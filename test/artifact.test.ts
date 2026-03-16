import { describe, expect, it } from 'vitest'
import {
  canonicalizeArtifactAnchorSummary,
  canonicalizeArtifactVerificationReceipt,
  hashArtifactAnchorSummary,
  hashArtifactVerificationReceipt,
  type ArtifactAnchorSummary,
  type ArtifactVerificationReceipt,
} from '../src/index.js'

describe('artifact helpers', () => {
  it('canonicalizes artifact anchor summaries deterministically', () => {
    const summary: ArtifactAnchorSummary = {
      version: 1,
      anchorId: 'anchor-1',
      artifactId: 'artifact-1',
      kind: 'public_news.capture',
      cid: 'bafytestcid',
      bundleHash: '0x11',
      leaseId: 'lease-1',
      providerAddress:
        '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      requesterAddress:
        '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      sourceUrl: 'https://example.com/news/1',
      subjectId: 'subject-1',
      resultDigest: '0x22',
      createdAt: '2026-03-10T00:00:00.000Z',
      metadata: {
        labels: ['news', 'capture'],
        title: 'Example',
      },
    }

    expect(canonicalizeArtifactAnchorSummary(summary)).toBe(
      canonicalizeArtifactAnchorSummary({
        ...summary,
        metadata: {
          title: 'Example',
          labels: ['news', 'capture'],
        },
      }),
    )
    expect(hashArtifactAnchorSummary(summary)).toMatch(/^0x[0-9a-f]+$/)
  })

  it('canonicalizes artifact verification receipts deterministically', () => {
    const receipt: ArtifactVerificationReceipt = {
      version: 1,
      verificationId: 'verify-1',
      artifactId: 'artifact-1',
      kind: 'oracle.evidence',
      cid: 'bafyverifycid',
      leaseId: 'lease-1',
      bundleHash: '0x33',
      verifierAddress:
        '0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
      status: 'verified',
      responseHash: '0x44',
      checkedAt: '2026-03-10T00:01:00.000Z',
      metadata: {
        challenge: 'nonce',
        ok: true,
      },
    }

    expect(canonicalizeArtifactVerificationReceipt(receipt)).toBe(
      canonicalizeArtifactVerificationReceipt({
        ...receipt,
        metadata: {
          ok: true,
          challenge: 'nonce',
        },
      }),
    )
    expect(hashArtifactVerificationReceipt(receipt)).toMatch(/^0x[0-9a-f]+$/)
  })
})
