import {
  assertAttestedBeneficiary,
  assertCctpCreditRequest,
  BURN_MESSAGE_SENDER_OFFSET,
  CCTP_V1_BODY_OFFSET,
  computeCctpUsedNonceKey,
  decodeCctpBurnMessage,
} from '../src/utils/cctpMessage';
import { buildV1CctpMessageForChain } from './helpers/cctpTestMessage';

describe('CCTP message decoding', () => {
  const receiver = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd';
  const beneficiary = '0x1111111111111111111111111111111111111111';
  const chainKey = 'arbitrum-sepolia' as const;

  test('decodes attested burn amount and mint recipient from V1 message', () => {
    const amount = 1_000_000n;
    const message = buildV1CctpMessageForChain(chainKey, {
      amount,
      mintRecipient: receiver,
      beneficiary,
      nonce: 1n,
    });

    const decoded = decodeCctpBurnMessage(message);
    expect(decoded.messageVersion).toBe(0);
    expect(decoded.amount).toBe(amount);
    expect(decoded.mintRecipient.toLowerCase()).toBe(receiver.toLowerCase());
    expect(decoded.beneficiary.toLowerCase()).toBe(beneficiary.toLowerCase());
    expect(decoded.attestationNonceKey).toBe('3:1');
  });

  test('computes usedNonces key from sourceDomain and nonce', () => {
    const message = buildV1CctpMessageForChain(chainKey, {
      amount: 1n,
      mintRecipient: receiver,
      beneficiary,
      nonce: 42n,
    });
    const decoded = decodeCctpBurnMessage(message);
    const key = computeCctpUsedNonceKey(decoded.sourceDomain, decoded.nonce);
    expect(key.startsWith('0x')).toBe(true);
    expect(key.length).toBe(66);
  });

  test('rejects messageSender bytes32 with non-zero high bytes', () => {
    const message = buildV1CctpMessageForChain(chainKey, {
      amount: 1n,
      mintRecipient: receiver,
      beneficiary,
    });
    const byteOffset = CCTP_V1_BODY_OFFSET + BURN_MESSAGE_SENDER_OFFSET;
    const hexOffset = 2 + byteOffset * 2;
    const corrupted =
      message.slice(0, hexOffset) + 'ff'.repeat(12) + message.slice(hexOffset + 24);
    expect(() => decodeCctpBurnMessage(corrupted)).toThrow(/non-zero high bytes/);
  });

  test('rejects claimed amount that does not match attested burn', () => {
    const message = buildV1CctpMessageForChain(chainKey, {
      amount: 1_000_000n,
      mintRecipient: receiver,
      beneficiary,
    });

    expect(() =>
      assertCctpCreditRequest({
        messageBytes: message,
        claimedAmount: '999999999999',
        receiverAddress: receiver,
      })
    ).toThrow(/does not match attested burn amount/);
  });

  test('rejects mintRecipient that is not the configured receiver', () => {
    const message = buildV1CctpMessageForChain(chainKey, {
      amount: 1_000_000n,
      mintRecipient: '0x2222222222222222222222222222222222222222',
      beneficiary,
    });

    expect(() =>
      assertCctpCreditRequest({
        messageBytes: message,
        claimedAmount: '1000000',
        receiverAddress: receiver,
      })
    ).toThrow(/does not match receiver/);
  });

  test('accepts matching claimed amount and receiver', () => {
    const message = buildV1CctpMessageForChain(chainKey, {
      amount: 5_000_000n,
      mintRecipient: receiver,
      beneficiary,
    });

    const decoded = assertCctpCreditRequest({
      messageBytes: message,
      claimedAmount: '5000000',
      receiverAddress: receiver,
    });

    expect(decoded.amount).toBe(5_000_000n);
  });

  test('rejects claimed beneficiary that does not match attested messageSender', () => {
    const message = buildV1CctpMessageForChain(chainKey, {
      amount: 1_000_000n,
      mintRecipient: receiver,
      beneficiary,
    });

    expect(() =>
      assertAttestedBeneficiary({
        messageBytes: message,
        claimedBeneficiary: '0x2222222222222222222222222222222222222222',
      })
    ).toThrow(/does not match attested messageSender/);
  });

  test('rejects non-V1 CCTP message version', () => {
    const message = buildV1CctpMessageForChain(chainKey, {
      amount: 1_000_000n,
      mintRecipient: receiver,
      beneficiary,
    });
    const mutated = message.replace(/^0x00000000/, '0x00000001');
    expect(() => decodeCctpBurnMessage(mutated)).toThrow(/Unsupported CCTP message version/);
  });

  test('accepts matching optional claimed beneficiary', () => {
    const message = buildV1CctpMessageForChain(chainKey, {
      amount: 1_000_000n,
      mintRecipient: receiver,
      beneficiary,
    });

    const result = assertAttestedBeneficiary({
      messageBytes: message,
      claimedBeneficiary: beneficiary,
    });
    expect(result.beneficiary.toLowerCase()).toBe(beneficiary.toLowerCase());
  });
});
