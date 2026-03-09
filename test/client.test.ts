import { expect, test, vi } from 'vitest'

import {
  createPublicClient,
  createWalletClient,
  encodeSystemActionData,
  http,
  systemActionAddress,
  toHex,
} from 'tosdk'
import { privateKeyToAccount } from 'tosdk/accounts'
import { tosTestnet } from 'tosdk/chains'

import { accounts } from './src/constants.js'
import { nativeAccounts } from './src/nativeFixtures.js'

type RpcRequestPayload = {
  id: number
  jsonrpc: '2.0'
  method: string
  params: readonly unknown[]
}

function createJsonRpcFetch(
  handler: (
    request: RpcRequestPayload,
    callIndex: number,
  ) => Promise<unknown> | unknown,
) {
  const calls: Array<{ url: string; request: RpcRequestPayload }> = []

  const fetchFn = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = JSON.parse(String(init?.body)) as RpcRequestPayload
    calls.push({ request, url: String(input) })
    const callIndex = calls.length - 1
    const response = await handler(request, callIndex)

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

test('public client uses the chain default RPC URL and returns native quantities', async () => {
  const { calls, fetchFn } = createJsonRpcFetch((request) => {
    switch (request.method) {
      case 'tos_chainId':
        return toHex(tosTestnet.id)
      case 'tos_getBalance':
        return toHex(42n)
      case 'tos_getTransactionCount':
        return toHex(7n)
      case 'tos_blockNumber':
        return toHex(99n)
      case 'tos_getBlockByNumber':
        return {
          hash: '0x1234',
          number: toHex(99n),
          transactions: [],
        }
      case 'tos_call':
        return '0xdeadbeef'
      default:
        throw new Error(`Unexpected method: ${request.method}`)
    }
  })

  const client = createPublicClient({
    chain: tosTestnet,
    transport: http(undefined, { fetchFn }),
  })

  await expect(client.getChainId()).resolves.toBe(BigInt(tosTestnet.id))
  await expect(
    client.getBalance({ address: nativeAccounts[0]!.address }),
  ).resolves.toBe(42n)
  await expect(
    client.getTransactionCount({ address: nativeAccounts[0]!.address }),
  ).resolves.toBe(7n)
  await expect(client.getBlockNumber()).resolves.toBe(99n)
  await expect(
    client.getBlockByNumber({ blockNumber: 99n, includeTransactions: true }),
  ).resolves.toEqual({
    hash: '0x1234',
    number: toHex(99n),
    transactions: [],
  })
  await expect(
    client.call({
      request: {
        from: nativeAccounts[0]!.address,
        to: nativeAccounts[1]!.address,
        data: '0xdeadbeef',
      },
    }),
  ).resolves.toBe('0xdeadbeef')

  expect(calls[0]!.url).toBe(tosTestnet.rpcUrls.default.http[0])
  expect(calls[1]!.request).toMatchObject({
    method: 'tos_getBalance',
    params: [nativeAccounts[0]!.address, 'latest'],
  })
  expect(calls[2]!.request).toMatchObject({
    method: 'tos_getTransactionCount',
    params: [nativeAccounts[0]!.address, 'pending'],
  })
  expect(calls[4]!.request).toMatchObject({
    method: 'tos_getBlockByNumber',
    params: [toHex(99n), true],
  })
  expect(calls[5]!.request).toMatchObject({
    method: 'tos_call',
    params: [
      {
        data: '0xdeadbeef',
        from: nativeAccounts[0]!.address,
        to: nativeAccounts[1]!.address,
      },
      'latest',
    ],
  })
})

test('waitForTransactionReceipt polls until a receipt becomes available', async () => {
  const receipt = {
    blockHash: '0xbeef',
    blockNumber: toHex(12n),
    cumulativeGasUsed: toHex(21_000n),
    from: nativeAccounts[0]!.address,
    gasUsed: toHex(21_000n),
    logs: [],
    to: nativeAccounts[1]!.address,
    transactionHash: '0xabcd',
  }

  const { fetchFn } = createJsonRpcFetch((_request, index) =>
    index === 0 ? null : receipt,
  )

  const client = createPublicClient({
    chain: tosTestnet,
    transport: http(undefined, { fetchFn }),
  })

  await expect(
    client.waitForTransactionReceipt({
      hash: '0xabcd',
      pollIntervalMs: 1,
      timeoutMs: 50,
    }),
  ).resolves.toEqual(receipt)
})

test('wallet client signs and broadcasts native transactions', async () => {
  const account = privateKeyToAccount(accounts[0]!.privateKey)
  const expectedSerialized = await account.signTransaction({
    chainId: BigInt(tosTestnet.id),
    data: '0x',
    from: account.address,
    gas: 21_000n,
    nonce: 7n,
    signerType: 'secp256k1',
    to: nativeAccounts[1]!.address,
    type: 'native',
    value: 1_000_000_000_000_000n,
  })

  const { calls, fetchFn } = createJsonRpcFetch((request) => {
    switch (request.method) {
      case 'tos_chainId':
        return toHex(tosTestnet.id)
      case 'tos_getTransactionCount':
        return toHex(7n)
      case 'tos_sendRawTransaction':
        return '0xfeed'
      default:
        throw new Error(`Unexpected method: ${request.method}`)
    }
  })

  const client = createWalletClient({
    account,
    chain: tosTestnet,
    transport: http(undefined, { fetchFn }),
  })

  await expect(
    client.sendTransaction({
      to: nativeAccounts[1]!.address,
      value: 1_000_000_000_000_000n,
    }),
  ).resolves.toBe('0xfeed')

  expect(calls.map((call) => call.request.method)).toEqual([
    'tos_chainId',
    'tos_getTransactionCount',
    'tos_sendRawTransaction',
  ])
  expect(calls[2]!.request.params[0]).toBe(expectedSerialized)
})

test('wallet client sends system actions through the system action address', async () => {
  const account = privateKeyToAccount(accounts[0]!.privateKey)
  const payload = {
    action: 'REPUTATION_RECORD_SCORE',
    payload: {
      agent: nativeAccounts[1]!.address,
      delta: 10,
    },
  }

  const expectedSerialized = await account.signTransaction({
    chainId: BigInt(tosTestnet.id),
    data: encodeSystemActionData(payload),
    from: account.address,
    gas: 120_000n,
    nonce: 3n,
    signerType: 'secp256k1',
    to: systemActionAddress,
    type: 'native',
    value: 0n,
  })

  const { calls, fetchFn } = createJsonRpcFetch((request) => {
    switch (request.method) {
      case 'tos_chainId':
        return toHex(tosTestnet.id)
      case 'tos_getTransactionCount':
        return toHex(3n)
      case 'tos_sendRawTransaction':
        return '0xcafe'
      default:
        throw new Error(`Unexpected method: ${request.method}`)
    }
  })

  const client = createWalletClient({
    account,
    chain: tosTestnet,
    transport: http(undefined, { fetchFn }),
  })

  await expect(client.sendSystemAction(payload)).resolves.toBe('0xcafe')

  expect(calls[2]!.request).toMatchObject({
    method: 'tos_sendRawTransaction',
    params: [expectedSerialized],
  })
})
