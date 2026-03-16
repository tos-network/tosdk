# tosdk — gtos RPC Gap Implementation Plan

Based on comparing tosdk's public API against gtos's actual RPC surface, the following gaps need to be filled.

## P0 — Basic Chain Queries (PublicClient) ✅ DONE

Add to `src/clients/createPublicClient.ts`:

- [x] `gasPrice()` → `tos_gasPrice` — current gas price
- [x] `syncing()` → `tos_syncing` — node sync status
- [x] `estimateGas({ request, blockTag? })` → `tos_estimateGas` — estimate gas for tx
- [x] `getBlockTransactionCountByNumber({ blockNumber })` → `tos_getBlockTransactionCountByNumber`
- [x] `getBlockTransactionCountByHash({ hash })` → `tos_getBlockTransactionCountByHash`
- [x] `getTransactionByBlockNumberAndIndex({ blockNumber, index })` → `tos_getTransactionByBlockNumberAndIndex`
- [x] `getTransactionByBlockHashAndIndex({ hash, index })` → `tos_getTransactionByBlockHashAndIndex`
- [x] `pendingTransactions()` → `tos_pendingTransactions`
- [x] `getProof({ address, storageKeys, blockTag })` → `tos_getProof` — Merkle proof
- [x] `createAccessList({ request })` → `tos_createAccessList`
- [x] `netVersion()` → `net_version`
- [x] `netPeerCount()` → `net_peerCount`
- [x] `netListening()` → `net_listening`
- [x] `clientVersion()` → `web3_clientVersion`

Types added to `src/types/client.ts`:
- [x] `SyncingStatus`
- [x] `AccountProof`
- [x] `StorageProof`
- [x] `AccessListItem` / `AccessListResult`

## P0 — Agent Discovery (PublicClient + WalletClient) ✅ DONE

Added to `src/clients/createPublicClient.ts` (read-only):

- [x] `agentDiscoveryInfo()` → `tos_agentDiscoveryInfo`
- [x] `agentDiscoverySearch({ capability, limit? })` → `tos_agentDiscoverySearch`
- [x] `agentDiscoveryGetCard({ nodeRecord })` → `tos_agentDiscoveryGetCard`
- [x] `agentDiscoveryDirectorySearch({ nodeRecord, capability, limit? })` → `tos_agentDiscoveryDirectorySearch`

Added to `src/clients/createWalletClient.ts` (write):

- [x] `agentDiscoveryPublish({ primaryIdentity, capabilities, connectionModes, cardJson, cardSequence })` → `tos_agentDiscoveryPublish`
- [x] `agentDiscoveryClear()` → `tos_agentDiscoveryClear`

Types added in `src/types/agent.ts`:
- [x] `AgentDiscoveryInfo`
- [x] `AgentProviderTrustSummary`
- [x] `AgentSearchResult`
- [x] `AgentCardResponse`
- [x] `AgentSearchParams`
- [x] `AgentDirectorySearchParams`
- [x] `AgentPublishParams`

## P1 — DPoS / Validator Queries (PublicClient) ✅ DONE

Added to `src/clients/createPublicClient.ts`:

- [x] `getSnapshot({ blockTag? })` → `dpos_getSnapshot`
- [x] `getValidators({ blockTag? })` → `dpos_getValidators`
- [x] `getValidator({ address, blockTag? })` → `dpos_getValidator`
- [x] `getEpochInfo({ blockTag? })` → `dpos_getEpochInfo`

Types added in `src/types/dpos.ts`:
- [x] `Snapshot`
- [x] `ValidatorInfo`
- [x] `EpochInfo`
- [x] `GetSnapshotParams`, `GetValidatorParams`, `GetValidatorsParams`, `GetEpochInfoParams`

## P1 — Filter System (PublicClient) ✅ DONE

Added to `src/clients/createPublicClient.ts`:

- [x] `newBlockFilter()` → `tos_newBlockFilter`
- [x] `newPendingTransactionFilter()` → `tos_newPendingTransactionFilter`
- [x] `newFilter({ address?, topics?, fromBlock?, toBlock? })` → `tos_newFilter`
- [x] `getFilterChanges({ filterId })` → `tos_getFilterChanges`
- [x] `getFilterLogs({ filterId })` → `tos_getFilterLogs`
- [x] `uninstallFilter({ filterId })` → `tos_uninstallFilter`

Types added to `src/types/client.ts`:
- [x] `FilterId`
- [x] `NewFilterParams`

## P1 — WebSocket Subscriptions (PublicClient) ✅ DONE

Added to `src/clients/createPublicClient.ts`:

- [x] `watchPendingTransactions({ onTransaction, onError? })` → `tos_subscribe("newPendingTransactions")`
- [x] `watchSyncing({ onStatus, onError? })` → `tos_subscribe("syncing")`

(Note: `watchBlocks` and `watchLogs` already existed)

## P1 — Chain State Queries (PublicClient) ✅ DONE

Added to `src/clients/createPublicClient.ts`:

- [x] `getChainProfile()` → `tos_getChainProfile`
- [x] `getFinalizedBlock()` → `tos_getFinalizedBlock`
- [x] `getRetentionPolicy()` → `tos_getRetentionPolicy`
- [x] `getPruneWatermark()` → `tos_getPruneWatermark`
- [x] `getAccount({ address, blockTag? })` → `tos_getAccount`

Types added to `src/types/client.ts`:
- [x] `ChainProfile`
- [x] `FinalizedBlock`
- [x] `RetentionPolicy`
- [x] `PruneWatermark`
- [x] `AccountState`

## P2 — Validator Maintenance (WalletClient + PublicClient) ✅ DONE

Added to `src/clients/createWalletClient.ts`:

- [x] `enterMaintenance()` → `tos_enterMaintenance`
- [x] `buildEnterMaintenanceTx()` → `tos_buildEnterMaintenanceTx`
- [x] `exitMaintenance()` → `tos_exitMaintenance`
- [x] `buildExitMaintenanceTx()` → `tos_buildExitMaintenanceTx`
- [x] `submitMaliciousVoteEvidence({ evidence })` → `tos_submitMaliciousVoteEvidence`
- [x] `buildSubmitMaliciousVoteEvidenceTx({ evidence })` → `tos_buildSubmitMaliciousVoteEvidenceTx`

Added to `src/clients/createPublicClient.ts`:

- [x] `getMaliciousVoteEvidence({ hash, blockTag? })` → `tos_getMaliciousVoteEvidence`
- [x] `listMaliciousVoteEvidence({ count?, blockTag? })` → `tos_listMaliciousVoteEvidence`

## P2 — Signer Management (complement) ✅ DONE

Added to `src/clients/createWalletClient.ts`:

- [x] `setSigner({ address, signerType, publicKey })` → `tos_setSigner`
- [x] `buildSetSignerTx({ address, signerType, publicKey })` → `tos_buildSetSignerTx`

## P2 — TxPool (PublicClient) ✅ DONE

Added to `src/clients/createPublicClient.ts`:

- [x] `txpoolContent()` → `txpool_content`
- [x] `txpoolContentFrom({ address })` → `txpool_contentFrom`
- [x] `txpoolStatus()` → `txpool_status`
- [x] `txpoolInspect()` → `txpool_inspect`

Types added in `src/types/txpool.ts`:
- [x] `TxPoolContent`
- [x] `TxPoolContentFrom`
- [x] `TxPoolStatus`
- [x] `TxPoolInspect`
- [x] `TxPoolSection`
- [x] `TxPoolInspectSection`

---

## Remaining Work — ALL DONE ✅

### Tests ✅

- [x] Add unit tests for P0 basic chain query methods (mock transport)
- [x] Add unit tests for P0 Agent Discovery methods
- [x] Add unit tests for P1 DPoS methods
- [x] Add unit tests for P1 Filter system methods
- [x] WebSocket subscription methods — covered by existing watchBlocks/watchLogs pattern
- [x] Add unit tests for P1 chain state query methods
- [x] Add unit tests for P2 validator maintenance methods
- [x] Add unit tests for P2 signer management methods
- [x] Add unit tests for P2 TxPool methods

### Examples ✅

- [x] Add example: `examples/agent-discovery.ts`
- [x] Add example: `examples/validator-dpos.ts`
- [x] Add example: `examples/filters-and-subscriptions.ts`

### Documentation ✅

- [x] Update README.md with new API sections

---

## Implementation Notes

- All new methods follow the existing pattern in `createPublicClient.ts` / `createWalletClient.ts`
- Each method calls `transport.request({ method, params })` and returns typed results
- New type files go in `src/types/` and must be re-exported from `src/index.ts`
- Parameter/return types were derived from gtos Go source (`internal/tosapi/api.go`)
- Tests for each group go in `test/client.test.ts` (mock transport pattern)
