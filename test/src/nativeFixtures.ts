import { privateKeyToAddress } from '../../src/accounts/utils/privateKeyToAddress.js'
import { accounts } from './constants.js'

export const nativeAccounts = accounts.map((account) => ({
  ...account,
  address: privateKeyToAddress(account.privateKey),
})) as readonly {
  address: `0x${string}`
  balance: bigint
  privateKey: `0x${string}`
}[]

export const nativeTypedData = {
  basic: {
    domain: {
      name: 'Ether Mail',
      version: '1',
      chainId: 1,
      verifyingContract: nativeAccounts[2]!.address,
    },
    types: {
      Person: [
        { name: 'name', type: 'string' },
        { name: 'wallet', type: 'address' },
      ],
      Mail: [
        { name: 'from', type: 'Person' },
        { name: 'to', type: 'Person' },
        { name: 'contents', type: 'string' },
      ],
    },
    message: {
      from: {
        name: 'Cow',
        wallet: nativeAccounts[0]!.address,
      },
      to: {
        name: 'Bob',
        wallet: nativeAccounts[1]!.address,
      },
      contents: 'Hello, Bob!',
    },
  },
  complex: {
    domain: {
      name: 'Ether Mail 🥵',
      version: '1.1.1',
      chainId: 1,
      verifyingContract: nativeAccounts[2]!.address,
    },
    types: {
      Name: [
        { name: 'first', type: 'string' },
        { name: 'last', type: 'string' },
      ],
      Person: [
        { name: 'name', type: 'Name' },
        { name: 'wallet', type: 'address' },
        { name: 'favoriteColors', type: 'string[3]' },
        { name: 'foo', type: 'uint256' },
        { name: 'age', type: 'uint8' },
        { name: 'isCool', type: 'bool' },
      ],
      Mail: [
        { name: 'timestamp', type: 'uint256' },
        { name: 'from', type: 'Person' },
        { name: 'to', type: 'Person' },
        { name: 'contents', type: 'string' },
        { name: 'hash', type: 'bytes' },
      ],
    },
    message: {
      timestamp: 1234567890n,
      contents: 'Hello, Bob! 🖤',
      hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      from: {
        name: {
          first: 'Cow',
          last: 'Burns',
        },
        wallet: nativeAccounts[0]!.address,
        age: 69,
        foo: 123123123123123123n,
        favoriteColors: ['red', 'green', 'blue'],
        isCool: false,
      },
      to: {
        name: { first: 'Bob', last: 'Builder' },
        wallet: nativeAccounts[1]!.address,
        age: 70,
        foo: 123123123123123123n,
        favoriteColors: ['orange', 'yellow', 'green'],
        isCool: true,
      },
    },
  },
} as const

export const nativeSignerVectors = {
  hash:
    '0x0000000000000000000000000000000000000000000000000000000000001234',
  secp256r1: {
    privateKey:
      '0x0000000000000000000000000000000000000000000000000000000000000001',
    publicKey:
      '0x046b17d1f2e12c4247f8bce6e563a440f277037d812deb33a0f4a13945d898c2964fe342e2fe1a7f9b8ee7eb4a7c0f9e162bce33576b315ececbb6406837bf51f5',
    address:
      '0xa000ddb94882f9f9cd0a859ed3a9f047ad43d7e2e4e7e491f1fe2e657a2651b6',
    signature:
      '0x3ea5f60ce5c59e31398bab46d733d6b5cc5cc7a26a17db3df621225b00c4d6303c2b40892df16f3941a8e4007bf544b6517248b6328ef5973e740e12bf1735d300',
  },
  bls12381: {
    privateKey:
      '0x153f6d8b207e967e0e8561298dde431fc54d6756726a4101ac6b93cf2956f40c',
    publicKey:
      '0x8a88216445ee8c8e576fb7dd4669ade8c53d2a3f12b28136d407b81bdf8259d50ba9a4a72488985934cbb4be8e3bc377',
    address:
      '0xc7bba5c41be98655c90fa26766944dddda327b05f092373887f877ec1fb998c6',
    signature:
      '0xb7daed666f8c92135accf34df2307e69f2bd7de579f2892b8002ac5f20e47a5ece832e3f6614ddf7d601854c070b6b4009f8f17e71a7c35a95c06dcfaf20c1aa1f77247eeb12e36e1fec707b1b7621b38391d8d30fe46f9d2645a0a21f18ba4a',
  },
  elgamal: {
    privateKey:
      '0x0100000000000000000000000000000000000000000000000000000000000000',
    publicKey:
      '0x8c9240b456a9e6dc65c377a1048d745f94a08cdb7f44cbcd7b46f34048871134',
    address:
      '0x068bf56e036ac1261de680eda2611ee30fd0e2c3a89e211d4299f9f75e1d7a85',
    signature:
      '0x4f12a0f9d16f93735fd64c7e5ccbc47bd3d83bd7cfe842ecc54df786a599e0041b4557ec2aa7b7dcfba1938d5ffdd4d90f9915bff8cde47e1434701fc3a20201',
  },
} as const
