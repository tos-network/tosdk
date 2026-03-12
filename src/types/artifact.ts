import type { Address } from './address.js'
import type { Hex } from './misc.js'

export type ArtifactBundleKind =
  | 'public_news.capture'
  | 'zktls.bundle'
  | 'oracle.evidence'
  | 'oracle.aggregate'
  | 'committee.vote'
  | 'committee.aggregate'
  | 'proof.verifier_receipt'
  | 'proof.material'

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

export type ArtifactRequesterEnvelope = {
  requester: {
    identity: {
      kind: 'tos'
      value: Address
    }
  }
  request_nonce: string
  request_expires_at: number
}

export type CaptureBaseRequest = ArtifactRequesterEnvelope & {
  capability: string
  ttl_seconds?: number | undefined
  auto_anchor?: boolean | undefined
}

export type CaptureNewsRequest = CaptureBaseRequest & {
  title: string
  source_url: string
  headline?: string | undefined
  body_text: string
}

export type CaptureOracleEvidenceRequest = CaptureBaseRequest & {
  title: string
  question: string
  evidence_text: string
  source_url?: string | undefined
  related_artifact_ids?: readonly string[] | undefined
}

export type ArtifactProviderRecord = {
  artifactId: string
  kind: ArtifactBundleKind
  title: string
  leaseId: string
  quoteId?: string | null | undefined
  cid: string
  bundleHash: Hex
  providerBaseUrl: string
  providerAddress: Address
  requesterAddress: Address
  sourceUrl?: string | null | undefined
  subjectId?: string | null | undefined
  summaryText?: string | null | undefined
  resultDigest?: Hex | null | undefined
  metadata?: Record<string, unknown> | null | undefined
  status: 'stored' | 'verified' | 'anchored' | 'failed'
  verificationId?: string | null | undefined
  anchorId?: string | null | undefined
  createdAt: string
  updatedAt: string
}

export type ArtifactVerificationRecord = {
  verificationId: string
  artifactId: string
  receipt: ArtifactVerificationReceipt
  receiptHash: Hex
  createdAt: string
  updatedAt: string
}

export type ArtifactAnchorRecord = {
  anchorId: string
  artifactId: string
  summary: ArtifactAnchorSummary
  summaryHash: Hex
  anchorTxHash?: Hex | null | undefined
  anchorReceipt?: Record<string, unknown> | null | undefined
  createdAt: string
  updatedAt: string
}

export type ArtifactItemResponse = {
  artifact: ArtifactProviderRecord
  verification: ArtifactVerificationRecord | null
  anchor: ArtifactAnchorRecord | null
  artifact_url: string
}
