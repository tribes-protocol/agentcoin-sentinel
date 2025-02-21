import { RUNTIME_SERVER_SOCKET_FILE } from '@/common/constants'
import axios from 'axios'
import { z } from 'zod'

const CommandKindSchema = z.union([
  z.literal('git'),
  z.literal('character_n_envvars')
])

type CommandKind = z.infer<typeof CommandKindSchema>

class RuntimeAPI {
  async sendCommand(kind: CommandKind): Promise<void> {
    const response = await axios({
      method: 'GET',
      socketPath: RUNTIME_SERVER_SOCKET_FILE,
      url: `http://localhost/command/new?kind=${kind}`
    })

    if (response.status !== 200) {
      throw new Error(`Command failed: ${response.data.error}`)
    }
  }
}

export const runtimeAPI = new RuntimeAPI()
