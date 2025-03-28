import { runtimeAPI } from '@/apis/runtime'
import { BUILDS_DIR, CODE_DIR, ENV_FILE, GIT_STATE_FILE } from '@/common/constants'
import { isEqualGitState, isNull, trimToNull } from '@/common/functions'
import { GitState, GitStateSchema } from '@/common/types'
import { OperationQueue } from '@/lang/operation_queue'
import { spawn, SpawnOptions } from 'child_process'
import { createHash } from 'crypto'
import * as fs from 'fs'
import * as path from 'path'
import simpleGit from 'simple-git'

export class GitService {
  private deployerQueue = new OperationQueue(1)
  private isWatching: boolean = false
  private state: GitState

  constructor() {
    if (fs.existsSync(GIT_STATE_FILE)) {
      const fileContent = fs.readFileSync(GIT_STATE_FILE, 'utf-8')
      this.state = GitStateSchema.parse(JSON.parse(fileContent))
    } else {
      this.state = {
        repositoryUrl: 'https://github.com/tribes-protocol/agent.git',
        branch: 'main'
      }
    }
  }

  async start(): Promise<void> {
    if (this.isWatching) {
      return
    }

    this.isWatching = true
    console.log('Starting git watcher...')

    while (this.isWatching) {
      try {
        await this.checkAndUpdate()
      } catch (error) {
        console.error('Error in git watcher:', error)
      }

      await new Promise((resolve) => setTimeout(resolve, 15000))
    }
  }

  private async checkAndUpdate(): Promise<void> {
    const state = this.state
    if (state.commit) {
      // console.log('Ignoring updates due to manual rollback')
      return
    }

    let commit: string

    // initial agent launch
    if (!fs.existsSync(CODE_DIR)) {
      commit =
        trimToNull(state.commit) ?? (await getLatestCommitHash(state.repositoryUrl, state.branch))
    } else {
      // check if the agent is outdated
      const buildPath = fs.realpathSync(CODE_DIR)
      const git = simpleGit(buildPath)

      await git.fetch('origin', this.state.branch)

      const [localCommit, remoteCommit] = await Promise.all([
        git.revparse(['HEAD']),
        git.revparse(['origin/' + this.state.branch])
      ])

      if (localCommit === remoteCommit) {
        // console.log('up to date at local=', localCommit, 'vs remote=', remoteCommit)
        return
      }
      console.log(`outdated (current: ${localCommit}, latest: ${remoteCommit}), redeploying...`)
      commit = remoteCommit
    }

    await this.build(this.state.repositoryUrl, commit)
  }

  async setGitState(state: GitState): Promise<void> {
    if (isEqualGitState(this.state, state)) {
      return
    }

    const commit =
      trimToNull(state.commit) ?? (await getLatestCommitHash(state.repositoryUrl, state.branch))
    await this.build(state.repositoryUrl, commit)

    this.state = state

    await fs.promises.writeFile(GIT_STATE_FILE, JSON.stringify(this.state, null, 2))
  }

  private async build(repoUrl: string, commit: string): Promise<void> {
    // TODO: might have to clear any queued operations

    await this.deployerQueue.submit(async () => {
      const repoPath = await prepareBuildDirectory(repoUrl, commit)
      const symlinkExists = fs.existsSync(CODE_DIR)
      const oldRepoPath = symlinkExists ? fs.realpathSync(CODE_DIR) : undefined

      try {
        // Create symlink for .env file
        const buildEnvPath = path.join(repoPath, '.env')
        if (fs.existsSync(buildEnvPath)) {
          // Remove existing .env file in the build directory if it exists
          fs.unlinkSync(buildEnvPath)
        }
        // Create symlink from root .env to build directory .env
        fs.symlinkSync(ENV_FILE, buildEnvPath)
        console.log(`Created .env symlink from ${ENV_FILE} to ${buildEnvPath}`)

        console.log('Installing runtime dependencies...')
        await spawnAsync('bun', ['i'], { cwd: repoPath, stdio: 'inherit' })
        console.log('Installed runtime dependencies')

        console.log('Building runtime...')
        await spawnAsync('bun', ['run', 'build'], { cwd: repoPath, stdio: 'inherit' })
        console.log('Built runtime')

        // symlink the app
        if (symlinkExists) {
          console.log('Removing old symlink...')
          fs.unlinkSync(CODE_DIR)
          console.log('Removed old symlink')
        }
        console.log('Creating new symlink...')
        fs.symlinkSync(repoPath, CODE_DIR)
        console.log('Created new symlink')

        console.log('Sending git command...')
        await runtimeAPI.sendCommand('git').catch((error) => {
          console.error('Failed to send git command:', error)
        })
        console.log('Done deploying agent')
      } catch (error) {
        console.error('Build failed:', error)
        // Clean up failed build directory
        fs.rmSync(repoPath, { recursive: true, force: true })
        throw error
      }

      try {
        if (oldRepoPath) {
          fs.rmSync(oldRepoPath, { recursive: true, force: true })
        }
      } catch (error) {
        console.error('Failed to remove old repository:', error)
      }
    })
  }

  async stop(): Promise<void> {
    this.isWatching = false
  }
}

function repoBuildPathForState(repoUrl: string, commit: string): string {
  const repoHash = createHash('md5')
    .update(repoUrl + '/' + commit)
    .digest('hex')
  const repoPath = path.join(BUILDS_DIR, repoHash)

  if (!fs.existsSync(BUILDS_DIR)) {
    fs.mkdirSync(BUILDS_DIR, { recursive: true })
    console.log(`Created repositories path: ${BUILDS_DIR}`)
  }

  return repoPath
}

async function getLatestCommitHash(repoUrl: string, branch: string): Promise<string> {
  const git = simpleGit()

  try {
    const refs = await git.listRemote(['--heads', repoUrl, branch])
    const [latestCommit] = refs.split('\t')

    if (isNull(latestCommit)) {
      throw new Error(`Branch ${branch} not found in repository ${repoUrl}`)
    }

    return latestCommit
  } catch (error) {
    console.error('Failed to get latest commit:', error)
    throw error
  }
}

async function prepareBuildDirectory(repoUrl: string, commit: string): Promise<string> {
  const buildPath = repoBuildPathForState(repoUrl, commit)

  if (fs.existsSync(buildPath)) {
    console.log(`Removing existing repository at ${buildPath}`)
    fs.rmSync(buildPath, { recursive: true, force: true })
  }

  // Clone the specific commit to a build path
  console.log(`Cloning ${repoUrl} at commit ${commit}...`)
  const git = simpleGit()
  await git.clone(repoUrl, buildPath, ['--no-checkout'])
  await git.cwd(buildPath)
  await git.fetch('origin', commit)
  await git.checkout(commit)

  return buildPath
}

function spawnAsync(command: string, args: string[], options: SpawnOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, options)
    process.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        console.error(`Process [${command} ${args.join(' ')}] exited with code ${code}`)
        reject(new Error(`Process exited with code ${code}`))
      }
    })
    process.on('error', reject)
  })
}
