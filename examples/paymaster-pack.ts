/**
 * Paymaster Builder Pack
 *
 * Demonstrates paymaster-specific workflows:
 * - Request paymaster quotes
 * - Build authorization requests with execution signatures
 * - Track authorization status
 */
import {
  buildPaymasterAuthorizationRequest,
  createPaymasterProviderClient,
  createWalletClient,
  http,
  privateKeyToAccount,
  tosTestnet,
} from '../src/index.js'
import type {
  Address,
  PaymasterQuoteResponse,
} from '../src/index.js'

export function buildPaymasterPack() {
  const account = privateKeyToAccount(
    '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
  )

  const walletClient = createWalletClient({
    account,
    chain: tosTestnet,
    transport: http('http://127.0.0.1:8545'),
  })

  const paymasterProvider = createPaymasterProviderClient({
    baseUrl: 'https://paymaster.example.com',
  })

  const requesterAddress = account.address as Address

  return {
    account,
    walletClient,
    paymasterProvider,
    requesterAddress,

    /** Request a paymaster quote */
    async requestQuote(target: Address, gas = '240000') {
      return paymasterProvider.quote({
        requester: { identity: { kind: 'tos', value: requesterAddress } },
        wallet_address: requesterAddress,
        target,
        gas,
      })
    },

    /** Build and submit an authorization from a quote */
    async authorize(quote: PaymasterQuoteResponse) {
      const request = await buildPaymasterAuthorizationRequest({
        rpcUrl: 'http://127.0.0.1:8545',
        account,
        walletClient,
        requesterAddress,
        requestNonce: `paymaster-${Date.now()}`,
        requestExpiresAt: Math.floor(Date.now() / 1000) + 300,
        quote,
      })
      return paymasterProvider.authorize(request)
    },

    /** Check authorization status */
    async checkStatus(authorizationId: string) {
      return paymasterProvider.status({ authorizationId })
    },
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const pack = buildPaymasterPack()
  console.log(
    JSON.stringify(
      {
        example: 'paymaster-pack',
        requesterAddress: pack.requesterAddress,
      },
      null,
      2,
    ),
  )
}
