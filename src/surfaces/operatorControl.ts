/**
 * Operator Control Surface
 *
 * Reusable helpers for operators who manage provider fleets,
 * monitor health, and control provider lifecycle.
 */
import type { Address } from '../types/address.js'

export type ProviderRole = 'signer' | 'paymaster' | 'storage' | 'artifact'

export type ProviderRegistration = {
  address: Address
  role: ProviderRole
  baseUrl: string
  label?: string | undefined
}

export type ProviderHealthStatus = {
  address: Address
  role: ProviderRole
  baseUrl: string
  healthy: boolean
  checkedAt: string
  latencyMs?: number | undefined
  error?: string | undefined
}

export type FleetStatus = {
  total: number
  healthy: number
  unhealthy: number
  providers: ProviderHealthStatus[]
}

/** Build a provider registration entry */
export function registerProvider(params: {
  address: Address
  role: ProviderRole
  baseUrl: string
  label?: string
}): ProviderRegistration {
  return {
    address: params.address,
    role: params.role,
    baseUrl: params.baseUrl.replace(/\/+$/, ''),
    label: params.label,
  }
}

/** Aggregate individual health checks into fleet status */
export function aggregateFleetStatus(
  statuses: ProviderHealthStatus[],
): FleetStatus {
  const healthy = statuses.filter((s) => s.healthy).length
  return {
    total: statuses.length,
    healthy,
    unhealthy: statuses.length - healthy,
    providers: statuses,
  }
}

/** Check health of a provider endpoint (fetch-based) */
export async function checkProviderHealth(
  registration: ProviderRegistration,
  fetchFn: (input: RequestInfo | URL) => Promise<Response> = fetch,
): Promise<ProviderHealthStatus> {
  const start = Date.now()
  try {
    const response = await fetchFn(`${registration.baseUrl}/healthz`)
    const latencyMs = Date.now() - start
    return {
      address: registration.address,
      role: registration.role,
      baseUrl: registration.baseUrl,
      healthy: response.ok,
      checkedAt: new Date().toISOString(),
      latencyMs,
      error: response.ok ? undefined : `HTTP ${response.status}`,
    }
  } catch (err) {
    return {
      address: registration.address,
      role: registration.role,
      baseUrl: registration.baseUrl,
      healthy: false,
      checkedAt: new Date().toISOString(),
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

/** Filter registrations by role */
export function filterByRole(
  registrations: ProviderRegistration[],
  role: ProviderRole,
): ProviderRegistration[] {
  return registrations.filter((r) => r.role === role)
}

/** Validate a provider registration */
export function validateRegistration(
  registration: ProviderRegistration,
): string[] {
  const errors: string[] = []
  if (!registration.address) errors.push('address is required')
  if (!registration.role) errors.push('role is required')
  if (!registration.baseUrl) errors.push('baseUrl is required')
  const validRoles: ProviderRole[] = ['signer', 'paymaster', 'storage', 'artifact']
  if (!validRoles.includes(registration.role)) {
    errors.push(
      `role must be one of: ${validRoles.join(', ')}`,
    )
  }
  try {
    new URL(registration.baseUrl)
  } catch {
    errors.push('baseUrl must be a valid URL')
  }
  return errors
}
