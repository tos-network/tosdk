import type { Address } from './address.js'
import type { Hex } from './misc.js'

export type MarketBindingKind = 'bounty' | 'observation' | 'oracle'

export type MarketBindingReceipt = {
  version: 1
  bindingId: string
  kind: MarketBindingKind
  subjectId: string
  capability?: string | undefined
  publisherAddress: Address
  requesterAddress?: Address | undefined
  paymentTxHash?: Hex | undefined
  artifactUrl?: string | undefined
  createdAt: string
  metadata?: Record<string, unknown> | undefined
}
