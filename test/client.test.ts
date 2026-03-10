import { expect, test, vi } from 'vitest'

import {
  createPublicClient,
  createWalletClient,
  encodeSystemActionData,
  http,
  systemActionAddress,
  toHex,
  webSocket,
} from 'tosdk'
import type { RpcBlock, RpcLog } from 'tosdk'
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

class FakeWebSocket {
  readyState = 0
  sent: RpcRequestPayload[] = []
  private listeners = new Map<string, Set<(event: any) => void>>()

  constructor(readonly url: string) {}

  addEventListener(type: string, listener: (event: any) => void) {
    const listeners = this.listeners.get(type) ?? new Set()
    listeners.add(listener)
    this.listeners.set(type, listeners)
  }

  removeEventListener(type: string, listener: (event: any) => void) {
    this.listeners.get(type)?.delete(listener)
  }

  send(data: string) {
    this.sent.push(JSON.parse(data) as RpcRequestPayload)
  }

  close() {
    this.readyState = 3
    this.emit('close', {})
  }

  open() {
    this.readyState = 1
    this.emit('open', {})
  }

  emitResult(id: number, result: unknown) {
    this.emit('message', {
      data: JSON.stringify({
        id,
        jsonrpc: '2.0',
        result,
      }),
    })
  }

  emitSubscription(subscription: string, result: unknown) {
    this.emit('message', {
      data: JSON.stringify({
        jsonrpc: '2.0',
        method: 'tos_subscription',
        params: {
          subscription,
          result,
        },
      }),
    })
  }

  private emit(type: string, event: unknown) {
    for (const listener of this.listeners.get(type) ?? []) listener(event)
  }
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

function flushAsync() {
  return new Promise((resolve) => setTimeout(resolve, 0))
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
      case 'tos_getSponsorNonce':
        return toHex(9n)
      case 'tos_getSigner':
        return {
          address: nativeAccounts[0]!.address,
          signer: {
            type: 'secp256k1',
            value: nativeAccounts[0]!.address,
            defaulted: true,
          },
          blockNumber: toHex(99n),
        }
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
  await expect(
    client.getSponsorNonce({ address: nativeAccounts[0]!.address }),
  ).resolves.toBe(9n)
  await expect(
    client.getSigner({ address: nativeAccounts[0]!.address }),
  ).resolves.toEqual({
    address: nativeAccounts[0]!.address,
    signer: {
      type: 'secp256k1',
      value: nativeAccounts[0]!.address,
      defaulted: true,
    },
    blockNumber: toHex(99n),
  })
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
  expect(calls[3]!.request).toMatchObject({
    method: 'tos_getSponsorNonce',
    params: [nativeAccounts[0]!.address, 'latest'],
  })
  expect(calls[4]!.request).toMatchObject({
    method: 'tos_getSigner',
    params: [nativeAccounts[0]!.address, 'latest'],
  })
  expect(calls[5]!.request).toMatchObject({
    method: 'tos_blockNumber',
    params: [],
  })
  expect(calls[6]!.request).toMatchObject({
    method: 'tos_getBlockByNumber',
    params: [toHex(99n), true],
  })
  expect(calls[7]!.request).toMatchObject({
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
  expect(calls[8]!.request).toMatchObject({
    method: 'tos_getCode',
    params: [nativeAccounts[1]!.address, 'latest'],
  })
  expect(calls[9]!.request).toMatchObject({
    method: 'tos_getStorageAt',
    params: [nativeAccounts[1]!.address, '0x01', 'latest'],
  })
  expect(calls[11]!.request).toMatchObject({
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
  expect(calls[12]!.request).toMatchObject({
    method: 'tos_estimateGas',
    params: [
      {
        from: nativeAccounts[0]!.address,
        to: nativeAccounts[1]!.address,
      },
    ],
  })
  expect(calls[14]!.request).toMatchObject({
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

test('wallet client uses the local account signerType when none is passed explicitly', async () => {
  const baseAccount = privateKeyToAccount(accounts[0]!.privateKey)
  const customAccount = {
    ...baseAccount,
    signerType: 'ed25519',
    signAuthorization: vi.fn(baseAccount.signAuthorization),
  }

  const client = createWalletClient({
    account: customAccount,
    chain: tosTestnet,
    transport: http(tosTestnet.rpcUrls.default.http[0], {
      fetchFn: vi.fn(async (_input, init) => {
        const request = JSON.parse(String(init?.body)) as RpcRequestPayload
        switch (request.method) {
          case 'tos_chainId':
            return new Response(
              JSON.stringify({
                id: request.id,
                jsonrpc: '2.0',
                result: toHex(tosTestnet.id),
              }),
              { headers: { 'content-type': 'application/json' }, status: 200 },
            )
          case 'tos_getTransactionCount':
            return new Response(
              JSON.stringify({
                id: request.id,
                jsonrpc: '2.0',
                result: toHex(1n),
              }),
              { headers: { 'content-type': 'application/json' }, status: 200 },
            )
          default:
            throw new Error(`Unexpected method: ${request.method}`)
        }
      }),
    }),
  })

  await client.signAuthorization({
    to: nativeAccounts[1]!.address,
    value: 1n,
  })

  expect(customAccount.signAuthorization).toHaveBeenCalledTimes(1)
  expect(customAccount.signAuthorization.mock.calls[0]![0]).toMatchObject({
    from: customAccount.address,
    nonce: 1n,
    signerType: 'ed25519',
    to: nativeAccounts[1]!.address,
    value: 1n,
  })
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

test('wallet client bootstraps signer metadata through ACCOUNT_SET_SIGNER', async () => {
  const account = privateKeyToAccount(accounts[0]!.privateKey)
  const expectedSerialized = await account.signTransaction({
    chainId: BigInt(tosTestnet.id),
    data: encodeSystemActionData({
      action: 'ACCOUNT_SET_SIGNER',
      payload: {
        signerType: 'ed25519',
        signerValue:
          '0x1111111111111111111111111111111111111111111111111111111111111111',
      },
    }),
    from: account.address,
    gas: 120_000n,
    nonce: 4n,
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
        return toHex(4n)
      case 'tos_sendRawTransaction':
        return '0xbead'
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
    client.setSignerMetadata({
      signerType: 'ed25519',
      signerValue:
        '0x1111111111111111111111111111111111111111111111111111111111111111',
    }),
  ).resolves.toBe('0xbead')

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

test('webSocket transport supports RPC requests and subscriptions', async () => {
  let socket!: FakeWebSocket
  const client = createPublicClient({
    chain: tosTestnet,
    transport: webSocket(undefined, {
      webSocketFactory: (url) => {
        socket = new FakeWebSocket(url)
        queueMicrotask(() => socket.open())
        return socket
      },
    }),
  })

  const blockPromise = client.getBlockByHash({ hash: '0xbeef' })
  await flushAsync()
  expect(socket.url).toBe(
    `wss://${tosTestnet.rpcUrls.default.http[0]!.slice('https://'.length)}`,
  )
  expect(socket.sent[0]).toMatchObject({
    method: 'tos_getBlockByHash',
    params: ['0xbeef', false],
  })
  socket.emitResult(socket.sent[0]!.id, {
    hash: '0xbeef',
    number: toHex(7n),
    transactions: [],
  })
  await expect(blockPromise).resolves.toMatchObject({ hash: '0xbeef' })

  const seenBlocks: RpcBlock[] = []
  const blockSubPromise = client.watchBlocks({
    onBlock: (block) => seenBlocks.push(block),
  })
  await flushAsync()
  expect(socket.sent[1]).toMatchObject({
    method: 'tos_subscribe',
    params: ['newHeads'],
  })
  socket.emitResult(socket.sent[1]!.id, '0xsub-blocks')
  const blockSub = await blockSubPromise
  socket.emitSubscription('0xsub-blocks', {
    number: toHex(8n),
    hash: '0xcafe',
    transactions: [],
  })
  expect(seenBlocks).toEqual([{ hash: '0xcafe', number: '0x8', transactions: [] }])

  const seenLogs: RpcLog[] = []
  const logSubPromise = client.watchLogs({
    filter: {
      address: nativeAccounts[1]!.address,
      topics: ['0x1111'],
    },
    onLog: (log) => seenLogs.push(log),
  })
  await flushAsync()
  expect(socket.sent[2]).toMatchObject({
    method: 'tos_subscribe',
    params: [
      'logs',
      {
        address: nativeAccounts[1]!.address,
        fromBlock: '0x0',
        toBlock: 'latest',
        topics: ['0x1111'],
      },
    ],
  })
  socket.emitResult(socket.sent[2]!.id, '0xsub-logs')
  const logSub = await logSubPromise
  socket.emitSubscription('0xsub-logs', {
    address: nativeAccounts[1]!.address,
    data: '0xdeadbeef',
    topics: ['0x1111'],
  })
  expect(seenLogs).toEqual([
    {
      address: nativeAccounts[1]!.address,
      data: '0xdeadbeef',
      topics: ['0x1111'],
    },
  ])

  const unsubscribeBlockPromise = blockSub.unsubscribe()
  await flushAsync()
  expect(socket.sent[3]).toMatchObject({
    method: 'tos_unsubscribe',
    params: ['0xsub-blocks'],
  })
  socket.emitResult(socket.sent[3]!.id, true)
  await unsubscribeBlockPromise

  const unsubscribeLogPromise = logSub.unsubscribe()
  await flushAsync()
  expect(socket.sent[4]).toMatchObject({
    method: 'tos_unsubscribe',
    params: ['0xsub-logs'],
  })
  socket.emitResult(socket.sent[4]!.id, true)
  await unsubscribeLogPromise
})
