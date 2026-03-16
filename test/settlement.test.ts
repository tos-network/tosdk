import { describe, expect, it } from 'vitest'

import {
  canonicalizeSettlementReceipt,
  hashSettlementReceipt,
  hashSettlementValue,
} from '../src/index.js'

describe('settlement helpers', () => {
  it('canonicalizes receipts with stable key ordering', () => {
    const receipt = {
      version: 1 as const,
      receiptId: 'observation:job-1',
      kind: 'observation' as const,
      subjectId: 'job-1',
      publisherAddress:
        '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' as const,
      resultHash:
        '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' as const,
      createdAt: '2026-03-09T00:00:00.000Z',
      metadata: {
        zeta: 1,
        alpha: {
          two: 2,
          one: 1,
        },
      },
    }

    expect(canonicalizeSettlementReceipt(receipt)).toBe(
      '{"createdAt":"2026-03-09T00:00:00.000Z","kind":"observation","metadata":{"alpha":{"one":1,"two":2},"zeta":1},"publisherAddress":"0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","receiptId":"observation:job-1","resultHash":"0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb","subjectId":"job-1","version":1}',
    )
  })

  it('produces the same hash for equivalent values with different key order', () => {
    const a = {
      summary: 'ok',
      confidence: 0.9,
      payload: { b: 2, a: 1 },
    }
    const b = {
      payload: { a: 1, b: 2 },
      confidence: 0.9,
      summary: 'ok',
    }

    expect(hashSettlementValue(a)).toBe(hashSettlementValue(b))
  })

  it('hashes full settlement receipts deterministically', () => {
    const receipt = {
      version: 1 as const,
      receiptId: 'oracle:result-1',
      kind: 'oracle' as const,
      subjectId: 'result-1',
      capability: 'oracle.resolve',
      publisherAddress:
        '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' as const,
      payerAddress:
        '0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc' as const,
      resultHash:
        '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' as const,
      artifactUrl: '/oracle/result/result-1',
      paymentTxHash:
        '0xdddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd' as const,
      createdAt: '2026-03-09T00:00:00.000Z',
    }

    expect(hashSettlementReceipt(receipt)).toMatch(/^0x[0-9a-f]{64}$/)
  })
})
