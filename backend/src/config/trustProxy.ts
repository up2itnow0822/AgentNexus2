import type { Application } from 'express';

/**
 * Parsed hop count for Express `trust proxy`, or `false` when proxies must not be trusted.
 */
export function getTrustProxyHopCount(): number | false {
  const raw = process.env.TRUST_PROXY_HOPS;
  if (raw === undefined || raw.trim() === '') {
    return false;
  }
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 0) {
    return false;
  }
  return n;
}

export function applyTrustProxySetting(app: Application): void {
  // TODO(C3): Confirm production reverse-proxy hop count for the hosting platform before deploy.
  app.set('trust proxy', getTrustProxyHopCount());
}
