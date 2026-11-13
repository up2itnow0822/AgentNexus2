/**
 * CCTP burn-message decoding helpers.
 *
 * Amount and mint recipient MUST be derived from attested MessageSent bytes.
 * Never trust client-supplied amounts for credit application.
 *
 * Layout references:
 * - CCTP V1 message header: body at offset 116
 * - CCTP V2 message header: body at offset 148
 * - BurnMessage (V1/V2): amount at body+68, mintRecipient at body+36
 * - BurnMessage (V1/V2): messageSender (credit beneficiary) at body+100
 * - Message header: sourceDomain at +4, nonce uint64 at +12
 * - BurnMessageV2: feeExecuted at body+164 (minted = amount - feeExecuted)
 */

import { encodePacked, keccak256, type Hex } from 'viem';

export const CCTP_SUPPORTED_MESSAGE_VERSION = 0;
export const CCTP_SUPPORTED_BURN_BODY_VERSION = 0;
export const CCTP_BASE_DOMAIN_ID = 6;
export const CCTP_V1_BODY_OFFSET = 116;
export const CCTP_V2_BODY_OFFSET = 148;
export const BURN_MINT_RECIPIENT_OFFSET = 36;
export const BURN_AMOUNT_OFFSET = 68;
export const BURN_MESSAGE_SENDER_OFFSET = 100;
export const BURN_V2_FEE_EXECUTED_OFFSET = 164;
export const BURN_V1_BODY_LENGTH = 132;
export const BURN_V2_BODY_LENGTH = 228;
export const CCTP_HEADER_NONCE_OFFSET = 12;
/** CCTP V1 message header: sender TokenMessenger (bytes32). */
export const CCTP_HEADER_SENDER_OFFSET = 20;
/** CCTP V1 message header: recipient TokenMessenger on destination (bytes32). */
export const CCTP_HEADER_RECIPIENT_OFFSET = 52;

export interface DecodedCctpBurn {
  messageVersion: number;
  amount: bigint;
  mintRecipient: `0x${string}`;
  /** Burn `messageSender` — authoritative credit beneficiary for this burn. */
  beneficiary: `0x${string}`;
  sourceDomain: number;
  nonce: bigint;
  attestationNonceKey: string;
}

function readUint32(bytes: Uint8Array, offset: number): number {
  return (
    (bytes[offset]! << 24) |
    (bytes[offset + 1]! << 16) |
    (bytes[offset + 2]! << 8) |
    bytes[offset + 3]!
  ) >>> 0;
}

function readUint64(bytes: Uint8Array, offset: number): bigint {
  let value = 0n;
  for (let i = 0; i < 8; i++) {
    value = (value << 8n) | BigInt(bytes[offset + i]!);
  }
  return value;
}

function readUint256(bytes: Uint8Array, offset: number): bigint {
  let value = 0n;
  for (let i = 0; i < 32; i++) {
    value = (value << 8n) | BigInt(bytes[offset + i]!);
  }
  return value;
}

function readAddressFromBytes32(bytes: Uint8Array, offset: number): `0x${string}` {
  for (let i = 0; i < 12; i++) {
    if (bytes[offset + i]! !== 0) {
      throw new Error('CCTP bytes32 address has non-zero high bytes');
    }
  }
  const hex = Array.from(bytes.slice(offset + 12, offset + 32))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `0x${hex}`;
}

function hexToBytes(hex: string): Uint8Array {
  const normalized = hex.startsWith('0x') ? hex.slice(2) : hex;
  if (normalized.length % 2 !== 0) {
    throw new Error('Invalid hex message bytes');
  }
  const out = new Uint8Array(normalized.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(normalized.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

/**
 * Decode burn amount and mint recipient from a CCTP MessageSent payload.
 */
export function decodeCctpBurnMessage(messageBytes: `0x${string}` | string): DecodedCctpBurn {
  const bytes = hexToBytes(messageBytes);
  if (bytes.length < CCTP_V1_BODY_OFFSET + BURN_V1_BODY_LENGTH) {
    throw new Error('CCTP message too short');
  }

  const messageVersion = readUint32(bytes, 0);
  if (messageVersion !== CCTP_SUPPORTED_MESSAGE_VERSION) {
    throw new Error('Unsupported CCTP message version');
  }

  const bodyOffset = CCTP_V1_BODY_OFFSET;

  if (bytes.length < bodyOffset + BURN_V1_BODY_LENGTH) {
    throw new Error('CCTP message body truncated');
  }

  const burnBodyVersion = readUint32(bytes, bodyOffset + 0);
  if (burnBodyVersion !== CCTP_SUPPORTED_BURN_BODY_VERSION) {
    throw new Error('Unsupported CCTP burn body version');
  }

  const mintRecipient = readAddressFromBytes32(bytes, bodyOffset + BURN_MINT_RECIPIENT_OFFSET);
  const beneficiary = readAddressFromBytes32(bytes, bodyOffset + BURN_MESSAGE_SENDER_OFFSET);
  const burnedAmount = readUint256(bytes, bodyOffset + BURN_AMOUNT_OFFSET);
  const sourceDomain = readUint32(bytes, 4);
  const nonce = readUint64(bytes, CCTP_HEADER_NONCE_OFFSET);
  const attestationNonceKey = `${sourceDomain}:${nonce.toString()}`;

  const amount = burnedAmount;

  if (amount <= 0n) {
    throw new Error('Decoded CCTP burn amount must be greater than zero');
  }

  return {
    messageVersion,
    amount,
    mintRecipient,
    beneficiary,
    sourceDomain,
    nonce,
    attestationNonceKey,
  };
}

/** On-chain MessageTransmitter.usedNonces key (V1). */
export function computeCctpUsedNonceKey(sourceDomain: number, nonce: bigint): Hex {
  return keccak256(encodePacked(['uint32', 'uint64'], [sourceDomain, nonce]));
}

/**
 * Stable idempotency key from the attested CCTP message header nonce.
 */
export function getCctpAttestationNonceKey(messageBytes: `0x${string}` | string): string {
  return decodeCctpBurnMessage(messageBytes).attestationNonceKey;
}

/**
 * Normalize an address for equality checks.
 */
export function normalizeAddress(address: string): string {
  return address.trim().toLowerCase();
}

/**
 * Validate client-submitted credit metadata against the attested burn message.
 * Returns the authoritative credit amount from the message.
 */
export function assertCctpCreditRequest(params: {
  messageBytes: `0x${string}` | string;
  claimedAmount: string;
  receiverAddress: string;
}): { amount: bigint; mintRecipient: `0x${string}`; messageVersion: number } {
  const decoded = decodeCctpBurnMessage(params.messageBytes);

  let claimed: bigint;
  try {
    claimed = BigInt(params.claimedAmount);
  } catch {
    throw new Error('Invalid claimed CCTP amount');
  }

  if (claimed !== decoded.amount) {
    throw new Error(
      `Claimed CCTP amount ${claimed.toString()} does not match attested burn amount ${decoded.amount.toString()}`
    );
  }

  if (normalizeAddress(decoded.mintRecipient) !== normalizeAddress(params.receiverAddress)) {
    throw new Error(
      `CCTP mintRecipient ${decoded.mintRecipient} does not match receiver ${params.receiverAddress}`
    );
  }

  return decoded;
}

/**
 * Reject optional client-supplied beneficiary when it does not match the attested burn body.
 */
export function assertAttestedBeneficiary(params: {
  messageBytes: `0x${string}` | string;
  claimedBeneficiary?: string;
}): { beneficiary: `0x${string}` } {
  const decoded = decodeCctpBurnMessage(params.messageBytes);

  if (params.claimedBeneficiary !== undefined && params.claimedBeneficiary !== '') {
    if (normalizeAddress(params.claimedBeneficiary) !== normalizeAddress(decoded.beneficiary)) {
      throw new Error(
        `Claimed beneficiary ${params.claimedBeneficiary} does not match attested messageSender ${decoded.beneficiary}`
      );
    }
  }

  return { beneficiary: decoded.beneficiary };
}
