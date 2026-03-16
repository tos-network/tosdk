import type { Chain } from '../../types/chain.js'
import type { Assign, Prettify } from '../../types/utils.js'

export type DefineChainReturnType<chain extends Chain = Chain> = Prettify<
  chain &
    (chain['extendSchema'] extends Record<string, unknown>
      ? {
          extend: <const extended extends chain['extendSchema']>(
            extended: extended,
          ) => Assign<chain, extended>
        }
      : {})
>

export function defineChain<const chain extends Chain>(
  chain: chain,
): DefineChainReturnType<chain> {
  const chainInstance = { ...chain } as chain

  function extend(base: typeof chainInstance) {
    type ExtendFn = (base: typeof chainInstance) => unknown
    return (fnOrExtended: ExtendFn | Record<string, unknown>) => {
      const properties = (
        typeof fnOrExtended === 'function' ? fnOrExtended(base) : fnOrExtended
      ) as (typeof chainInstance)['extendSchema']
      const combined = { ...base, ...properties }
      return Object.assign(combined, { extend: extend(combined) })
    }
  }

  return Object.assign(chainInstance, {
    extend: extend(chainInstance),
  }) as never
}

export function extendSchema<schema extends Record<string, unknown>>(): schema {
  return {} as schema
}
