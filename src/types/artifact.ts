import type { Address } from './address.js'
import type { Hex } from './misc.js'

export type ArtifactBundleKind =
  | 'public_news.capture'
  | 'oracle.evidence'
  | 'oracle.aggregate'
  | 'committee.vote'

export type ArtifactVerificationStatus = 'verified' | 'failed'

export interface ArtifactAnchorSummary {
  version: 1
  anchorId: string
  artifactId: string
  kind: ArtifactBundleKind
  cid: string
  bundleHash: Hex
  leaseId?: string
  providerAddress?: Address
  requesterAddress?: Address
  sourceUrl?: string
  subjectId?: string
  resultDigest?: Hex
  createdAt: string
  metadata?: Record<string, unknown>
}

export interface ArtifactVerificationReceipt {
  version: 1
  verificationId: string
  artifactId: string
  kind: ArtifactBundleKind
  cid: string
  leaseId?: string
  bundleHash: Hex
  verifierAddress?: Address
  status: ArtifactVerificationStatus
  responseHash: Hex
  checkedAt: string
  metadata?: Record<string, unknown>
}
