import {
  createPublicClient,
  http,
  webSocket,
  tosTestnet,
} from '../src/index.js'
import type {
  Address,
  ChainProfile,
  FilterId,
  FinalizedBlock,
  Hex,
  RpcLog,
  TxPoolContent,
  TxPoolStatus,
} from '../src/index.js'

/**
 * Demonstrates the filter-based polling API, WebSocket subscriptions,
 * chain state queries, and txpool introspection.
 */
export async function buildFiltersExample() {
  const publicClient = createPublicClient({
    chain: tosTestnet,
    transport: http('http://127.0.0.1:8545'),
  })

  // --- Filter creation and polling ---

  // Create a block filter that tracks new block hashes.
  const blockFilterId: FilterId = await publicClient.newBlockFilter()
  console.log('Block filter ID:', blockFilterId)

  // Create a log filter for Transfer events from a specific contract.
  const contractAddress =
    '0x1234567890abcdef1234567890abcdef12345678' as Address
  const transferEventTopic =
    '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef' as Hex

  const logFilterId: FilterId = await publicClient.newFilter({
    address: contractAddress,
    topics: [transferEventTopic],
    fromBlock: 'latest',
  })
  console.log('Log filter ID:', logFilterId)

  // Create a pending transaction filter.
  const pendingTxFilterId: FilterId =
    await publicClient.newPendingTransactionFilter()
  console.log('Pending tx filter ID:', pendingTxFilterId)

  // Poll each filter for changes. The return type depends on filter kind:
  //  - Block filter returns Hex[] (block hashes)
  //  - Log filter returns RpcLog[]
  //  - Pending tx filter returns Hex[] (transaction hashes)

  const blockChanges: readonly RpcLog[] | readonly Hex[] =
    await publicClient.getFilterChanges({ filterId: blockFilterId })
  console.log('New block hashes:', blockChanges.length)

  const logChanges: readonly RpcLog[] | readonly Hex[] =
    await publicClient.getFilterChanges({ filterId: logFilterId })
  console.log('New log entries:', logChanges.length)

  const pendingTxChanges: readonly RpcLog[] | readonly Hex[] =
    await publicClient.getFilterChanges({ filterId: pendingTxFilterId })
  console.log('New pending tx hashes:', pendingTxChanges.length)

  // Retrieve all logs that match a log filter since its creation.
  const allLogs: readonly RpcLog[] = await publicClient.getFilterLogs({
    filterId: logFilterId,
  })
  console.log('All matching logs:', allLogs.length)

  // Clean up filters when no longer needed.
  const blockRemoved = await publicClient.uninstallFilter({
    filterId: blockFilterId,
  })
  const logRemoved = await publicClient.uninstallFilter({
    filterId: logFilterId,
  })
  const pendingRemoved = await publicClient.uninstallFilter({
    filterId: pendingTxFilterId,
  })
  console.log('Filters uninstalled:', blockRemoved, logRemoved, pendingRemoved)

  // --- Chain state queries ---

  const chainProfile: ChainProfile = await publicClient.getChainProfile()
  console.log('Chain ID:', chainProfile.chainId)
  console.log('Target block interval (ms):', chainProfile.targetBlockIntervalMs)
  console.log('Retain blocks:', chainProfile.retainBlocks)

  const finalizedBlock: FinalizedBlock | null =
    await publicClient.getFinalizedBlock()
  if (finalizedBlock) {
    console.log('Finalized block number:', finalizedBlock.number)
    console.log('Finalized block hash:', finalizedBlock.hash)
  }

  // --- TxPool introspection ---

  const txpoolStatus: TxPoolStatus = await publicClient.txpoolStatus()
  console.log('TxPool pending:', txpoolStatus.pending)
  console.log('TxPool queued:', txpoolStatus.queued)

  const txpoolContent: TxPoolContent = await publicClient.txpoolContent()
  console.log(
    'TxPool content pending addresses:',
    Object.keys(txpoolContent.pending).length,
  )
  console.log(
    'TxPool content queued addresses:',
    Object.keys(txpoolContent.queued).length,
  )

  return {
    blockFilterId,
    logFilterId,
    pendingTxFilterId,
    chainProfile,
    finalizedBlock,
    txpoolStatus,
  }
}

/**
 * Demonstrates WebSocket-based subscriptions for real-time events.
 * Requires a WebSocket transport.
 */
export async function buildSubscriptionsExample() {
  const wsClient = createPublicClient({
    chain: tosTestnet,
    transport: webSocket('ws://127.0.0.1:8546'),
  })

  // Subscribe to pending transaction hashes in real time.
  const pendingTxSub = await wsClient.watchPendingTransactions({
    onTransaction(hash: Hex) {
      console.log('Pending tx:', hash)
    },
    onError(error: Error) {
      console.error('Pending tx subscription error:', error)
    },
  })

  // Subscribe to syncing status changes.
  const syncingSub = await wsClient.watchSyncing({
    onStatus(status) {
      if (status === false) {
        console.log('Node is fully synced')
      } else {
        console.log(
          'Syncing:',
          status.currentBlock,
          '/',
          status.highestBlock,
        )
      }
    },
    onError(error: Error) {
      console.error('Syncing subscription error:', error)
    },
  })

  // Unsubscribe when done.
  await pendingTxSub.unsubscribe()
  await syncingSub.unsubscribe()

  return { pendingTxSub, syncingSub }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(
    JSON.stringify(
      {
        example: 'filters-and-subscriptions',
        description:
          'Filter polling, WebSocket subscriptions, chain state, and txpool queries',
      },
      null,
      2,
    ),
  )
}
