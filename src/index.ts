import { AgentService } from '@/services/agent'
import { GitService } from '@/services/git'
import { KeychainService } from '@/services/keychain'

export const main = async (): Promise<void> => {
  // initialize services
  const keychainService = new KeychainService()
  const gitWatcherService = new GitService()
  const agentService = new AgentService(gitWatcherService, keychainService)

  // handle SIGINT & SIGTERM
  const shutdown = async (signal: string): Promise<void> => {
    console.log(`Received ${signal}. Stopping sentinel...`)
    await Promise.all([gitWatcherService.stop(), agentService.stop()])
    process.exit(0)
  }

  process.on('SIGINT', async () => {
    void shutdown('SIGINT')
  })

  process.once('SIGTERM', () => {
    void shutdown('SIGTERM')
  })

  // start services
  await Promise.all([gitWatcherService.start(), agentService.start()])
}

main().catch((error) => {
  console.error(`failed to start sentinel. retrying...`, error)
  process.exit(1)
})
