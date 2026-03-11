import {
  canonicalizeMarketBindingReceipt,
  canonicalizeSettlementReceipt,
  hashMarketBindingReceipt,
  hashSettlementReceipt,
} from '../src/index.js'
import type { Address, MarketBindingReceipt, SettlementReceipt } from '../src/index.js'

export function buildMarketplaceAndSettlementExample() {
  const publisherAddress =
    '0x61cef93ad3eb77ef5c4cc65a17448286a9aa9931a10d712af4db9e8abb363e16' as Address
  const requesterAddress =
    '0xa1f28ad7db747d8015af4bfcedfb93f57f3a8ab4cc9233d34a65df610f4f1122' as Address
  const solverAddress =
    '0xb4cc9233d34a65df610f4f1122a1f28ad7db747d8015af4bfcedfb93f57f3a8ab' as Address

  const marketBindingReceipt: MarketBindingReceipt = {
    version: 1,
    bindingId: 'market-binding-demo-001',
    kind: 'bounty',
    subjectId: 'bounty-demo-001',
    capability: 'problem_solving.general',
    publisherAddress,
    requesterAddress,
    paymentTxHash:
      '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    artifactUrl: '/artifacts/item/artifact-bounty-001',
    createdAt: '2026-03-11T00:00:00.000Z',
    metadata: {
      settlementMode: 'manual',
      rewardWei: '50000000000000000',
    },
  }

  const settlementReceipt: SettlementReceipt = {
    version: 1,
    receiptId: 'settlement-demo-001',
    kind: 'bounty',
    subjectId: 'bounty-demo-001',
    capability: 'problem_solving.general',
    publisherAddress,
    solverAddress,
    payerAddress: requesterAddress,
    resultHash:
      '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    artifactUrl: '/artifacts/item/artifact-bounty-001',
    paymentTxHash:
      '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    payoutTxHash:
      '0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
    createdAt: '2026-03-11T00:05:00.000Z',
    metadata: {
      outcome: 'accepted',
      confidence: 0.97,
    },
  }

  return {
    marketBindingReceipt,
    marketBindingCanonical: canonicalizeMarketBindingReceipt(marketBindingReceipt),
    marketBindingHash: hashMarketBindingReceipt(marketBindingReceipt),
    settlementReceipt,
    settlementCanonical: canonicalizeSettlementReceipt(settlementReceipt),
    settlementHash: hashSettlementReceipt(settlementReceipt),
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const example = buildMarketplaceAndSettlementExample()
  console.log(
    JSON.stringify(
      {
        example: 'marketplace-and-settlement',
        marketBindingHash: example.marketBindingHash,
        settlementHash: example.settlementHash,
      },
      null,
      2,
    ),
  )
}
