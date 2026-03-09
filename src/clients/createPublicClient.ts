import type { ErrorType } from '../errors/utils.js'
import {
  TransactionReceiptTimeoutError,
  type TransactionReceiptTimeoutErrorType,
} from '../errors/client.js'
import type {
  BlockTag,
  PublicClient,
  PublicClientConfig,
  RpcBlock,
  RpcTransactionReceipt,
  RpcTransactionRequest,
  WaitForTransactionReceiptParameters,
} from '../types/client.js'
import type { Hex } from '../types/misc.js'
import { type NumberToHexErrorType, numberToHex } from '../utils/encoding/toHex.js'
import { createHttpTransport, http } from '../transports/http.js'
import { getAddress, type GetAddressErrorType } from '../utils/address/getAddress.js'

export type CreatePublicClientErrorType =
  | GetAddressErrorType
  | NumberToHexErrorType
  | TransactionReceiptTimeoutErrorType
  | ErrorType

export function createPublicClient(
  config: PublicClientConfig = {},
): PublicClient {
  const transport = createHttpTransport(config.transport ?? http(), config.chain)

  const request = <T>(method: string, params: readonly unknown[] = []) =>
    transport.request<T>(method, params)

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
    async getBlockByNumber({
      blockNumber = 'latest',
      includeTransactions = false,
    } = {}) {
      return request<RpcBlock | null>('tos_getBlockByNumber', [
        normalizeBlockTag(blockNumber),
        includeTransactions,
      ])
    },
    async call({ request: callRequest, blockTag = 'latest' }) {
      return request<Hex>('tos_call', [
        serializeRpcTransactionRequest(callRequest),
        normalizeBlockTag(blockTag),
      ])
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
