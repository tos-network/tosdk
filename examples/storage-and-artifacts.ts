import {
  canonicalizeArtifactVerificationReceipt,
  canonicalizeStorageReceipt,
  createArtifactProviderClient,
  createStorageProviderClient,
  hashArtifactVerificationReceipt,
  hashStorageReceipt,
} from '../src/index.js'
import type { Address, ArtifactVerificationReceipt, StorageReceipt } from '../src/index.js'

export function buildStorageAndArtifactExamples() {
  const storageProvider = createStorageProviderClient({
    baseUrl: 'https://storage.example.com',
  })

  const artifactProvider = createArtifactProviderClient({
    baseUrl: 'https://artifacts.example.com',
  })

  const providerAddress =
    '0xc1ffd3cfee2d9e5cd67643f8f39fd6e51aad88f6f4ce6ab8827279cfffb92266' as Address
  const requesterAddress =
    '0x61cef93ad3eb77ef5c4cc65a17448286a9aa9931a10d712af4db9e8abb363e16' as Address

  const storageReceipt: StorageReceipt = {
    version: 1 as const,
    receiptId: 'receipt-demo-001',
    leaseId: 'lease-demo-001',
    cid: 'bafybeigdyrzt4demo',
    bundleHash:
      '0x1111111111111111111111111111111111111111111111111111111111111111' as const,
    bundleKind: 'public_news.capture',
    providerAddress,
    requesterAddress,
    sizeBytes: 1024,
    ttlSeconds: 3600,
    amountTomi: '1000',
    status: 'active' as const,
    issuedAt: '2026-03-10T00:00:00.000Z',
    expiresAt: '2026-03-10T01:00:00.000Z',
  }

  const artifactReceipt: ArtifactVerificationReceipt = {
    version: 1 as const,
    verificationId: 'verify-demo-001',
    artifactId: 'artifact-demo-001',
    kind: 'public_news.capture' as const,
    cid: 'bafybeigdyrzt4demo',
    leaseId: 'lease-demo-001',
    bundleHash:
      '0x1111111111111111111111111111111111111111111111111111111111111111' as const,
    verifierAddress: providerAddress,
    status: 'verified' as const,
    responseHash:
      '0x2222222222222222222222222222222222222222222222222222222222222222' as const,
    checkedAt: '2026-03-10T00:05:00.000Z',
  }

  return {
    storageProvider,
    artifactProvider,
    storageReceipt,
    storageReceiptCanonical: canonicalizeStorageReceipt(storageReceipt),
    storageReceiptHash: hashStorageReceipt(storageReceipt),
    artifactReceipt,
    artifactReceiptCanonical: canonicalizeArtifactVerificationReceipt(artifactReceipt),
    artifactReceiptHash: hashArtifactVerificationReceipt(artifactReceipt),
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const example = buildStorageAndArtifactExamples()
  console.log(
    JSON.stringify(
      {
        example: 'storage-and-artifacts',
        storageReceiptHash: example.storageReceiptHash,
        artifactReceiptHash: example.artifactReceiptHash,
      },
      null,
      2,
    ),
  )
}
