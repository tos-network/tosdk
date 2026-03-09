import type { AbiParameter } from 'abitype'

import type { Address } from './address.js'
import type { BlockTag } from './client.js'
import type { Hex } from './misc.js'

export type PackageArgument = {
  type: AbiParameter['type']
  value: unknown
}

export type CallPackageParameters = {
  address: Address
  packageName: string
  functionSignature: string
  args?: readonly PackageArgument[] | undefined
  blockTag?: BlockTag | undefined
}

export type SendPackageTransactionParameters = {
  to: Address
  packageName: string
  functionSignature: string
  args?: readonly PackageArgument[] | undefined
  chainId?: number | bigint | undefined
  nonce?: number | bigint | undefined
  gas?: number | bigint | undefined
  value?: number | bigint | undefined
  from?: Address | undefined
  signerType?: string | undefined
}

export type DeployPackageParameters = {
  packageBinary: Hex
  constructorArgs?: readonly PackageArgument[] | undefined
  chainId?: number | bigint | undefined
  nonce?: number | bigint | undefined
  gas?: number | bigint | undefined
  value?: number | bigint | undefined
  from?: Address | undefined
  signerType?: string | undefined
}
