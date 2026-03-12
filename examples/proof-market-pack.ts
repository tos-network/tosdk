/**
 * Proof Market Pack
 *
 * Demonstrates reusable proof-oriented bundle classes and receipt helpers:
 * - classify proof artifact kinds
 * - build proof artifact search filters
 * - verify proof receipts and anchors
 */
import {
  buildProofArtifactSearchParams,
  isCryptographicProofArtifactKind,
  isPublicProofArtifactKind,
  verifyProofArtifactAnchor,
  verifyProofArtifactReceipt,
} from '../src/index.js'
import type {
  Address,
  ArtifactAnchorSummary,
  ArtifactVerificationReceipt,
  PublicProofArtifactKind,
} from '../src/index.js'

export function buildProofMarketPack() {
  const verifierAddress =
    '0x9d3b0b4e9e8665c2f8d8774d2a4f65dffcb03c91e8d883c4a863df1af9cdb012' as Address

  const kinds: PublicProofArtifactKind[] = [
    'zktls.bundle',
    'committee.vote',
    'committee.aggregate',
    'proof.verifier_receipt',
    'proof.material',
  ]

  const sampleReceipt: ArtifactVerificationReceipt = {
    version: 1,
    verificationId: 'proof-verify-001',
    artifactId: 'proof-artifact-001',
    kind: 'proof.verifier_receipt',
    cid: 'bafyproofverify001',
    bundleHash:
      '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' as const,
    verifierAddress,
    status: 'verified',
    responseHash:
      '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' as const,
    checkedAt: new Date().toISOString(),
  }

  const sampleAnchor: ArtifactAnchorSummary = {
    version: 1,
    anchorId: 'proof-anchor-001',
    artifactId: 'proof-artifact-001',
    kind: 'committee.aggregate',
    cid: 'bafyproofanchor001',
    bundleHash:
      '0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc' as const,
    createdAt: new Date().toISOString(),
  }

  return {
    kinds,
    publicKinds: kinds.filter((kind) => isPublicProofArtifactKind(kind)),
    cryptographicKinds: kinds.filter((kind) =>
      isCryptographicProofArtifactKind(kind),
    ),
    search: buildProofArtifactSearchParams({
      kinds: ['zktls.bundle', 'committee.aggregate'],
      sourceUrlPrefix: 'https://news.example.com',
      subjectId: 'times-homepage-2026-03-12',
      verifiedOnly: true,
      anchoredOnly: true,
    }),
    receipt: verifyProofArtifactReceipt(sampleReceipt),
    anchor: verifyProofArtifactAnchor(sampleAnchor),
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const pack = buildProofMarketPack()
  console.log(
    JSON.stringify(
      {
        example: 'proof-market-pack',
        publicKinds: pack.publicKinds,
        cryptographicKinds: pack.cryptographicKinds,
        search: pack.search,
        receiptHash: pack.receipt.receiptHash,
        anchorHash: pack.anchor.summaryHash,
      },
      null,
      2,
    ),
  )
}
