import { expect, test } from 'vitest'

import { accounts } from '~test/constants.js'
import { privateKeyToAddress } from './privateKeyToAddress.js'

test('default', () => {
  expect(privateKeyToAddress(accounts[0].privateKey)).toEqual(
    '0xc1ffd3cfee2d9e5cd67643f8f39fd6e51aad88f6f4ce6ab8827279cfffb92266',
  )
})
