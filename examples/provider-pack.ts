/**
 * Provider Builder Pack
 *
 * Demonstrates how a provider implements service endpoints for the TOS network:
 * - Signer provider service shape (quote, submit, status, receipt)
 * - Paymaster provider service shape (quote, authorize, status, receipt)
 * - Storage provider service shape (quote, put, get, head, audit, renew)
 * - Artifact provider service shape (capture, item, verify, anchor)
 *
 * This pack shows the expected request/response types for each endpoint.
 */
import type {
  Address,
  ArtifactItemResponse,
  ArtifactProviderRecord,
  CaptureNewsRequest,
  PaymasterAuthorizeRequest,
  PaymasterAuthorizationResponse,
  PaymasterQuoteRequest,
  PaymasterQuoteResponse,
  SignerExecutionResponse,
  SignerQuoteRequest,
  SignerQuoteResponse,
  SignerSubmitRequest,
  StorageLeaseResponse,
  StoragePutRequest,
  StorageQuoteRequest,
  StorageQuoteResponse,
} from '../src/index.js'

/** Minimal signer provider handler type */
export type SignerProviderHandler = {
  handleQuote(request: SignerQuoteRequest): Promise<SignerQuoteResponse>
  handleSubmit(request: SignerSubmitRequest): Promise<SignerExecutionResponse>
  handleStatus(executionId: string): Promise<SignerExecutionResponse>
  handleReceipt(executionId: string): Promise<SignerExecutionResponse>
}

/** Minimal paymaster provider handler type */
export type PaymasterProviderHandler = {
  handleQuote(request: PaymasterQuoteRequest): Promise<PaymasterQuoteResponse>
  handleAuthorize(request: PaymasterAuthorizeRequest): Promise<PaymasterAuthorizationResponse>
  handleStatus(authorizationId: string): Promise<PaymasterAuthorizationResponse>
  handleReceipt(authorizationId: string): Promise<PaymasterAuthorizationResponse>
}

/** Minimal storage provider handler type */
export type StorageProviderHandler = {
  handleQuote(request: StorageQuoteRequest): Promise<StorageQuoteResponse>
  handlePut(request: StoragePutRequest): Promise<StorageLeaseResponse>
  handleHead(cid: string): Promise<StorageLeaseResponse>
  handleGet(cid: string): Promise<{ lease: StorageLeaseResponse; bundle: unknown }>
}

/** Minimal artifact provider handler type */
export type ArtifactProviderHandler = {
  handleCapture(request: CaptureNewsRequest): Promise<ArtifactProviderRecord>
  handleItem(artifactId: string): Promise<ArtifactItemResponse>
}

export function buildProviderPack() {
  const providerAddress =
    '0xa1f28ad7db747d8015af4bfcedfb93f57f3a8ab4cc9233d34a65df610f4f1122' as Address
  const requesterAddress =
    '0x61cef93ad3eb77ef5c4cc65a17448286a9aa9931a10d712af4db9e8abb363e16' as Address

  const signerQuoteResponse: SignerQuoteResponse = {
    quoteId: 'signer-provider-pack-001',
    chainId: '1666',
    providerAddress,
    walletAddress: requesterAddress,
    requesterAddress,
    targetAddress: providerAddress,
    valueWei: '0',
    dataHex: '0x',
    gas: '240000',
    policyId: 'provider-signer-policy-001',
    policyHash:
      '0x1111111111111111111111111111111111111111111111111111111111111111',
    scopeHash:
      '0x1111111111111111111111111111111111111111111111111111111111111111',
    trustTier: 'self_hosted',
    amountWei: '5000000000000000',
    status: 'quoted',
    expiresAt: new Date(Date.now() + 300_000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const storageQuoteResponse: StorageQuoteResponse = {
    quote_id: 'storage-provider-pack-001',
    provider_address: providerAddress,
    requester_address: requesterAddress,
    cid: 'bafybeigproviderpack001',
    bundle_kind: 'public_news.capture',
    size_bytes: 4096,
    ttl_seconds: 7200,
    amount_wei: '2000000000000000',
    expires_at: new Date(Date.now() + 600_000).toISOString(),
  }

  return {
    providerAddress,
    requesterAddress,
    signerQuoteResponse,
    storageQuoteResponse,
    /** Provider handler shapes for building a provider service */
    handlerShapes: {
      signer: {} as SignerProviderHandler,
      paymaster: {} as PaymasterProviderHandler,
      storage: {} as StorageProviderHandler,
      artifact: {} as ArtifactProviderHandler,
    },
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const pack = buildProviderPack()
  console.log(
    JSON.stringify(
      {
        example: 'provider-pack',
        providerAddress: pack.providerAddress,
        handlerShapes: Object.keys(pack.handlerShapes),
      },
      null,
      2,
    ),
  )
}
