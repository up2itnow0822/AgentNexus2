/**
 * Circle Iris attestation hosts — fixed per network class (not env-overridable).
 */

export type CctpNetworkClass = 'mainnet' | 'testnet';

export const CCTP_IRIS_MAINNET = 'https://iris-api.circle.com';
export const CCTP_IRIS_TESTNET = 'https://iris-api-sandbox.circle.com';

export function getCctpIrisBaseUrl(networkClass: CctpNetworkClass): string {
  return networkClass === 'mainnet' ? CCTP_IRIS_MAINNET : CCTP_IRIS_TESTNET;
}

export function resolveCctpNetworkClassFromEnv(): CctpNetworkClass {
  return process.env.X402_NETWORK === 'base' ? 'mainnet' : 'testnet';
}
