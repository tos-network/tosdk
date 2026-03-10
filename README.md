# TOS Network SDK

`tosdk` is the TypeScript SDK for building applications, agents, and services on TOS Network.

This repository is a native TypeScript SDK for TOS Network. It focuses on native accounts, 32-byte addresses, typed-data signing, native transaction signing, and a small RPC client surface for building wallets, agents, and services.

## Current Direction

- Native 32-byte account addresses
- TypeScript-first developer experience
- Reusable account, signing, and encoding utilities
- A small surface area that is easy to embed into agents and services

## What Is Working Now

- Private-key, HD, and mnemonic-based local accounts
- Native 32-byte address derivation from secp256k1 keys
- Native transaction typing, serialization, and signing
- Typed data signing on top of the 32-byte account model
- Public and wallet clients for TOS RPC
- Reusable requester-side clients for storage, artifact, signer-provider, and paymaster-provider services
- Native-only tests for accounts, signing, encoding, chains, clients, and utilities

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

## Provider Client Surfaces

`tosdk` also exposes reusable requester-side service clients so third-party
builders can talk to OpenFox-style providers without depending on the full
runtime:

- `createStorageProviderClient`
- `createArtifactProviderClient`
- `createSignerProviderClient`
- `createPaymasterProviderClient`
- `buildPaymasterAuthorizationRequest`

## License

MIT
