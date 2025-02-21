import { agentcoinAPI } from '@/apis/agentcoin'
import { AGENT_PROVISION_FILE } from '@/common/constants'
import { AGENT_ADMIN_PUBLIC_KEY, AGENTCOIN_FUN_API_URL } from '@/common/env'
import { isNull, isRequiredString, isValidSignature } from '@/common/functions'
import { AgentIdentity, AgentIdentitySchema, SentinelSetGitCommandSchema } from '@/common/types'
import { OperationQueue } from '@/lang/operation_queue'

import { GitService } from '@/services/git'
import { KeychainService } from '@/services/keychain'
import * as fs from 'fs'
import { io, Socket } from 'socket.io-client'
import { z } from 'zod'

export const ProvisionStateSchema = z.object({
  agentId: AgentIdentitySchema
})

export type ProvisionState = z.infer<typeof ProvisionStateSchema>

export class AgentService {
  private commandQueue = new OperationQueue(1)
  private socket?: Socket
  private cachedIdentity: AgentIdentity | undefined
  private readonly gitService: GitService
  private readonly keychainService: KeychainService

  constructor(gitService: GitService, keychainService: KeychainService) {
    this.gitService = gitService
    this.keychainService = keychainService
  }

  async start(): Promise<void> {
    if (this.socket) {
      return
    }

    const publicKey = this.keychainService.publicKey
    const agentId = await this.getAgentId()

    this.socket = io(AGENTCOIN_FUN_API_URL, {
      reconnection: true,
      rejectUnauthorized: process.env.NODE_ENV === 'production',
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
      withCredentials: true,
      timeout: 20000,
      transports: ['websocket', 'polling'],
      autoConnect: true,
      auth: async (cb: (data: unknown) => void) => {
        console.log('re-authenticating ws with agentcoin')
        const message = await agentcoinAPI.generateAuthMessage(publicKey)
        const signature = await this.keychainService.sign(message)
        cb({
          message,
          agentId,
          signature
        })
      }
    })

    this.socket.on('connect', () => {
      console.log('Sentinel node just connected to Agentcoin API')
    })

    this.socket.on('disconnect', () => {
      console.log('Sentinel node just disconnected from Agentcoin API')
    })

    this.socket.on(`admin:${agentId}`, async (payload: string) => {
      try {
        const jsonObj = JSON.parse(payload)
        const { content, signature } = jsonObj
        if (!isRequiredString(content) || !isRequiredString(signature)) {
          throw new Error('Invalid payload')
        }

        if (!isValidSignature(content, AGENT_ADMIN_PUBLIC_KEY, signature)) {
          throw new Error('Invalid signature')
        }

        const command = SentinelSetGitCommandSchema.safeParse(JSON.parse(content))
        if (!command.success) {
          // ignore other commands
          return
        }

        console.log('admin command received:', command.data.kind)
        await this.gitService.setGitState(command.data.state)
        console.log('admin command handled:', command.data.kind)
      } catch (e) {
        console.error('Error handling admin command:', e, payload)
      }
    })

    this.socket.connect()
  }

  async getAgentId(): Promise<string> {
    while (!fs.existsSync(AGENT_PROVISION_FILE)) {
      console.log(`Waiting for agent provision file...${AGENT_PROVISION_FILE}`)
      await new Promise((resolve) => setTimeout(resolve, 10000))
    }

    if (isNull(this.cachedIdentity)) {
      const { agentId } = ProvisionStateSchema.parse(
        JSON.parse(fs.readFileSync(AGENT_PROVISION_FILE, 'utf-8'))
      )
      this.cachedIdentity = agentId
    }
    return this.cachedIdentity
  }

  async stop(): Promise<void> {
    if (isNull(this.socket)) {
      return
    }

    this.socket.disconnect()
  }
}
