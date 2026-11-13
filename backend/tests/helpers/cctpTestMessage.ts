import {
  BURN_V1_BODY_LENGTH,
  CCTP_V1_BODY_OFFSET,
} from '../../src/utils/cctpMessage';

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

/** Minimal CCTP V1 MessageSent payload with a BurnMessage body. */
export function buildV1CctpMessage(params: {
  amount: bigint;
  mintRecipient: string;
  beneficiary: string;
  nonce?: bigint;
  sourceDomain?: number;
  burnToken?: string;
}): `0x${string}` {
  const nonceHex = (params.nonce ?? 1n).toString(16).padStart(16, '0');
  const sourceDomain = params.sourceDomain ?? 3;

  const header =
    encodeUint32(0) +
    encodeUint32(sourceDomain) +
    encodeUint32(6) +
    nonceHex +
    '11'.repeat(32) +
    '22'.repeat(32) +
    '00'.repeat(32);

  const burnToken =
    params.burnToken ?? '0xaf88d065e77c8cC2239327C5EDb3A432268e5831';

  const body =
    encodeUint32(0) +
    encodeAddressAsBytes32(burnToken) +
    encodeAddressAsBytes32(params.mintRecipient) +
    encodeUint256(params.amount) +
    encodeAddressAsBytes32(params.beneficiary);

  const hex = header + body;
  if (hex.length / 2 !== CCTP_V1_BODY_OFFSET + BURN_V1_BODY_LENGTH) {
    throw new Error('unexpected test message length');
  }
  return `0x${hex}`;
}
