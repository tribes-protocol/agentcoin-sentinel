import { KNOWLEDGE_DIR } from '@/common/constants'
import { Knowledge } from '@/common/types'
import crypto from 'crypto'
import fs from 'fs/promises'
import path from 'path'

export class KnowledgeService {
  constructor() {}

  private async writeJsonFile(metadata: Knowledge): Promise<void> {
    await fs.mkdir(KNOWLEDGE_DIR, { recursive: true })

    const hash = crypto.createHash('md5').update(metadata.url).digest('hex')
    const filePath = path.join(KNOWLEDGE_DIR, `${hash}.json`)
    const tempFilePath = filePath + '.tmp' // Temporary file for atomic write

    try {
      await fs.writeFile(tempFilePath, JSON.stringify(metadata, null, 2))
      await fs.rename(tempFilePath, filePath) // Atomic operation
    } catch (error) {
      console.error(`Error writing JSON file for ${metadata.filename}:`, error)
      throw error
    }
  }

  async handleSetKnowledge(url: string, filename: string): Promise<void> {
    const metadata: Knowledge = {
      url,
      filename,
      action: 'create',
      updatedAt: new Date()
    }

    await this.writeJsonFile(metadata)
  }

  async handleDeleteKnowledge(url: string, filename: string): Promise<void> {
    const metadata: Knowledge = {
      url,
      filename,
      action: 'delete',
      updatedAt: new Date()
    }

    await this.writeJsonFile(metadata)
  }
}
