import {
  createPublicClient,
} from './createPublicClient.js'
import {
  createWalletClient,
} from './createWalletClient.js'
import {
  http,
} from '../transports/http.js'
import type {
  PaymasterAuthorizationResponse,
  PaymasterAuthorizeRequest,
  PaymasterQuoteRequest,
  PaymasterQuoteResponse,
} from '../types/delegation.js'
import type { ProviderFetch } from './createStorageProviderClient.js'
import type { LocalAccount } from '../accounts/types.js'
import type { PublicClient, WalletClient } from '../types/client.js'

export type PaymasterProviderClientConfig = {
  baseUrl: string
  fetchFn?: ProviderFetch | undefined
  headers?: HeadersInit | undefined
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '')
}

async function readJsonResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(
      `paymaster provider request failed (${response.status}): ${await response.text()}`,
    )
  }
  return (await response.json()) as T
}

function buildHeaders(headers?: HeadersInit) {
  return {
    'Content-Type': 'application/json',
    ...(headers ?? {}),
  }
}

export async function buildPaymasterAuthorizationRequest(params: {
  rpcUrl: string
  account: LocalAccount
  requesterAddress: PaymasterQuoteResponse['requesterAddress']
  quote: PaymasterQuoteResponse
  requestNonce: string
  requestExpiresAt: number
  reason?: string
  publicClient?: Pick<PublicClient, 'getTransactionCount' | 'getChainId'>
  walletClient?: Pick<WalletClient, 'signAuthorization'>
}): Promise<PaymasterAuthorizeRequest> {
  const publicClient = params.publicClient ?? createPublicClient({
    transport: http(params.rpcUrl),
  })
  const walletClient = params.walletClient ?? createWalletClient({
    account: params.account,
    transport: http(params.rpcUrl),
  })
  const executionNonce = await publicClient.getTransactionCount({
    address: params.quote.walletAddress,
    blockTag: 'pending',
  })
  const chainId = await publicClient.getChainId()
  const executionSignature = await walletClient.signAuthorization({
    account: params.account,
    chainId,
    nonce: executionNonce,
    gas: BigInt(params.quote.gas),
    to: params.quote.targetAddress,
    value: BigInt(params.quote.valueWei),
    data: params.quote.dataHex,
    from: params.quote.walletAddress,
    sponsor: params.quote.sponsorAddress,
    signerType: params.quote.requesterSignerType,
    sponsorSignerType: params.quote.sponsorSignerType,
    sponsorNonce: BigInt(params.quote.sponsorNonce),
    sponsorExpiry: BigInt(params.quote.sponsorExpiry),
    sponsorPolicyHash: params.quote.policyHash,
  })

  return {
    quote_id: params.quote.quoteId,
    requester: {
      identity: {
        kind: 'tos',
        value: params.requesterAddress,
      },
    },
    wallet_address: params.quote.walletAddress,
    request_nonce: params.requestNonce,
    request_expires_at: params.requestExpiresAt,
    execution_nonce: executionNonce.toString(),
    target: params.quote.targetAddress,
    value_wei: params.quote.valueWei,
    data: params.quote.dataHex,
    gas: params.quote.gas,
    execution_signature: executionSignature,
    ...(params.reason ? { reason: params.reason } : {}),
  }
}

export function createPaymasterProviderClient(config: PaymasterProviderClientConfig) {
  const baseUrl = trimTrailingSlash(config.baseUrl)
  const fetchFn = config.fetchFn ?? fetch

  return {
    async quote(request: PaymasterQuoteRequest): Promise<PaymasterQuoteResponse> {
      const response = await fetchFn(`${baseUrl}/quote`, {
        method: 'POST',
        headers: buildHeaders(config.headers),
        body: JSON.stringify(request),
      })
      return readJsonResponse<PaymasterQuoteResponse>(response)
    },

    async authorize(
      request: PaymasterAuthorizeRequest,
    ): Promise<PaymasterAuthorizationResponse> {
      const response = await fetchFn(`${baseUrl}/authorize`, {
        method: 'POST',
        headers: buildHeaders(config.headers),
        body: JSON.stringify(request),
      })
      return readJsonResponse<PaymasterAuthorizationResponse>(response)
    },

    async status(parameters: {
      authorizationId: string
    }): Promise<PaymasterAuthorizationResponse> {
      const response = await fetchFn(
        `${baseUrl}/status/${encodeURIComponent(parameters.authorizationId)}`,
      )
      return readJsonResponse<PaymasterAuthorizationResponse>(response)
    },

    async receipt(parameters: {
      authorizationId: string
    }): Promise<PaymasterAuthorizationResponse> {
      const response = await fetchFn(
        `${baseUrl}/receipt/${encodeURIComponent(parameters.authorizationId)}`,
      )
      return readJsonResponse<PaymasterAuthorizationResponse>(response)
    },

    async health(): Promise<Record<string, unknown>> {
      const response = await fetchFn(`${baseUrl}/healthz`)
      return readJsonResponse<Record<string, unknown>>(response)
    },
  }
}
