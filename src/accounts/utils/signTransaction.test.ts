import { assertType, describe, expect, test } from 'vitest'
import { accounts } from '~test/constants.js'
import { nativeAccounts } from '~test/nativeFixtures.js'

import type {
  TransactionSerializableNative,
  TransactionSerializedNative,
} from '../../types/transaction.js'
import { signTransaction } from './signTransaction.js'

describe('native', () => {
  const baseNative = {
    chainId: 1666,
    from: nativeAccounts[0]!.address,
    gas: 21000n,
    nonce: 785,
    signerType: 'secp256k1',
    to: nativeAccounts[1]!.address,
    type: 'native',
    value: 1_000_000_000_000_000_000n,
  } as const satisfies TransactionSerializableNative

  test('default', async () => {
    const signature = await signTransaction({
      transaction: baseNative,
      privateKey: accounts[0].privateKey,
    })
    expect(signature).toMatchInlineSnapshot(
      `"0x00f8a3820682820311825208a0482845ef5f7df661eb71148970997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a764000080c0a0c1ffd3cfee2d9e5cd67643f8f39fd6e51aad88f6f4ce6ab8827279cfffb9226689736563703235366b3101a0a702a08c7baa22393f555d00f159e57b7b34d7c13f941bd3f315538f6cbc4fe7a07a2850b0ef43821c1c2a6d3d7ee35e67eb5e227a867e0a34c636fd358c9c2a88"`,
    )
  })

  test('types', async () => {
    const signature = await signTransaction({
      transaction: baseNative,
      privateKey: accounts[0].privateKey,
    })
    assertType<TransactionSerializedNative>(signature)
  })
})
