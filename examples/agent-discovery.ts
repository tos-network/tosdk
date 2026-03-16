import {
  createPublicClient,
  createWalletClient,
  http,
  privateKeyToAccount,
  tosTestnet,
} from '../src/index.js'
import type {
  AgentCardResponse,
  AgentDiscoveryInfo,
  AgentSearchResult,
} from '../src/index.js'

/**
 * Demonstrates agent discovery read operations using the public client,
 * and publish/clear operations using the wallet client.
 */
export async function buildAgentDiscoveryExample() {
  // --- Public client: read-only discovery queries ---

  const publicClient = createPublicClient({
    chain: tosTestnet,
    transport: http('http://127.0.0.1:8545'),
  })

  // Retrieve the local node's agent discovery status.
  const info: AgentDiscoveryInfo = await publicClient.agentDiscoveryInfo()
  console.log('Discovery enabled:', info.enabled)
  console.log('Published card:', info.hasPublishedCard)

  // Search the DHT for agents that expose a specific capability.
  const searchResults: readonly AgentSearchResult[] =
    await publicClient.agentDiscoverySearch({
      capability: 'llm-inference',
      limit: 10,
    })
  console.log('Search results:', searchResults.length)

  // If results were found, fetch the full card for the first agent.
  if (searchResults.length > 0) {
    const firstResult = searchResults[0]
    const card: AgentCardResponse = await publicClient.agentDiscoveryGetCard({
      nodeRecord: firstResult.nodeRecord,
    })
    console.log('Card nodeId:', card.nodeId)
    console.log('Card JSON:', card.cardJson)
  }

  // Perform a directory-scoped search through a known directory node.
  const directoryResults: readonly AgentSearchResult[] =
    await publicClient.agentDiscoveryDirectorySearch({
      nodeRecord: 'enr:-example-directory-node-record',
      capability: 'llm-inference',
      limit: 5,
    })
  console.log('Directory search results:', directoryResults.length)

  // --- Wallet client: publish and clear agent card ---

  const account = privateKeyToAccount(
    '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
  )

  const walletClient = createWalletClient({
    account,
    chain: tosTestnet,
    transport: http('http://127.0.0.1:8545'),
  })

  // Publish an agent card with capabilities and metadata.
  const publishedInfo: AgentDiscoveryInfo =
    await walletClient.agentDiscoveryPublish({
      primaryIdentity: account.address,
      capabilities: ['llm-inference', 'tool-execution'],
      connectionModes: ['direct', 'relay'],
      cardJson: JSON.stringify({
        name: 'example-agent',
        version: '1.0.0',
        endpoints: ['https://agent.example.com/a2a'],
      }),
      cardSequence: 1,
    })
  console.log('Published - enabled:', publishedInfo.enabled)
  console.log('Published - hasCard:', publishedInfo.hasPublishedCard)

  // Clear the published agent card from the network.
  const clearedInfo: AgentDiscoveryInfo =
    await walletClient.agentDiscoveryClear()
  console.log('Cleared - hasCard:', clearedInfo.hasPublishedCard)

  return {
    info,
    searchResults,
    directoryResults,
    publishedInfo,
    clearedInfo,
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(
    JSON.stringify(
      {
        example: 'agent-discovery',
        description:
          'Agent discovery info, search, card retrieval, publish, and clear',
      },
      null,
      2,
    ),
  )
}
