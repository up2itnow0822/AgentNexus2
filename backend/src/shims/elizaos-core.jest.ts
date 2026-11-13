/**
 * Runtime Jest stub for @elizaos/core (NodeNext + ESM resolution).
 */
export class AgentRuntime {
  constructor(_config: Record<string, unknown>) {}
}

export interface Character {
  name: string;
  bio?: string[];
  [key: string]: unknown;
}
