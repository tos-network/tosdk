# TOS Network SDK

`tosdk` is the TypeScript SDK for building applications, agents, and services on TOS Network.

This repository is a native TypeScript SDK for TOS Network. The account layer now uses 32-byte native addresses while keeping a compact client and action surface for application and agent development.

## Current Direction

- Native 32-byte account addresses
- TypeScript-first developer experience
- Reusable client, account, signing, and transport utilities
- A migration path from EVM-oriented tooling toward TOS-native behavior

## What Is Working Now

- Private-key, HD, and mnemonic-based local accounts
- Native 32-byte address derivation from secp256k1 keys
- Native transaction typing, serialization, and signing
- Typed data signing on top of the 32-byte account model
- Core account and address test coverage focused on the native path

## Scope

This SDK is still under active migration. Some modules still reflect the upstream EVM-oriented structure, but the account layer is already being converted to TOS-native behavior first.

## Example

```ts
import { privateKeyToAccount } from 'tosdk/accounts'

const account = privateKeyToAccount(
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
)

console.log(account.address)
// 0xc1ffd3cfee2d9e5cd67643f8f39fd6e51aad88f6f4ce6ab8827279cfffb92266
```

## License

MIT
