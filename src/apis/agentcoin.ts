import { AGENTCOIN_FUN_API_URL } from '@/common/env'
import { z } from 'zod'

const AuthMessageResponseSchema = z.object({
  message: z.string()
})

class AgentcoinAPI {
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
