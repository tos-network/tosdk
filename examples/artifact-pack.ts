/**
 * Artifact Builder Pack
 *
 * Demonstrates artifact lifecycle management:
 * - Capture news and oracle evidence
 * - Retrieve artifact items
 * - Verify and anchor artifacts
 * - Hash artifact data for integrity
 */
import {
  canonicalizeArtifactVerificationReceipt,
  canonicalizeArtifactAnchorSummary,
  createArtifactProviderClient,
  hashArtifactVerificationReceipt,
  hashArtifactAnchorSummary,
  hashArtifactValue,
} from '../src/index.js'
import type {
  Address,
  ArtifactAnchorSummary,
  ArtifactVerificationReceipt,
  CaptureNewsRequest,
  CaptureOracleEvidenceRequest,
  Hex,
} from '../src/index.js'

export function buildArtifactPack() {
  const requesterAddress =
    '0x61cef93ad3eb77ef5c4cc65a17448286a9aa9931a10d712af4db9e8abb363e16' as Address
  const providerAddress =
    '0xa1f28ad7db747d8015af4bfcedfb93f57f3a8ab4cc9233d34a65df610f4f1122' as Address

  const artifactProvider = createArtifactProviderClient({
    baseUrl: 'https://artifacts.example.com',
  })

  /** Build a news capture request */
  function buildNewsCaptureRequest(params: {
    title: string
    sourceUrl: string
    bodyText: string
    ttlSeconds?: number
  }): CaptureNewsRequest {
    return {
      requester: { identity: { kind: 'tos', value: requesterAddress } },
      request_nonce: `capture-news-${Date.now()}`,
      request_expires_at: Math.floor(Date.now() / 1000) + 300,
      capability: 'capture.news.public',
      ttl_seconds: params.ttlSeconds ?? 7200,
      auto_anchor: true,
      title: params.title,
      source_url: params.sourceUrl,
      body_text: params.bodyText,
    }
  }

  /** Build an oracle evidence capture request */
  function buildOracleEvidenceRequest(params: {
    title: string
    question: string
    evidenceText: string
    sourceUrl?: string
  }): CaptureOracleEvidenceRequest {
    return {
      requester: { identity: { kind: 'tos', value: requesterAddress } },
      request_nonce: `capture-oracle-${Date.now()}`,
      request_expires_at: Math.floor(Date.now() / 1000) + 300,
      capability: 'capture.oracle.evidence',
      ttl_seconds: 7200,
      auto_anchor: true,
      title: params.title,
      question: params.question,
      evidence_text: params.evidenceText,
      source_url: params.sourceUrl,
    }
  }

  /** Hash any artifact value for integrity checking */
  function hashValue(value: unknown): Hex {
    return hashArtifactValue(value)
  }

  /** Verify an artifact verification receipt */
  function verifyReceipt(receipt: ArtifactVerificationReceipt) {
    return {
      canonical: canonicalizeArtifactVerificationReceipt(receipt),
      hash: hashArtifactVerificationReceipt(receipt),
      isVerified: receipt.status === 'verified',
    }
  }

  /** Verify an artifact anchor summary */
  function verifyAnchor(summary: ArtifactAnchorSummary) {
    return {
      canonical: canonicalizeArtifactAnchorSummary(summary),
      hash: hashArtifactAnchorSummary(summary),
    }
  }

  return {
    requesterAddress,
    providerAddress,
    artifactProvider,
    buildNewsCaptureRequest,
    buildOracleEvidenceRequest,
    hashValue,
    verifyReceipt,
    verifyAnchor,
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const pack = buildArtifactPack()
  console.log(
    JSON.stringify(
      {
        example: 'artifact-pack',
        requesterAddress: pack.requesterAddress,
        providerAddress: pack.providerAddress,
        supportedKinds: [
          'public_news.capture',
          'oracle.evidence',
          'oracle.aggregate',
          'committee.vote',
        ],
      },
      null,
      2,
    ),
  )
}
