import type { Address } from './address.js'

/** Trust summary for an agent provider from on-chain registry. */
export type AgentProviderTrustSummary = {
  registered: boolean
  suspended: boolean
  stake: string
  stakeBucket?: string | undefined
  reputation: string
  reputationBucket?: string | undefined
  ratingCount: string
  capabilityRegistered: boolean
  capabilityBit?: number | undefined
  hasOnchainCapability: boolean
  localRankScore?: number | undefined
  localRankReason?: string | undefined
}

/** Info returned by `tos_agentDiscoveryInfo`. */
export type AgentDiscoveryInfo = {
  enabled: boolean
  profileVersion: number
  talkProtocol: string
  nodeId?: string | undefined
  nodeRecord?: string | undefined
  primaryIdentity?: string | undefined
  cardSequence?: number | undefined
  connectionModes?: number | undefined
  capabilities?: readonly string[] | undefined
  hasPublishedCard: boolean
}

/** Result item returned by `tos_agentDiscoverySearch` and `tos_agentDiscoveryDirectorySearch`. */
export type AgentSearchResult = {
  nodeId: string
  nodeRecord: string
  primaryIdentity?: string | undefined
  connectionModes?: number | undefined
  cardSequence?: number | undefined
  capabilities?: readonly string[] | undefined
  trust?: AgentProviderTrustSummary | undefined
}

/** Card response returned by `tos_agentDiscoveryGetCard`. */
export type AgentCardResponse = {
  nodeId: string
  nodeRecord: string
  cardJson: string
}

/** Parameters for `agentDiscoverySearch`. */
export type AgentSearchParams = {
  capability: string
  limit?: number | undefined
}

/** Parameters for `agentDiscoveryDirectorySearch`. */
export type AgentDirectorySearchParams = {
  nodeRecord: string
  capability: string
  limit?: number | undefined
}

/** Parameters for `agentDiscoveryPublish`. */
export type AgentPublishParams = {
  primaryIdentity: Address
  capabilities: readonly string[]
  connectionModes?: readonly string[] | undefined
  cardJson?: string | undefined
  cardSequence?: number | undefined
}
