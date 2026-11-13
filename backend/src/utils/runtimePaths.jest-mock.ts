import path from 'path';

/** Jest stub: avoids import.meta in CommonJS-transformed tests. */
export function agentRuntimeSeccompPath(): string {
  return path.join(process.cwd(), 'agent-runtime/security/seccomp-profile.json');
}
