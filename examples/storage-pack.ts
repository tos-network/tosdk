/**
 * Storage Builder Pack
 *
 * Demonstrates storage provider interactions:
 * - Request storage quotes
 * - Store bundles and retrieve leases
 * - Audit stored content
 * - Renew leases
 * - Verify storage receipts
 */
import {
  canonicalizeStorageReceipt,
  canonicalizeStorageAnchorSummary,
  createStorageProviderClient,
  hashStorageReceipt,
  hashStorageAnchorSummary,
} from '../src/index.js'
import type {
  Address,
  StorageQuoteRequest,
  StorageReceipt,
  StorageAnchorSummary,
} from '../src/index.js'

export function buildStoragePack() {
  const requesterAddress =
    '0x61cef93ad3eb77ef5c4cc65a17448286a9aa9931a10d712af4db9e8abb363e16' as Address
  const providerAddress =
    '0xa1f28ad7db747d8015af4bfcedfb93f57f3a8ab4cc9233d34a65df610f4f1122' as Address

  const storageProvider = createStorageProviderClient({
    baseUrl: 'https://storage.example.com',
  })

  /** Build a storage quote request */
  function buildQuoteRequest(params: {
    cid: string
    bundleKind: string
    sizeBytes: number
    ttlSeconds?: number
  }): StorageQuoteRequest {
    return {
      cid: params.cid,
      bundle_kind: params.bundleKind,
      size_bytes: params.sizeBytes,
      ttl_seconds: params.ttlSeconds ?? 3600,
      requester_address: requesterAddress,
    }
  }

  /** Verify a storage receipt */
  function verifyReceipt(receipt: StorageReceipt) {
    return {
      canonical: canonicalizeStorageReceipt(receipt),
      hash: hashStorageReceipt(receipt),
      isActive: receipt.status === 'active',
    }
  }

  /** Verify a storage anchor summary */
  function verifyAnchor(summary: StorageAnchorSummary) {
    return {
      canonical: canonicalizeStorageAnchorSummary(summary),
      hash: hashStorageAnchorSummary(summary),
    }
  }

  const sampleReceipt: StorageReceipt = {
    version: 1,
    receiptId: 'storage-pack-receipt-001',
    leaseId: 'storage-pack-lease-001',
    cid: 'bafybeidemopack',
    bundleHash:
      '0x5555555555555555555555555555555555555555555555555555555555555555' as const,
    bundleKind: 'public_news.capture',
    providerAddress,
    requesterAddress,
    sizeBytes: 2048,
    ttlSeconds: 3600,
    amountTomi: '1000000000000000',
    status: 'active',
    issuedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
  }

  return {
    requesterAddress,
    providerAddress,
    storageProvider,
    buildQuoteRequest,
    verifyReceipt,
    verifyAnchor,
    sampleReceipt,
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const pack = buildStoragePack()
  const check = pack.verifyReceipt(pack.sampleReceipt)
  console.log(
    JSON.stringify(
      {
        example: 'storage-pack',
        receiptHash: check.hash,
        isActive: check.isActive,
      },
      null,
      2,
    ),
  )
}
