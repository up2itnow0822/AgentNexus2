import { PrismaClient } from '@prisma/client';

/** Jest stub to avoid loading @elizaos/* ESM graph in unit tests. */
export class ElizaAgentService {
  constructor(_prisma: PrismaClient) {}

  async startAgent(_agentId: string): Promise<boolean> {
    return true;
  }

  async stopAgent(_agentId: string): Promise<boolean> {
    return true;
  }

  getAgentStatus(_agentId: string): 'running' | 'stopped' {
    return 'stopped';
  }
}
