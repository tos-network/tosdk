/**
 * Gateway Builder Pack
 *
 * Demonstrates how a gateway node routes requests across providers:
 * - Creates clients for multiple provider types
 * - Implements routing logic across signer and paymaster providers
 * - Demonstrates health checking and provider selection
 */
import {
  createSignerProviderClient,
  createPaymasterProviderClient,
  createStorageProviderClient,
  createArtifactProviderClient,
} from '../src/index.js'
import type { Address } from '../src/index.js'

export type ProviderEndpoint = {
  role: 'signer' | 'paymaster' | 'storage' | 'artifact'
  baseUrl: string
  address: Address
}

export type GatewayRouteResult = {
  provider: ProviderEndpoint
  healthy: boolean
}

export function buildGatewayPack(endpoints: ProviderEndpoint[]) {
  const signerClients = endpoints
    .filter((e) => e.role === 'signer')
    .map((e) => ({
      endpoint: e,
      client: createSignerProviderClient({ baseUrl: e.baseUrl }),
    }))

  const paymasterClients = endpoints
    .filter((e) => e.role === 'paymaster')
    .map((e) => ({
      endpoint: e,
      client: createPaymasterProviderClient({ baseUrl: e.baseUrl }),
    }))

  const storageClients = endpoints
    .filter((e) => e.role === 'storage')
    .map((e) => ({
      endpoint: e,
      client: createStorageProviderClient({ baseUrl: e.baseUrl }),
    }))

  const artifactClients = endpoints
    .filter((e) => e.role === 'artifact')
    .map((e) => ({
      endpoint: e,
      client: createArtifactProviderClient({ baseUrl: e.baseUrl }),
    }))

  return {
    signerClients,
    paymasterClients,
    storageClients,
    artifactClients,

    /** Check health of all registered providers */
    async checkHealth(): Promise<GatewayRouteResult[]> {
      const results: GatewayRouteResult[] = []
      for (const entry of [...signerClients, ...paymasterClients, ...storageClients, ...artifactClients]) {
        try {
          await entry.client.health()
          results.push({ provider: entry.endpoint, healthy: true })
        } catch {
          results.push({ provider: entry.endpoint, healthy: false })
        }
      }
      return results
    },

    /** Pick the first healthy signer provider */
    async pickSigner() {
      for (const entry of signerClients) {
        try {
          await entry.client.health()
          return entry
        } catch {
          continue
        }
      }
      throw new Error('no healthy signer provider available')
    },

    /** Pick the first healthy paymaster provider */
    async pickPaymaster() {
      for (const entry of paymasterClients) {
        try {
          await entry.client.health()
          return entry
        } catch {
          continue
        }
      }
      throw new Error('no healthy paymaster provider available')
    },
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const providerAddress =
    '0xa1f28ad7db747d8015af4bfcedfb93f57f3a8ab4cc9233d34a65df610f4f1122' as Address
  const gateway = buildGatewayPack([
    { role: 'signer', baseUrl: 'https://signer-a.example.com', address: providerAddress },
    { role: 'signer', baseUrl: 'https://signer-b.example.com', address: providerAddress },
    { role: 'paymaster', baseUrl: 'https://paymaster.example.com', address: providerAddress },
    { role: 'storage', baseUrl: 'https://storage.example.com', address: providerAddress },
    { role: 'artifact', baseUrl: 'https://artifacts.example.com', address: providerAddress },
  ])
  console.log(
    JSON.stringify(
      {
        example: 'gateway-pack',
        signerProviders: gateway.signerClients.length,
        paymasterProviders: gateway.paymasterClients.length,
        storageProviders: gateway.storageClients.length,
        artifactProviders: gateway.artifactClients.length,
      },
      null,
      2,
    ),
  )
}
