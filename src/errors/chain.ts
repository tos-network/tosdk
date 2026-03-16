import { BaseError } from './base.js'

export type InvalidChainIdErrorType = InvalidChainIdError & {
  name: 'InvalidChainIdError'
}

export class InvalidChainIdError extends BaseError {
  constructor({ chainId }: { chainId?: number | undefined }) {
    super(
      typeof chainId === 'number'
        ? `Chain ID "${chainId}" is invalid.`
        : 'Chain ID is invalid.',
      { name: 'InvalidChainIdError' },
    )
  }
}
