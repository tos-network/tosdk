import { HDKey } from '@scure/bip32'
import { describe, expect, test } from 'vitest'

import { toBytes, verifyMessage } from 'tosdk'
import {
  generateMnemonic,
  generatePrivateKey,
  hdKeyToAccount,
  mnemonicToAccount,
  parseAccount,
  privateKeyToAccount,
  privateKeyToAddress,
  publicKeyToAddress,
  signMessage,
  signTransaction,
  signTypedData,
  toAccount,
} from 'tosdk/accounts'

import { accounts } from './src/constants.js'
import { nativeAccounts, nativeTypedData } from './src/nativeFixtures.js'

test('generatePrivateKey returns a 32-byte hex key', () => {
  expect(generatePrivateKey()).toMatch(/^0x[0-9a-f]{64}$/u)
})

test('generateMnemonic returns 12 words by default', () => {
  expect(generateMnemonic().split(' ')).toHaveLength(12)
})

test('privateKeyToAccount uses a 32-byte native address', () => {
  const account = privateKeyToAccount(accounts[0]!.privateKey)
  expect(account.address).toBe(
    '0xc1ffd3cfee2d9e5cd67643f8f39fd6e51aad88f6f4ce6ab8827279cfffb92266',
  )
  expect(account.publicKey).toMatch(/^0x04[0-9a-f]+$/u)
})

test('privateKeyToAddress and publicKeyToAddress agree', () => {
  const account = privateKeyToAccount(accounts[0]!.privateKey)
  expect(privateKeyToAddress(accounts[0]!.privateKey)).toBe(account.address)
  expect(publicKeyToAddress(account.publicKey)).toBe(account.address)
})

test('hd and mnemonic derivation follow the native path', () => {
  const seed = toBytes(
    '0x9dfc3c64c2f8bede1533b6a79f8570e5943e0b8fd1cf77107adf7b72cef42185d564a3aee24cab43f80e3c4538087d70fc824eabbad596a23c97b6ee8322ccc0',
  )
  const hdAccount = hdKeyToAccount(HDKey.fromMasterSeed(seed))
  const mnemonicAccount = mnemonicToAccount(
    'test test test test test test test test test test test junk',
  )
  expect(hdAccount.address).toBe(
    '0xc1ffd3cfee2d9e5cd67643f8f39fd6e51aad88f6f4ce6ab8827279cfffb92266',
  )
  expect(mnemonicAccount.address).toBe(hdAccount.address)
})

describe('account coercion', () => {
  test('toAccount converts a native address into a remote account', () => {
    expect(toAccount(nativeAccounts[0]!.address)).toEqual({
      address: nativeAccounts[0]!.address,
      type: 'remote',
    })
  })

  test('parseAccount preserves a local account', () => {
    const account = privateKeyToAccount(accounts[0]!.privateKey)
    expect(parseAccount(account)).toBe(account)
  })
})

describe('native signing', () => {
  const privateKey = accounts[0]!.privateKey

  test('signMessage and verifyMessage', async () => {
    const signature = await signMessage({
      message: 'hello world',
      privateKey,
    })
    expect(signature).toBe(
      '0xba661cbfe2863d3f577b8cb8a014e4b23f935c164942c2a82c084f5e90e520ff7bd70e2a8a9ffd7161332701ef3d0479113a2cc9a9d0f4be6788f086b734c88a1c',
    )
    await expect(
      verifyMessage({
        address: nativeAccounts[0]!.address,
        message: 'hello world',
        signature,
      }),
    ).resolves.toBe(true)
  })

  test('signTransaction serializes native transactions', async () => {
    await expect(
      signTransaction({
        privateKey,
        transaction: {
          chainId: 1666,
          from: nativeAccounts[0]!.address,
          gas: 21000n,
          signerType: 'secp256k1',
          to: nativeAccounts[1]!.address,
          type: 'native',
          value: 1_000_000_000_000_000_000n,
        },
      }),
    ).resolves.toBe(
      '0x00f8a182068280825208a0482845ef5f7df661eb71148970997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a764000080c0a0c1ffd3cfee2d9e5cd67643f8f39fd6e51aad88f6f4ce6ab8827279cfffb9226689736563703235366b311ca00f7d56c78d0f419f2c4bc48efb2897006f6be93dba62bebb0fb21e05f329eaf7a07c4b6c17f310eedaac9bd75169f33f9421653c64b1396dbaf69c25db528c72ff',
    )
  })

  test('signTypedData supports 32-byte addresses', async () => {
    await expect(
      signTypedData({
        ...nativeTypedData.basic,
        primaryType: 'Mail',
        privateKey,
      }),
    ).resolves.toBe(
      '0x35c65cdb26d85929ba5aa38c680dd1c038d7351a7ad6a3aee8f1a68606bbcffc3c49937ea645d94705afa42f5000f32cc6b76b6ddeee1762bc0230ce5c2927591b',
    )
  })
})
