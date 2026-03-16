/**
 * Requester Builder Pack
 *
 * Demonstrates how a requester interacts with the TOS network:
 * - Create wallet and public clients
 * - Request signer quotes and submit delegated executions
 * - Request paymaster quotes and authorize sponsored transactions
 * - Store artifacts and retrieve verification receipts
 */
import {
  buildPaymasterAuthorizationRequest,
  createPaymasterProviderClient,
  createPublicClient,
  createSignerProviderClient,
  createStorageProviderClient,
  createArtifactProviderClient,
  createWalletClient,
  http,
  privateKeyToAccount,
  tosTestnet,
} from '../src/index.js'
import type {
  Address,
  PaymasterQuoteResponse,
  SignerQuoteResponse,
  StorageQuoteResponse,
} from '../src/index.js'

export function buildRequesterPack() {
  const account = privateKeyToAccount(
    '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
  )

  const publicClient = createPublicClient({
    chain: tosTestnet,
    transport: http('http://127.0.0.1:8545'),
  })

  const walletClient = createWalletClient({
    account,
    chain: tosTestnet,
    transport: http('http://127.0.0.1:8545'),
  })

  const signerProvider = createSignerProviderClient({
    baseUrl: 'https://signer.example.com',
  })

  const paymasterProvider = createPaymasterProviderClient({
    baseUrl: 'https://paymaster.example.com',
  })

  const storageProvider = createStorageProviderClient({
    baseUrl: 'https://storage.example.com',
  })

  const artifactProvider = createArtifactProviderClient({
    baseUrl: 'https://artifacts.example.com',
  })

  const requesterAddress = account.address as Address

  return {
    account,
    publicClient,
    walletClient,
    signerProvider,
    paymasterProvider,
    storageProvider,
    artifactProvider,
    requesterAddress,

    /** Request a signer quote for delegated execution */
    async requestSignerQuote(target: Address, gas = '240000') {
      return signerProvider.quote({
        requester: { identity: { kind: 'tos', value: requesterAddress } },
        target,
        gas,
        reason: 'requester pack: delegated execution',
      })
    },

    /** Submit a signed execution to the signer provider */
    async submitExecution(quote: SignerQuoteResponse) {
      return signerProvider.submit({
        requester: { identity: { kind: 'tos', value: requesterAddress } },
        quote_id: quote.quoteId,
        request_nonce: `req-${Date.now()}`,
        request_expires_at: Math.floor(Date.now() / 1000) + 300,
        target: quote.targetAddress,
        value_wei: quote.valueWei,
        data: quote.dataHex,
        gas: quote.gas,
      })
    },

    /** Request a paymaster quote for sponsored execution */
    async requestPaymasterQuote(target: Address, gas = '240000') {
      return paymasterProvider.quote({
        requester: { identity: { kind: 'tos', value: requesterAddress } },
        wallet_address: requesterAddress,
        target,
        gas,
      })
    },

    /** Build and send a paymaster authorization */
    async authorizePaymaster(quote: PaymasterQuoteResponse) {
      const authorizeRequest = await buildPaymasterAuthorizationRequest({
        rpcUrl: 'http://127.0.0.1:8545',
        account,
        walletClient,
        requesterAddress,
        requestNonce: `paymaster-req-${Date.now()}`,
        requestExpiresAt: Math.floor(Date.now() / 1000) + 300,
        quote,
      })
      return paymasterProvider.authorize(authorizeRequest)
    },

    /** Store a bundle through the storage provider */
    async storeBundle(quote: StorageQuoteResponse, bundle: unknown) {
      return storageProvider.put({
        requester: { identity: { kind: 'tos', value: requesterAddress } },
        request_nonce: `storage-req-${Date.now()}`,
        request_expires_at: Math.floor(Date.now() / 1000) + 300,
        quote_id: quote.quote_id,
        bundle_kind: quote.bundle_kind,
        ttl_seconds: quote.ttl_seconds,
        cid: quote.cid,
        bundle,
      })
    },
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const pack = buildRequesterPack()
  console.log(
    JSON.stringify(
      {
        example: 'requester-pack',
        address: pack.requesterAddress,
        surfaces: ['signer', 'paymaster', 'storage', 'artifact'],
      },
      null,
      2,
    ),
  )
}
