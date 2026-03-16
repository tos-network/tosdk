import type { ErrorType } from '../errors/utils.js'
import type {
  DeployPackageParameters,
  SendPackageTransactionParameters,
  SetSignerMetadataParameters,
  SendSystemActionParameters,
  SignTransactionParameters,
  WalletClient,
  WalletClientConfig,
} from '../types/client.js'
import type {
  BuiltTransactionResult,
  LeaseDeployResult,
  WalletLeaseCloseParameters,
  WalletLeaseDeployParameters,
  WalletLeaseRenewParameters,
} from '../types/lease.js'
import type { Address } from '../types/address.js'
import type { Hex, Signature } from '../types/misc.js'
import type { TransactionSerializableNative } from '../types/transaction.js'
import type { LocalAccount } from '../accounts/types.js'
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

  const resolveAccount = (
    account: LocalAccount | undefined,
  ): LocalAccount => account ?? config.account

  const buildTransaction = async ({
    account = config.account,
    chainId,
    nonce,
    gas = 21_000n,
    to,
    value = 0n,
    data = '0x',
    from,
    signerType,
    sponsor,
    sponsorSignerType,
    sponsorNonce,
    sponsorExpiry,
    sponsorPolicyHash,
  }: SignTransactionParameters): Promise<TransactionSerializableNative> => {
    const resolvedAccount = resolveAccount(account)
    const resolvedSignerType = signerType ?? resolvedAccount.signerType ?? 'secp256k1'
    const resolvedFrom = getAddress(from ?? resolvedAccount.address)
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
      signerType: resolvedSignerType,
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
    const account = resolveAccount(parameters.account)
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
    const executionSignature = await resolveAccount(parameters.account)
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

  const sendBuiltTransaction = async ({
    account = config.account,
    built,
  }: {
    account?: LocalAccount | undefined
    built: BuiltTransactionResult
  }) =>
    sendTransaction({
      account,
      data: built.tx.input,
      from: built.tx.from,
      gas: built.tx.gas,
      nonce: built.tx.nonce,
      to: built.tx.to,
      value: built.tx.value,
    })

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

  const leaseDeploy = async ({
    account = config.account,
    from,
    ...rest
  }: WalletLeaseDeployParameters): Promise<LeaseDeployResult> => {
    const resolvedAccount = resolveAccount(account)
    const built = await publicClient.buildLeaseDeployTx({
      from: getAddress(from ?? resolvedAccount.address),
      ...rest,
    })
    const txHash = await sendBuiltTransaction({ account: resolvedAccount, built })
    if (!built.contractAddress) {
      throw new Error('Lease deploy builder did not return a contract address.')
    }
    return {
      txHash,
      contractAddress: built.contractAddress,
    }
  }

  const leaseRenew = async ({
    account = config.account,
    from,
    ...rest
  }: WalletLeaseRenewParameters) => {
    const resolvedAccount = resolveAccount(account)
    const built = await publicClient.buildLeaseRenewTx({
      from: getAddress(from ?? resolvedAccount.address),
      ...rest,
    })
    return sendBuiltTransaction({ account: resolvedAccount, built })
  }

  const leaseClose = async ({
    account = config.account,
    from,
    ...rest
  }: WalletLeaseCloseParameters) => {
    const resolvedAccount = resolveAccount(account)
    const built = await publicClient.buildLeaseCloseTx({
      from: getAddress(from ?? resolvedAccount.address),
      ...rest,
    })
    return sendBuiltTransaction({ account: resolvedAccount, built })
  }

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

  const setSignerMetadata = async ({
    account = config.account,
    signerType,
    signerValue,
    gas = 120_000n,
  }: SetSignerMetadataParameters) =>
    sendSystemAction({
      account,
      action: 'ACCOUNT_SET_SIGNER',
      payload: {
        signerType,
        signerValue,
      },
      gas,
      value: 0n,
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
    leaseDeploy,
    leaseRenew,
    leaseClose,
    sendSystemAction,
    setSignerMetadata,
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
