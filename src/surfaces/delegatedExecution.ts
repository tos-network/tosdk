/**
 * Delegated Execution Surface
 *
 * Reusable helpers for consumers who need delegated execution via signer
 * or paymaster providers. Wraps the lower-level client calls into
 * higher-level workflows.
 */
import type {
  SignerQuoteResponse,
  SignerExecutionResponse,
  PaymasterQuoteResponse,
  PaymasterAuthorizationResponse,
  RequesterIdentityEnvelope,
} from '../types/delegation.js'
import type { Address } from '../types/address.js'
import type { Hex } from '../types/misc.js'

export type DelegatedExecutionRequest = {
  target: Address
  valueWei?: string
  data?: Hex
  gas?: string
  reason?: string
}

export type DelegatedExecutionResult = {
  executionId: string
  status: string
  txHash?: Hex | null
}

export type SponsoredExecutionResult = {
  authorizationId: string
  status: string
  txHash?: Hex | null
}

/** Build a requester identity envelope from an address */
export function buildRequesterEnvelope(
  requesterAddress: Address,
): RequesterIdentityEnvelope {
  return {
    requester: {
      identity: {
        kind: 'tos',
        value: requesterAddress,
      },
    },
  }
}

/** Extract a delegated execution result from a signer execution response */
export function toDelegatedResult(
  response: SignerExecutionResponse,
): DelegatedExecutionResult {
  return {
    executionId: response.executionId,
    status: response.status,
    txHash: response.submittedTxHash ?? null,
  }
}

/** Extract a sponsored execution result from a paymaster authorization response */
export function toSponsoredResult(
  response: PaymasterAuthorizationResponse,
): SponsoredExecutionResult {
  return {
    authorizationId: response.authorizationId,
    status: response.status,
    txHash: response.submittedTxHash ?? null,
  }
}

/** Check whether a signer quote is still valid (not expired) */
export function isSignerQuoteValid(
  quote: SignerQuoteResponse,
  now?: Date,
): boolean {
  const currentTime = (now ?? new Date()).getTime()
  return new Date(quote.expiresAt).getTime() > currentTime
}

/** Check whether a paymaster quote is still valid (not expired) */
export function isPaymasterQuoteValid(
  quote: PaymasterQuoteResponse,
  now?: Date,
): boolean {
  const currentTime = (now ?? new Date()).getTime()
  return new Date(quote.expiresAt).getTime() > currentTime
}

/** Validate that a delegated execution request has required fields */
export function validateDelegatedRequest(
  request: DelegatedExecutionRequest,
): string[] {
  const errors: string[] = []
  if (!request.target) errors.push('target address is required')
  if (request.gas !== undefined) {
    const gasNum = Number(request.gas)
    if (Number.isNaN(gasNum) || gasNum <= 0) {
      errors.push('gas must be a positive number')
    }
  }
  if (request.valueWei !== undefined) {
    const valueNum = Number(request.valueWei)
    if (Number.isNaN(valueNum) || valueNum < 0) {
      errors.push('valueWei must be a non-negative number')
    }
  }
  return errors
}
