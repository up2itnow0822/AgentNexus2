import { CCTP_CONFIG, type CctpChainConfig } from '../../src/config/cctp';
import {
  BURN_V1_BODY_LENGTH,
  CCTP_V1_BODY_OFFSET,
} from '../../src/utils/cctpMessage';

export type CctpConfigKey = keyof typeof CCTP_CONFIG;

function encodeUint32(value: number): string {
  return value.toString(16).padStart(8, '0');
}

function encodeUint256(value: bigint): string {
  return value.toString(16).padStart(64, '0');
}

function encodeAddressAsBytes32(address: string): string {
  const hex = address.toLowerCase().replace(/^0x/, '');
  if (hex.length !== 40) throw new Error('expected 20-byte address');
  return hex.padStart(64, '0');
}

function usdcBytes32ForConfig(cfg: CctpChainConfig): string {
  return encodeAddressAsBytes32(cfg.usdcAddress);
}

/** Minimal CCTP V1 MessageSent payload using chain config (no inline token literals in callers). */
export function buildV1CctpMessageForChain(
  chainKey: CctpConfigKey,
  params: {
    amount: bigint;
    mintRecipient: string;
    beneficiary: string;
    nonce?: bigint;
    destinationDomain?: number;
  }
): `0x${string}` {
  const cfg = CCTP_CONFIG[chainKey];
  const nonceHex = (params.nonce ?? 1n).toString(16).padStart(16, '0');

  const header =
    encodeUint32(0) +
    encodeUint32(cfg.cctpDomain) +
    encodeUint32(params.destinationDomain ?? 6) +
    nonceHex +
    '11'.repeat(32) +
    '22'.repeat(32) +
    '00'.repeat(32);

  const body =
    encodeUint32(0) +
    usdcBytes32ForConfig(cfg) +
    encodeAddressAsBytes32(params.mintRecipient) +
    encodeUint256(params.amount) +
    encodeAddressAsBytes32(params.beneficiary);

  const hex = header + body;
  if (hex.length / 2 !== CCTP_V1_BODY_OFFSET + BURN_V1_BODY_LENGTH) {
    throw new Error('unexpected test message length');
  }
  return `0x${hex}`;
}

/** Build message with USDC from a different chain config (validation negative cases). */
export function buildV1CctpMessageWithTokenChain(
  headerChainKey: CctpConfigKey,
  tokenChainKey: CctpConfigKey,
  params: {
    amount: bigint;
    mintRecipient: string;
    beneficiary: string;
    nonce?: bigint;
  }
): `0x${string}` {
  const headerCfg = CCTP_CONFIG[headerChainKey];
  const tokenCfg = CCTP_CONFIG[tokenChainKey];
  const nonceHex = (params.nonce ?? 1n).toString(16).padStart(16, '0');

  const header =
    encodeUint32(0) +
    encodeUint32(headerCfg.cctpDomain) +
    encodeUint32(6) +
    nonceHex +
    '11'.repeat(32) +
    '22'.repeat(32) +
    '00'.repeat(32);

  const body =
    encodeUint32(0) +
    encodeAddressAsBytes32(tokenCfg.usdcAddress) +
    encodeAddressAsBytes32(params.mintRecipient) +
    encodeUint256(params.amount) +
    encodeAddressAsBytes32(params.beneficiary);

  const hex = header + body;
  return `0x${hex}`;
}
