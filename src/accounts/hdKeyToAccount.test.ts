import { HDKey } from '@scure/bip32'

import { describe, expect, test } from 'vitest'

import { accounts } from '~test/constants.js'
import { nativeAccounts, nativeTypedData } from '~test/nativeFixtures.js'
import { toBytes } from '../utils/encoding/toBytes.js'

import { hdKeyToAccount } from './hdKeyToAccount.js'
import { privateKeyToAddress } from './utils/privateKeyToAddress.js'

const hdKey = HDKey.fromMasterSeed(
  toBytes(
    '0x9dfc3c64c2f8bede1533b6a79f8570e5943e0b8fd1cf77107adf7b72cef42185d564a3aee24cab43f80e3c4538087d70fc824eabbad596a23c97b6ee8322ccc0',
  ),
)

test('default', () => {
  expect(hdKeyToAccount(hdKey)).toMatchInlineSnapshot(`
    {
      "address": "0xc1ffd3cfee2d9e5cd67643f8f39fd6e51aad88f6f4ce6ab8827279cfffb92266",
      "getHdKey": [Function],
      "nonceManager": undefined,
      "publicKey": "0x048318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed753547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5",
      "sign": [Function],
      "signAuthorization": [Function],
      "signMessage": [Function],
      "signTransaction": [Function],
      "signTypedData": [Function],
      "source": "hd",
      "type": "local",
    }
  `)
})

describe('args: addressIndex', () => {
  Array.from({ length: 10 }).forEach((_, index) => {
    test(`addressIndex: ${index}`, () => {
      const account = hdKeyToAccount(hdKey, {
        addressIndex: index,
      })
      expect(account.address).toEqual(privateKeyToAddress(accounts[index].privateKey))
    })
  })
})

describe('args: path', () => {
  Array.from({ length: 10 }).forEach((_, index) => {
    test(`path: m/44'/60'/0'/0/${index}`, () => {
      const account = hdKeyToAccount(hdKey, {
        path: `m/44'/60'/0'/0/${index}`,
      })
      expect(account.address).toEqual(privateKeyToAddress(accounts[index].privateKey))
    })
  })
})

test('args: accountIndex', () => {
  expect(
    hdKeyToAccount(hdKey, { accountIndex: 1 }).address,
  ).toMatchInlineSnapshot('"0xd85c168b89c97bac98fceda08c8d35429f74ec245f8ef2f4fd1e551cff97d650"')
  expect(
    hdKeyToAccount(hdKey, { accountIndex: 2 }).address,
  ).toMatchInlineSnapshot('"0x2316ffc2b5997775ced3bcb398e503f35d0a019cb0a251ad243a4ccfcf371f46"')
  expect(
    hdKeyToAccount(hdKey, { accountIndex: 3 }).address,
  ).toMatchInlineSnapshot('"0x9959dab20b14176ba97ad14fcb9fa1ea9b8a3bf422a8639f23df77ea66020ec2"')
})

test('args: changeIndex', () => {
  expect(
    hdKeyToAccount(hdKey, { changeIndex: 1 }).address,
  ).toMatchInlineSnapshot('"0xcf1917a7b3650705962056944b39f7b0624b9db86ad293686bc38b903142dbbc"')
  expect(
    hdKeyToAccount(hdKey, { changeIndex: 2 }).address,
  ).toMatchInlineSnapshot('"0x70caa3fb2adfafbd1c175cfbe0ff44fdb999d485dcfe6b0840f0d14eea8a08a0"')
  expect(
    hdKeyToAccount(hdKey, { changeIndex: 3 }).address,
  ).toMatchInlineSnapshot('"0xb8bddee52bfcd518329b334e4e0ebc370cadc5d152505ea4febcf839e7e2d3f8"')
})

test('sign message', async () => {
  const account = hdKeyToAccount(hdKey)
  expect(
    await account.signMessage({ message: 'hello world' }),
  ).toMatchInlineSnapshot(
    '"0xa461f509887bd19e312c0c58467ce8ff8e300d3c1a90b608a760c5b80318eaf15fe57c96f9175d6cd4daad4663763baa7e78836e067d0163e9a2ccf2ff753f5b1b"',
  )
})

test('sign transaction', async () => {
  const account = hdKeyToAccount(hdKey)
  expect(
    await account.signTransaction({
      chainId: 1666,
      from: account.address,
      gas: 21000n,
      signerType: 'secp256k1',
      to: nativeAccounts[1]!.address,
      type: 'native',
      value: 1_000_000_000_000_000_000n,
    }),
  ).toMatchInlineSnapshot(
    `"0x00f8a182068280825208a0482845ef5f7df661eb71148970997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a764000080c0a0c1ffd3cfee2d9e5cd67643f8f39fd6e51aad88f6f4ce6ab8827279cfffb9226689736563703235366b3101a00f7d56c78d0f419f2c4bc48efb2897006f6be93dba62bebb0fb21e05f329eaf7a07c4b6c17f310eedaac9bd75169f33f9421653c64b1396dbaf69c25db528c72ff"`,
  )
})

test('sign typed data', async () => {
  const account = hdKeyToAccount(hdKey)
  expect(
    await account.signTypedData({
      ...nativeTypedData.basic,
      primaryType: 'Mail',
    }),
  ).toMatchInlineSnapshot(
    `"0x35c65cdb26d85929ba5aa38c680dd1c038d7351a7ad6a3aee8f1a68606bbcffc3c49937ea645d94705afa42f5000f32cc6b76b6ddeee1762bc0230ce5c2927591b"`,
  )
})

test('return: getHdKey()', async () => {
  const account = hdKeyToAccount(hdKey)
  expect(account.getHdKey()).toMatchInlineSnapshot(`
    {
      "xpriv": "xprvA3KbAeguosodJeRqpV3NF1VYREub6vBASfBEXa1LgZeqPAhCFkHQMBjXYPa8RZvP5tnWMSg2zYcox5vbsfz1pB7J2zU9LEzWxg7rrRpoeSh",
      "xpub": "xpub6GJwaADoeFMvX8WJvWaNc9SGyGk5WNu1ot6qKxQxEuBpFy2LoHbetz41PgEcEg4n2bk3hWoHYJ69EqkjpoSv9KrinCnZV6y4Xo6VJZ6KHWT",
    }
  `)
})
