/**
 * In-memory idempotency ledger for CCTP relay submits keyed by attested message nonce.
 */

export interface CctpNonceRelayResult {
  status: string;
  mintTx: string;
  creditTx: string;
}

const ledger = new Map<string, CctpNonceRelayResult>();

export function peekCctpNonceRelay(nonceKey: string): CctpNonceRelayResult | undefined {
  return ledger.get(nonceKey);
}

export function recordCctpNonceRelay(nonceKey: string, result: CctpNonceRelayResult): void {
  ledger.set(nonceKey, result);
}

/** @internal test helper */
export function resetCctpNonceLedgerForTests(): void {
  ledger.clear();
}
