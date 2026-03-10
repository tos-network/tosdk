import type {
  SignerExecutionResponse,
  SignerQuoteRequest,
  SignerQuoteResponse,
  SignerSubmitRequest,
} from '../types/delegation.js'
import type { ProviderFetch } from './createStorageProviderClient.js'

export type SignerProviderClientConfig = {
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
      `signer provider request failed (${response.status}): ${await response.text()}`,
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

export function createSignerProviderClient(config: SignerProviderClientConfig) {
  const baseUrl = trimTrailingSlash(config.baseUrl)
  const fetchFn = config.fetchFn ?? fetch

  return {
    async quote(request: SignerQuoteRequest): Promise<SignerQuoteResponse> {
      const response = await fetchFn(`${baseUrl}/quote`, {
        method: 'POST',
        headers: buildHeaders(config.headers),
        body: JSON.stringify(request),
      })
      return readJsonResponse<SignerQuoteResponse>(response)
    },

    async submit(request: SignerSubmitRequest): Promise<SignerExecutionResponse> {
      const response = await fetchFn(`${baseUrl}/submit`, {
        method: 'POST',
        headers: buildHeaders(config.headers),
        body: JSON.stringify(request),
      })
      return readJsonResponse<SignerExecutionResponse>(response)
    },

    async status(parameters: {
      executionId: string
    }): Promise<SignerExecutionResponse> {
      const response = await fetchFn(
        `${baseUrl}/status/${encodeURIComponent(parameters.executionId)}`,
      )
      return readJsonResponse<SignerExecutionResponse>(response)
    },

    async receipt(parameters: {
      executionId: string
    }): Promise<SignerExecutionResponse> {
      const response = await fetchFn(
        `${baseUrl}/receipt/${encodeURIComponent(parameters.executionId)}`,
      )
      return readJsonResponse<SignerExecutionResponse>(response)
    },

    async health(): Promise<Record<string, unknown>> {
      const response = await fetchFn(`${baseUrl}/healthz`)
      return readJsonResponse<Record<string, unknown>>(response)
    },
  }
}
