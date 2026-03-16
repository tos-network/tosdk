import type {
  StoredBundleResponse,
  StorageAuditResponse,
  StorageLeaseResponse,
  StoragePutRequest,
  StorageQuoteRequest,
  StorageQuoteResponse,
  StorageRenewalResponse,
  StorageRenewRequest,
} from '../types/storage.js'

export type ProviderFetch = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>

export type StorageProviderClientConfig = {
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
      `storage provider request failed (${response.status}): ${await response.text()}`,
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

export function createStorageProviderClient(config: StorageProviderClientConfig) {
  const baseUrl = trimTrailingSlash(config.baseUrl)
  const fetchFn = config.fetchFn ?? fetch

  return {
    async quote(request: StorageQuoteRequest): Promise<StorageQuoteResponse> {
      const response = await fetchFn(`${baseUrl}/quote`, {
        method: 'POST',
        headers: buildHeaders(config.headers),
        body: JSON.stringify(request),
      })
      return readJsonResponse<StorageQuoteResponse>(response)
    },

    async put(request: StoragePutRequest): Promise<StorageLeaseResponse> {
      const response = await fetchFn(`${baseUrl}/put`, {
        method: 'POST',
        headers: buildHeaders(config.headers),
        body: JSON.stringify(request),
      })
      return readJsonResponse<StorageLeaseResponse>(response)
    },

    async head(parameters: {
      cid: string
    }): Promise<StorageLeaseResponse> {
      const response = await fetchFn(
        `${baseUrl}/head/${encodeURIComponent(parameters.cid)}`,
      )
      return readJsonResponse<StorageLeaseResponse>(response)
    },

    async get(parameters: {
      cid: string
    }): Promise<StoredBundleResponse> {
      const response = await fetchFn(
        `${baseUrl}/get/${encodeURIComponent(parameters.cid)}`,
      )
      return readJsonResponse<StoredBundleResponse>(response)
    },

    async audit(parameters: {
      lease_id: string
      challenge_nonce: string
    }): Promise<StorageAuditResponse> {
      const response = await fetchFn(`${baseUrl}/audit`, {
        method: 'POST',
        headers: buildHeaders(config.headers),
        body: JSON.stringify(parameters),
      })
      return readJsonResponse<StorageAuditResponse>(response)
    },

    async renew(request: StorageRenewRequest): Promise<StorageRenewalResponse> {
      const response = await fetchFn(`${baseUrl}/renew`, {
        method: 'POST',
        headers: buildHeaders(config.headers),
        body: JSON.stringify(request),
      })
      return readJsonResponse<StorageRenewalResponse>(response)
    },

    async health(): Promise<Record<string, unknown>> {
      const response = await fetchFn(`${baseUrl}/healthz`)
      return readJsonResponse<Record<string, unknown>>(response)
    },
  }
}
