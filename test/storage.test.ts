import { describe, expect, it } from 'vitest'
import {
  canonicalizeStorageAnchorSummary,
  canonicalizeStorageReceipt,
  hashStorageAnchorSummary,
  hashStorageReceipt,
} from '../src/index.js'
import type { StorageAnchorSummary, StorageReceipt } from '../src/index.js'

describe('storage helpers', () => {
  it('canonicalizes storage receipts deterministically', () => {
    const receipt: StorageReceipt = {
      version: 1,
      receiptId: 'receipt-1',
      leaseId: 'lease-1',
      cid: 'cid:test',
      bundleHash: '0x11',
      bundleKind: 'artifact.bundle',
      providerAddress:
        '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      requesterAddress:
        '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      sizeBytes: 42,
      ttlSeconds: 3600,
      amountWei: '1000',
      status: 'active',
      issuedAt: '2026-03-09T00:00:00.000Z',
      expiresAt: '2026-03-09T01:00:00.000Z',
      metadata: {
        z: 1,
        a: 'ordered',
      },
    }

    expect(canonicalizeStorageReceipt(receipt)).toBe(
      canonicalizeStorageReceipt({
        ...receipt,
        metadata: {
          a: 'ordered',
          z: 1,
        },
      }),
    )
    expect(hashStorageReceipt(receipt)).toMatch(/^0x[0-9a-f]+$/)
  })

  it('canonicalizes storage anchor summaries deterministically', () => {
    const summary: StorageAnchorSummary = {
      version: 1,
      anchorId: 'anchor-1',
      leaseId: 'lease-1',
      cid: 'cid:test',
      bundleHash: '0x22',
      providerAddress:
        '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      requesterAddress:
        '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      leaseRoot: '0x33',
      expiresAt: '2026-03-09T01:00:00.000Z',
      createdAt: '2026-03-09T00:00:00.000Z',
      metadata: {
        labels: ['one', 'two'],
      },
    }

    expect(canonicalizeStorageAnchorSummary(summary)).toContain('"anchorId":"anchor-1"')
    expect(hashStorageAnchorSummary(summary)).toMatch(/^0x[0-9a-f]+$/)
  })
})
