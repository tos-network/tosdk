import type { Address } from './address.js'
import type { Hex } from './misc.js'

export type StorageReceiptStatus = 'active' | 'expired' | 'released'

export type StorageReceipt = {
  version: 1
  receiptId: string
  leaseId: string
  cid: string
  bundleHash: Hex
  bundleKind: string
  providerAddress: Address
  requesterAddress: Address
  sizeBytes: number
  ttlSeconds: number
  amountWei: string
  status: StorageReceiptStatus
  issuedAt: string
  expiresAt: string
  artifactUrl?: string | null | undefined
  paymentTxHash?: Hex | null | undefined
  metadata?: Record<string, unknown> | undefined
}

export type StorageAnchorSummary = {
  version: 1
  anchorId: string
  leaseId: string
  cid: string
  bundleHash: Hex
  providerAddress: Address
  requesterAddress: Address
  leaseRoot: Hex
  expiresAt: string
  createdAt: string
  metadata?: Record<string, unknown> | undefined
}
