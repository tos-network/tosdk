import type { Chain } from '../types/chain.js'
import type {
  RpcSubscription,
  RpcTransport,
  SubscriptionTransport,
  TransportConfig,
  WebSocketLike,
  WebSocketTransportConfig,
} from '../types/client.js'
import type { ErrorType } from '../errors/utils.js'
import {
  RpcConnectionClosedError,
  type RpcConnectionClosedErrorType,
  RpcResponseError,
  type RpcResponseErrorType,
  RpcUrlRequiredError,
  type RpcUrlRequiredErrorType,
  WebSocketUnavailableError,
  type WebSocketUnavailableErrorType,
} from '../errors/client.js'
import { createHttpTransport, http } from './http.js'

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

type JsonRpcNotification<T> = {
  jsonrpc: '2.0'
  method: string
  params: {
    subscription: string
    result: T
  }
}

type PendingRequest = {
  reject(error: Error): void
  resolve(value: unknown): void
}

type SubscriptionHandler = {
  onData(data: unknown): void
  onError?(error: Error): void
}

type WebSocketState = {
  socket: WebSocketLike
  nextId: number
  pendingRequests: Map<number, PendingRequest>
  subscriptions: Map<string, SubscriptionHandler>
}

export type WebSocketTransportErrorType =
  | RpcConnectionClosedErrorType
  | RpcResponseErrorType
  | RpcUrlRequiredErrorType
  | WebSocketUnavailableErrorType
  | ErrorType

export function webSocket(
  url?: string,
  options: Omit<WebSocketTransportConfig, 'type' | 'url'> = {},
): WebSocketTransportConfig {
  return {
    type: 'webSocket',
    url,
    ...options,
  }
}

export function createTransport(
  config: TransportConfig = http(),
  chain?: Chain | undefined,
): RpcTransport {
  return config.type === 'webSocket'
    ? createWebSocketTransport(config, chain)
    : createHttpTransport(config, chain)
}

export function createWebSocketTransport(
  config: WebSocketTransportConfig = webSocket(),
  chain?: Chain | undefined,
): SubscriptionTransport {
  const resolvedUrl = resolveWebSocketUrl(config, chain)
  if (!resolvedUrl) throw new RpcUrlRequiredError()

  let statePromise: Promise<WebSocketState> | undefined

  const connect = async () => {
    if (statePromise) return statePromise

    statePromise = new Promise<WebSocketState>((resolve, reject) => {
      const socket = createWebSocket(config, resolvedUrl)
      const state: WebSocketState = {
        socket,
        nextId: 1,
        pendingRequests: new Map(),
        subscriptions: new Map(),
      }

      const handleMessage = (event: { data?: string | undefined }) => {
        if (!event.data) return
        const payload = JSON.parse(String(event.data)) as
          | JsonRpcSuccess<unknown>
          | JsonRpcFailure
          | JsonRpcNotification<unknown>

        if ('method' in payload && payload.method === 'tos_subscription') {
          const subscription = state.subscriptions.get(
            payload.params.subscription,
          )
          subscription?.onData(payload.params.result)
          return
        }

        if (!('id' in payload)) return
        const request = state.pendingRequests.get(payload.id)
        if (!request) return
        state.pendingRequests.delete(payload.id)

        if ('error' in payload) {
          request.reject(
            new RpcResponseError({
              code: payload.error.code,
              data: payload.error.data,
              message: payload.error.message,
              method: 'webSocket request',
            }),
          )
          return
        }

        request.resolve(payload.result)
      }

      const handleOpen = () => resolve(state)
      const handleClose = () => {
        const error = new RpcConnectionClosedError()
        for (const request of state.pendingRequests.values()) {
          request.reject(error)
        }
        state.pendingRequests.clear()
        for (const subscription of state.subscriptions.values()) {
          subscription.onError?.(error)
        }
        state.subscriptions.clear()
        statePromise = undefined
      }
      const handleError = () => {
        if (!statePromise) return
      }

      socket.addEventListener('message', handleMessage)
      socket.addEventListener('open', handleOpen)
      socket.addEventListener('close', handleClose)
      socket.addEventListener('error', handleError)

      Promise.resolve().catch(reject)
    })

    return statePromise
  }

  const request = async <T>(
    method: string,
    params: readonly unknown[] = [],
  ): Promise<T> => {
    const state = await connect()
    const id = state.nextId++
    const payload = {
      id,
      jsonrpc: '2.0',
      method,
      params,
    }

    return new Promise<T>((resolve, reject) => {
      state.pendingRequests.set(id, { resolve, reject })
      state.socket.send(JSON.stringify(payload))
    })
  }

  const subscribe = async <T>({
    namespace = 'tos',
    event,
    params = [],
    onData,
    onError,
  }: {
    namespace?: string | undefined
    event: string
    params?: readonly unknown[] | undefined
    onData(data: T): void
    onError?(error: Error): void
  }): Promise<RpcSubscription> => {
    const subscriptionId = await request<string>(`${namespace}_subscribe`, [
      event,
      ...params,
    ])
    const state = await connect()
    state.subscriptions.set(subscriptionId, {
      onData: onData as (data: unknown) => void,
      ...(onError ? { onError } : {}),
    })

    return {
      id: subscriptionId,
      async unsubscribe() {
        state.subscriptions.delete(subscriptionId)
        await request<boolean>(`${namespace}_unsubscribe`, [subscriptionId])
      },
    }
  }

  return {
    key: 'webSocket',
    name: 'WebSocket JSON-RPC',
    url: resolvedUrl,
    request,
    subscribe,
  }
}

function createWebSocket(
  config: WebSocketTransportConfig,
  url: string,
): WebSocketLike {
  if (config.webSocketFactory) return config.webSocketFactory(url)
  if (typeof WebSocket === 'undefined') throw new WebSocketUnavailableError()
  return new WebSocket(url)
}

function resolveWebSocketUrl(
  config: WebSocketTransportConfig,
  chain?: Chain | undefined,
) {
  if (config.url) return config.url
  const fromChain = chain?.rpcUrls.default.webSocket?.[0]
  if (fromChain) return fromChain
  const httpUrl = chain?.rpcUrls.default.http[0]
  if (!httpUrl) return undefined
  if (httpUrl.startsWith('https://')) return `wss://${httpUrl.slice('https://'.length)}`
  if (httpUrl.startsWith('http://')) return `ws://${httpUrl.slice('http://'.length)}`
  return undefined
}
