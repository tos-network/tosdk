/**
 * Versioned schema references for operator API contracts.
 *
 * Operator schemas cover receipts, anchors, and verification records
 * that operators produce and consumers verify.
 */
import { createSchemaReference, type SchemaReference } from './version.js'

// -- Storage Receipts --

export const StorageReceiptSchema = createSchemaReference(
  'StorageReceipt',
  [
    'version', 'receiptId', 'leaseId', 'cid', 'bundleHash', 'bundleKind',
    'providerAddress', 'requesterAddress', 'sizeBytes', 'ttlSeconds',
    'amountTomi', 'status', 'issuedAt', 'expiresAt', 'artifactUrl',
    'paymentTxHash', 'metadata',
  ],
  [
    'version', 'receiptId', 'leaseId', 'cid', 'bundleHash', 'bundleKind',
    'providerAddress', 'requesterAddress', 'sizeBytes', 'ttlSeconds',
    'amountTomi', 'status', 'issuedAt', 'expiresAt',
  ],
)

export const StorageAnchorSummarySchema = createSchemaReference(
  'StorageAnchorSummary',
  [
    'version', 'anchorId', 'leaseId', 'cid', 'bundleHash',
    'providerAddress', 'requesterAddress', 'leaseRoot',
    'expiresAt', 'createdAt', 'metadata',
  ],
  [
    'version', 'anchorId', 'leaseId', 'cid', 'bundleHash',
    'providerAddress', 'requesterAddress', 'leaseRoot',
    'expiresAt', 'createdAt',
  ],
)

// -- Artifact Receipts --

export const ArtifactVerificationReceiptSchema = createSchemaReference(
  'ArtifactVerificationReceipt',
  [
    'version', 'verificationId', 'artifactId', 'kind', 'cid',
    'leaseId', 'bundleHash', 'verifierAddress', 'status',
    'responseHash', 'checkedAt', 'metadata',
  ],
  [
    'version', 'verificationId', 'artifactId', 'kind', 'cid',
    'bundleHash', 'status', 'responseHash', 'checkedAt',
  ],
)

export const ArtifactAnchorSummarySchema = createSchemaReference(
  'ArtifactAnchorSummary',
  [
    'version', 'anchorId', 'artifactId', 'kind', 'cid', 'bundleHash',
    'leaseId', 'providerAddress', 'requesterAddress', 'sourceUrl',
    'subjectId', 'resultDigest', 'createdAt', 'metadata',
  ],
  [
    'version', 'anchorId', 'artifactId', 'kind', 'cid', 'bundleHash',
    'createdAt',
  ],
)

export const ZkTlsBundleRecordSchema = createSchemaReference(
  'ZkTlsBundleRecord',
  [
    'recordId', 'jobId', 'requestKey', 'capability', 'requesterIdentity',
    'providerBackend', 'sourceUrl', 'resultUrl', 'bundleUrl', 'bundleFormat',
    'originClaims', 'verifierMaterialReferences', 'integrity', 'bundle',
    'metadata', 'createdAt', 'updatedAt',
  ],
  [
    'recordId', 'jobId', 'requestKey', 'capability', 'requesterIdentity',
    'providerBackend', 'sourceUrl', 'bundleFormat', 'originClaims',
    'verifierMaterialReferences', 'integrity', 'bundle', 'createdAt',
    'updatedAt',
  ],
)

export const ProofVerificationRecordSchema = createSchemaReference(
  'ProofVerificationRecord',
  [
    'recordId', 'resultId', 'requestKey', 'capability', 'requesterIdentity',
    'providerBackend', 'verifierClass', 'verificationMode', 'verdict',
    'verdictReason', 'summary', 'verifierProfile', 'verifierReceiptSha256',
    'verifierMaterialReference', 'boundSubjectHashes', 'request',
    'metadata', 'createdAt', 'updatedAt',
  ],
  [
    'recordId', 'resultId', 'requestKey', 'capability', 'requesterIdentity',
    'providerBackend', 'verifierClass', 'verificationMode', 'verdict',
    'verdictReason', 'summary', 'verifierReceiptSha256', 'boundSubjectHashes',
    'request', 'createdAt', 'updatedAt',
  ],
)

export const CommitteeRunRecordSchema = createSchemaReference(
  'CommitteeRunRecord',
  [
    'runId', 'kind', 'title', 'question', 'committeeSize', 'thresholdM',
    'members', 'subjectRef', 'artifactIds', 'status', 'winningResultHash',
    'disagreement', 'rerunCount', 'maxReruns', 'payoutTotalTomi', 'payouts',
    'tally', 'createdAt', 'updatedAt', 'metadata',
  ],
  [
    'runId', 'kind', 'title', 'question', 'committeeSize', 'thresholdM',
    'members', 'status', 'rerunCount', 'maxReruns', 'createdAt', 'updatedAt',
  ],
)

// -- Market & Settlement Receipts --

export const MarketBindingReceiptSchema = createSchemaReference(
  'MarketBindingReceipt',
  [
    'version', 'bindingId', 'kind', 'subjectId', 'capability',
    'publisherAddress', 'requesterAddress', 'paymentTxHash',
    'artifactUrl', 'createdAt', 'metadata',
  ],
  [
    'version', 'bindingId', 'kind', 'subjectId',
    'publisherAddress', 'createdAt',
  ],
)

export const SettlementReceiptSchema = createSchemaReference(
  'SettlementReceipt',
  [
    'version', 'receiptId', 'kind', 'subjectId', 'capability',
    'publisherAddress', 'solverAddress', 'payerAddress',
    'resultHash', 'artifactUrl', 'paymentTxHash', 'payoutTxHash',
    'createdAt', 'metadata',
  ],
  [
    'version', 'receiptId', 'kind', 'subjectId',
    'publisherAddress', 'resultHash', 'createdAt',
  ],
)

// -- All operator schemas registry --

export const ALL_OPERATOR_SCHEMAS: readonly SchemaReference[] = [
  StorageReceiptSchema,
  StorageAnchorSummarySchema,
  ArtifactVerificationReceiptSchema,
  ArtifactAnchorSummarySchema,
  ZkTlsBundleRecordSchema,
  ProofVerificationRecordSchema,
  CommitteeRunRecordSchema,
  MarketBindingReceiptSchema,
  SettlementReceiptSchema,
]
