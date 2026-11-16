/**
 * Scrub sensitive values from error/log payloads before printing.
 */

const SENSITIVE_PATTERN =
  /(https?:\/\/[^\s]+|0x[a-fA-F0-9]{64}|api[_-]?key|secret|password|private[_-]?key|bearer\s+)/i;

export function sanitizeLogMessage(input: string): string {
  if (SENSITIVE_PATTERN.test(input)) {
    return '[redacted]';
  }
  return input.slice(0, 500);
}

export function logSafeError(scope: string, error: unknown): void {
  const message =
    error instanceof Error ? sanitizeLogMessage(error.message) : 'unknown error';
  console.error(`[${scope}] ${message}`);
}
