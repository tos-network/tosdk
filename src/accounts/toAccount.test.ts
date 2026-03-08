import { describe, expect, test } from 'vitest'

import { accounts } from '~test/constants.js'

import { toAccount } from './toAccount.js'
import { privateKeyToAddress } from './utils/privateKeyToAddress.js'

const address = privateKeyToAddress(accounts[0].privateKey)

describe('toAccount', () => {
  test('json-rpc account', () => {
    expect(toAccount(address)).toMatchInlineSnapshot(`
      {
        "address": "0xc1ffd3cfee2d9e5cd67643f8f39fd6e51aad88f6f4ce6ab8827279cfffb92266",
        "type": "json-rpc",
      }
    `)
  })

  test('json-rpc account (invalid address)', () => {
    expect(() => toAccount('0x1')).toThrowErrorMatchingInlineSnapshot(`
      [InvalidAddressError: Address "0x1" is invalid.

      - Address must be a hex value of 32 bytes (64 hex characters).
      - Address must start with 0x and contain only hexadecimal characters.

      Version: viem@x.y.z]
    `)
  })

  test('local account', () => {
    expect(
      toAccount({
        address,
        async signMessage() {
          return '0x'
        },
        async signTransaction(_transaction) {
          return '0x'
        },
        async signTypedData() {
          return '0x'
        },
      }),
    ).toMatchInlineSnapshot(`
      {
        "address": "0xc1ffd3cfee2d9e5cd67643f8f39fd6e51aad88f6f4ce6ab8827279cfffb92266",
        "nonceManager": undefined,
        "sign": undefined,
        "signAuthorization": undefined,
        "signMessage": [Function],
        "signTransaction": [Function],
        "signTypedData": [Function],
        "source": "custom",
        "type": "local",
      }
    `)
  })

  test('local account (invalid address)', () => {
    expect(() =>
      toAccount({
        address: '0x1',
        async signMessage() {
          return '0x'
        },
        async signTransaction(_transaction) {
          return '0x'
        },
        async signTypedData() {
          return '0x'
        },
      }),
    ).toThrowErrorMatchingInlineSnapshot(`
      [InvalidAddressError: Address "0x1" is invalid.

      - Address must be a hex value of 32 bytes (64 hex characters).
      - Address must start with 0x and contain only hexadecimal characters.

      Version: viem@x.y.z]
    `)
  })
})
