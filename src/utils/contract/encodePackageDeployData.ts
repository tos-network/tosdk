import type { Hex } from '../../types/misc.js'
import type { PackageArgument } from '../../types/contract.js'
import { encodeAbiParameters } from '../abi/encodeAbiParameters.js'

export function encodePackageDeployData(parameters: {
  packageBinary: Hex
  constructorArgs?: readonly PackageArgument[] | undefined
}): Hex {
  const args = parameters.constructorArgs ?? []
  if (args.length === 0) return parameters.packageBinary
  const encodedArgs = encodeAbiParameters(
    args.map((arg) => ({ type: arg.type })),
    args.map((arg) => arg.value) as readonly unknown[],
  )
  return `0x${parameters.packageBinary.slice(2)}${encodedArgs.slice(2)}` as Hex
}
