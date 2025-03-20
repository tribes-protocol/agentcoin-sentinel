import { isRequiredString } from '@/common/functions'
import { isAddress } from 'viem'
import { z } from 'zod'
const AGENT_ID_REGEX =
  /^AGENT-[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/

export const AgentIdentitySchema =
  z.custom<`AGENT-${string}-${string}-${string}-${string}-${string}`>(
    (val): val is `AGENT-${string}-${string}-${string}-${string}-${string}` =>
      typeof val === 'string' && AGENT_ID_REGEX.test(val)
  )
export type AgentIdentity = z.infer<typeof AgentIdentitySchema>

export const RollbackDataSchema = z.object({
  rollbackedCommit: z.string()
})

export type RollbackData = z.infer<typeof RollbackDataSchema>

export const HexStringSchema = z.custom<`0x${string}`>(
  (val): val is `0x${string}` => typeof val === 'string' && /^0x[a-fA-F0-9]+$/.test(val)
)

export type HexString = z.infer<typeof HexStringSchema>

export const EthAddressSchema = z
  .custom<`0x${string}`>((val): val is `0x${string}` => typeof val === 'string' && isAddress(val))
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  .transform((arg) => arg.toLowerCase() as `0x${string}`)

export type EthAddress = z.infer<typeof EthAddressSchema>

export const SolAddressSchema = z.string().refine(
  (val) => {
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(val)
  },
  {
    message: 'Invalid Solana address format'
  }
)

export type SolAddress = z.infer<typeof SolAddressSchema>

export const WalletAddressSchema = z.union([EthAddressSchema, SolAddressSchema])

export type WalletAddress = z.infer<typeof WalletAddressSchema>

export const WalletSchema = z.object({
  id: z.number(),
  address: WalletAddressSchema,
  kind: z.enum(['evm', 'solana']),
  label: z.string(),
  subOrganizationId: z.string(),
  agentId: AgentIdentitySchema,
  createdAt: z.preprocess((arg) => (isRequiredString(arg) ? new Date(arg) : arg), z.date())
})

export type Wallet = z.infer<typeof WalletSchema>

export const KeyPairSchema = z.object({
  publicKey: z.string(),
  privateKey: z.string()
})

export type KeyPair = z.infer<typeof KeyPairSchema>

export const AgentRegistrationSchema = z.object({
  registrationToken: z.string()
})

export type AgentRegistration = z.infer<typeof AgentRegistrationSchema>

export const GitStateSchema = z.object({
  repositoryUrl: z.string(),
  branch: z.string(),
  commit: z.string().optional().nullable()
})

export type GitState = z.infer<typeof GitStateSchema>

export const AgentProvisionResponseSchema = z.object({
  success: z.boolean(),
  agentId: AgentIdentitySchema
})

export type AgentProvisionResponse = z.infer<typeof AgentProvisionResponseSchema>

export const BaseCharacterSchema = z.object({
  bio: z.array(z.string()),
  lore: z.array(z.string()),
  knowledge: z.array(z.string()),
  messageExamples: z.array(
    z.array(
      z.object({
        user: z.string(),
        content: z.object({
          text: z.string()
        })
      })
    )
  ),
  postExamples: z.array(z.string()),
  topics: z.array(z.string()),
  style: z.object({
    all: z.array(z.string()),
    chat: z.array(z.string()),
    post: z.array(z.string())
  }),
  adjectives: z.array(z.string())
})

export type BaseCharacter = z.infer<typeof BaseCharacterSchema>

export const CharacterSchema = BaseCharacterSchema.extend({
  id: z.string().optional().nullable(),
  name: z.string(),
  clients: z.array(z.string()),
  modelProvider: z.string(),
  settings: z.object({
    secrets: z.record(z.string()).optional().nullable(),
    voice: z
      .object({
        model: z.string()
      })
      .optional()
      .nullable()
  }),
  plugins: z.array(z.string())
})

export type Character = z.infer<typeof CharacterSchema>

export const SentinelSetGitCommandSchema = z.object({
  kind: z.literal('set_git'),
  state: GitStateSchema
})

export const SentinelSetCharAndEnvVarsCommandSchema = z.object({
  kind: z.literal('set_character_n_envvars'),
  character: CharacterSchema,
  envVars: z.record(z.string(), z.string())
})

export const SentinelAddKnowledgeCommandSchema = z.object({
  kind: z.literal('add_knowledge'),
  source: z.string(),
  filename: z.string()
})

export const SentinelDeleteKnowledgeCommandSchema = z.object({
  kind: z.literal('delete_knowledge'),
  source: z.string(),
  filename: z.string()
})

export const SentinelCommandSchema = z.discriminatedUnion('kind', [
  SentinelSetGitCommandSchema,
  SentinelAddKnowledgeCommandSchema,
  SentinelDeleteKnowledgeCommandSchema,
  SentinelSetCharAndEnvVarsCommandSchema
])

export type SentinelCommand = z.infer<typeof SentinelCommandSchema>

export const KnowledgeSchema = z.object({
  source: z.string(),
  filename: z.string(),
  action: z.enum(['create', 'delete']),
  updatedAt: z.preprocess((arg) => (isRequiredString(arg) ? new Date(arg) : arg), z.date())
})

export type Knowledge = z.infer<typeof KnowledgeSchema>

export const SignWithPubKeyRequest = z.object({
  message: z.string()
})

export const SignWithWalletRequest = z.object({
  walletAddress: WalletAddressSchema,
  subOrganizationId: z.string(),
  message: z.string()
})

export const TransactionSchema = z.object({
  to: EthAddressSchema,
  value: z
    .union([z.string(), z.bigint()])
    .transform((val) => (typeof val === 'string' ? BigInt(val) : val))
    .optional(),
  data: HexStringSchema.optional()
})

export type Transaction = z.infer<typeof TransactionSchema>

export const SignTxnWithWalletRequest = z.object({
  walletAddress: WalletAddressSchema,
  subOrganizationId: z.string(),
  transaction: TransactionSchema,
  chainId: z.number()
})

export const EncryptRequest = z.object({
  plaintext: z.string()
})

export const DecryptRequest = z.object({
  encrypted: z.string(),
  ephemPublicKey: z.string()
})
