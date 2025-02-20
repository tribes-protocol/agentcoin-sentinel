import { agentcoinClient } from '@/clients/agentcoin'
import { AGENT_PROVISION_FILE, CHARACTER_FILE, ENV_FILE } from '@/common/constants'
import { AGENTCOIN_FUN_API_URL } from '@/common/env'
import { isNull, isRequiredString, isValidSignature } from '@/common/functions'
import {
  AgentIdentity,
  AgentIdentitySchema,
  Character,
  SentinelCommand,
  SentinelCommandSchema
} from '@/common/types'
import { OperationQueue } from '@/lang/operation_queue'

import { GitWatcherService } from '@/services/gitwatcher'
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
  private readonly stateFile = AGENT_PROVISION_FILE
  private socket?: Socket
  private cachedIdentity: AgentIdentity | undefined

  constructor(
    private readonly gitWatcherService: GitWatcherService,
    private readonly keychainService: KeychainService,
    private readonly adminPubKey: string
  ) { }

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
        const message = await agentcoinClient.generateAuthMessage(publicKey)
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
      console.log('admin command received:', payload)
      try {
        const jsonObj = JSON.parse(payload)
        const { content, signature } = jsonObj
        if (!isRequiredString(content) || !isRequiredString(signature)) {
          throw new Error('Invalid payload')
        }

        if (!isValidSignature(content, this.adminPubKey, signature)) {
          throw new Error('Invalid signature')
        }

        const command = SentinelCommandSchema.parse(JSON.parse(content))
        await this.handleAdminCommand(command)
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

  private async handleAdminCommand(command: SentinelCommand): Promise<void> {
    await this.commandQueue.submit(async () => {
      console.log('admin command received:', command)
      switch (command.kind) {
        case 'set_git':
          await this.gitWatcherService.setGitState(command.state)
          break
        case 'set_character_n_envvars':
          await this.handleSetCharacterAndEnvvars(command.character, command.envVars)
          break
      }
    })
  }

  private async handleSetCharacterAndEnvvars(character: Character, envVars: Record<string, string>): Promise<void> {
    // write the character to the character file
    await fs.promises.writeFile(CHARACTER_FILE, JSON.stringify(character, null, 2))

    // write the env vars to the env file
    const envContent = Object.entries(envVars)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n')

    await fs.promises.writeFile(ENV_FILE, envContent)
  }


  async stop(): Promise<void> {
    if (isNull(this.socket)) {
      return
    }

    this.socket.disconnect()
  }
}
