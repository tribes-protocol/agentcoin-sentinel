import { GitService } from '@/services/git'

export const main = async (): Promise<void> => {
  console.log('Home directory:', process.env.HOME)
  // initialize services
  const gitWatcherService = new GitService()

  // handle SIGINT & SIGTERM
  const shutdown = async (signal: string): Promise<void> => {
    console.log(`Received ${signal}. Stopping sentinel...`)
    await gitWatcherService.stop()
    process.exit(0)
  }

  process.on('SIGINT', async () => {
    void shutdown('SIGINT')
  })

  process.once('SIGTERM', () => {
    void shutdown('SIGTERM')
  })

  // start services
  await gitWatcherService.start()
}

main().catch((error) => {
  console.error(`failed to start sentinel. retrying...`, error)
  process.exit(1)
})
