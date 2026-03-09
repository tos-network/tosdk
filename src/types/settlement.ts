import type { Address } from './address.js'
import type { Hex } from './misc.js'

export type SettlementKind = 'bounty' | 'observation' | 'oracle'

export type SettlementReceipt = {
  version: 1
  receiptId: string
  kind: SettlementKind
  subjectId: string
  capability?: string | undefined
  publisherAddress: Address
  solverAddress?: Address | null | undefined
  payerAddress?: Address | null | undefined
  resultHash: Hex
  artifactUrl?: string | null | undefined
  paymentTxHash?: Hex | null | undefined
  payoutTxHash?: Hex | null | undefined
  createdAt: string
  metadata?: Record<string, unknown> | undefined
}
