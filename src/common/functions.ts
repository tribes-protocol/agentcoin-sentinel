import { ec } from '@/common/ec'
import { GitState } from '@/common/types'
import { createHash, UUID } from 'crypto'

export function isEqualGitState(state1: GitState, state2: GitState): boolean {
  return (
    state1.repositoryUrl === state2.repositoryUrl &&
    state1.branch === state2.branch &&
    state1.commit === state2.commit
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isNull(obj: any): obj is null | undefined {
  return obj === null || obj === undefined
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ensureString(value: any, message: string | undefined = undefined): string {
  if (!value) {
    throw new Error(message || 'Value is undefined')
  }
  return value
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isRequiredString(arg: any): arg is string {
  return typeof arg === 'string'
}

export function isValidSignature(message: string, publicKey: string, signature: string): boolean {
  try {
    const keyPair = ec.keyFromPublic(publicKey, 'hex')

    const msgHash = createHash('sha256').update(message).digest()

    return keyPair.verify(msgHash, signature)
  } catch (error) {
    console.error('Signature verification error:', error)
    return false
  }
}

/**
 * Trims a string and returns null if the result is empty
 * @param str The string to trim
 * @returns The trimmed string or null if empty
 */
export function trimToNull(str: string | null | undefined): string | null {
  if (isNull(str)) {
    return null
  }

  const trimmed = str.trim()
  return trimmed.length > 0 ? trimmed : null
}

const UUID_PATTERN = /^[0-9a-f]+-[0-9a-f]+-[0-9a-f]+-[0-9a-f]+-[0-9a-f]+$/i

export function ensureUUID(input: string): UUID {
  if (!UUID_PATTERN.test(input)) {
    throw new Error(`Invalid UUID format: ${input}`)
  }

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return input as UUID
}
