import type {
  AbiConstructor,
  AbiError,
  AbiEvent,
  AbiFallback,
  AbiFunction,
  AbiParameter,
  AbiReceive,
} from 'abitype'

import {
  InvalidDefinitionTypeError,
  type InvalidDefinitionTypeErrorType,
} from '../../errors/abi.js'
import type { ErrorType } from '../../errors/utils.js'
type AbiItem =
  | AbiFunction
  | AbiEvent
  | AbiError
  | AbiConstructor
  | AbiFallback
  | AbiReceive

export type FormatAbiItemErrorType =
  | FormatAbiParamsErrorType
  | InvalidDefinitionTypeErrorType
  | ErrorType

export function formatAbiItem(
  abiItem: AbiItem,
  { includeName = false }: { includeName?: boolean | undefined } = {},
) {
  switch (abiItem.type) {
    case 'constructor':
      return `constructor(${formatAbiParams(abiItem.inputs, { includeName })})`
    case 'fallback':
    case 'receive':
      return abiItem.type
    case 'function':
    case 'event':
    case 'error':
      return `${abiItem.name}(${formatAbiParams(abiItem.inputs, { includeName })})`
  }
  throw new InvalidDefinitionTypeError((abiItem as { type: string }).type)
}

export type FormatAbiParamsErrorType = ErrorType

export function formatAbiParams(
  params: readonly AbiParameter[] | undefined,
  { includeName = false }: { includeName?: boolean | undefined } = {},
): string {
  if (!params) return ''
  return params
    .map((param) => formatAbiParam(param, { includeName }))
    .join(includeName ? ', ' : ',')
}

export type FormatAbiParamErrorType = ErrorType

function formatAbiParam(
  param: AbiParameter,
  { includeName }: { includeName: boolean },
): string {
  if (param.type.startsWith('tuple')) {
    return `(${formatAbiParams(
      (param as unknown as { components: AbiParameter[] }).components,
      { includeName },
    )})${param.type.slice('tuple'.length)}`
  }
  return param.type + (includeName && param.name ? ` ${param.name}` : '')
}
