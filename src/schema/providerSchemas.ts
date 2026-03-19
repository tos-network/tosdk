/**
 * Versioned schema references for provider API contracts.
 *
 * These references define the expected shape of requests and responses
 * for each provider type. Used for validation and drift detection.
 */
import { createSchemaReference, type SchemaReference } from './version.js'

// -- Signer Provider Schemas --

export const SignerQuoteRequestSchema = createSchemaReference(
  'SignerQuoteRequest',
  ['requester', 'target', 'value_tomi', 'data', 'gas', 'reason'],
  ['requester', 'target'],
)

export const SignerQuoteResponseSchema = createSchemaReference(
  'SignerQuoteResponse',
  [
    'quoteId', 'chainId', 'providerAddress', 'walletAddress',
    'requesterAddress', 'targetAddress', 'valueTomi', 'dataHex',
    'gas', 'policyId', 'policyHash', 'scopeHash', 'delegateIdentity',
    'trustTier', 'amountTomi', 'status', 'expiresAt', 'createdAt', 'updatedAt',
  ],
  [
    'quoteId', 'chainId', 'providerAddress', 'walletAddress',
    'requesterAddress', 'targetAddress', 'valueTomi', 'dataHex',
    'gas', 'policyId', 'policyHash', 'scopeHash',
    'trustTier', 'amountTomi', 'status', 'expiresAt', 'createdAt', 'updatedAt',
  ],
)

export const SignerSubmitRequestSchema = createSchemaReference(
  'SignerSubmitRequest',
  ['requester', 'quote_id', 'request_nonce', 'request_expires_at', 'target', 'value_tomi', 'data', 'gas', 'reason'],
  ['requester', 'quote_id', 'request_nonce', 'request_expires_at', 'target'],
)

export const SignerExecutionResponseSchema = createSchemaReference(
  'SignerExecutionResponse',
  [
    'executionId', 'quoteId', 'requestKey', 'requestHash',
    'providerAddress', 'walletAddress', 'requesterAddress', 'targetAddress',
    'valueTomi', 'dataHex', 'gas', 'policyId', 'policyHash', 'scopeHash',
    'delegateIdentity', 'trustTier', 'requestNonce', 'requestExpiresAt',
    'reason', 'paymentId', 'submittedTxHash', 'submittedReceipt',
    'receiptHash', 'status', 'lastError', 'createdAt', 'updatedAt',
  ],
  [
    'executionId', 'quoteId', 'requestKey', 'requestHash',
    'providerAddress', 'walletAddress', 'requesterAddress', 'targetAddress',
    'valueTomi', 'dataHex', 'gas', 'policyId', 'policyHash', 'scopeHash',
    'trustTier', 'requestNonce', 'requestExpiresAt',
    'status', 'createdAt', 'updatedAt',
  ],
)

// -- Paymaster Provider Schemas --

export const PaymasterQuoteRequestSchema = createSchemaReference(
  'PaymasterQuoteRequest',
  ['requester', 'wallet_address', 'target', 'value_tomi', 'data', 'gas', 'reason'],
  ['requester', 'wallet_address', 'target'],
)

export const PaymasterQuoteResponseSchema = createSchemaReference(
  'PaymasterQuoteResponse',
  [
    'quoteId', 'chainId', 'providerAddress', 'sponsorAddress', 'sponsorSignerType',
    'walletAddress', 'requesterAddress', 'requesterSignerType', 'targetAddress',
    'valueTomi', 'dataHex', 'gas', 'policyId', 'policyHash', 'scopeHash',
    'delegateIdentity', 'trustTier', 'amountTomi', 'sponsorNonce', 'sponsorExpiry',
    'status', 'expiresAt', 'createdAt', 'updatedAt',
  ],
  [
    'quoteId', 'chainId', 'providerAddress', 'sponsorAddress', 'sponsorSignerType',
    'walletAddress', 'requesterAddress', 'requesterSignerType', 'targetAddress',
    'valueTomi', 'dataHex', 'gas', 'policyId', 'policyHash', 'scopeHash',
    'trustTier', 'amountTomi', 'sponsorNonce', 'sponsorExpiry',
    'status', 'expiresAt', 'createdAt', 'updatedAt',
  ],
)

export const PaymasterAuthorizeRequestSchema = createSchemaReference(
  'PaymasterAuthorizeRequest',
  [
    'requester', 'quote_id', 'wallet_address', 'request_nonce',
    'request_expires_at', 'execution_nonce', 'target', 'value_tomi',
    'data', 'gas', 'execution_signature', 'reason',
  ],
  [
    'requester', 'quote_id', 'wallet_address', 'request_nonce',
    'request_expires_at', 'execution_nonce', 'target', 'value_tomi',
    'data', 'gas', 'execution_signature',
  ],
)

export const PaymasterAuthorizationResponseSchema = createSchemaReference(
  'PaymasterAuthorizationResponse',
  [
    'authorizationId', 'quoteId', 'chainId', 'requestKey', 'requestHash',
    'providerAddress', 'sponsorAddress', 'sponsorSignerType',
    'walletAddress', 'requesterAddress', 'requesterSignerType', 'targetAddress',
    'valueTomi', 'dataHex', 'gas', 'policyId', 'policyHash', 'scopeHash',
    'delegateIdentity', 'trustTier', 'requestNonce', 'requestExpiresAt',
    'executionNonce', 'sponsorNonce', 'sponsorExpiry', 'reason',
    'paymentId', 'executionSignature', 'sponsorSignature',
    'submittedTxHash', 'submittedReceipt', 'receiptHash',
    'status', 'lastError', 'createdAt', 'updatedAt',
  ],
  [
    'authorizationId', 'quoteId', 'chainId', 'requestKey', 'requestHash',
    'providerAddress', 'sponsorAddress', 'sponsorSignerType',
    'walletAddress', 'requesterAddress', 'requesterSignerType', 'targetAddress',
    'valueTomi', 'dataHex', 'gas', 'policyId', 'policyHash', 'scopeHash',
    'trustTier', 'requestNonce', 'requestExpiresAt',
    'executionNonce', 'sponsorNonce', 'sponsorExpiry',
    'status', 'createdAt', 'updatedAt',
  ],
)

// -- Storage Provider Schemas --

export const StorageQuoteRequestSchema = createSchemaReference(
  'StorageQuoteRequest',
  ['cid', 'bundle_kind', 'size_bytes', 'ttl_seconds', 'requester_address'],
  ['cid', 'bundle_kind', 'size_bytes', 'ttl_seconds', 'requester_address'],
)

export const StorageQuoteResponseSchema = createSchemaReference(
  'StorageQuoteResponse',
  [
    'quote_id', 'provider_address', 'requester_address', 'cid',
    'bundle_kind', 'size_bytes', 'ttl_seconds', 'amount_tomi', 'expires_at',
  ],
  [
    'quote_id', 'provider_address', 'requester_address', 'cid',
    'bundle_kind', 'size_bytes', 'ttl_seconds', 'amount_tomi', 'expires_at',
  ],
)

export const StoragePutRequestSchema = createSchemaReference(
  'StoragePutRequest',
  ['requester', 'request_nonce', 'request_expires_at', 'quote_id', 'bundle', 'bundle_kind', 'ttl_seconds', 'cid'],
  ['requester', 'request_nonce', 'request_expires_at', 'bundle', 'bundle_kind'],
)

export const StorageLeaseResponseSchema = createSchemaReference(
  'StorageLeaseResponse',
  [
    'lease_id', 'cid', 'bundle_hash', 'bundle_kind', 'provider_address',
    'size_bytes', 'ttl_seconds', 'amount_tomi', 'issued_at', 'expires_at',
    'receipt_id', 'receipt_hash', 'payment_tx_hash', 'payment_status',
    'get_url', 'head_url', 'anchor_tx_hash',
  ],
  [
    'lease_id', 'cid', 'bundle_hash', 'bundle_kind', 'provider_address',
    'size_bytes', 'ttl_seconds', 'amount_tomi', 'issued_at', 'expires_at',
    'receipt_id', 'receipt_hash', 'get_url', 'head_url',
  ],
)

// -- All schemas registry --

export const ALL_PROVIDER_SCHEMAS: readonly SchemaReference[] = [
  SignerQuoteRequestSchema,
  SignerQuoteResponseSchema,
  SignerSubmitRequestSchema,
  SignerExecutionResponseSchema,
  PaymasterQuoteRequestSchema,
  PaymasterQuoteResponseSchema,
  PaymasterAuthorizeRequestSchema,
  PaymasterAuthorizationResponseSchema,
  StorageQuoteRequestSchema,
  StorageQuoteResponseSchema,
  StoragePutRequestSchema,
  StorageLeaseResponseSchema,
]
