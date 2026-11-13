import type { CctpChainConfig } from '../config/cctp';
import { circleV1MessengerAddress } from '../config/cctpV1Contracts';
import {
  CCTP_BASE_DOMAIN_ID,
  CCTP_HEADER_RECIPIENT_OFFSET,
  CCTP_HEADER_SENDER_OFFSET,
  normalizeAddress,
} from './cctpMessage';
import { CctpValidationError } from './cctpErrors';
import type { Log } from 'viem';

export const BURN_BODY_VERSION_OFFSET = 0;
export const BURN_BURN_TOKEN_OFFSET = 4;

export function assertCctpNetworkClassMatch(
  sourceConfig: CctpChainConfig,
  activeNetworkClass: 'mainnet' | 'testnet'
): void {
  if (sourceConfig.networkClass !== activeNetworkClass) {
    throw new CctpValidationError();
  }
}

export function assertMessageTransmitterEmitter(
  logs: Log[],
  messageTransmitterAddress: string
): void {
  const expected = normalizeAddress(messageTransmitterAddress);
  const hasEmitter = logs.some((log) => normalizeAddress(log.address) === expected);
  if (!hasEmitter) {
    throw new CctpValidationError();
  }
}

export function assertCctpHeaderDomains(bytes: Uint8Array, sourceConfig: CctpChainConfig): void {
  const sourceDomain = readUint32(bytes, 4);
  const destinationDomain = readUint32(bytes, 8);
  if (sourceDomain !== sourceConfig.cctpDomain) {
    throw new CctpValidationError();
  }
  if (destinationDomain !== CCTP_BASE_DOMAIN_ID) {
    throw new CctpValidationError();
  }
}

export function assertCctpBurnToken(
  bytes: Uint8Array,
  bodyOffset: number,
  usdcAddress: string
): void {
  const burnToken = readAddressFromBytes32(bytes, bodyOffset + BURN_BURN_TOKEN_OFFSET);
  if (normalizeAddress(burnToken) !== normalizeAddress(usdcAddress)) {
    throw new CctpValidationError();
  }
}

/** Require attested message header sender/recipient TokenMessengers (V1, bytes32). */
export function assertCctpHeaderTokenMessengers(
  bytes: Uint8Array,
  sourceConfig: CctpChainConfig,
  destConfig: CctpChainConfig
): void {
  const sender = readAddressFromBytes32(bytes, CCTP_HEADER_SENDER_OFFSET);
  const recipient = readAddressFromBytes32(bytes, CCTP_HEADER_RECIPIENT_OFFSET);
  const expectedSender = circleV1MessengerAddress(
    sourceConfig.cctpDomain,
    sourceConfig.networkClass
  );
  const expectedRecipient = circleV1MessengerAddress(
    destConfig.cctpDomain,
    destConfig.networkClass
  );
  if (normalizeAddress(sender) !== normalizeAddress(expectedSender)) {
    throw new CctpValidationError();
  }
  if (normalizeAddress(recipient) !== normalizeAddress(expectedRecipient)) {
    throw new CctpValidationError();
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
  for (let i = 0; i < 12; i++) {
    if (bytes[offset + i]! !== 0) {
      throw new CctpValidationError();
    }
  }
  const hex = Array.from(bytes.slice(offset + 12, offset + 32))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `0x${hex}`;
}
