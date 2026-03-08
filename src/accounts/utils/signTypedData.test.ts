import { expect, test } from 'vitest'

import { accounts } from '~test/constants.js'
import { nativeAccounts, nativeTypedData } from '~test/nativeFixtures.js'

import { signTypedData } from './signTypedData.js'

test('default', async () => {
  expect(
    await signTypedData({
      ...nativeTypedData.basic,
      primaryType: 'Mail',
      privateKey: accounts[0].privateKey,
    }),
  ).toMatchInlineSnapshot(
    `"0x35c65cdb26d85929ba5aa38c680dd1c038d7351a7ad6a3aee8f1a68606bbcffc3c49937ea645d94705afa42f5000f32cc6b76b6ddeee1762bc0230ce5c2927591b"`,
  )
})

test('minimal', async () => {
  expect(
    await signTypedData({
      types: {
        EIP712Domain: [],
      },
      primaryType: 'EIP712Domain',
      domain: {},
      privateKey: accounts[0].privateKey,
    }),
  ).toEqual(
    '0xda87197eb020923476a6d0149ca90bc1c894251cc30b38e0dd2cdd48567e12386d3ed40a509397410a4fd2d66e1300a39ac42f828f8a5a2cb948b35c22cf29e81c',
  )
})

test('complex', async () => {
  expect(
    await signTypedData({
      ...nativeTypedData.complex,
      primaryType: 'Mail',
      privateKey: accounts[0].privateKey,
    }),
  ).toEqual(
    '0xbb2e80e39e2442cd7d986eb9fb962f3fff206650085cded07227692f0fb904996172dbc8d5007e4eb2c1781886f91a0cedf839aae4dab6667739df188d7c682f1c',
  )
})

test('domain: empty', async () => {
  expect(
    await signTypedData({
      ...nativeTypedData.complex,
      domain: undefined,
      primaryType: 'Mail',
      privateKey: accounts[0].privateKey,
    }),
  ).toMatchInlineSnapshot(
    `"0x99dab0404b95294a37b55cdea1703eb70604550d29d2d568ed4146bd15dd7306488bb7271a492cb8ea8757f9078875030ea8ae5118ce31b80f80369f2922dcae1b"`,
  )

  expect(
    await signTypedData({
      ...nativeTypedData.complex,
      domain: {},
      primaryType: 'Mail',
      privateKey: accounts[0].privateKey,
    }),
  ).toMatchInlineSnapshot(
    `"0x99dab0404b95294a37b55cdea1703eb70604550d29d2d568ed4146bd15dd7306488bb7271a492cb8ea8757f9078875030ea8ae5118ce31b80f80369f2922dcae1b"`,
  )
})

test('domain: chainId', async () => {
  expect(
    await signTypedData({
      ...nativeTypedData.complex,
      domain: {
        chainId: 1,
      },
      primaryType: 'Mail',
      privateKey: accounts[0].privateKey,
    }),
  ).toMatchInlineSnapshot(
    `"0x8154b074c0d19ada2106f20ebb50e83bab1f196568f8d4852ba358684ac0fff233a2f271e09337d032de1be4291835569fc6653bebec26144e2f64ba69423d0a1b"`,
  )
})

test('domain: name', async () => {
  expect(
    await signTypedData({
      ...nativeTypedData.complex,
      domain: {
        name: 'Ether!',
      },
      primaryType: 'Mail',
      privateKey: accounts[0].privateKey,
    }),
  ).toMatchInlineSnapshot(
    `"0xa479d603402979de41672fa533a0e5a017fb97f44b0c5c96aaaf3fd4f52eb2492c22aa1d9b6002859d64f4c261a60dbf19d38c30cac88ac894207da3c2b5a5d41b"`,
  )
})

test('domain: verifyingContract', async () => {
  expect(
    await signTypedData({
      ...nativeTypedData.complex,
      domain: {
        verifyingContract: nativeAccounts[3]!.address,
      },
      primaryType: 'Mail',
      privateKey: accounts[0].privateKey,
    }),
  ).toMatchInlineSnapshot(
    `"0x0788381870bd65a038b5f24a5f05016c6ba77d3026b4739ce6d5805d96ca5dae07c662c11bd653fc971c8e8cc1870482f226f6f88f177fafca9dcca9bc0dab001b"`,
  )
})

test('domain: salt', async () => {
  expect(
    await signTypedData({
      ...nativeTypedData.complex,
      domain: {
        salt: '0x123512315aaaa1231313b1231b23b13b123aa12312211b1b1b111bbbb1affafa',
      },
      primaryType: 'Mail',
      privateKey: accounts[0].privateKey,
    }),
  ).toMatchInlineSnapshot(
    `"0x6b34d4bda17c3d263028e01a44af60656472273bf49834fd4c76c6eac84452954bbe862c6d033d5cddc4de218932b5f25c31ad6d26ef7adb10226c6536640a2b1b"`,
  )
})
