import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'

export const AGENTCOIN_FUN_DIR =
  process.env.AGENTCOIN_FUN_DIR ?? path.join(os.homedir(), '.agentcoin-fun')

export const ENV_FILE = path.join(AGENTCOIN_FUN_DIR, '.env')

export const GIT_STATE_FILE = path.join(AGENTCOIN_FUN_DIR, 'agent-git.json')

export const CODE_DIR = path.join(AGENTCOIN_FUN_DIR, 'code')

export const BUILDS_DIR = path.join(AGENTCOIN_FUN_DIR, 'builds')

export const KNOWLEDGE_DIR = path.join(AGENTCOIN_FUN_DIR, 'knowledge')

export const RUNTIME_SERVER_SOCKET_FILE = path.join(AGENTCOIN_FUN_DIR, 'runtime-server.sock')

// make sure the `.agentcoin-fun` directory exists
if (!fs.existsSync(AGENTCOIN_FUN_DIR)) {
  fs.mkdirSync(AGENTCOIN_FUN_DIR, { recursive: true })
}
