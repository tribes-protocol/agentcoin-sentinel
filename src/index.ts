import { AGENT_ADMIN_PUBLIC_KEY } from '@/common/env'
import { AgentService } from '@/services/agent'
import { GitWatcherService } from '@/services/gitwatcher'
import { KeychainService } from '@/services/keychain'
import { KnowledgeService } from '@/services/knowledge'
import { KNOWLEDGE_DIR } from '@/common/constants'

export const main = async (): Promise<void> => {
  console.log('Home directory:', process.env.HOME)
  // initialize services
  const keychainService = new KeychainService()
  const gitWatcherService = new GitWatcherService()
  const knowledgeService = new KnowledgeService()

  const agentService = new AgentService(gitWatcherService, keychainService, knowledgeService)

  // handle SIGINT
  process.on('SIGINT', async () => {
    console.log('\nReceived SIGINT. Stopping git watcher...')
    await gitWatcherService.stop()
    await agentService.stop()
    process.exit(0)
  })

  // start services
  await Promise.all([gitWatcherService.start(), agentService.start()])
}

main().catch((error) => {
  console.error(`failed to start sentinel. retrying...`, error)
  process.exit(1)
})
