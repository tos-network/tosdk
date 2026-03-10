import type { PrivateKeyAccount } from '../accounts/types.js'

import type { Address } from './address.js'
import type { Chain } from './chain.js'
import type {
  CallPackageParameters,
  DeployPackageParameters,
  PackageArgument,
  SendPackageTransactionParameters,
} from './contract.js'
import type { Hex, Signature } from './misc.js'

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

export type RpcTransaction = {
  blockHash?: Hex | null | undefined
  blockNumber?: Hex | null | undefined
  from: Address
  gas?: Hex | undefined
  hash: Hex
  input?: Hex | undefined
  nonce?: Hex | undefined
  signerType?: string | undefined
  to: Address | null
  transactionIndex?: Hex | undefined
  type?: Hex | string | undefined
  value?: Hex | undefined
  [key: string]: unknown
}

export type RpcLog = {
  address: Address
  blockHash?: Hex | null | undefined
  blockNumber?: Hex | null | undefined
  data: Hex
  logIndex?: Hex | undefined
  removed?: boolean | undefined
  topics: readonly Hex[]
  transactionHash?: Hex | null | undefined
  transactionIndex?: Hex | undefined
  [key: string]: unknown
}

export type LogFilterTopics = readonly (
  | Hex
  | null
  | readonly (Hex | null)[]
)[]

export type LogFilter = {
  address?: Address | readonly Address[] | undefined
  topics?: LogFilterTopics | undefined
  blockHash?: Hex | undefined
  fromBlock?: BlockTag | number | bigint | undefined
  toBlock?: BlockTag | number | bigint | undefined
}

export type FeeHistory = {
  oldestBlock: bigint
  reward?: bigint[][] | undefined
  baseFeePerGas?: bigint[] | undefined
  gasUsedRatio: number[]
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

export type WebSocketLike = {
  readyState: number
  addEventListener(
    type: 'close' | 'error' | 'message' | 'open',
    listener: (event: any) => void,
  ): void
  removeEventListener(
    type: 'close' | 'error' | 'message' | 'open',
    listener: (event: any) => void,
  ): void
  send(data: string): void
  close(code?: number, reason?: string): void
}

export type WebSocketTransportConfig = {
  type: 'webSocket'
  url?: string | undefined
  webSocketFactory?: ((url: string) => WebSocketLike) | undefined
}

export type TransportConfig = HttpTransportConfig | WebSocketTransportConfig

export type RpcTransport = {
  key: string
  name: string
  url: string
  request<T>(method: string, params?: readonly unknown[]): Promise<T>
}

export type RpcSubscription = {
  id: string
  unsubscribe(): Promise<void>
}

export type SubscriptionTransport = RpcTransport & {
  subscribe<T>(parameters: {
    namespace?: string | undefined
    event: string
    params?: readonly unknown[] | undefined
    onData(data: T): void
    onError?(error: Error): void
  }): Promise<RpcSubscription>
}

export type PublicClientConfig = {
  chain?: Chain | undefined
  transport?: TransportConfig | undefined
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
  getSponsorNonce(parameters: {
    address: Address
    blockTag?: BlockTag | undefined
  }): Promise<bigint>
  getTransactionReceipt(parameters: {
    hash: Hex
  }): Promise<RpcTransactionReceipt | null>
  getTransactionByHash(parameters: {
    hash: Hex
  }): Promise<RpcTransaction | null>
  getBlockByHash(parameters: {
    hash: Hex
    includeTransactions?: boolean | undefined
  }): Promise<RpcBlock | null>
  getBlockByNumber(parameters?: {
    blockNumber?: BlockTag | number | bigint | undefined
    includeTransactions?: boolean | undefined
  }): Promise<RpcBlock | null>
  getCode(parameters: {
    address: Address
    blockTag?: BlockTag | undefined
  }): Promise<Hex>
  getStorageAt(parameters: {
    address: Address
    slot: Hex
    blockTag?: BlockTag | undefined
  }): Promise<Hex>
  getLogs(parameters: LogFilter): Promise<readonly RpcLog[]>
  call(parameters: {
    request: RpcTransactionRequest
    blockTag?: BlockTag | undefined
  }): Promise<Hex>
  callPackage(parameters: CallPackageParameters): Promise<Hex>
  estimateGas(parameters: {
    request: RpcTransactionRequest
  }): Promise<bigint>
  maxPriorityFeePerGas(): Promise<bigint>
  feeHistory(parameters: {
    blockCount: number | bigint
    lastBlock?: BlockTag | number | bigint | undefined
    rewardPercentiles?: readonly number[] | undefined
  }): Promise<FeeHistory>
  watchBlocks(parameters: {
    onBlock(block: RpcBlock): void
    onError?(error: Error): void
  }): Promise<RpcSubscription>
  watchLogs(parameters: {
    filter?: LogFilter | undefined
    onLog(log: RpcLog): void
    onError?(error: Error): void
  }): Promise<RpcSubscription>
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
  to?: Address | null | undefined
  value?: number | bigint | undefined
  data?: Hex | undefined
  from?: Address | undefined
  signerType?: string | undefined
  sponsor?: Address | undefined
  sponsorSignerType?: string | undefined
  sponsorNonce?: number | bigint | undefined
  sponsorExpiry?: number | bigint | undefined
  sponsorPolicyHash?: Hex | undefined
  sponsorSignature?: Signature | undefined
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
  signAuthorization(parameters: SignTransactionParameters): Promise<Signature>
  assembleTransaction(
    parameters: SignTransactionParameters & {
      executionSignature: Signature
      sponsorSignature?: Signature | undefined
    },
  ): Promise<Hex>
  signTransaction(parameters: SignTransactionParameters): Promise<Hex>
  sendRawTransaction(parameters: { serializedTransaction: Hex }): Promise<Hex>
  sendTransaction(parameters: SignTransactionParameters): Promise<Hex>
  sendPackageTransaction(
    parameters: SendPackageTransactionParameters,
  ): Promise<Hex>
  deployPackage(parameters: DeployPackageParameters): Promise<Hex>
  sendSystemAction(parameters: SendSystemActionParameters): Promise<Hex>
}

export type {
  CallPackageParameters,
  DeployPackageParameters,
  PackageArgument,
  SendPackageTransactionParameters,
}
