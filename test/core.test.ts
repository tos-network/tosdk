import { expect, test } from 'vitest'

import { keccak256, parseUnits, toBytes, toHex } from 'tosdk'
import { tos, tosTestnet } from 'tosdk/chains'

test('toHex and toBytes encode basic values', () => {
  expect(toHex('hello')).toBe('0x68656c6c6f')
  expect(Array.from(toBytes('hello'))).toEqual([104, 101, 108, 108, 111])
  expect(toHex(true, { size: 1 })).toBe('0x01')
})

test('keccak256 hashes byte-compatible values', () => {
  expect(keccak256('0x68656c6c6f')).toBe(
    '0x1c8aff950685c2ed4bc3174f3472287b56d9517b9c948127319a09a7a36deac8',
  )
})

test('parseUnits expands decimal strings', () => {
  expect(parseUnits('420', 9)).toBe(420000000000n)
  expect(parseUnits('1.5', 18)).toBe(1500000000000000000n)
})

test('chains export native TOS definitions', () => {
  expect(tos.name).toBe('TOS Mainnet')
  expect(tos.testnet).toBe(false)
  expect(tosTestnet.name).toBe('TOS Testnet')
  expect(tosTestnet.testnet).toBe(true)
})
