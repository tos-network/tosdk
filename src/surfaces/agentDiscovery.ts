/**
 * Agent Discovery Surface
 *
 * Reusable helpers for consumers who need to join discovery search results
 * with published cards, rank trusted providers, apply typed preferences, and
 * explain provider-selection decisions without depending on OpenFox internals.
 */
import type {
  AgentCardResponse,
  AgentConnectionMode,
  AgentPublishedCard,
  AgentSearchResult,
} from '../types/agent.js'
import type { PublicClient } from '../types/client.js'

export type DiscoveredAgentProvider = {
  search: AgentSearchResult
  card: AgentCardResponse
  parsedCard?: AgentPublishedCard | undefined
  matchedCapability?: string | undefined
}

export type TrustedDiscoveredAgentProvider = {
  provider: DiscoveredAgentProvider
  trustScore: number
}

export type AgentProviderSelectionPreferences = {
  requiredConnectionModes?: readonly AgentConnectionMode[] | undefined
  packagePrefix?: string | undefined
  serviceKind?: string | undefined
  capabilityKind?: string | undefined
  privacyMode?: string | undefined
  receiptMode?: string | undefined
  requireDisclosureReady?: boolean | undefined
  minTrustScore?: number | undefined
}

export type AgentProviderSelectionDiagnostics = {
  provider: DiscoveredAgentProvider
  trustScore: number
  trusted: boolean
  preferred: boolean
  trustFailures: string[]
  preferenceFailures: string[]
}

export type PreferredAgentProviderResolution = {
  provider: TrustedDiscoveredAgentProvider | undefined
  diagnostics: AgentProviderSelectionDiagnostics[]
}

const CONNECTION_MODE_BITS: Record<AgentConnectionMode, number> = {
  talkreq: 0x01,
  https: 0x02,
  stream: 0x04,
}

function safeParsePublishedCard(card: AgentCardResponse): AgentPublishedCard | undefined {
  if (card.parsedCard) return card.parsedCard
  try {
    return JSON.parse(card.cardJson) as AgentPublishedCard
  } catch {
    return undefined
  }
}

function requiresRoutingProfile(prefs: AgentProviderSelectionPreferences): boolean {
  return Boolean(
    prefs.serviceKind ||
      prefs.capabilityKind ||
      prefs.privacyMode ||
      prefs.receiptMode ||
      prefs.requireDisclosureReady,
  )
}

export function connectionModesFromMask(
  mask: number | undefined,
): AgentConnectionMode[] {
  if (!mask) return []
  const out: AgentConnectionMode[] = []
  if ((mask & CONNECTION_MODE_BITS.talkreq) === CONNECTION_MODE_BITS.talkreq) out.push('talkreq')
  if ((mask & CONNECTION_MODE_BITS.https) === CONNECTION_MODE_BITS.https) out.push('https')
  if ((mask & CONNECTION_MODE_BITS.stream) === CONNECTION_MODE_BITS.stream) out.push('stream')
  return out
}

export function discoverCapabilityFromCard(
  parsedCard: AgentPublishedCard | undefined,
  capability: string,
): string | undefined {
  return parsedCard?.capabilities?.find((item) => item.name === capability)?.name
}

export async function discoverAgentProviders(
  client: PublicClient,
  parameters: {
    capability: string
    limit?: number | undefined
  },
): Promise<DiscoveredAgentProvider[]> {
  const results = await client.agentDiscoverySearch(parameters)
  const providers: DiscoveredAgentProvider[] = []
  for (const result of results) {
    const card = await client.agentDiscoveryGetCard({ nodeRecord: result.nodeRecord })
    const parsedCard = safeParsePublishedCard(card)
    providers.push({
      search: result,
      card,
      parsedCard,
      matchedCapability: discoverCapabilityFromCard(parsedCard, parameters.capability),
    })
  }
  return providers
}

export async function directoryDiscoverAgentProviders(
  client: PublicClient,
  parameters: {
    nodeRecord: string
    capability: string
    limit?: number | undefined
  },
): Promise<DiscoveredAgentProvider[]> {
  const results = await client.agentDiscoveryDirectorySearch(parameters)
  const providers: DiscoveredAgentProvider[] = []
  for (const result of results) {
    const card = await client.agentDiscoveryGetCard({ nodeRecord: result.nodeRecord })
    const parsedCard = safeParsePublishedCard(card)
    providers.push({
      search: result,
      card,
      parsedCard,
      matchedCapability: discoverCapabilityFromCard(parsedCard, parameters.capability),
    })
  }
  return providers
}

export function rankTrustedAgentProviders(
  providers: readonly DiscoveredAgentProvider[],
): TrustedDiscoveredAgentProvider[] {
  return providers
    .filter((provider) => {
      const trust = provider.search.trust
      return Boolean(trust?.registered && !trust?.suspended && trust?.hasOnchainCapability)
    })
    .map((provider) => ({
      provider,
      trustScore: provider.search.trust?.localRankScore ?? 0,
    }))
    .sort((left, right) => {
      if (left.trustScore !== right.trustScore) {
        return right.trustScore - left.trustScore
      }
      return left.provider.search.nodeRecord.localeCompare(right.provider.search.nodeRecord)
    })
}

export function filterPreferredAgentProviders(
  providers: readonly TrustedDiscoveredAgentProvider[],
  prefs: AgentProviderSelectionPreferences = {},
): TrustedDiscoveredAgentProvider[] {
  return providers.filter((provider) =>
    getPreferenceFailures(provider.provider, provider.trustScore, prefs).length === 0,
  )
}

export function resolvePreferredAgentProvider(
  providers: readonly TrustedDiscoveredAgentProvider[],
  prefs: AgentProviderSelectionPreferences = {},
): TrustedDiscoveredAgentProvider | undefined {
  return filterPreferredAgentProviders(providers, prefs)[0]
}

export function diagnoseAgentProviders(
  providers: readonly DiscoveredAgentProvider[],
  prefs: AgentProviderSelectionPreferences = {},
): AgentProviderSelectionDiagnostics[] {
  return providers.map((provider) => {
    const trustFailures = getTrustFailures(provider)
    const trustScore = provider.search.trust?.localRankScore ?? 0
    const preferenceFailures = getPreferenceFailures(provider, trustScore, prefs)
    return {
      provider,
      trustScore,
      trusted: trustFailures.length === 0,
      preferred: trustFailures.length === 0 && preferenceFailures.length === 0,
      trustFailures,
      preferenceFailures,
    }
  })
}

export function summarizeAgentProviderDiagnostics(
  diagnostics: readonly AgentProviderSelectionDiagnostics[],
): string {
  if (diagnostics.length === 0) {
    return 'no discovery candidates returned a parseable provider card'
  }
  return diagnostics
    .slice(0, 3)
    .map((item) => {
      const reasons = [...item.trustFailures, ...item.preferenceFailures]
      return `${item.provider.search.nodeId}: ${
        reasons.length > 0 ? reasons.join('; ') : 'not selected'
      }`
    })
    .join(' | ')
}

export function requirePreferredAgentProvider(
  resolution: PreferredAgentProviderResolution,
  capability: string,
): TrustedDiscoveredAgentProvider {
  if (resolution.provider) {
    return resolution.provider
  }
  throw new Error(
    `No provider found for capability ${capability}: ${summarizeAgentProviderDiagnostics(
      resolution.diagnostics,
    )}`,
  )
}

export async function searchPreferredAgentProvider(
  client: PublicClient,
  parameters: {
    capability: string
    limit?: number | undefined
  },
  prefs: AgentProviderSelectionPreferences = {},
): Promise<TrustedDiscoveredAgentProvider | undefined> {
  const providers = await discoverAgentProviders(client, parameters)
  const trusted = rankTrustedAgentProviders(providers)
  return resolvePreferredAgentProvider(trusted, prefs)
}

export async function directorySearchPreferredAgentProvider(
  client: PublicClient,
  parameters: {
    nodeRecord: string
    capability: string
    limit?: number | undefined
  },
  prefs: AgentProviderSelectionPreferences = {},
): Promise<TrustedDiscoveredAgentProvider | undefined> {
  const providers = await directoryDiscoverAgentProviders(client, parameters)
  const trusted = rankTrustedAgentProviders(providers)
  return resolvePreferredAgentProvider(trusted, prefs)
}

export async function searchPreferredAgentProviderWithDiagnostics(
  client: PublicClient,
  parameters: {
    capability: string
    limit?: number | undefined
  },
  prefs: AgentProviderSelectionPreferences = {},
): Promise<PreferredAgentProviderResolution> {
  const providers = await discoverAgentProviders(client, parameters)
  const trusted = rankTrustedAgentProviders(providers)
  return {
    provider: resolvePreferredAgentProvider(trusted, prefs),
    diagnostics: diagnoseAgentProviders(providers, prefs),
  }
}

export async function searchPreferredAgentProviderOrThrow(
  client: PublicClient,
  parameters: {
    capability: string
    limit?: number | undefined
  },
  prefs: AgentProviderSelectionPreferences = {},
): Promise<TrustedDiscoveredAgentProvider> {
  return requirePreferredAgentProvider(
    await searchPreferredAgentProviderWithDiagnostics(client, parameters, prefs),
    parameters.capability,
  )
}

export async function directorySearchPreferredAgentProviderWithDiagnostics(
  client: PublicClient,
  parameters: {
    nodeRecord: string
    capability: string
    limit?: number | undefined
  },
  prefs: AgentProviderSelectionPreferences = {},
): Promise<PreferredAgentProviderResolution> {
  const providers = await directoryDiscoverAgentProviders(client, parameters)
  const trusted = rankTrustedAgentProviders(providers)
  return {
    provider: resolvePreferredAgentProvider(trusted, prefs),
    diagnostics: diagnoseAgentProviders(providers, prefs),
  }
}

export async function directorySearchPreferredAgentProviderOrThrow(
  client: PublicClient,
  parameters: {
    nodeRecord: string
    capability: string
    limit?: number | undefined
  },
  prefs: AgentProviderSelectionPreferences = {},
): Promise<TrustedDiscoveredAgentProvider> {
  return requirePreferredAgentProvider(
    await directorySearchPreferredAgentProviderWithDiagnostics(
      client,
      parameters,
      prefs,
    ),
    parameters.capability,
  )
}

function getTrustFailures(provider: DiscoveredAgentProvider): string[] {
  const failures: string[] = []
  const trust = provider.search.trust
  if (!trust) {
    failures.push('missing trust summary')
    return failures
  }
  if (!trust.registered) failures.push('provider not registered')
  if (trust.suspended) failures.push('provider suspended')
  if (!trust.hasOnchainCapability) failures.push('capability missing on-chain')
  return failures
}

function getPreferenceFailures(
  provider: DiscoveredAgentProvider,
  trustScore: number,
  prefs: AgentProviderSelectionPreferences,
): string[] {
  const failures: string[] = []
  if ((prefs.minTrustScore ?? 0) > trustScore) {
    failures.push('trust score below minimum')
  }
  if ((prefs.requiredConnectionModes?.length ?? 0) > 0) {
    const mask = provider.search.connectionModes ?? 0
    const missing = prefs.requiredConnectionModes!.filter(
      (mode) => (mask & CONNECTION_MODE_BITS[mode]) !== CONNECTION_MODE_BITS[mode],
    )
    if (missing.length > 0) failures.push('required connection modes missing')
  }

  const parsed = provider.parsedCard
  if (prefs.packagePrefix && !(parsed?.package_name?.startsWith(prefs.packagePrefix))) {
    failures.push('package prefix mismatch')
  }
  if (!requiresRoutingProfile(prefs)) return failures
  if (!parsed?.routing_profile) {
    failures.push('routing profile missing')
    return failures
  }

  const routing = parsed.routing_profile
  if (prefs.serviceKind) {
    const serviceKinds = routing.service_kinds ?? []
    if (routing.service_kind !== prefs.serviceKind && !serviceKinds.includes(prefs.serviceKind)) {
      failures.push('service kind mismatch')
    }
  }
  if (prefs.capabilityKind && routing.capability_kind !== prefs.capabilityKind) {
    failures.push('capability kind mismatch')
  }
  if (prefs.privacyMode && routing.privacy_mode !== prefs.privacyMode) {
    failures.push('privacy mode mismatch')
  }
  if (prefs.receiptMode && routing.receipt_mode !== prefs.receiptMode) {
    failures.push('receipt mode mismatch')
  }
  if (prefs.requireDisclosureReady && routing.disclosure_ready !== true) {
    failures.push('disclosure-ready requirement not met')
  }
  return failures
}
