import type { RpcTransaction } from './client.js'

/** Map of address -> nonce -> transaction for a single pool section. */
export type TxPoolSection = Record<string, Record<string, RpcTransaction>>

/**
 * Full transaction pool content with pending and queued transactions
 * keyed by sender address and nonce.
 */
export type TxPoolContent = {
  pending: TxPoolSection
  queued: TxPoolSection
}

/**
 * Transaction pool content for a single address,
 * keyed by nonce string.
 */
export type TxPoolContentFrom = {
  pending: Record<string, RpcTransaction>
  queued: Record<string, RpcTransaction>
}

/** Transaction pool status counts. */
export type TxPoolStatus = {
  pending: number
  queued: number
}

/** Map of address -> nonce -> human-readable summary string for a single pool section. */
export type TxPoolInspectSection = Record<string, Record<string, string>>

/** Human-readable transaction pool inspection summary. */
export type TxPoolInspect = {
  pending: TxPoolInspectSection
  queued: TxPoolInspectSection
}
