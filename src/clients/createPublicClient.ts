import type { ErrorType } from '../errors/utils.js'
import {
  TransactionReceiptTimeoutError,
  type TransactionReceiptTimeoutErrorType,
} from '../errors/client.js'
import type {
  BlockTag,
  FeeHistory,
  LogFilter,
  PublicClient,
  PublicClientConfig,
  RpcBlock,
  RpcLog,
  RpcSubscription,
  RpcTransaction,
  RpcTransactionReceipt,
  RpcTransactionRequest,
  SubscriptionTransport,
  WaitForTransactionReceiptParameters,
} from '../types/client.js'
import type { Hex } from '../types/misc.js'
import { type NumberToHexErrorType, numberToHex } from '../utils/encoding/toHex.js'
import { createTransport, http } from '../transports/index.js'
import { getAddress, type GetAddressErrorType } from '../utils/address/getAddress.js'
import {
  InvalidLogFilterError,
  type InvalidLogFilterErrorType,
  SubscriptionsUnsupportedError,
  type SubscriptionsUnsupportedErrorType,
} from '../errors/client.js'

export type CreatePublicClientErrorType =
  | GetAddressErrorType
  | InvalidLogFilterErrorType
  | NumberToHexErrorType
  | SubscriptionsUnsupportedErrorType
  | TransactionReceiptTimeoutErrorType
  | ErrorType

export function createPublicClient(
  config: PublicClientConfig = {},
): PublicClient {
  const transport = createTransport(config.transport ?? http(), config.chain)

  const request = <T>(method: string, params: readonly unknown[] = []) =>
    transport.request<T>(method, params)

  const subscribe = <T>({
    event,
    onData,
    onError,
    params = [],
  }: {
    event: string
    onData(data: T): void
    onError?(error: Error): void
    params?: readonly unknown[] | undefined
  }): Promise<RpcSubscription> => {
    if (!('subscribe' in transport) || typeof transport.subscribe !== 'function') {
      throw new SubscriptionsUnsupportedError()
    }
    return (transport as SubscriptionTransport).subscribe<T>({
      event,
      onData,
      params,
      ...(onError ? { onError } : {}),
    })
  }

  return {
    chain: config.chain,
    transport,
    request,
    async getChainId() {
      return parseRpcQuantity(await request<Hex>('tos_chainId'))
    },
    async getBlockNumber() {
      return parseRpcQuantity(await request<Hex>('tos_blockNumber'))
    },
    async getBalance({ address, blockTag = 'latest' }) {
      return parseRpcQuantity(
        await request<Hex>('tos_getBalance', [
          getAddress(address),
          normalizeBlockTag(blockTag),
        ]),
      )
    },
    async getTransactionCount({ address, blockTag = 'pending' }) {
      return parseRpcQuantity(
        await request<Hex>('tos_getTransactionCount', [
          getAddress(address),
          normalizeBlockTag(blockTag),
        ]),
      )
    },
    async getTransactionReceipt({ hash }) {
      return request<RpcTransactionReceipt | null>('tos_getTransactionReceipt', [hash])
    },
    async getTransactionByHash({ hash }) {
      return request<RpcTransaction | null>('tos_getTransactionByHash', [hash])
    },
    async getBlockByHash({ hash, includeTransactions = false }) {
      return request<RpcBlock | null>('tos_getBlockByHash', [
        hash,
        includeTransactions,
      ])
    },
    async getBlockByNumber({
      blockNumber = 'latest',
      includeTransactions = false,
    } = {}) {
      return request<RpcBlock | null>('tos_getBlockByNumber', [
        normalizeBlockTag(blockNumber),
        includeTransactions,
      ])
    },
    async getCode({ address, blockTag = 'latest' }) {
      return request<Hex>('tos_getCode', [
        getAddress(address),
        normalizeBlockTag(blockTag),
      ])
    },
    async getStorageAt({ address, slot, blockTag = 'latest' }) {
      return request<Hex>('tos_getStorageAt', [
        getAddress(address),
        slot,
        normalizeBlockTag(blockTag),
      ])
    },
    async getLogs(filter) {
      return request<readonly RpcLog[]>('tos_getLogs', [
        serializeLogFilter(filter),
      ])
    },
    async call({ request: callRequest, blockTag = 'latest' }) {
      return request<Hex>('tos_call', [
        serializeRpcTransactionRequest(callRequest),
        normalizeBlockTag(blockTag),
      ])
    },
    async estimateGas({ request: estimateRequest }) {
      return parseRpcQuantity(
        await request<Hex>('tos_estimateGas', [
          serializeRpcTransactionRequest(estimateRequest),
        ]),
      )
    },
    async maxPriorityFeePerGas() {
      return parseRpcQuantity(await request<Hex>('tos_maxPriorityFeePerGas'))
    },
    async feeHistory({
      blockCount,
      lastBlock = 'latest',
      rewardPercentiles = [],
    }) {
      const response = await request<{
        oldestBlock: Hex
        reward?: Hex[][]
        baseFeePerGas?: Hex[]
        gasUsedRatio: number[]
      }>('tos_feeHistory', [
        numberToHex(blockCount),
        normalizeBlockTag(lastBlock),
        rewardPercentiles,
      ])
      return parseFeeHistory(response)
    },
    async watchBlocks({ onBlock, onError }) {
      return subscribe<RpcBlock>({
        event: 'newHeads',
        onData: onBlock,
        ...(onError ? { onError } : {}),
      })
    },
    async watchLogs({ filter, onLog, onError }) {
      return subscribe<RpcLog>({
        event: 'logs',
        params: filter ? [serializeLogFilter(filter)] : [],
        onData: onLog,
        ...(onError ? { onError } : {}),
      })
    },
    async waitForTransactionReceipt({
      hash,
      pollIntervalMs = 2_000,
      timeoutMs = 60_000,
    }: WaitForTransactionReceiptParameters) {
      const deadline = Date.now() + timeoutMs
      while (Date.now() < deadline) {
        const receipt = await request<RpcTransactionReceipt | null>(
          'tos_getTransactionReceipt',
          [hash],
        )
        if (receipt) return receipt
        await delay(pollIntervalMs)
      }
      throw new TransactionReceiptTimeoutError({ hash, timeoutMs })
    },
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function normalizeBlockTag(
  blockTag: BlockTag | number | bigint,
): BlockTag {
  if (typeof blockTag === 'number' || typeof blockTag === 'bigint')
    return numberToHex(blockTag)
  return blockTag
}

function parseRpcQuantity(value: Hex): bigint {
  return BigInt(value)
}

function serializeRpcTransactionRequest(
  request: RpcTransactionRequest,
): RpcTransactionRequest {
  return {
    ...request,
    ...(request.from ? { from: getAddress(request.from) } : {}),
    to: getAddress(request.to),
  }
}

function serializeLogFilter(filter: LogFilter) {
  if (filter.blockHash && (filter.fromBlock || filter.toBlock)) {
    throw new InvalidLogFilterError()
  }

  const address = filter.address

  return {
    ...(address
      ? {
          address: Array.isArray(address)
            ? address.map((item) => getAddress(item))
            : getAddress(address as Hex),
        }
      : {}),
    ...(filter.topics ? { topics: filter.topics } : {}),
    ...(filter.blockHash
      ? { blockHash: filter.blockHash }
      : {
          fromBlock: normalizeBlockTag(filter.fromBlock ?? 0n),
          toBlock: normalizeBlockTag(filter.toBlock ?? 'latest'),
        }),
  }
}

function parseFeeHistory(response: {
  oldestBlock: Hex
  reward?: Hex[][]
  baseFeePerGas?: Hex[]
  gasUsedRatio: number[]
}): FeeHistory {
  return {
    oldestBlock: parseRpcQuantity(response.oldestBlock),
    ...(response.reward
      ? {
          reward: response.reward.map((rewardRow) =>
            rewardRow.map((value) => parseRpcQuantity(value)),
          ),
        }
      : {}),
    ...(response.baseFeePerGas
      ? {
          baseFeePerGas: response.baseFeePerGas.map((value) =>
            parseRpcQuantity(value),
          ),
        }
      : {}),
    gasUsedRatio: response.gasUsedRatio,
  }
}
