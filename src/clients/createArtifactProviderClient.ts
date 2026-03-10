import type {
  ArtifactItemResponse,
  CaptureNewsRequest,
  CaptureOracleEvidenceRequest,
} from '../types/artifact.js'
import type { ProviderFetch } from './createStorageProviderClient.js'

export type ArtifactProviderClientConfig = {
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
      `artifact provider request failed (${response.status}): ${await response.text()}`,
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

export function createArtifactProviderClient(config: ArtifactProviderClientConfig) {
  const baseUrl = trimTrailingSlash(config.baseUrl)
  const fetchFn = config.fetchFn ?? fetch

  return {
    async captureNews(request: CaptureNewsRequest): Promise<ArtifactItemResponse> {
      const response = await fetchFn(`${baseUrl}/capture-news`, {
        method: 'POST',
        headers: buildHeaders(config.headers),
        body: JSON.stringify(request),
      })
      return readJsonResponse<ArtifactItemResponse>(response)
    },

    async captureOracleEvidence(
      request: CaptureOracleEvidenceRequest,
    ): Promise<ArtifactItemResponse> {
      const response = await fetchFn(`${baseUrl}/oracle-evidence`, {
        method: 'POST',
        headers: buildHeaders(config.headers),
        body: JSON.stringify(request),
      })
      return readJsonResponse<ArtifactItemResponse>(response)
    },

    async getItem(parameters: { artifactId: string }): Promise<ArtifactItemResponse> {
      const response = await fetchFn(
        `${baseUrl}/item/${encodeURIComponent(parameters.artifactId)}`,
      )
      return readJsonResponse<ArtifactItemResponse>(response)
    },

    async health(): Promise<Record<string, unknown>> {
      const response = await fetchFn(`${baseUrl}/healthz`)
      return readJsonResponse<Record<string, unknown>>(response)
    },
  }
}
