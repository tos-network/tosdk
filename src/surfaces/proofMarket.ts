/**
 * Proof Market Surface
 *
 * Reusable helpers for consumers who need to read, validate, and filter
 * proof-oriented artifact bundles without depending on OpenFox internals.
 */
import type {
  ArtifactAnchorSummary,
  ArtifactBundleKind,
  ArtifactVerificationReceipt,
} from '../types/artifact.js'
import type { Hex } from '../types/misc.js'
import {
  canonicalizeArtifactAnchorSummary,
  canonicalizeArtifactVerificationReceipt,
  hashArtifactAnchorSummary,
  hashArtifactVerificationReceipt,
} from '../utils/artifact.js'

export type PublicProofArtifactKind =
  | 'zktls.bundle'
  | 'committee.vote'
  | 'committee.aggregate'
  | 'proof.verifier_receipt'
  | 'proof.material'

const PUBLIC_PROOF_KINDS = new Set<PublicProofArtifactKind>([
  'zktls.bundle',
  'committee.vote',
  'committee.aggregate',
  'proof.verifier_receipt',
  'proof.material',
])

const CRYPTOGRAPHIC_PROOF_KINDS = new Set<PublicProofArtifactKind>([
  'zktls.bundle',
  'proof.verifier_receipt',
  'proof.material',
])

export interface ProofArtifactSearchParams {
  kinds?: readonly PublicProofArtifactKind[]
  sourceUrlPrefix?: string
  subjectId?: string
  verifiedOnly?: boolean
  anchoredOnly?: boolean
}

export interface ProofVerificationResult {
  receiptHash: Hex
  canonical: string
  status: 'verified' | 'failed'
}

export interface ProofAnchorResult {
  summaryHash: Hex
  canonical: string
  anchorId: string
  kind: ArtifactBundleKind
}

export function isPublicProofArtifactKind(
  kind: ArtifactBundleKind,
): kind is PublicProofArtifactKind {
  return PUBLIC_PROOF_KINDS.has(kind as PublicProofArtifactKind)
}

export function isCryptographicProofArtifactKind(
  kind: ArtifactBundleKind,
): kind is PublicProofArtifactKind {
  return CRYPTOGRAPHIC_PROOF_KINDS.has(kind as PublicProofArtifactKind)
}

export function buildProofArtifactSearchParams(
  params: ProofArtifactSearchParams = {},
): ProofArtifactSearchParams {
  const kinds = params.kinds?.filter((kind) => PUBLIC_PROOF_KINDS.has(kind))
  const sourceUrlPrefix = params.sourceUrlPrefix?.trim()
  const subjectId = params.subjectId?.trim()
  return {
    ...(kinds?.length ? { kinds } : {}),
    ...(sourceUrlPrefix ? { sourceUrlPrefix } : {}),
    ...(subjectId ? { subjectId } : {}),
    ...(params.verifiedOnly === true ? { verifiedOnly: true } : {}),
    ...(params.anchoredOnly === true ? { anchoredOnly: true } : {}),
  }
}

export function verifyProofArtifactReceipt(
  receipt: ArtifactVerificationReceipt,
): ProofVerificationResult {
  return {
    receiptHash: hashArtifactVerificationReceipt(receipt),
    canonical: canonicalizeArtifactVerificationReceipt(receipt),
    status: receipt.status,
  }
}

export function verifyProofArtifactAnchor(
  summary: ArtifactAnchorSummary,
): ProofAnchorResult {
  return {
    summaryHash: hashArtifactAnchorSummary(summary),
    canonical: canonicalizeArtifactAnchorSummary(summary),
    anchorId: summary.anchorId,
    kind: summary.kind,
  }
}
