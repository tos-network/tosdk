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
      case 'tos_getCode':
        return '0x60016001'
      case 'tos_getStorageAt':
        return '0x01'
      case 'tos_getTransactionByHash':
        return {
          hash: '0xaaaa',
          from: nativeAccounts[0]!.address,
          to: nativeAccounts[1]!.address,
          value: toHex(42n),
        }
      case 'tos_getLogs':
        return [
          {
            address: nativeAccounts[1]!.address,
            data: '0xdeadbeef',
            topics: ['0x1111'],
          },
        ]
      case 'tos_estimateGas':
        return toHex(55_555n)
      case 'tos_maxPriorityFeePerGas':
        return toHex(1_500_000_000n)
      case 'tos_feeHistory':
        return {
          oldestBlock: toHex(90n),
          reward: [[toHex(1n), toHex(2n)]],
          baseFeePerGas: [toHex(10n), toHex(11n)],
          gasUsedRatio: [0.5, 0.75],
        }
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
  await expect(
    client.getCode({ address: nativeAccounts[1]!.address }),
  ).resolves.toBe('0x60016001')
  await expect(
    client.getStorageAt({
      address: nativeAccounts[1]!.address,
      slot: '0x01',
    }),
  ).resolves.toBe('0x01')
  await expect(
    client.getTransactionByHash({ hash: '0xaaaa' }),
  ).resolves.toMatchObject({
    from: nativeAccounts[0]!.address,
    hash: '0xaaaa',
    to: nativeAccounts[1]!.address,
  })
  await expect(
    client.getLogs({
      address: nativeAccounts[1]!.address,
      fromBlock: 1n,
      toBlock: 5n,
      topics: ['0x1111'],
    }),
  ).resolves.toEqual([
    {
      address: nativeAccounts[1]!.address,
      data: '0xdeadbeef',
      topics: ['0x1111'],
    },
  ])
  await expect(
    client.estimateGas({
      request: {
        from: nativeAccounts[0]!.address,
        to: nativeAccounts[1]!.address,
      },
    }),
  ).resolves.toBe(55_555n)
  await expect(client.maxPriorityFeePerGas()).resolves.toBe(1_500_000_000n)
  await expect(
    client.feeHistory({
      blockCount: 2,
      lastBlock: 100n,
      rewardPercentiles: [25, 75],
    }),
  ).resolves.toEqual({
    oldestBlock: 90n,
    reward: [[1n, 2n]],
    baseFeePerGas: [10n, 11n],
    gasUsedRatio: [0.5, 0.75],
  })

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
  expect(calls[6]!.request).toMatchObject({
    method: 'tos_getCode',
    params: [nativeAccounts[1]!.address, 'latest'],
  })
  expect(calls[7]!.request).toMatchObject({
    method: 'tos_getStorageAt',
    params: [nativeAccounts[1]!.address, '0x01', 'latest'],
  })
  expect(calls[9]!.request).toMatchObject({
    method: 'tos_getLogs',
    params: [
      {
        address: nativeAccounts[1]!.address,
        fromBlock: '0x1',
        toBlock: '0x5',
        topics: ['0x1111'],
      },
    ],
  })
  expect(calls[10]!.request).toMatchObject({
    method: 'tos_estimateGas',
    params: [
      {
        from: nativeAccounts[0]!.address,
        to: nativeAccounts[1]!.address,
      },
    ],
  })
  expect(calls[12]!.request).toMatchObject({
    method: 'tos_feeHistory',
    params: ['0x2', '0x64', [25, 75]],
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

test('getLogs rejects blockHash mixed with block range parameters', async () => {
  const client = createPublicClient({
    chain: tosTestnet,
    transport: http(tosTestnet.rpcUrls.default.http[0], {
      fetchFn: vi.fn(),
    }),
  })

  await expect(
    client.getLogs({
      blockHash: '0xabcd',
      fromBlock: 1n,
    }),
  ).rejects.toMatchObject({
    name: 'InvalidLogFilterError',
  })
})
