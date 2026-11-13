import type { CctpChainConfig } from '../config/cctp';
import { CCTP_BASE_DOMAIN_ID } from './cctpMessage';
import { normalizeAddress } from './cctpMessage';
import type { Log } from 'viem';

export const BURN_BODY_VERSION_OFFSET = 0;
export const BURN_BURN_TOKEN_OFFSET = 4;

export function assertCctpNetworkClassMatch(
  sourceConfig: CctpChainConfig,
  activeNetworkClass: 'mainnet' | 'testnet'
): void {
  if (sourceConfig.networkClass !== activeNetworkClass) {
    throw new Error('CCTP source network class mismatch');
  }
}

export function assertMessageTransmitterEmitter(
  logs: Log[],
  messageTransmitterAddress: string
): void {
  const expected = normalizeAddress(messageTransmitterAddress);
  const hasEmitter = logs.some((log) => normalizeAddress(log.address) === expected);
  if (!hasEmitter) {
    throw new Error('MessageSent emitter is not the configured MessageTransmitter');
  }
}

export function assertCctpHeaderDomains(bytes: Uint8Array, sourceConfig: CctpChainConfig): void {
  const sourceDomain = readUint32(bytes, 4);
  const destinationDomain = readUint32(bytes, 8);
  if (sourceDomain !== sourceConfig.cctpDomain) {
    throw new Error('CCTP source domain mismatch');
  }
  if (destinationDomain !== CCTP_BASE_DOMAIN_ID) {
    throw new Error('CCTP destination domain must be Base');
  }
}

export function assertCctpBurnToken(
  bytes: Uint8Array,
  bodyOffset: number,
  usdcAddress: string
): void {
  const burnToken = readAddressFromBytes32(bytes, bodyOffset + BURN_BURN_TOKEN_OFFSET);
  if (normalizeAddress(burnToken) !== normalizeAddress(usdcAddress)) {
    throw new Error('CCTP burn token mismatch');
  }
}

function readUint32(bytes: Uint8Array, offset: number): number {
  return (
    (bytes[offset]! << 24) |
    (bytes[offset + 1]! << 16) |
    (bytes[offset + 2]! << 8) |
    bytes[offset + 3]!
  ) >>> 0;
}

function readAddressFromBytes32(bytes: Uint8Array, offset: number): `0x${string}` {
  const hex = Array.from(bytes.slice(offset + 12, offset + 32))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `0x${hex}`;
}
