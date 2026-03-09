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
import type { Hex } from '../types/misc.js'
import { toHex, type ToHexErrorType } from '../utils/encoding/toHex.js'
import { encodePackageCallData } from '../utils/contract/encodePackageCallData.js'
import { encodePackageDeployData } from '../utils/contract/encodePackageDeployData.js'
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
