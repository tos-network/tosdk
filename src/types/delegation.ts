import type { Address } from './address.js'
import type { Hex, Signature } from './misc.js'

export type SignerProviderTrustTier =
  | 'self_hosted'
  | 'org_trusted'
  | 'public_low_trust'

export type PaymasterProviderTrustTier = SignerProviderTrustTier

export interface RequesterIdentityEnvelope {
  requester: {
    identity: {
      kind: 'tos'
      value: Address
    }
  }
}

export interface SignerQuoteRequest extends RequesterIdentityEnvelope {
  target: Address
  value_wei?: string
  data?: Hex
  gas?: string
  reason?: string
}

export interface SignerQuoteResponse {
  quoteId: string
  chainId: string
  providerAddress: Address
  walletAddress: Address
  requesterAddress: Address
  targetAddress: Address
  valueWei: string
  dataHex: Hex
  gas: string
  policyId: string
  policyHash: Hex
  scopeHash: Hex
  delegateIdentity?: string | null
  trustTier: SignerProviderTrustTier
  amountWei: string
  status: string
  expiresAt: string
  createdAt: string
  updatedAt: string
}

export interface SignerSubmitRequest extends RequesterIdentityEnvelope {
  quote_id: string
  request_nonce: string
  request_expires_at: number
  target: Address
  value_wei?: string
  data?: Hex
  gas?: string
  reason?: string
}

export interface SignerExecutionResponse {
  executionId: string
  quoteId: string
  requestKey: string
  requestHash: Hex
  providerAddress: Address
  walletAddress: Address
  requesterAddress: Address
  targetAddress: Address
  valueWei: string
  dataHex: Hex
  gas: string
  policyId: string
  policyHash: Hex
  scopeHash: Hex
  delegateIdentity?: string | null
  trustTier: SignerProviderTrustTier
  requestNonce: string
  requestExpiresAt: number
  reason?: string | null
  paymentId?: Hex | null
  submittedTxHash?: Hex | null
  submittedReceipt?: Record<string, unknown> | null
  receiptHash?: Hex | null
  status: string
  lastError?: string | null
  createdAt: string
  updatedAt: string
}

export interface PaymasterQuoteRequest extends RequesterIdentityEnvelope {
  wallet_address: Address
  target: Address
  value_wei?: string
  data?: Hex
  gas?: string
  reason?: string
}

export interface PaymasterQuoteResponse {
  quoteId: string
  chainId: string
  providerAddress: Address
  sponsorAddress: Address
  sponsorSignerType: string
  walletAddress: Address
  requesterAddress: Address
  requesterSignerType: string
  targetAddress: Address
  valueWei: string
  dataHex: Hex
  gas: string
  policyId: string
  policyHash: Hex
  scopeHash: Hex
  delegateIdentity?: string | null
  trustTier: PaymasterProviderTrustTier
  amountWei: string
  sponsorNonce: string
  sponsorExpiry: number
  status: string
  expiresAt: string
  createdAt: string
  updatedAt: string
}

export interface PaymasterAuthorizeRequest extends RequesterIdentityEnvelope {
  quote_id: string
  wallet_address: Address
  request_nonce: string
  request_expires_at: number
  execution_nonce: string
  target: Address
  value_wei: string
  data: Hex
  gas: string
  execution_signature: Signature
  reason?: string
}

export interface PaymasterAuthorizationResponse {
  authorizationId: string
  quoteId: string
  chainId: string
  requestKey: string
  requestHash: Hex
  providerAddress: Address
  sponsorAddress: Address
  sponsorSignerType: string
  walletAddress: Address
  requesterAddress: Address
  requesterSignerType: string
  targetAddress: Address
  valueWei: string
  dataHex: Hex
  gas: string
  policyId: string
  policyHash: Hex
  scopeHash: Hex
  delegateIdentity?: string | null
  trustTier: PaymasterProviderTrustTier
  requestNonce: string
  requestExpiresAt: number
  executionNonce: string
  sponsorNonce: string
  sponsorExpiry: number
  reason?: string | null
  paymentId?: Hex | null
  executionSignature?: Signature | null
  sponsorSignature?: Signature | null
  submittedTxHash?: Hex | null
  submittedReceipt?: Record<string, unknown> | null
  receiptHash?: Hex | null
  status: string
  lastError?: string | null
  createdAt: string
  updatedAt: string
}
