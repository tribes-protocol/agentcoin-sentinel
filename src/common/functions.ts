import { ec } from '@/common/ec'
import { GitState } from '@/common/types'
import { createHash } from 'crypto'

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
