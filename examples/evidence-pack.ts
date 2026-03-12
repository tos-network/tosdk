/**
 * Evidence Builder Pack
 *
 * Demonstrates how to capture, verify, and anchor evidence artifacts:
 * - Capture oracle evidence through artifact providers
 * - Verify evidence receipts
 * - Hash and canonicalize evidence data
 * - Anchor evidence on-chain
 */
import {
  canonicalizeArtifactVerificationReceipt,
  canonicalizeArtifactAnchorSummary,
  createArtifactProviderClient,
  createStorageProviderClient,
  hashArtifactVerificationReceipt,
  hashArtifactAnchorSummary,
  hashArtifactValue,
} from '../src/index.js'
import type {
  Address,
  ArtifactAnchorSummary,
  ArtifactVerificationReceipt,
  CaptureOracleEvidenceRequest,
  Hex,
} from '../src/index.js'

export function buildEvidencePack() {
  const requesterAddress =
    '0x61cef93ad3eb77ef5c4cc65a17448286a9aa9931a10d712af4db9e8abb363e16' as Address
  const verifierAddress =
    '0xa1f28ad7db747d8015af4bfcedfb93f57f3a8ab4cc9233d34a65df610f4f1122' as Address

  const artifactProvider = createArtifactProviderClient({
    baseUrl: 'https://artifacts.example.com',
  })

  const storageProvider = createStorageProviderClient({
    baseUrl: 'https://storage.example.com',
  })

  /** Build an oracle evidence capture request */
  function buildEvidenceCaptureRequest(params: {
    title: string
    question: string
    evidenceText: string
    sourceUrl?: string
    relatedArtifactIds?: readonly string[]
  }): CaptureOracleEvidenceRequest {
    return {
      requester: { identity: { kind: 'tos', value: requesterAddress } },
      request_nonce: `evidence-${Date.now()}`,
      request_expires_at: Math.floor(Date.now() / 1000) + 300,
      capability: 'capture.oracle.evidence',
      ttl_seconds: 7200,
      auto_anchor: true,
      title: params.title,
      question: params.question,
      evidence_text: params.evidenceText,
      source_url: params.sourceUrl,
      related_artifact_ids: params.relatedArtifactIds,
    }
  }

  /** Verify an evidence receipt by checking hash integrity */
  function verifyEvidenceReceipt(receipt: ArtifactVerificationReceipt): {
    canonical: string
    hash: Hex
    valid: boolean
  } {
    const canonical = canonicalizeArtifactVerificationReceipt(receipt)
    const hash = hashArtifactVerificationReceipt(receipt)
    return {
      canonical,
      hash,
      valid: receipt.status === 'verified',
    }
  }

  /** Verify an anchor summary by checking hash integrity */
  function verifyAnchorSummary(summary: ArtifactAnchorSummary): {
    canonical: string
    hash: Hex
  } {
    return {
      canonical: canonicalizeArtifactAnchorSummary(summary),
      hash: hashArtifactAnchorSummary(summary),
    }
  }

  const sampleReceipt: ArtifactVerificationReceipt = {
    version: 1,
    verificationId: 'evidence-verify-001',
    artifactId: 'evidence-artifact-001',
    kind: 'oracle.evidence',
    cid: 'bafybeievidence001',
    leaseId: 'evidence-lease-001',
    bundleHash:
      '0x3333333333333333333333333333333333333333333333333333333333333333' as const,
    verifierAddress,
    status: 'verified',
    responseHash:
      '0x4444444444444444444444444444444444444444444444444444444444444444' as const,
    checkedAt: new Date().toISOString(),
  }

  const sampleAnchor: ArtifactAnchorSummary = {
    version: 1,
    anchorId: 'evidence-anchor-001',
    artifactId: 'evidence-artifact-001',
    kind: 'oracle.evidence',
    cid: 'bafybeievidence001',
    bundleHash:
      '0x3333333333333333333333333333333333333333333333333333333333333333' as const,
    leaseId: 'evidence-lease-001',
    providerAddress: verifierAddress,
    requesterAddress,
    createdAt: new Date().toISOString(),
  }

  return {
    requesterAddress,
    verifierAddress,
    artifactProvider,
    storageProvider,
    buildEvidenceCaptureRequest,
    verifyEvidenceReceipt,
    verifyAnchorSummary,
    hashArtifactValue,
    sampleReceipt,
    sampleAnchor,
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const pack = buildEvidencePack()
  const receiptCheck = pack.verifyEvidenceReceipt(pack.sampleReceipt)
  const anchorCheck = pack.verifyAnchorSummary(pack.sampleAnchor)
  console.log(
    JSON.stringify(
      {
        example: 'evidence-pack',
        receiptHash: receiptCheck.hash,
        receiptValid: receiptCheck.valid,
        anchorHash: anchorCheck.hash,
      },
      null,
      2,
    ),
  )
}
