/**
 * Marketplace Builder Pack
 *
 * Demonstrates marketplace and settlement workflows:
 * - Create market bindings (bounty, observation, oracle)
 * - Process settlements
 * - Hash and verify binding/settlement receipts
 */
import {
  canonicalizeMarketBindingReceipt,
  canonicalizeSettlementReceipt,
  hashMarketBindingReceipt,
  hashSettlementReceipt,
} from '../src/index.js'
import type {
  Address,
  MarketBindingReceipt,
  MarketBindingKind,
  SettlementReceipt,
  SettlementKind,
  Hex,
} from '../src/index.js'

export function buildMarketplacePack() {
  const publisherAddress =
    '0x61cef93ad3eb77ef5c4cc65a17448286a9aa9931a10d712af4db9e8abb363e16' as Address
  const requesterAddress =
    '0xa1f28ad7db747d8015af4bfcedfb93f57f3a8ab4cc9233d34a65df610f4f1122' as Address
  const solverAddress =
    '0xb4cc9233d34a65df610f4f1122a1f28ad7db747d8015af4bfcedfb93f57f3a8ab' as Address

  /** Create a market binding receipt for a given kind */
  function createBinding(params: {
    kind: MarketBindingKind
    subjectId: string
    capability?: string
    rewardWei?: string
  }): MarketBindingReceipt {
    return {
      version: 1,
      bindingId: `binding-${params.kind}-${Date.now()}`,
      kind: params.kind,
      subjectId: params.subjectId,
      capability: params.capability,
      publisherAddress,
      requesterAddress,
      createdAt: new Date().toISOString(),
      metadata: {
        settlementMode: 'manual',
        rewardWei: params.rewardWei ?? '50000000000000000',
      },
    }
  }

  /** Create a settlement receipt */
  function createSettlement(params: {
    kind: SettlementKind
    subjectId: string
    capability?: string
    resultHash: Hex
  }): SettlementReceipt {
    return {
      version: 1,
      receiptId: `settlement-${params.kind}-${Date.now()}`,
      kind: params.kind,
      subjectId: params.subjectId,
      capability: params.capability,
      publisherAddress,
      solverAddress,
      payerAddress: requesterAddress,
      resultHash: params.resultHash,
      createdAt: new Date().toISOString(),
    }
  }

  /** Verify a binding receipt */
  function verifyBinding(receipt: MarketBindingReceipt) {
    return {
      canonical: canonicalizeMarketBindingReceipt(receipt),
      hash: hashMarketBindingReceipt(receipt),
    }
  }

  /** Verify a settlement receipt */
  function verifySettlement(receipt: SettlementReceipt) {
    return {
      canonical: canonicalizeSettlementReceipt(receipt),
      hash: hashSettlementReceipt(receipt),
    }
  }

  return {
    publisherAddress,
    requesterAddress,
    solverAddress,
    createBinding,
    createSettlement,
    verifyBinding,
    verifySettlement,
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const pack = buildMarketplacePack()
  const binding = pack.createBinding({
    kind: 'bounty',
    subjectId: 'bounty-001',
    capability: 'problem_solving.general',
  })
  const settlement = pack.createSettlement({
    kind: 'bounty',
    subjectId: 'bounty-001',
    resultHash:
      '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
  })
  console.log(
    JSON.stringify(
      {
        example: 'marketplace-pack',
        bindingHash: pack.verifyBinding(binding).hash,
        settlementHash: pack.verifySettlement(settlement).hash,
      },
      null,
      2,
    ),
  )
}
