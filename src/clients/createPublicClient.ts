import type { ErrorType } from '../errors/utils.js'
import {
  TransactionReceiptTimeoutError,
  type TransactionReceiptTimeoutErrorType,
} from '../errors/client.js'
import type {
  BlockTag,
  CallPackageParameters,
  FeeHistory,
  LogFilter,
  PublicClient,
  PublicClientConfig,
  RpcBlock,
  RpcTransactionRequest,
  RpcLog,
  RpcSubscription,
  RpcSignerProfile,
  RpcTransaction,
  RpcTransactionReceipt,
  SubscriptionTransport,
  WaitForTransactionReceiptParameters,
} from '../types/client.js'
import type {
  BuiltTransactionResult,
  GetLeaseParameters,
  LeaseCloseParameters,
  LeaseDeployParameters,
  LeaseRecord,
  LeaseRenewParameters,
} from '../types/lease.js'
import type { Hex } from '../types/misc.js'
import type {
  GetPrivBalanceParameters,
  GetPrivNonceParameters,
  PrivBalanceRecord,
  PrivShieldParameters,
  PrivTransferParameters,
  PrivUnshieldParameters,
} from '../types/privacy.js'
import { type NumberToHexErrorType, numberToHex } from '../utils/encoding/toHex.js'
import { createTransport, http } from '../transports/index.js'
import { encodePackageCallData } from '../utils/contract/encodePackageCallData.js'
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
    async getSponsorNonce({ address, blockTag = 'latest' }) {
      return parseRpcQuantity(
        await request<Hex>('tos_getSponsorNonce', [
          getAddress(address),
          normalizeBlockTag(blockTag),
        ]),
      )
    },
    async getSigner({ address, blockTag = 'latest' }) {
      return request<RpcSignerProfile>('tos_getSigner', [
        getAddress(address),
        normalizeBlockTag(blockTag),
      ])
    },
    async privGetBalance({
      pubkey,
      blockTag = 'latest',
    }: GetPrivBalanceParameters) {
      return parsePrivBalanceResult(
        await request<RpcPrivBalanceResult>('tos_privGetBalance', [
          pubkey,
          normalizeBlockTag(blockTag),
        ]),
      )
    },
    async privGetNonce({
      pubkey,
      blockTag = 'latest',
    }: GetPrivNonceParameters) {
      return parseRpcQuantity(
        await request<Hex>('tos_privGetNonce', [
          pubkey,
          normalizeBlockTag(blockTag),
        ]),
      )
    },
    async privTransfer(parameters: PrivTransferParameters) {
      return request<Hex>('tos_privTransfer', [
        serializePrivTransferParameters(parameters),
      ])
    },
    async privShield(parameters: PrivShieldParameters) {
      return request<Hex>('tos_privShield', [
        serializePrivShieldParameters(parameters),
      ])
    },
    async privUnshield(parameters: PrivUnshieldParameters) {
      return request<Hex>('tos_privUnshield', [
        serializePrivUnshieldParameters(parameters),
      ])
    },
    async getLease({ address, blockTag = 'latest' }: GetLeaseParameters) {
      const record = await request<RpcLeaseRecord | null>('tos_getLease', [
        getAddress(address),
        normalizeBlockTag(blockTag),
      ])
      return parseLeaseRecord(record)
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
    async callPackage({
      address,
      packageName,
      functionSignature,
      args = [],
      blockTag = 'latest',
    }: CallPackageParameters) {
      return request<Hex>('tos_call', [
        serializeRpcTransactionRequest({
          to: getAddress(address),
          data: encodePackageCallData({
            packageName,
            functionSignature,
            args,
          }),
        }),
        normalizeBlockTag(blockTag),
      ])
    },
    async buildLeaseDeployTx(parameters: LeaseDeployParameters) {
      return parseBuiltTransactionResult(
        await request<RpcBuiltTransactionResult>('tos_buildLeaseDeployTx', [
          serializeLeaseDeployParameters(parameters),
        ]),
      )
    },
    async buildLeaseRenewTx(parameters: LeaseRenewParameters) {
      return parseBuiltTransactionResult(
        await request<RpcBuiltTransactionResult>('tos_buildLeaseRenewTx', [
          serializeLeaseRenewParameters(parameters),
        ]),
      )
    },
    async buildLeaseCloseTx(parameters: LeaseCloseParameters) {
      return parseBuiltTransactionResult(
        await request<RpcBuiltTransactionResult>('tos_buildLeaseCloseTx', [
          serializeLeaseCloseParameters(parameters),
        ]),
      )
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

type RpcLeaseRecord = {
  address: Hex
  leaseOwner: Hex
  createdAtBlock: Hex
  expireAtBlock: Hex
  graceUntilBlock: Hex
  codeBytes: Hex
  depositWei?: Hex | null | undefined
  scheduledPruneEpoch: Hex
  scheduledPruneSeq: Hex
  status: string
  tombstoned: boolean
  tombstoneCodeHash: Hex
  tombstoneExpiredAt: Hex
  blockNumber: Hex
}

type RpcPrivBalanceResult = {
  pubkey: Hex
  commitment: Hex
  handle: Hex
  version: Hex
  privNonce: Hex
  blockNumber: Hex
}

type RpcBuiltTransactionResult = {
  tx: {
    from: Hex
    to: Hex
    nonce: Hex
    gas: Hex
    value: Hex
    input: Hex
  }
  raw: Hex
  contractAddress?: Hex | undefined
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

function serializeLeaseDeployParameters(parameters: LeaseDeployParameters) {
  return {
    from: getAddress(parameters.from),
    ...(typeof parameters.nonce !== 'undefined'
      ? { nonce: numberToHex(parameters.nonce) }
      : {}),
    ...(typeof parameters.gas !== 'undefined'
      ? { gas: numberToHex(parameters.gas) }
      : {}),
    code: parameters.code,
    leaseBlocks: numberToHex(parameters.leaseBlocks),
    ...(typeof parameters.leaseOwner !== 'undefined'
      ? { leaseOwner: getAddress(parameters.leaseOwner) }
      : {}),
    ...(typeof parameters.value !== 'undefined'
      ? { value: numberToHex(parameters.value) }
      : {}),
  }
}

function serializePrivTransferParameters(parameters: PrivTransferParameters) {
  return {
    from: parameters.from,
    to: parameters.to,
    privNonce: numberToHex(parameters.privNonce),
    fee: numberToHex(parameters.fee),
    feeLimit: numberToHex(parameters.feeLimit),
    commitment: parameters.commitment,
    senderHandle: parameters.senderHandle,
    receiverHandle: parameters.receiverHandle,
    sourceCommitment: parameters.sourceCommitment,
    ctValidityProof: parameters.ctValidityProof,
    commitmentEqProof: parameters.commitmentEqProof,
    rangeProof: parameters.rangeProof,
    ...(typeof parameters.encryptedMemo !== 'undefined'
      ? { encryptedMemo: parameters.encryptedMemo }
      : {}),
    ...(typeof parameters.memoSenderHandle !== 'undefined'
      ? { memoSenderHandle: parameters.memoSenderHandle }
      : {}),
    ...(typeof parameters.memoReceiverHandle !== 'undefined'
      ? { memoReceiverHandle: parameters.memoReceiverHandle }
      : {}),
    s: parameters.s,
    e: parameters.e,
  }
}

function serializePrivShieldParameters(parameters: PrivShieldParameters) {
  return {
    pubkey: parameters.pubkey,
    recipient: parameters.recipient,
    privNonce: numberToHex(parameters.privNonce),
    fee: numberToHex(parameters.fee),
    amount: numberToHex(parameters.amount),
    commitment: parameters.commitment,
    handle: parameters.handle,
    shieldProof: parameters.shieldProof,
    rangeProof: parameters.rangeProof,
    s: parameters.s,
    e: parameters.e,
  }
}

function serializePrivUnshieldParameters(parameters: PrivUnshieldParameters) {
  return {
    pubkey: parameters.pubkey,
    recipient: getAddress(parameters.recipient),
    privNonce: numberToHex(parameters.privNonce),
    fee: numberToHex(parameters.fee),
    amount: numberToHex(parameters.amount),
    sourceCommitment: parameters.sourceCommitment,
    commitmentEqProof: parameters.commitmentEqProof,
    rangeProof: parameters.rangeProof,
    s: parameters.s,
    e: parameters.e,
  }
}

function serializeLeaseRenewParameters(parameters: LeaseRenewParameters) {
  return {
    from: getAddress(parameters.from),
    ...(typeof parameters.nonce !== 'undefined'
      ? { nonce: numberToHex(parameters.nonce) }
      : {}),
    ...(typeof parameters.gas !== 'undefined'
      ? { gas: numberToHex(parameters.gas) }
      : {}),
    contractAddr: getAddress(parameters.contractAddress),
    deltaBlocks: numberToHex(parameters.deltaBlocks),
  }
}

function serializeLeaseCloseParameters(parameters: LeaseCloseParameters) {
  return {
    from: getAddress(parameters.from),
    ...(typeof parameters.nonce !== 'undefined'
      ? { nonce: numberToHex(parameters.nonce) }
      : {}),
    ...(typeof parameters.gas !== 'undefined'
      ? { gas: numberToHex(parameters.gas) }
      : {}),
    contractAddr: getAddress(parameters.contractAddress),
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

function parseLeaseRecord(record: RpcLeaseRecord | null): LeaseRecord | null {
  if (!record) return null
  return {
    address: getAddress(record.address),
    leaseOwner: getAddress(record.leaseOwner),
    createdAtBlock: parseRpcQuantity(record.createdAtBlock),
    expireAtBlock: parseRpcQuantity(record.expireAtBlock),
    graceUntilBlock: parseRpcQuantity(record.graceUntilBlock),
    codeBytes: parseRpcQuantity(record.codeBytes),
    depositWei: record.depositWei ? parseRpcQuantity(record.depositWei) : 0n,
    scheduledPruneEpoch: parseRpcQuantity(record.scheduledPruneEpoch),
    scheduledPruneSeq: parseRpcQuantity(record.scheduledPruneSeq),
    status: record.status,
    tombstoned: record.tombstoned,
    tombstoneCodeHash: record.tombstoneCodeHash,
    tombstoneExpiredAt: parseRpcQuantity(record.tombstoneExpiredAt),
    blockNumber: parseRpcQuantity(record.blockNumber),
  }
}

function parsePrivBalanceResult(result: RpcPrivBalanceResult): PrivBalanceRecord {
  return {
    pubkey: result.pubkey,
    commitment: result.commitment,
    handle: result.handle,
    version: parseRpcQuantity(result.version),
    privNonce: parseRpcQuantity(result.privNonce),
    blockNumber: parseRpcQuantity(result.blockNumber),
  }
}

function parseBuiltTransactionResult(
  result: RpcBuiltTransactionResult,
): BuiltTransactionResult {
  return {
    tx: {
      from: getAddress(result.tx.from),
      to: getAddress(result.tx.to),
      nonce: parseRpcQuantity(result.tx.nonce),
      gas: parseRpcQuantity(result.tx.gas),
      value: parseRpcQuantity(result.tx.value),
      input: result.tx.input,
    },
    raw: result.raw,
    ...(result.contractAddress
      ? { contractAddress: getAddress(result.contractAddress) }
      : {}),
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
