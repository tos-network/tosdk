import { describe, expect, test } from 'vitest'

import { getAddress } from './getAddress.js'

test('normalizes address', () => {
  expect(
    getAddress(
      '0xC1FFD3CFEE2D9E5CD67643F8F39FD6E51AAD88F6F4CE6AB8827279CFFFB92266',
    ),
  ).toMatchInlineSnapshot('"0xc1ffd3cfee2d9e5cd67643f8f39fd6e51aad88f6f4ce6ab8827279cfffb92266"')
  expect(
    getAddress(
      '0x482845ef5f7df661eb71148970997970c51812dc3a010c7d01b50e0d17dc79c8',
    ),
  ).toMatchInlineSnapshot('"0x482845ef5f7df661eb71148970997970c51812dc3a010c7d01b50e0d17dc79c8"')
})

describe('errors', () => {
  test('invalid address', () => {
    expect(() =>
      getAddress('0xa5cc3c03994db5b0d9a5eEdD10Cabab0813678az'),
    ).toThrowErrorMatchingInlineSnapshot(`
      [InvalidAddressError: Address "0xa5cc3c03994db5b0d9a5eEdD10Cabab0813678az" is invalid.

      - Address must be a hex value of 32 bytes (64 hex characters).
      - Address must start with 0x and contain only hexadecimal characters.

      Version: viem@x.y.z]
    `)
    expect(() =>
      getAddress(
        '0xc1ffd3cfee2d9e5cd67643f8f39fd6e51aad88f6f4ce6ab8827279cfffb922',
      ),
    ).toThrowErrorMatchingInlineSnapshot(`
      [InvalidAddressError: Address "0xc1ffd3cfee2d9e5cd67643f8f39fd6e51aad88f6f4ce6ab8827279cfffb922" is invalid.

      - Address must be a hex value of 32 bytes (64 hex characters).
      - Address must start with 0x and contain only hexadecimal characters.

      Version: viem@x.y.z]
    `)
    expect(() =>
      getAddress(
        'c1ffd3cfee2d9e5cd67643f8f39fd6e51aad88f6f4ce6ab8827279cfffb92266',
      ),
    ).toThrowErrorMatchingInlineSnapshot(`
      [InvalidAddressError: Address "c1ffd3cfee2d9e5cd67643f8f39fd6e51aad88f6f4ce6ab8827279cfffb92266" is invalid.

      - Address must be a hex value of 32 bytes (64 hex characters).
      - Address must start with 0x and contain only hexadecimal characters.

      Version: viem@x.y.z]
    `)
  })
})
