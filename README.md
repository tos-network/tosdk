# TOS Network SDK

`tosdk` is the TypeScript SDK for building applications, agents, and services on TOS Network.

This repository is a native TypeScript SDK for TOS Network. It focuses on native accounts, 32-byte addresses, typed-data signing, native transaction signing, and a small RPC client surface for building wallets, agents, and services.

## Current Direction

- Native 32-byte account addresses
- TypeScript-first developer experience
- Reusable account, signing, and encoding utilities
- A small surface area that is easy to embed into agents and services

## What Is Working Now

- Private-key, HD, mnemonic, BLS12-381, secp256r1, and ElGamal-based local accounts
- Native 32-byte address derivation from secp256k1 keys
- Native transaction typing, serialization, and signing
- Typed data signing on top of the 32-byte account model
- Public and wallet clients for TOS RPC
- Privacy RPC helpers for encrypted balance reads and prepared privacy transaction submission
- Reusable requester-side clients for storage, artifact, signer-provider, and paymaster-provider services
- High-level operation surfaces for delegated execution, evidence, operator control, and proof markets
- Schema validation and drift detection for provider and operator data
- Package (contract) deployment, calling, and lease management
- Native-only tests for accounts, signing, encoding, chains, clients, and utilities

## Module Entry Points

The SDK provides multiple entry points for tree-shaking:

| Import path | Description |
|---|---|
| `tosdk` | Main entry — re-exports all public API |
| `tosdk/accounts` | Account creation, signing, and key management |
| `tosdk/chains` | Chain definitions (`tos`, `tosTestnet`, `defineChain`) |
| `tosdk/clients` | Public, wallet, and provider client factories |
| `tosdk/transports` | HTTP and WebSocket RPC transports |
| `tosdk/surfaces` | High-level surfaces for delegated execution, evidence, operator control, proof markets |
| `tosdk/schema` | Schema validation, drift detection, and versioning |

## Scope

This SDK is intentionally focused. It provides the native account, transaction, and RPC path used by the current TOS agent stack and avoids shipping unrelated legacy EVM modules.

## Example

```ts
import { createPublicClient, createWalletClient, http } from 'tosdk'
import { privateKeyToAccount } from 'tosdk/accounts'
import { tosTestnet } from 'tosdk/chains'

const account = privateKeyToAccount(
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
)

const publicClient = createPublicClient({
  chain: tosTestnet,
  transport: http(),
})

const walletClient = createWalletClient({
  account,
  chain: tosTestnet,
  transport: http(),
})

console.log(await publicClient.getChainId())
console.log(account.address)

const hash = await walletClient.sendTransaction({
  to: '0xc1ffd3cfee2d9e5cd67643f8f39fd6e51aad88f6f4ce6ab8827279cfffb92266',
  value: 1_000_000_000_000_000n,
})

console.log(hash)
```

## Accounts

The accounts module supports multiple signing schemes:

- `privateKeyToAccount` — secp256k1 private key
- `hdKeyToAccount` — BIP32 hierarchical deterministic wallet
- `mnemonicToAccount` — BIP39 mnemonic phrase
- `bls12381PrivateKeyToAccount` — BLS12-381 signing
- `secp256r1PrivateKeyToAccount` — secp256r1 (P-256) signing
- `elgamalPrivateKeyToAccount` — ElGamal encryption (privacy)
- `toAccount` — custom account from user-provided signing functions
- `generatePrivateKey` / `generateMnemonic` — key generation helpers

## Privacy RPC

The public and wallet clients also expose the privacy RPC methods implemented by
`gtos`:

- `privGetBalance`
- `privGetNonce`
- `privTransfer`
- `privShield`
- `privUnshield`

These methods are thin RPC wrappers. For the submission methods, your
application is still responsible for producing the commitment, handles, proofs,
and Schnorr signature before calling the SDK helper.

```ts
import {
  createPublicClient,
  elgamalPrivateKeyToAccount,
  http,
  tosTestnet,
  type PrivTransferParameters,
} from 'tosdk'

const privacyAccount = elgamalPrivateKeyToAccount(
  '0x0100000000000000000000000000000000000000000000000000000000000000',
)

const client = createPublicClient({
  chain: tosTestnet,
  transport: http(),
})

const balance = await client.privGetBalance({
  pubkey: privacyAccount.publicKey,
})

const nonce = await client.privGetNonce({
  pubkey: privacyAccount.publicKey,
  blockTag: 'pending',
})

const preparedTransfer: PrivTransferParameters = {
  from: privacyAccount.publicKey,
  to: '0x1111111111111111111111111111111111111111111111111111111111111111',
  privNonce: nonce,
  fee: 3n,
  feeLimit: 5n,
  commitment: '0x...',
  senderHandle: '0x...',
  receiverHandle: '0x...',
  sourceCommitment: '0x...',
  ctValidityProof: '0x...',
  commitmentEqProof: '0x...',
  rangeProof: '0x...',
  s: '0x...',
  e: '0x...',
}

await client.privTransfer(preparedTransfer)
console.log(balance)
```

See [examples/privacy-wallet.ts](./examples/privacy-wallet.ts) for a fuller
example that wires all five privacy methods together.

## Chain Queries

The public client exposes additional chain query methods:

- `gasPrice()` — current gas price
- `syncing()` — node sync status (returns `false` or a `SyncingStatus` object)
- `estimateGas({ request, blockTag? })` — estimate gas for a transaction
- `getProof({ address, storageKeys, blockTag })` — Merkle proof for an account
- `createAccessList({ request })` — generate an access list for a transaction

**Net / Web3 utilities:**

- `netVersion()` — network ID string
- `netPeerCount()` — number of connected peers
- `netListening()` — whether the node is listening for connections
- `clientVersion()` — `web3_clientVersion` string

**Block transaction queries:**

- `getBlockTransactionCountByNumber({ blockNumber })` — tx count in a block by number
- `getBlockTransactionCountByHash({ hash })` — tx count in a block by hash
- `getTransactionByBlockNumberAndIndex({ blockNumber, index })` — single tx by block number + index
- `getTransactionByBlockHashAndIndex({ hash, index })` — single tx by block hash + index
- `pendingTransactions()` — list of pending transactions

## Agent Discovery

Read-only queries are on the public client; write operations require a wallet client.

**Public client (read-only):**

- `agentDiscoveryInfo()` — discovery subsystem info
- `agentDiscoverySearch({ capability, limit? })` — search agents by capability
- `agentDiscoveryGetCard({ nodeRecord })` — fetch a single agent card
- `agentDiscoveryDirectorySearch({ nodeRecord, capability, limit? })` — directory-scoped search

**Wallet client (write):**

- `agentDiscoveryPublish({ primaryIdentity, capabilities, connectionModes, cardJson, cardSequence })` — publish an agent card
- `agentDiscoveryClear()` — remove the published card

```ts
const results = await publicClient.agentDiscoverySearch({
  capability: 'llm-inference',
  limit: 10,
})

await walletClient.agentDiscoveryPublish({
  primaryIdentity: 'did:example:123',
  capabilities: ['llm-inference'],
  connectionModes: ['direct'],
  cardJson: '{"name":"my-agent"}',
  cardSequence: 1,
})
```

## DPoS / Validators

Query the DPoS consensus layer through the public client:

- `getSnapshot({ blockTag? })` — full validator snapshot at a block
- `getValidators({ blockTag? })` — list of current validators
- `getValidator({ address, blockTag? })` — details for a single validator
- `getEpochInfo({ blockTag? })` — current epoch number, start block, and length

## Filters and Subscriptions

**Filter methods (HTTP polling):**

- `newBlockFilter()` — create a block filter, returns a filter ID
- `newPendingTransactionFilter()` — create a pending-tx filter
- `newFilter({ address?, topics?, fromBlock?, toBlock? })` — create a log filter
- `getFilterChanges({ filterId })` — poll for changes since last poll
- `getFilterLogs({ filterId })` — get all logs matching a filter
- `uninstallFilter({ filterId })` — remove a filter

**WebSocket subscriptions:**

- `watchBlocks({ onBlock, onError? })` — stream new block headers
- `watchLogs({ onLog, onError?, address?, topics? })` — stream matching logs
- `watchPendingTransactions({ onTransaction, onError? })` — stream pending tx hashes
- `watchSyncing({ onStatus, onError? })` — stream sync status changes

## Chain State

- `getChainProfile()` — chain configuration profile
- `getFinalizedBlock()` — latest finalized block number and hash
- `getRetentionPolicy()` — data retention policy
- `getPruneWatermark()` — current prune watermark
- `getAccount({ address, blockTag? })` — full account state (balance, nonce, code hash, etc.)

## Validator Maintenance

Wallet client methods for validator operators:

- `enterMaintenance()` / `buildEnterMaintenanceTx()` — enter maintenance mode
- `exitMaintenance()` / `buildExitMaintenanceTx()` — exit maintenance mode
- `submitMaliciousVoteEvidence({ evidence })` / `buildSubmitMaliciousVoteEvidenceTx({ evidence })` — submit vote evidence
- `getMaliciousVoteEvidence({ hash, blockTag? })` — query a single evidence record (public client)
- `listMaliciousVoteEvidence({ count?, blockTag? })` — list recent evidence (public client)
- `setSigner({ address, signerType, publicKey })` / `buildSetSignerTx({ address, signerType, publicKey })` — set or update the validator signer key

## Transaction Pool

Inspect the node's transaction pool through the public client:

- `txpoolContent()` — full pool contents grouped by sender
- `txpoolContentFrom({ address })` — pool contents for a single address
- `txpoolStatus()` — pending and queued counts
- `txpoolInspect()` — human-readable summary of pool contents

## Provider Client Surfaces

`tosdk` exposes reusable requester-side service clients so third-party
builders can talk to OpenFox-style providers without depending on the full
runtime:

- `createSignerProviderClient` — quote, submit, status, receipt, health
- `createPaymasterProviderClient` — quote, authorize, status, receipt, health
- `createStorageProviderClient` — quote, put, renew, get, audit, health
- `createArtifactProviderClient` — captureNews, captureOracleEvidence, get, verify, health
- `buildPaymasterAuthorizationRequest`

## Surfaces

High-level operation surfaces for complex workflows:

- **Delegated Execution** — `buildRequesterEnvelope`, `toDelegatedResult`, `toSponsoredResult`, quote validation, request validation
- **Evidence** — `buildEvidenceCaptureRequest`, `verifyEvidenceReceipt`, `verifyEvidenceAnchor`, evidence kind checks
- **Operator Control** — `registerProvider`, `aggregateFleetStatus`, `checkProviderHealth`, `filterByRole`, registration validation
- **Proof Market** — `buildProofArtifactSearchParams`, proof kind checks, anchor and receipt verification

## Schema Validation

The schema module provides validation and drift detection for provider and operator data:

- Provider schemas for signer, paymaster, and storage request/response cycles
- Operator schemas for storage receipts, artifact verification, market bindings, and settlement
- `validateAgainstSchema` / `validateBatch` — validate data against schemas
- `detectDrift` / `detectBatchDrift` — detect schema drift

## Package and Lease Management

The wallet client supports package (contract) operations:

- `deployPackage` — deploy a package contract
- `callPackageFunction` — call a package function and send the transaction
- `buildLeaseDeployTx` / `deployLease` — deploy a lease
- `buildLeaseRenewTx` / `renewLease` — renew a lease
- `buildLeaseCloseTx` / `closeLease` — close a lease
- `getLease` — query lease info

## Examples

Repository examples are available under `examples/`:

- `examples/network-wallet.ts` — basic wallet creation and RPC calls
- `examples/privacy-wallet.ts` — privacy account and encrypted transactions
- `examples/provider-clients.ts` — provider client initialization
- `examples/delegated-execution.ts` — delegated execution workflow
- `examples/storage-and-artifacts.ts` — storage provider operations
- `examples/marketplace-and-settlement.ts` — marketplace operations
- `examples/provider-service-shapes.ts` — provider service interfaces
- `examples/artifact-pack.ts` — artifact provider pack
- `examples/evidence-pack.ts` — evidence capture pack
- `examples/gateway-pack.ts` — gateway pack
- `examples/marketplace-pack.ts` — marketplace pack
- `examples/paymaster-pack.ts` — paymaster provider pack
- `examples/proof-market-pack.ts` — proof market pack
- `examples/provider-pack.ts` — provider pack
- `examples/requester-pack.ts` — requester pack
- `examples/signer-pack.ts` — signer provider pack
- `examples/storage-pack.ts` — storage provider pack
- `examples/agent-discovery.ts` — agent discovery publish and search
- `examples/validator-dpos.ts` — DPoS validator queries and maintenance
- `examples/filters-and-subscriptions.ts` — filters, polling, and WebSocket subscriptions

Validate the example pack with:

```bash
pnpm test:examples
```

## License

MIT
