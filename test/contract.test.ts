import { expect, test } from 'vitest'

import {
  createPublicClient,
  createWalletClient,
  encodePackageCallData,
  encodePackageDeployData,
  http,
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
  handler: (request: RpcRequestPayload) => Promise<unknown> | unknown,
) {
  const calls: Array<{ url: string; request: RpcRequestPayload }> = []
  const fetchFn = async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = JSON.parse(String(init?.body)) as RpcRequestPayload
    calls.push({ request, url: String(input) })
    const result = await handler(request)
    return new Response(
      JSON.stringify({ id: request.id, jsonrpc: '2.0', result }),
      {
        headers: { 'content-type': 'application/json' },
        status: 200,
      },
    )
  }
  return { calls, fetchFn }
}

test('encodePackageCallData builds package dispatch tag + selector + args', () => {
  const calldata = encodePackageCallData({
    packageName: 'TaskMarket',
    functionSignature: 'openTask(bytes32,bytes32)',
    args: [
      {
        type: 'bytes32',
        value:
          '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      },
      {
        type: 'bytes32',
        value:
          '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      },
    ],
  })

  expect(calldata.startsWith('0x')).toBe(true)
  expect(calldata.length).toBeGreaterThan(8 + 8 + 64 * 2)
})

test('encodePackageDeployData appends constructor args to package binary', () => {
  const deployData = encodePackageDeployData({
    packageBinary: '0x6001600155',
    constructorArgs: [
      {
        type: 'bytes32',
        value:
          '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      },
    ],
  })

  expect(deployData.startsWith('0x6001600155')).toBe(true)
  expect(deployData.length).toBeGreaterThan('0x6001600155'.length)
})

test('public client calls package contracts with encoded calldata', async () => {
  const { calls, fetchFn } = createJsonRpcFetch((request) => {
    if (request.method === 'tos_call') return '0xdeadbeef'
    throw new Error(`Unexpected method: ${request.method}`)
  })

  const client = createPublicClient({
    chain: tosTestnet,
    transport: http(undefined, { fetchFn }),
  })

  await expect(
    client.callPackage({
      address: nativeAccounts[1]!.address,
      packageName: 'TaskMarket',
      functionSignature: 'getTask(bytes32)',
      args: [
        {
          type: 'bytes32',
          value:
            '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        },
      ],
    }),
  ).resolves.toBe('0xdeadbeef')

  expect(calls[0]!.request).toMatchObject({
    method: 'tos_call',
    params: [
      {
        to: nativeAccounts[1]!.address,
      },
      'latest',
    ],
  })
  expect(String((calls[0]!.request.params[0] as any).data).startsWith('0x')).toBe(true)
})

test('wallet client sends package transactions and deploys packages', async () => {
  const account = privateKeyToAccount(accounts[0]!.privateKey)
  const { calls, fetchFn } = createJsonRpcFetch((request) => {
    switch (request.method) {
      case 'tos_chainId':
        return toHex(tosTestnet.id)
      case 'tos_getTransactionCount':
        return toHex(1n)
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
    client.sendPackageTransaction({
      to: nativeAccounts[1]!.address,
      packageName: 'TaskMarket',
      functionSignature: 'openTask(bytes32)',
      args: [
        {
          type: 'bytes32',
          value:
            '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        },
      ],
      value: 0n,
    }),
  ).resolves.toBe('0xfeed')

  await expect(
    client.deployPackage({
      packageBinary: '0x6001600155',
      constructorArgs: [
        {
          type: 'bytes32',
          value:
            '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        },
      ],
      gas: 5_000_000n,
      value: 0n,
    }),
  ).resolves.toBe('0xfeed')

  expect(calls.filter((call) => call.request.method === 'tos_sendRawTransaction')).toHaveLength(2)
})
