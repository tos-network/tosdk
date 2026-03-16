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

export type StorageQuoteRequest = {
  cid: string
  bundle_kind: string
  size_bytes: number
  ttl_seconds: number
  requester_address: Address
}

export type StorageIdentityEnvelope = {
  requester: {
    identity: {
      kind: 'tos'
      value: Address
    }
  }
  request_nonce: string
  request_expires_at: number
}

export type StoragePutRequest = StorageIdentityEnvelope & {
  quote_id?: string | undefined
  bundle: unknown
  bundle_kind: string
  ttl_seconds?: number | undefined
  cid?: string | undefined
}

export type StorageRenewRequest = StorageIdentityEnvelope & {
  lease_id: string
  ttl_seconds?: number | undefined
}

export type StorageQuoteResponse = {
  quote_id: string
  provider_address: Address
  requester_address: Address
  cid: string
  bundle_kind: string
  size_bytes: number
  ttl_seconds: number
  amount_wei: string
  expires_at: string
}

export type StorageLeaseResponse = {
  lease_id: string
  cid: string
  bundle_hash: Hex
  bundle_kind: string
  provider_address: Address
  size_bytes: number
  ttl_seconds: number
  amount_wei: string
  issued_at: string
  expires_at: string
  receipt_id: string
  receipt_hash: Hex
  payment_tx_hash?: Hex | undefined
  payment_status?: string | undefined
  get_url: string
  head_url: string
  anchor_tx_hash?: Hex | undefined
}

export type StorageRenewalResponse = StorageLeaseResponse & {
  renewal_id: string
  previous_expires_at: string
  renewed_expires_at: string
  added_ttl_seconds: number
}

export type StorageAuditResponse = {
  audit_id: string
  lease_id: string
  cid: string
  status: 'verified' | 'failed'
  response_hash: Hex
  checked_at: string
}

export type StoredBundleResponse = {
  lease: StorageLeaseResponse
  bundle: unknown
}
