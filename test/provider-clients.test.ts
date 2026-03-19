import { expect, test, vi } from 'vitest'

import {
  createArtifactProviderClient,
  createStorageProviderClient,
  type ArtifactItemResponse,
  type StorageLeaseResponse,
} from '../src/index.js'

function createFetchStub(
  handler: (input: string, init?: RequestInit) => Promise<unknown> | unknown,
) {
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const result = await handler(String(input), init)
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  })
}

test('storage provider client issues quote/put/head/get/audit/renew requests', async () => {
  const leaseResponse: StorageLeaseResponse = {
    lease_id: 'lease-1',
    cid: 'bafytest',
    bundle_hash: '0x11',
    bundle_kind: 'oracle.evidence',
    provider_address:
      '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    size_bytes: 42,
    ttl_seconds: 3600,
    amount_tomi: '1000',
    issued_at: '2026-03-10T00:00:00.000Z',
    expires_at: '2026-03-10T01:00:00.000Z',
    receipt_id: 'receipt-1',
    receipt_hash: '0x22',
    get_url: 'https://provider.example/get/bafytest',
    head_url: 'https://provider.example/head/bafytest',
  }

  const fetchFn = createFetchStub((input) => {
    if (input.endsWith('/quote')) {
      return {
        quote_id: 'quote-1',
        provider_address: leaseResponse.provider_address,
        requester_address:
          '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        cid: leaseResponse.cid,
        bundle_kind: leaseResponse.bundle_kind,
        size_bytes: leaseResponse.size_bytes,
        ttl_seconds: leaseResponse.ttl_seconds,
        amount_tomi: leaseResponse.amount_tomi,
        expires_at: leaseResponse.expires_at,
      }
    }
    if (input.endsWith('/put')) return leaseResponse
    if (input.includes('/head/')) return leaseResponse
    if (input.includes('/get/')) return { lease: leaseResponse, bundle: { ok: true } }
    if (input.endsWith('/audit')) {
      return {
        audit_id: 'audit-1',
        lease_id: leaseResponse.lease_id,
        cid: leaseResponse.cid,
        status: 'verified',
        response_hash: '0x33',
        checked_at: '2026-03-10T00:05:00.000Z',
      }
    }
    if (input.endsWith('/renew')) {
      return {
        ...leaseResponse,
        renewal_id: 'renewal-1',
        previous_expires_at: leaseResponse.expires_at,
        renewed_expires_at: '2026-03-10T02:00:00.000Z',
        added_ttl_seconds: 3600,
      }
    }
    if (input.endsWith('/healthz')) return { ok: true }
    throw new Error(`unexpected request: ${input}`)
  })

  const client = createStorageProviderClient({
    baseUrl: 'https://provider.example/storage/',
    fetchFn,
  })

  await expect(
    client.quote({
      cid: leaseResponse.cid,
      bundle_kind: leaseResponse.bundle_kind,
      size_bytes: leaseResponse.size_bytes,
      ttl_seconds: leaseResponse.ttl_seconds,
      requester_address:
        '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    }),
  ).resolves.toMatchObject({ quote_id: 'quote-1' })

  await expect(
    client.put({
      requester: {
        identity: {
          kind: 'tos',
          value:
            '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        },
      },
      request_nonce: 'nonce-1',
      request_expires_at: 1_800_000_000,
      bundle: { ok: true },
      bundle_kind: leaseResponse.bundle_kind,
      ttl_seconds: leaseResponse.ttl_seconds,
      cid: leaseResponse.cid,
    }),
  ).resolves.toMatchObject({ lease_id: 'lease-1' })

  await expect(client.head({ cid: leaseResponse.cid })).resolves.toMatchObject({
    lease_id: 'lease-1',
  })
  await expect(client.get({ cid: leaseResponse.cid })).resolves.toEqual({
    lease: leaseResponse,
    bundle: { ok: true },
  })
  await expect(
    client.audit({ lease_id: leaseResponse.lease_id, challenge_nonce: 'nonce-2' }),
  ).resolves.toMatchObject({ audit_id: 'audit-1' })
  await expect(
    client.renew({
      requester: {
        identity: {
          kind: 'tos',
          value:
            '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        },
      },
      request_nonce: 'nonce-3',
      request_expires_at: 1_800_000_000,
      lease_id: leaseResponse.lease_id,
    }),
  ).resolves.toMatchObject({ renewal_id: 'renewal-1' })
  await expect(client.health()).resolves.toEqual({ ok: true })
})

test('artifact provider client issues capture/get/health requests', async () => {
  const artifactResponse: ArtifactItemResponse = {
    artifact: {
      artifactId: 'artifact-1',
      kind: 'public_news.capture',
      title: 'Example',
      leaseId: 'lease-1',
      cid: 'bafyartifact',
      bundleHash: '0x44',
      providerBaseUrl: 'https://provider.example/artifacts',
      providerAddress:
        '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      requesterAddress:
        '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      status: 'stored',
      createdAt: '2026-03-10T00:00:00.000Z',
      updatedAt: '2026-03-10T00:00:00.000Z',
    },
    verification: null,
    anchor: null,
    artifact_url: 'https://provider.example/artifacts/item/artifact-1',
  }

  const fetchFn = createFetchStub((input) => {
    if (input.endsWith('/capture-news')) return artifactResponse
    if (input.endsWith('/oracle-evidence')) return artifactResponse
    if (input.includes('/item/')) return artifactResponse
    if (input.endsWith('/healthz')) return { ok: true }
    throw new Error(`unexpected request: ${input}`)
  })

  const client = createArtifactProviderClient({
    baseUrl: 'https://provider.example/artifacts/',
    fetchFn,
  })

  await expect(
    client.captureNews({
      capability: 'public_news.capture',
      requester: {
        identity: {
          kind: 'tos',
          value:
            '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        },
      },
      request_nonce: 'nonce-1',
      request_expires_at: 1_800_000_000,
      title: 'Example',
      source_url: 'https://example.com',
      body_text: 'body',
    }),
  ).resolves.toMatchObject({ artifact: { artifactId: 'artifact-1' } })

  await expect(
    client.captureOracleEvidence({
      capability: 'oracle.evidence',
      requester: {
        identity: {
          kind: 'tos',
          value:
            '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        },
      },
      request_nonce: 'nonce-2',
      request_expires_at: 1_800_000_000,
      title: 'Question',
      question: 'What happened?',
      evidence_text: 'Evidence.',
    }),
  ).resolves.toMatchObject({ artifact: { artifactId: 'artifact-1' } })

  await expect(client.getItem({ artifactId: 'artifact-1' })).resolves.toEqual(
    artifactResponse,
  )
  await expect(client.health()).resolves.toEqual({ ok: true })
})
