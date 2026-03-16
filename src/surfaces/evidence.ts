/**
 * Evidence Surface
 *
 * Reusable helpers for evidence consumers who need to capture,
 * verify, and anchor oracle evidence through the artifact system.
 */
import type {
  ArtifactAnchorSummary,
  ArtifactBundleKind,
  ArtifactVerificationReceipt,
  CaptureOracleEvidenceRequest,
} from '../types/artifact.js'
import type { Address } from '../types/address.js'
import type { Hex } from '../types/misc.js'
import {
  canonicalizeArtifactVerificationReceipt,
  hashArtifactVerificationReceipt,
  canonicalizeArtifactAnchorSummary,
  hashArtifactAnchorSummary,
} from '../utils/artifact.js'

export type EvidenceCaptureParams = {
  requesterAddress: Address
  title: string
  question: string
  evidenceText: string
  sourceUrl?: string
  relatedArtifactIds?: readonly string[]
  ttlSeconds?: number
  autoAnchor?: boolean
}

export type EvidenceVerificationResult = {
  receiptHash: Hex
  canonical: string
  isVerified: boolean
  verifierAddress?: Address | undefined
  checkedAt: string
}

export type EvidenceAnchorResult = {
  summaryHash: Hex
  canonical: string
  anchorId: string
  artifactId: string
}

/** Build an oracle evidence capture request from simplified params */
export function buildEvidenceCaptureRequest(
  params: EvidenceCaptureParams,
): CaptureOracleEvidenceRequest {
  return {
    requester: {
      identity: { kind: 'tos', value: params.requesterAddress },
    },
    request_nonce: `evidence-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    request_expires_at: Math.floor(Date.now() / 1000) + 300,
    capability: 'capture.oracle.evidence',
    ttl_seconds: params.ttlSeconds ?? 7200,
    auto_anchor: params.autoAnchor ?? true,
    title: params.title,
    question: params.question,
    evidence_text: params.evidenceText,
    source_url: params.sourceUrl,
    related_artifact_ids: params.relatedArtifactIds,
  }
}

/** Verify an evidence verification receipt and return structured result */
export function verifyEvidenceReceipt(
  receipt: ArtifactVerificationReceipt,
): EvidenceVerificationResult {
  return {
    receiptHash: hashArtifactVerificationReceipt(receipt),
    canonical: canonicalizeArtifactVerificationReceipt(receipt),
    isVerified: receipt.status === 'verified',
    verifierAddress: receipt.verifierAddress,
    checkedAt: receipt.checkedAt,
  }
}

/** Verify an evidence anchor summary and return structured result */
export function verifyEvidenceAnchor(
  summary: ArtifactAnchorSummary,
): EvidenceAnchorResult {
  return {
    summaryHash: hashArtifactAnchorSummary(summary),
    canonical: canonicalizeArtifactAnchorSummary(summary),
    anchorId: summary.anchorId,
    artifactId: summary.artifactId,
  }
}

/** Check whether an evidence artifact kind is an oracle type */
export function isOracleEvidenceKind(kind: ArtifactBundleKind): boolean {
  return kind === 'oracle.evidence' || kind === 'oracle.aggregate'
}

/** Validate evidence capture params before submitting */
export function validateEvidenceParams(
  params: EvidenceCaptureParams,
): string[] {
  const errors: string[] = []
  if (!params.requesterAddress) errors.push('requesterAddress is required')
  if (!params.title || params.title.trim().length === 0) {
    errors.push('title is required')
  }
  if (!params.question || params.question.trim().length === 0) {
    errors.push('question is required')
  }
  if (!params.evidenceText || params.evidenceText.trim().length === 0) {
    errors.push('evidenceText is required')
  }
  if (params.ttlSeconds !== undefined && params.ttlSeconds <= 0) {
    errors.push('ttlSeconds must be positive')
  }
  return errors
}
