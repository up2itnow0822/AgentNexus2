/**
 * Minimal typings for @elizaos/core under NodeNext resolution.
 * Upstream .d.ts files use extensionless relative paths that NodeNext cannot resolve.
 */
declare module '@elizaos/core' {
  export interface Character {
    name: string;
    bio?: string[];
    lore?: string[];
    knowledge?: string[];
    messageExamples?: unknown[];
    style?: Record<string, unknown>;
    topics?: string[];
    adjectives?: string[];
    clients?: string[];
    plugins?: unknown[];
    modelProvider?: string;
    settings?: Record<string, unknown>;
    [key: string]: unknown;
  }

  export class AgentRuntime {
    constructor(config: {
      character: Character;
      plugins?: unknown[];
      adapter?: unknown;
    });
  }
}
