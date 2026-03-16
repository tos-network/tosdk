import type { Address } from './address.js'

export type ChainNativeCurrency = {
  name: string
  symbol: string
  decimals: number
}

export type ChainRpcUrls = {
  http: readonly string[]
  webSocket?: readonly string[] | undefined
}

export type ChainBlockExplorer = {
  name: string
  url: string
  apiUrl?: string | undefined
}

export type ChainContract = {
  address: Address
  blockCreated?: number | undefined
}

export type Chain = {
  id: number
  name: string
  nativeCurrency: ChainNativeCurrency
  rpcUrls: {
    [key: string]: ChainRpcUrls
    default: ChainRpcUrls
  }
  blockExplorers?:
    | {
        [key: string]: ChainBlockExplorer
        default: ChainBlockExplorer
      }
    | undefined
  contracts?:
    | {
        [key: string]: ChainContract | undefined
      }
    | undefined
  blockTime?: number | undefined
  sourceId?: number | undefined
  testnet?: boolean | undefined
  extendSchema?: Record<string, unknown> | undefined
}
