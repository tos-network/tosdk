import type { PrivateKeyAccount } from '../accounts/types.js'

import type { Address } from './address.js'
import type { Chain } from './chain.js'
import type { Hex } from './misc.js'

export type BlockTag =
  | 'latest'
  | 'pending'
  | 'earliest'
  | 'safe'
  | 'finalized'
  | Hex

export type RpcTransactionRequest = {
  from?: Address | undefined
  to: Address
  gas?: Hex | undefined
  value?: Hex | undefined
  data?: Hex | undefined
}

export type RpcTransactionReceipt = {
  blockHash: Hex
  blockNumber: Hex
  contractAddress?: Address | null | undefined
  cumulativeGasUsed: Hex
  effectiveGasPrice?: Hex | undefined
  from: Address
  gasUsed: Hex
  logs: readonly unknown[]
  logsBloom?: Hex | undefined
  status?: Hex | undefined
  to: Address | null
  transactionHash: Hex
  transactionIndex?: Hex | undefined
  type?: Hex | string | undefined
  [key: string]: unknown
}

export type RpcBlock = {
  hash?: Hex | null | undefined
  number?: Hex | null | undefined
  parentHash?: Hex | undefined
  timestamp?: Hex | undefined
  transactions: readonly unknown[]
  [key: string]: unknown
}

export type HttpTransportConfig = {
  type: 'http'
  url?: string | undefined
  fetchFn?: typeof fetch | undefined
  headers?: HeadersInit | undefined
}

export type RpcTransport = {
  key: string
  name: string
  url: string
  request<T>(method: string, params?: readonly unknown[]): Promise<T>
}

export type PublicClientConfig = {
  chain?: Chain | undefined
  transport?: HttpTransportConfig | undefined
}

export type WaitForTransactionReceiptParameters = {
  hash: Hex
  timeoutMs?: number | undefined
  pollIntervalMs?: number | undefined
}

export type PublicClient = {
  chain?: Chain | undefined
  transport: RpcTransport
  request<T>(method: string, params?: readonly unknown[]): Promise<T>
  getChainId(): Promise<bigint>
  getBlockNumber(): Promise<bigint>
  getBalance(parameters: {
    address: Address
    blockTag?: BlockTag | undefined
  }): Promise<bigint>
  getTransactionCount(parameters: {
    address: Address
    blockTag?: BlockTag | undefined
  }): Promise<bigint>
  getTransactionReceipt(parameters: {
    hash: Hex
  }): Promise<RpcTransactionReceipt | null>
  getBlockByNumber(parameters?: {
    blockNumber?: BlockTag | number | bigint | undefined
    includeTransactions?: boolean | undefined
  }): Promise<RpcBlock | null>
  call(parameters: {
    request: RpcTransactionRequest
    blockTag?: BlockTag | undefined
  }): Promise<Hex>
  waitForTransactionReceipt(
    parameters: WaitForTransactionReceiptParameters,
  ): Promise<RpcTransactionReceipt>
}

export type WalletClientConfig = PublicClientConfig & {
  account: PrivateKeyAccount
}

export type SignTransactionParameters = {
  account?: PrivateKeyAccount | undefined
  chainId?: number | bigint | undefined
  nonce?: number | bigint | undefined
  gas?: number | bigint | undefined
  to: Address
  value?: number | bigint | undefined
  data?: Hex | undefined
  from?: Address | undefined
  signerType?: string | undefined
}

export type SendSystemActionParameters = {
  account?: PrivateKeyAccount | undefined
  action: string
  payload?: Record<string, unknown> | undefined
  gas?: number | bigint | undefined
  value?: number | bigint | undefined
}

export type WalletClient = PublicClient & {
  account: PrivateKeyAccount
  signTransaction(parameters: SignTransactionParameters): Promise<Hex>
  sendRawTransaction(parameters: { serializedTransaction: Hex }): Promise<Hex>
  sendTransaction(parameters: SignTransactionParameters): Promise<Hex>
  sendSystemAction(parameters: SendSystemActionParameters): Promise<Hex>
}
