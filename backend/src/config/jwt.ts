/**
 * JWT configuration — no default secret; fail closed when unset.
 */

export const JWT_ALGORITHM = 'HS256' as const;

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }
  return secret;
}

/** Throws at process startup when JWT_SECRET is missing. */
export function assertJwtConfiguredAtStartup(): void {
  getJwtSecret();
}

export function isJwtConfigured(): boolean {
  return Boolean(process.env.JWT_SECRET?.trim());
}
