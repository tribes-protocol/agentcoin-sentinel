import { AGENTCOIN_FUN_API_URL } from '@/common/env'
import { AgentProvisionResponse, AgentProvisionResponseSchema } from '@/common/types'
import { z } from 'zod'

const AuthMessageResponseSchema = z.object({
  message: z.string()
})

class AgentcoinAPI {
  async provisionAgent(
    signupToken: string,
    signature: string,
    publicKey: string
  ): Promise<AgentProvisionResponse> {
    const response = await fetch(`${AGENTCOIN_FUN_API_URL}/api/agents/provision`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ signupToken, signature, publicKey })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error('Failed to provision agent coin')
    }

    return AgentProvisionResponseSchema.parse(data)
  }

  async generateAuthMessage(publicKey: string): Promise<string> {
    const response = await fetch(`${AGENTCOIN_FUN_API_URL}/api/agents/gen-auth-msg`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ publicKey })
    })

    if (!response.ok) {
      throw new Error('Failed to generate auth message')
    }

    const data = AuthMessageResponseSchema.parse(await response.json())
    return data.message
  }
}

export const agentcoinAPI = new AgentcoinAPI()
