import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'

export const AYAOS_DIR = process.env.AYAOS_DIR ?? path.join(os.homedir(), '.ayaos')

export const ENV_FILE = path.join(AYAOS_DIR, '.env')

export const GIT_STATE_FILE = path.join(AYAOS_DIR, 'ayaos-git.json')

export const KEYPAIR_FILE = path.join(AYAOS_DIR, 'ayaos-keypair.json')

export const CHARACTER_FILE = path.join(AYAOS_DIR, 'character.json')

export const CODE_DIR = path.join(AYAOS_DIR, 'code')

export const BUILDS_DIR = path.join(AYAOS_DIR, 'builds')

export const KNOWLEDGE_DIR = path.join(AYAOS_DIR, 'knowledge')

export const RUNTIME_SERVER_SOCKET_FILE = path.join(AYAOS_DIR, 'runtime-server.sock')

// make sure the `.ayaos` directory exists
if (!fs.existsSync(AYAOS_DIR)) {
  fs.mkdirSync(AYAOS_DIR, { recursive: true })
}
