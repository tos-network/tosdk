import type { ErrorType } from '../errors/utils.js'
import type {
  DeployPackageParameters,
  SendPackageTransactionParameters,
  SendSystemActionParameters,
  SignTransactionParameters,
  WalletClient,
  WalletClientConfig,
} from '../types/client.js'
import type { Address } from '../types/address.js'
import type { Hex, Signature } from '../types/misc.js'
import type { TransactionSerializableNative } from '../types/transaction.js'
import { toHex, type ToHexErrorType } from '../utils/encoding/toHex.js'
import { encodePackageCallData } from '../utils/contract/encodePackageCallData.js'
import { encodePackageDeployData } from '../utils/contract/encodePackageDeployData.js'
import { serializeTransaction } from '../utils/transaction/serializeTransaction.js'
import { createPublicClient, type CreatePublicClientErrorType } from './createPublicClient.js'
import { getAddress, type GetAddressErrorType } from '../utils/address/getAddress.js'

export type CreateWalletClientErrorType =
  | CreatePublicClientErrorType
  | GetAddressErrorType
  | ToHexErrorType
  | ErrorType

export const systemActionAddress =
  '0x0000000000000000000000000000000000000000000000000000000000000001' as Address

export function createWalletClient(config: WalletClientConfig): WalletClient {
  const publicClient = createPublicClient(config)

  const sendRawTransaction = ({ serializedTransaction }: { serializedTransaction: Hex }) =>
    publicClient.request<Hex>('tos_sendRawTransaction', [serializedTransaction])

  const buildTransaction = async ({
    account = config.account,
    chainId,
    nonce,
    gas = 21_000n,
    to,
    value = 0n,
    data = '0x',
    from,
    signerType = 'secp256k1',
    sponsor,
    sponsorSignerType,
    sponsorNonce,
    sponsorExpiry,
    sponsorPolicyHash,
  }: SignTransactionParameters): Promise<TransactionSerializableNative> => {
    const resolvedFrom = getAddress(from ?? account.address)
    const needsSponsorNonce = typeof sponsor !== 'undefined' && typeof sponsorNonce === 'undefined'
    const [resolvedChainId, resolvedNonce, resolvedSponsorNonce] = await Promise.all([
      typeof chainId === 'undefined' ? publicClient.getChainId() : BigInt(chainId),
      typeof nonce === 'undefined'
        ? publicClient.getTransactionCount({
            address: resolvedFrom,
            blockTag: 'pending',
          })
        : BigInt(nonce),
      needsSponsorNonce
        ? publicClient.getSponsorNonce({
            address: getAddress(sponsor!),
            blockTag: 'pending',
          })
        : typeof sponsorNonce === 'undefined'
          ? Promise.resolve(undefined)
          : Promise.resolve(BigInt(sponsorNonce)),
    ])

    return {
      chainId: resolvedChainId,
      data,
      from: resolvedFrom,
      gas: BigInt(gas),
      nonce: resolvedNonce,
      signerType,
      ...(typeof sponsor !== 'undefined'
        ? {
            sponsor: getAddress(sponsor),
            sponsorSignerType: sponsorSignerType ?? 'secp256k1',
            sponsorNonce: resolvedSponsorNonce!,
            sponsorExpiry: BigInt(sponsorExpiry!),
            sponsorPolicyHash: sponsorPolicyHash!,
          }
        : {}),
      ...(typeof to !== 'undefined' && to !== null ? { to: getAddress(to) } : {}),
      value: BigInt(value),
    }
  }

  const signAuthorization = async (
    parameters: SignTransactionParameters,
  ): Promise<Signature> => {
    const account = parameters.account ?? config.account
    return account.signAuthorization(await buildTransaction(parameters))
  }

  const assembleTransaction = async ({
    executionSignature,
    sponsorSignature,
    ...parameters
  }: SignTransactionParameters & {
    executionSignature: Signature
    sponsorSignature?: Signature | undefined
  }): Promise<Hex> => {
    const transaction = await buildTransaction(parameters)
    return serializeTransaction(transaction, {
      execution: executionSignature,
      sponsor: sponsorSignature,
    })
  }

  const signTransaction = async (
    parameters: SignTransactionParameters,
  ): Promise<Hex> => {
    const transaction = await buildTransaction(parameters)
    const executionSignature = await (parameters.account ?? config.account)
      .signAuthorization(transaction)
    if (transaction.sponsor && !parameters.sponsorSignature) {
      throw new Error(
        'Sponsored native transactions require `sponsorSignature` to assemble the final envelope.',
      )
    }
    return serializeTransaction(transaction, {
      execution: executionSignature,
      sponsor: parameters.sponsorSignature,
    })
  }

  const sendTransaction = async (parameters: SignTransactionParameters) => {
    const serializedTransaction = await signTransaction(parameters)
    return sendRawTransaction({ serializedTransaction })
  }

  const sendPackageTransaction = async ({
    packageName,
    functionSignature,
    args = [],
    ...rest
  }: SendPackageTransactionParameters) =>
    sendTransaction({
      ...rest,
      data: encodePackageCallData({
        packageName,
        functionSignature,
        args,
      }),
    })

  const deployPackage = async ({
    packageBinary,
    constructorArgs = [],
    ...rest
  }: DeployPackageParameters) =>
    sendTransaction({
      ...rest,
      to: undefined,
      data: encodePackageDeployData({
        packageBinary,
        constructorArgs,
      }),
    })

  const sendSystemAction = async ({
    account = config.account,
    action,
    payload,
    gas = 120_000n,
    value = 0n,
  }: SendSystemActionParameters) =>
    sendTransaction({
      account,
      data: encodeSystemActionData({ action, payload }),
      gas,
      to: systemActionAddress,
      value,
    })

  return {
    ...publicClient,
    account: config.account,
    assembleTransaction,
    signAuthorization,
    signTransaction,
    sendRawTransaction,
    sendTransaction,
    sendPackageTransaction,
    deployPackage,
    sendSystemAction,
  }
}

export function encodeSystemActionData({
  action,
  payload,
}: {
  action: string
  payload?: Record<string, unknown> | undefined
}): Hex {
  return toHex(
    JSON.stringify({
      action,
      ...(payload ? { payload } : {}),
    }),
  )
}
