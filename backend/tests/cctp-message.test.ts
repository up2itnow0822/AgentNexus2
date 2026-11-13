import {
  assertAttestedBeneficiary,
  assertCctpCreditRequest,
  decodeCctpBurnMessage,
} from '../src/utils/cctpMessage';
import { buildV1CctpMessage } from './helpers/cctpTestMessage';

describe('CCTP message decoding', () => {
  const receiver = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd';
  const beneficiary = '0x1111111111111111111111111111111111111111';

  test('decodes attested burn amount and mint recipient from V1 message', () => {
    const amount = 1_000_000n;
    const message = buildV1CctpMessage({ amount, mintRecipient: receiver, beneficiary });

    const decoded = decodeCctpBurnMessage(message);
    expect(decoded.messageVersion).toBe(0);
    expect(decoded.amount).toBe(amount);
    expect(decoded.mintRecipient.toLowerCase()).toBe(receiver.toLowerCase());
    expect(decoded.beneficiary.toLowerCase()).toBe(beneficiary.toLowerCase());
    expect(decoded.attestationNonceKey).toBe('3:1');
  });

  test('rejects claimed amount that does not match attested burn', () => {
    const message = buildV1CctpMessage({
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
    const message = buildV1CctpMessage({
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
    const message = buildV1CctpMessage({
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
    const message = buildV1CctpMessage({
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

  test('accepts matching optional claimed beneficiary', () => {
    const message = buildV1CctpMessage({
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
