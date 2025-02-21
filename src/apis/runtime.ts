import { RUNTIME_SERVER_SOCKET_FILE } from '@/common/constants'
import { z } from 'zod'

const CommandKindSchema = z.union([
  z.literal('git'),
  z.literal('character_n_envvars')
])

type CommandKind = z.infer<typeof CommandKindSchema>

class RuntimeAPI {
  async sendCommand(kind: CommandKind): Promise<void> {
    const url = `http://unix:${encodeURIComponent(RUNTIME_SERVER_SOCKET_FILE)}:/command/new?kind=${kind}`
    const response = await fetch(url, {
      method: 'GET'
    })

    if (!response.ok) {
      throw new Error(`Failed to send command: ${response.statusText}`)
    }

    const result = await response.json()
    if (!result.success) {
      throw new Error(`Command failed: ${result.error}`)
    }
  }
}

export const runtimeAPI = new RuntimeAPI()
