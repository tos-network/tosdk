import { expect, test } from 'vitest'

import { isAddress } from './isAddress.js'

test('checks if address is valid', () => {
  expect(
    isAddress(
      '0xc1ffd3cfee2d9e5cd67643f8f39fd6e51aad88f6f4ce6ab8827279cfffb92266',
    ),
  ).toBeTruthy()
  expect(isAddress('x')).toBeFalsy()
  expect(isAddress('0xa')).toBeFalsy()
  expect(
    isAddress(
      '0xc1ffd3cfee2d9e5cd67643f8f39fd6e51aad88f6f4ce6ab8827279cfffb9226z',
    ),
  ).toBeFalsy()
  expect(
    isAddress('0xc1ffd3cfee2d9e5cd67643f8f39fd6e51aad88f6f4ce6ab8827279cfffb922'),
  ).toBeFalsy()
  expect(
    isAddress('c1ffd3cfee2d9e5cd67643f8f39fd6e51aad88f6f4ce6ab8827279cfffb92266'),
  ).toBeFalsy()
})
