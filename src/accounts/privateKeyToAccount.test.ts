import { expect, test } from 'vitest'
import { wagmiContractConfig } from '~test/abis.js'
import { accounts } from '~test/constants.js'
import { nativeAccounts, nativeTypedData } from '~test/nativeFixtures.js'
import { privateKeyToAccount } from './privateKeyToAccount.js'

test('default', () => {
  expect(privateKeyToAccount(accounts[0].privateKey)).toMatchInlineSnapshot(`
    {
      "address": "0xc1ffd3cfee2d9e5cd67643f8f39fd6e51aad88f6f4ce6ab8827279cfffb92266",
      "nonceManager": undefined,
      "publicKey": "0x048318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed753547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5",
      "sign": [Function],
      "signAuthorization": [Function],
      "signMessage": [Function],
      "signTransaction": [Function],
      "signTypedData": [Function],
      "source": "privateKey",
      "type": "local",
    }
  `)
})

test('sign', async () => {
  const account = privateKeyToAccount(accounts[0].privateKey)
  expect(
    await account.sign({
      hash: '0xd9eba16ed0ecae432b71fe008c98cc872bb4cc214d3220a36f365326cf807d68',
    }),
  ).toMatchInlineSnapshot(
    `"0xa461f509887bd19e312c0c58467ce8ff8e300d3c1a90b608a760c5b80318eaf15fe57c96f9175d6cd4daad4663763baa7e78836e067d0163e9a2ccf2ff753f5b1b"`,
  )
})

test('sign authorization', async () => {
  const account = privateKeyToAccount(accounts[0].privateKey)
  const signedAuthorization = await account.signAuthorization({
    contractAddress: wagmiContractConfig.address,
    chainId: 1,
    nonce: 0,
  })
  expect(signedAuthorization).toMatchInlineSnapshot(
    `
    {
      "address": "0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2",
      "chainId": 1,
      "nonce": 0,
      "r": "0xff5d79daa56d5aae2657e8950af71377f8c2860255a9c915948c071ef9286def",
      "s": "0x17318a10ff56f0000a350a210fdb312ba22260a64f38dddc135912a6c4795c1d",
      "v": 27n,
      "yParity": 0,
    }
  `,
  )
})

test('sign message', async () => {
  const account = privateKeyToAccount(accounts[0].privateKey)
  expect(
    await account.signMessage({ message: 'hello world' }),
  ).toMatchInlineSnapshot(
    '"0xa461f509887bd19e312c0c58467ce8ff8e300d3c1a90b608a760c5b80318eaf15fe57c96f9175d6cd4daad4663763baa7e78836e067d0163e9a2ccf2ff753f5b1b"',
  )
})

test('sign transaction', async () => {
  const account = privateKeyToAccount(accounts[0].privateKey)
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
  const account = privateKeyToAccount(accounts[0].privateKey)
  expect(
    await account.signTypedData({
      ...nativeTypedData.basic,
      primaryType: 'Mail',
    }),
  ).toMatchInlineSnapshot(
    `"0x35c65cdb26d85929ba5aa38c680dd1c038d7351a7ad6a3aee8f1a68606bbcffc3c49937ea645d94705afa42f5000f32cc6b76b6ddeee1762bc0230ce5c2927591b"`,
  )
})
