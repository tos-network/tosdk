# TOSDK Examples

These examples show how to use `tosdk` directly without depending on the
OpenFox runtime.

Included examples:

- `network-wallet.ts`
- `privacy-wallet.ts`
- `provider-clients.ts`
- `storage-and-artifacts.ts`
- `delegated-execution.ts`
- `marketplace-and-settlement.ts`
- `provider-service-shapes.ts`
- `proof-market-pack.ts`

Example groups:

- `network-wallet.ts`
  - local accounts
  - public client
  - wallet client
- `privacy-wallet.ts`
  - ElGamal privacy account
  - encrypted balance and private nonce reads
  - pre-signed `privTransfer` / `privShield` / `privUnshield` submission helpers
- `provider-clients.ts`
  - requester-side provider clients for signer, paymaster, storage, and artifact routes
- `delegated-execution.ts`
  - bounded signer-provider and paymaster-provider requester flow
- `storage-and-artifacts.ts`
  - storage/artifact receipts, canonicalization, and hashes
- `marketplace-and-settlement.ts`
  - market binding and settlement receipts, canonicalization, and hashes
- `provider-service-shapes.ts`
  - typed request/response payload shapes for third-party provider implementations
- `proof-market-pack.ts`
  - public proof bundle classes
  - proof-oriented search filters
  - verification receipt and anchor helpers

All examples are intentionally small and use placeholder URLs, addresses, and
ids. Replace them before connecting to a real node or provider.

To validate the example pack:

```bash
pnpm test:examples
```
