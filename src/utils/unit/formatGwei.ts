import { gtomiUnits } from '../../constants/unit.js'

import { type FormatUnitsErrorType, formatUnits } from './formatUnits.js'

export type FormatGtomiErrorType = FormatUnitsErrorType
/** @deprecated Use `FormatGtomiErrorType` instead. */
export type FormatGweiErrorType = FormatGtomiErrorType

/** Formats a base-unit amount using gtomi decimals. */
export function formatGtomi(tomi: bigint, unit: 'tomi' = 'tomi') {
  return formatUnits(tomi, gtomiUnits[unit])
}

/** @deprecated Use `formatGtomi` instead. */
export const formatGwei = formatGtomi
