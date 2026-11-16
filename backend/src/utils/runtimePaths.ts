import path from 'path';
import { fileURLToPath } from 'url';

/** Seccomp profile path resolved from this module's location (dist/utils at runtime). */
export function agentRuntimeSeccompPath(): string {
  return path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    '../../agent-runtime/security/seccomp-profile.json',
  );
}
