import { BaseError } from './base.js'

export type InvalidAddressErrorType = InvalidAddressError & {
  name: 'InvalidAddressError'
}
export class InvalidAddressError extends BaseError {
  constructor({ address }: { address: string }) {
    super(`Address "${address}" is invalid.`, {
      metaMessages: [
        '- Address must be a hex value of 32 bytes (64 hex characters).',
        '- Address must start with 0x and contain only hexadecimal characters.',
      ],
      name: 'InvalidAddressError',
    })
  }
}
