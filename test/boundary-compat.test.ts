import { expect, test, vi } from 'vitest'

import {
  BOUNDARY_SCHEMA_VERSION,
  createPublicClient,
  http,
  type ApprovalRecord,
  type ExecutionReceipt,
  type IntentEnvelope,
  type PlanRecord,
} from 'tosdk'
import { tosTestnet } from 'tosdk/chains'

type RpcRequestPayload = {
  id: number
  jsonrpc: '2.0'
  method: string
  params: readonly unknown[]
}

function createJsonRpcFetch(
  handler: (request: RpcRequestPayload) => Promise<unknown> | unknown,
) {
  const calls: Array<{ request: RpcRequestPayload; url: string }> = []

  const fetchFn = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = JSON.parse(String(init?.body)) as RpcRequestPayload
    calls.push({ request, url: String(input) })
    const response = await handler(request)

    return new Response(
      JSON.stringify({
        id: request.id,
        jsonrpc: '2.0',
        result: response,
      }),
      {
        headers: { 'content-type': 'application/json' },
        status: 200,
      },
    )
  })

  return { calls, fetchFn }
}

function hexBytes(byte: string, length: number): `0x${string}` {
  return `0x${byte.repeat(length)}` as `0x${string}`
}

test('exports the 2046 boundary schema version and compatible record shapes', () => {
  const sharedAddress = hexBytes('11', 32)
  const sharedHash = hexBytes('aa', 32)
  const now = 1_774_000_000

  const intent: IntentEnvelope = {
    intentId: 'intent-1',
    schemaVersion: BOUNDARY_SCHEMA_VERSION,
    action: 'transfer',
    requester: sharedAddress,
    actorAgentId: sharedAddress,
    terminalClass: 'app',
    trustTier: 3,
    params: { amount: '42' },
    constraints: {
      maxValue: '42',
      allowedRecipients: [sharedAddress],
      requiredTrustTier: 2,
      maxGas: 21_000,
      deadline: now + 600,
    },
    createdAt: now,
    expiresAt: now + 600,
    status: 'pending',
  }

  const plan: PlanRecord = {
    planId: 'plan-1',
    intentId: intent.intentId,
    schemaVersion: BOUNDARY_SCHEMA_VERSION,
    provider: sharedAddress,
    sponsor: sharedAddress,
    artifactRef: 'artifact://plan/1',
    abiRef: 'artifact://abi/1',
    policyHash: sharedHash,
    sponsorPolicyHash: sharedHash,
    effectsHash: sharedHash,
    estimatedGas: 21_000,
    estimatedValue: '42',
    route: [
      {
        target: sharedAddress,
        action: 'transfer',
        value: '42',
        artifactRef: 'artifact://route/1',
      },
    ],
    fallbackPlanId: 'plan-2',
    createdAt: now,
    expiresAt: now + 600,
    status: 'ready',
  }

  const approval: ApprovalRecord = {
    approvalId: 'approval-1',
    intentId: intent.intentId,
    planId: plan.planId,
    schemaVersion: BOUNDARY_SCHEMA_VERSION,
    approver: sharedAddress,
    approverRole: 'guardian',
    accountId: sharedAddress,
    terminalClass: 'app',
    trustTier: 3,
    policyHash: sharedHash,
    approvalProofRef: 'artifact://proof/1',
    scope: {
      maxValue: '42',
      allowedActions: ['transfer'],
      allowedTargets: [sharedAddress],
      terminalClasses: ['app'],
      minTrustTier: 2,
    },
    createdAt: now,
    expiresAt: now + 600,
    status: 'granted',
  }

  const receipt: ExecutionReceipt = {
    receiptId: 'receipt-1',
    intentId: intent.intentId,
    planId: plan.planId,
    approvalId: approval.approvalId,
    schemaVersion: BOUNDARY_SCHEMA_VERSION,
    txHash: sharedHash,
    blockNumber: 123,
    blockHash: sharedHash,
    from: sharedAddress,
    to: sharedAddress,
    sponsor: sharedAddress,
    actorAgentId: sharedAddress,
    terminalClass: 'app',
    trustTier: 3,
    policyHash: sharedHash,
    sponsorPolicyHash: sharedHash,
    artifactRef: 'artifact://receipt/1',
    effectsHash: sharedHash,
    gasUsed: 21_000,
    value: '42',
    receiptStatus: 'success',
    proofRef: 'artifact://proof/receipt/1',
    receiptRef: 'artifact://chain/receipt/1',
    settledAt: now + 300,
  }

  expect(BOUNDARY_SCHEMA_VERSION).toBe('0.1.0')
  expect(intent.schemaVersion).toBe(BOUNDARY_SCHEMA_VERSION)
  expect(plan.schemaVersion).toBe(BOUNDARY_SCHEMA_VERSION)
  expect(approval.schemaVersion).toBe(BOUNDARY_SCHEMA_VERSION)
  expect(receipt.schemaVersion).toBe(BOUNDARY_SCHEMA_VERSION)
})

test('maps 2046 public-client helpers to the expected RPC methods', async () => {
  const sharedAddress = hexBytes('11', 32)
  const sharedHash = hexBytes('aa', 32)
  const gatewayConfig = {
    supportedTerminals: ['app'],
    trustTierMin: 2,
    active: true,
  }
  const auditMeta = {
    planId: 'plan-1',
    approvalId: 'approval-1',
    sessionRoot: sharedHash,
  }
  const fulfillment = {
    fulfillmentId: 'fulfillment-1',
    status: 'pending',
  }
  const { calls, fetchFn } = createJsonRpcFetch((request) => {
    switch (request.method) {
      case 'gateway_getGatewayConfig':
        return gatewayConfig
      case 'auditReceipt_getAuditMeta':
        return auditMeta
      case 'settlement_getFulfillment':
        return fulfillment
      case 'policyWallet_getBoundaryVersion':
        return BOUNDARY_SCHEMA_VERSION
      default:
        throw new Error(`Unexpected method: ${request.method}`)
    }
  })

  const client = createPublicClient({
    chain: tosTestnet,
    transport: http(undefined, { fetchFn }),
  })

  await expect(
    client.getGatewayConfig({ agent: sharedAddress }),
  ).resolves.toEqual(gatewayConfig)
  expect(calls[0]!.request).toMatchObject({
    method: 'gateway_getGatewayConfig',
    params: [sharedAddress],
  })

  await expect(
    client.getAuditMeta({ txHash: sharedHash }),
  ).resolves.toEqual(auditMeta)
  expect(calls[1]!.request).toMatchObject({
    method: 'auditReceipt_getAuditMeta',
    params: [sharedHash],
  })

  await expect(
    client.getAsyncFulfillment({ fulfillmentId: 'fulfillment-1' }),
  ).resolves.toEqual(fulfillment)
  expect(calls[2]!.request).toMatchObject({
    method: 'settlement_getFulfillment',
    params: ['fulfillment-1'],
  })

  await expect(client.getBoundaryVersion()).resolves.toBe(
    BOUNDARY_SCHEMA_VERSION,
  )
  expect(calls[3]!.request).toMatchObject({
    method: 'policyWallet_getBoundaryVersion',
    params: [],
  })
})
