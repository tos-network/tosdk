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

Validate the example pack with:

```bash
pnpm test:examples
```

## License

MIT
