/**
 * In-memory idempotency ledger for CCTP relay submits keyed by attested message nonce.
 *
 * Residual risk (C7): this ledger is single-process only. Multiple relayer instances
 * require a shared store (Redis/DB) for strict cross-pod idempotency.
 */

export interface CctpNonceRelayResult {
  status: string;
  mintTx: string;
  creditTx: string;
}

type LedgerEntry =
  | { state: 'in_flight' }
  | { state: 'completed'; result: CctpNonceRelayResult };

const ledger = new Map<string, LedgerEntry>();

export function peekCctpNonceRelay(nonceKey: string): CctpNonceRelayResult | undefined {
  const entry = ledger.get(nonceKey);
  if (entry?.state === 'completed') {
    return entry.result;
  }
  return undefined;
}

export function isCctpNonceInFlight(nonceKey: string): boolean {
  return ledger.get(nonceKey)?.state === 'in_flight';
}

export type BeginRelayResult = 'started' | 'in_flight' | 'completed';

/** Mark relay in-flight before Iris polling / signing (C7). */
export function tryBeginCctpNonceRelay(nonceKey: string): BeginRelayResult {
  const existing = ledger.get(nonceKey);
  if (existing?.state === 'completed') {
    return 'completed';
  }
  if (existing?.state === 'in_flight') {
    return 'in_flight';
  }
  ledger.set(nonceKey, { state: 'in_flight' });
  return 'started';
}

export function recordCctpNonceRelay(nonceKey: string, result: CctpNonceRelayResult): void {
  ledger.set(nonceKey, { state: 'completed', result });
}

export function clearCctpNonceInFlight(nonceKey: string): void {
  const entry = ledger.get(nonceKey);
  if (entry?.state === 'in_flight') {
    ledger.delete(nonceKey);
  }
}

/** @internal test helper */
export function resetCctpNonceLedgerForTests(): void {
  ledger.clear();
}
