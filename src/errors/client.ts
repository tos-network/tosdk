import type { Hex } from '../types/misc.js'

import { BaseError } from './base.js'

export type RpcUrlRequiredErrorType = RpcUrlRequiredError & {
  name: 'RpcUrlRequiredError'
}

export class RpcUrlRequiredError extends BaseError {
  constructor() {
    super('No RPC URL was configured for the client transport.', {
      metaMessages: [
        'Provide an explicit transport URL or configure `chain.rpcUrls.default.http[0]`.',
      ],
      name: 'RpcUrlRequiredError',
    })
  }
}

export type RpcRequestErrorType = RpcRequestError & {
  name: 'RpcRequestError'
}

export class RpcRequestError extends BaseError {
  constructor({
    body,
    method,
    status,
    url,
  }: {
    body: string
    method: string
    status: number
    url: string
  }) {
    super(`RPC request "${method}" failed with status ${status}.`, {
      metaMessages: [`URL: ${url}`, `Body: ${body}`],
      name: 'RpcRequestError',
    })
  }
}

export type RpcResponseErrorType = RpcResponseError & {
  name: 'RpcResponseError'
}

export class RpcResponseError extends BaseError {
  code: number

  constructor({
    code,
    data,
    message,
    method,
  }: {
    code: number
    data?: unknown
    message: string
    method: string
  }) {
    super(`RPC "${method}" returned error ${code}: ${message}`, {
      metaMessages: typeof data === 'undefined' ? undefined : [JSON.stringify(data)],
      name: 'RpcResponseError',
    })
    this.code = code
  }
}

export type TransactionReceiptTimeoutErrorType =
  TransactionReceiptTimeoutError & {
    name: 'TransactionReceiptTimeoutError'
  }

export class TransactionReceiptTimeoutError extends BaseError {
  hash: Hex

  constructor({
    hash,
    timeoutMs,
  }: {
    hash: Hex
    timeoutMs: number
  }) {
    super(`Timed out waiting for transaction receipt ${hash}.`, {
      metaMessages: [`Timeout: ${timeoutMs}ms`],
      name: 'TransactionReceiptTimeoutError',
    })
    this.hash = hash
  }
}

export type InvalidLogFilterErrorType = InvalidLogFilterError & {
  name: 'InvalidLogFilterError'
}

export class InvalidLogFilterError extends BaseError {
  constructor() {
    super('Invalid log filter parameters.', {
      metaMessages: [
        'Do not specify `blockHash` together with `fromBlock` or `toBlock`.',
      ],
      name: 'InvalidLogFilterError',
    })
  }
}
