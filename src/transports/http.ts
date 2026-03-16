import {
  RpcRequestError,
  type RpcRequestErrorType,
  RpcResponseError,
  type RpcResponseErrorType,
  RpcUrlRequiredError,
  type RpcUrlRequiredErrorType,
} from '../errors/client.js'
import type { Chain } from '../types/chain.js'
import type {
  HttpTransportConfig,
  RpcTransport,
} from '../types/client.js'
import type { ErrorType } from '../errors/utils.js'

type JsonRpcSuccess<T> = {
  id: number
  jsonrpc: '2.0'
  result: T
}

type JsonRpcFailure = {
  id: number
  jsonrpc: '2.0'
  error: {
    code: number
    data?: unknown
    message: string
  }
}

export type HttpTransportErrorType =
  | RpcRequestErrorType
  | RpcResponseErrorType
  | RpcUrlRequiredErrorType
  | ErrorType

export function http(
  url?: string,
  options: Omit<HttpTransportConfig, 'type' | 'url'> = {},
): HttpTransportConfig {
  return {
    type: 'http',
    url,
    ...options,
  }
}

export function createHttpTransport(
  config: HttpTransportConfig = http(),
  chain?: Chain | undefined,
): RpcTransport {
  const resolvedUrl = config.url ?? chain?.rpcUrls.default.http[0]
  if (!resolvedUrl) throw new RpcUrlRequiredError()

  const fetchFn = config.fetchFn ?? fetch
  let nextId = 1

  return {
    key: 'http',
    name: 'HTTP JSON-RPC',
    url: resolvedUrl,
    async request<T>(method: string, params: readonly unknown[] = []): Promise<T> {
      const id = nextId++
      const response = await fetchFn(resolvedUrl, {
        body: JSON.stringify({
          id,
          jsonrpc: '2.0',
          method,
          params,
        }),
        headers: {
          'content-type': 'application/json',
          ...(config.headers ?? {}),
        },
        method: 'POST',
      })
      if (!response.ok) {
        throw new RpcRequestError({
          body: await response.text(),
          method,
          status: response.status,
          url: resolvedUrl,
        })
      }
      const payload = (await response.json()) as JsonRpcSuccess<T> | JsonRpcFailure
      if ('error' in payload) {
        throw new RpcResponseError({
          code: payload.error.code,
          data: payload.error.data,
          message: payload.error.message,
          method,
        })
      }
      return payload.result
    },
  }
}
