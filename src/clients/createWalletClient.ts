import type { ErrorType } from '../errors/utils.js'
import type {
  DeployPackageParameters,
  SendPackageTransactionParameters,
  SendSystemActionParameters,
  SignTransactionParameters,
  SponsoredTransactionParameters,
  WalletClient,
  WalletClientConfig,
} from '../types/client.js'
import type { Address } from '../types/address.js'
import type { Hex, Signature } from '../types/misc.js'
import { toHex, type ToHexErrorType } from '../utils/encoding/toHex.js'
import { encodePackageCallData } from '../utils/contract/encodePackageCallData.js'
import { encodePackageDeployData } from '../utils/contract/encodePackageDeployData.js'
import { serializeTransactionSponsored } from '../utils/transaction/serializeTransaction.js'
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

  const signTransaction = async ({
    account = config.account,
    chainId,
    nonce,
    gas = 21_000n,
    to,
    value = 0n,
    data = '0x',
    from,
    signerType = 'secp256k1',
  }: SignTransactionParameters): Promise<Hex> => {
    const resolvedFrom = getAddress(from ?? account.address)
    const [resolvedChainId, resolvedNonce] = await Promise.all([
      typeof chainId === 'undefined' ? publicClient.getChainId() : BigInt(chainId),
      typeof nonce === 'undefined'
        ? publicClient.getTransactionCount({
            address: resolvedFrom,
            blockTag: 'pending',
          })
        : BigInt(nonce),
    ])

    return account.signTransaction({
      chainId: resolvedChainId,
      data,
      from: resolvedFrom,
      gas: BigInt(gas),
      nonce: resolvedNonce,
      signerType,
      ...(typeof to !== 'undefined' && to !== null ? { to: getAddress(to) } : {}),
      type: 'native',
      value: BigInt(value),
    })
  }

  const sendTransaction = async (parameters: SignTransactionParameters) => {
    const serializedTransaction = await signTransaction(parameters)
    return sendRawTransaction({ serializedTransaction })
  }

  const signSponsoredExecution = async ({
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
    sponsorNonce,
    sponsorExpiry,
    sponsorPolicyHash,
  }: SponsoredTransactionParameters) => {
    const resolvedFrom = getAddress(from ?? account.address)
    const resolvedChainId =
      typeof chainId === 'undefined' ? await publicClient.getChainId() : BigInt(chainId)
    const resolvedNonce =
      typeof nonce === 'undefined'
        ? await publicClient.getTransactionCount({
            address: resolvedFrom,
            blockTag: 'pending',
          })
        : BigInt(nonce)

    return account.signSponsoredExecution({
      chainId: resolvedChainId,
      data,
      from: resolvedFrom,
      gas: BigInt(gas),
      nonce: resolvedNonce,
      signerType,
      sponsor: getAddress(sponsor),
      sponsorExpiry: BigInt(sponsorExpiry),
      sponsorNonce: BigInt(sponsorNonce),
      sponsorPolicyHash,
      ...(typeof to !== 'undefined' && to !== null ? { to: getAddress(to) } : {}),
      type: 'sponsored',
      value: BigInt(value),
    })
  }

  const signSponsoredTransaction = async ({
    sponsorSignature,
    ...parameters
  }: SponsoredTransactionParameters & { sponsorSignature: Signature }) => {
    const executionSignature = await signSponsoredExecution(parameters)
    const account = parameters.account ?? config.account
    const resolvedFrom = getAddress(parameters.from ?? account.address)
    const resolvedChainId =
      typeof parameters.chainId === 'undefined'
        ? await publicClient.getChainId()
        : BigInt(parameters.chainId)
    const resolvedNonce =
      typeof parameters.nonce === 'undefined'
        ? await publicClient.getTransactionCount({
            address: resolvedFrom,
            blockTag: 'pending',
          })
        : BigInt(parameters.nonce)

    return serializeTransactionSponsored(
      {
        chainId: resolvedChainId,
        data: parameters.data ?? '0x',
        from: resolvedFrom,
        gas: BigInt(parameters.gas ?? 21_000n),
        nonce: resolvedNonce,
        signerType: parameters.signerType ?? 'secp256k1',
        sponsor: getAddress(parameters.sponsor),
        sponsorExpiry: BigInt(parameters.sponsorExpiry),
        sponsorNonce: BigInt(parameters.sponsorNonce),
        sponsorPolicyHash: parameters.sponsorPolicyHash,
        ...(typeof parameters.to !== 'undefined' && parameters.to !== null
          ? { to: getAddress(parameters.to) }
          : {}),
        type: 'sponsored',
        value: BigInt(parameters.value ?? 0n),
      },
      {
        execution: executionSignature,
        sponsor: sponsorSignature,
      },
    )
  }

  const sendSponsoredTransaction = async (
    parameters: SponsoredTransactionParameters & { sponsorSignature: Signature },
  ) => {
    const serializedTransaction = await signSponsoredTransaction(parameters)
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
    signTransaction,
    signSponsoredExecution,
    signSponsoredTransaction,
    sendRawTransaction,
    sendTransaction,
    sendSponsoredTransaction,
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
