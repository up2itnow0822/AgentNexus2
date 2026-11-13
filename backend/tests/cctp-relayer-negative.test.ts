import { resetCctpNonceLedgerForTests } from '../src/utils/cctpNonceLedger';
import {
  buildV1CctpMessageForChain,
  buildV1CctpMessageWithTokenChain,
  v1TokenMessengerBytes32,
} from './helpers/cctpTestMessage';
import { encodeMessageReceivedLog, encodeMessageSentLog } from './helpers/cctpTestLogs';
import type { Hex } from 'viem';
import { computeCctpUsedNonceKey } from '../src/utils/cctpMessage';
import { CctpRelayerService } from '../src/services/CctpRelayerService';
import { CCTP_CONFIG } from '../src/config/cctp';
import { CctpHttpError } from '../src/utils/cctpErrors';

const sendTransaction = jest.fn();
const getTransactionReceipt = jest.fn();
const waitForTransactionReceipt = jest.fn();
const readContract = jest.fn();

jest.mock('viem', () => {
  const actual = jest.requireActual<typeof import('viem')>('viem');
  return {
    ...actual,
    createPublicClient: jest.fn(() => ({
      getTransactionReceipt,
      waitForTransactionReceipt,
      readContract,
    })),
    createWalletClient: jest.fn(() => ({
      sendTransaction,
    })),
  };
});

describe('CctpRelayerService validation negatives', () => {
  const originalEnv = process.env;
  const receiver = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd';
  const beneficiary = '0x1111111111111111111111111111111111111111';
  const sourceCfg = CCTP_CONFIG['arbitrum-sepolia'];

  const baseEnv = {
    ENABLE_CCTP_RELAYER: 'true',
    RELAYER_PRIVATE_KEY:
      '0x0000000000000000000000000000000000000000000000000000000000000001',
    CCTP_BASE_RECEIVER_CONTRACT: receiver,
    X402_NETWORK: 'base-sepolia',
    ARBITRUM_RPC_URL: 'http://localhost:0',
    BASE_SEPOLIA_RPC_URL: 'http://localhost:0',
  };

  beforeEach(() => {
    resetCctpNonceLedgerForTests();
    jest.clearAllMocks();
    jest
      .spyOn(CctpRelayerService.prototype as unknown as { pollIrisAttestation: () => Promise<string> }, 'pollIrisAttestation')
      .mockResolvedValue('0x' + 'ff'.repeat(65));
    process.env = { ...originalEnv, ...baseEnv };
    readContract.mockImplementation(({ functionName }: { functionName: string }) => {
      if (functionName === 'isReferenceProcessed') return false;
      if (functionName === 'usedNonces') return 0n;
      return 0n;
    });
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('rejects mainnet source when deployment is testnet', async () => {
    const service = new CctpRelayerService();
    await expect(
      service.relayTransfer(`0x${'aa'.repeat(32)}`, CCTP_CONFIG.arbitrum.caip2, 'r', beneficiary)
    ).rejects.toBeInstanceOf(CctpHttpError);
    expect(sendTransaction).not.toHaveBeenCalled();
  });

  test('rejects wrong MessageSent emitter address', async () => {
    const message = buildV1CctpMessageForChain('arbitrum-sepolia', {
      amount: 1n,
      mintRecipient: receiver,
      beneficiary,
    });
    const wrongEmitter = CCTP_CONFIG['base-sepolia'].messageTransmitter;
    getTransactionReceipt.mockResolvedValue({
      logs: [encodeMessageSentLog({ ...sourceCfg, messageTransmitter: wrongEmitter }, message, `0x${'aa'.repeat(32)}`)],
    });

    const service = new CctpRelayerService();
    await expect(
      service.relayTransfer(`0x${'aa'.repeat(32)}`, sourceCfg.caip2, 'r', beneficiary)
    ).rejects.toBeInstanceOf(CctpHttpError);
  });

  test('rejects wrong destination domain in message header', async () => {
    const message = buildV1CctpMessageForChain('arbitrum-sepolia', {
      amount: 1n,
      mintRecipient: receiver,
      beneficiary,
      destinationDomain: 7,
    });
    getTransactionReceipt.mockResolvedValue({
      logs: [encodeMessageSentLog(sourceCfg, message, `0x${'aa'.repeat(32)}`)],
    });

    const service = new CctpRelayerService();
    await expect(
      service.relayTransfer(`0x${'aa'.repeat(32)}`, sourceCfg.caip2, 'r', beneficiary)
    ).rejects.toBeInstanceOf(CctpHttpError);
  });

  test('rejects wrong burn token for source chain', async () => {
    const message = buildV1CctpMessageWithTokenChain('arbitrum-sepolia', 'ethereum', {
      amount: 1n,
      mintRecipient: receiver,
      beneficiary,
    });
    getTransactionReceipt.mockResolvedValue({
      logs: [encodeMessageSentLog(sourceCfg, message, `0x${'aa'.repeat(32)}`)],
    });

    const service = new CctpRelayerService();
    await expect(
      service.relayTransfer(`0x${'aa'.repeat(32)}`, sourceCfg.caip2, 'r', beneficiary)
    ).rejects.toBeInstanceOf(CctpHttpError);
  });

  test('rejects wrong header sender before signing (fresh mint path)', async () => {
    const message = buildV1CctpMessageForChain('arbitrum-sepolia', {
      amount: 1n,
      mintRecipient: receiver,
      beneficiary,
      headerSenderAddress: '0x000000000000000000000000000000000000dead',
    });
    getTransactionReceipt.mockResolvedValue({
      logs: [encodeMessageSentLog(sourceCfg, message, `0x${'aa'.repeat(32)}`)],
    });

    const pollSpy = jest.spyOn(
      CctpRelayerService.prototype as unknown as { pollIrisAttestation: () => Promise<string> },
      'pollIrisAttestation'
    );

    const service = new CctpRelayerService();
    await expect(
      service.relayTransfer(`0x${'aa'.repeat(32)}`, sourceCfg.caip2, 'r', beneficiary)
    ).rejects.toBeInstanceOf(CctpHttpError);
    expect(sendTransaction).not.toHaveBeenCalled();
    expect(pollSpy).not.toHaveBeenCalled();
  });

  test('rejects wrong header recipient before signing (fresh mint path)', async () => {
    const message = buildV1CctpMessageForChain('arbitrum-sepolia', {
      amount: 1n,
      mintRecipient: receiver,
      beneficiary,
      headerRecipientAddress: '0x000000000000000000000000000000000000beef',
    });
    getTransactionReceipt.mockResolvedValue({
      logs: [encodeMessageSentLog(sourceCfg, message, `0x${'aa'.repeat(32)}`)],
    });

    const pollSpy = jest.spyOn(
      CctpRelayerService.prototype as unknown as { pollIrisAttestation: () => Promise<string> },
      'pollIrisAttestation'
    );

    const service = new CctpRelayerService();
    await expect(
      service.relayTransfer(`0x${'aa'.repeat(32)}`, sourceCfg.caip2, 'r', beneficiary)
    ).rejects.toBeInstanceOf(CctpHttpError);
    expect(sendTransaction).not.toHaveBeenCalled();
    expect(pollSpy).not.toHaveBeenCalled();
  });

  test('rejects wrong header sender when destination nonce already used', async () => {
    const nonce = 77n;
    const message = buildV1CctpMessageForChain('arbitrum-sepolia', {
      amount: 1n,
      mintRecipient: receiver,
      beneficiary,
      nonce,
      headerSenderAddress: '0x000000000000000000000000000000000000dead',
    });
    getTransactionReceipt.mockResolvedValue({
      logs: [encodeMessageSentLog(sourceCfg, message, `0x${'aa'.repeat(32)}`)],
    });

    const nonceKey = computeCctpUsedNonceKey(sourceCfg.cctpDomain, nonce);
    readContract.mockImplementation(({ functionName, args }: { functionName: string; args: unknown[] }) => {
      if (functionName === 'isReferenceProcessed') return false;
      if (functionName === 'usedNonces' && args[0] === nonceKey) return 1n;
      return 0n;
    });

    const pollSpy = jest.spyOn(
      CctpRelayerService.prototype as unknown as { pollIrisAttestation: () => Promise<string> },
      'pollIrisAttestation'
    );

    const service = new CctpRelayerService();
    await expect(
      service.relayTransfer(`0x${'aa'.repeat(32)}`, sourceCfg.caip2, 'r', beneficiary)
    ).rejects.toBeInstanceOf(CctpHttpError);
    expect(sendTransaction).not.toHaveBeenCalled();
    expect(pollSpy).not.toHaveBeenCalled();
  });

  test('rejects wrong header recipient when destination nonce already used', async () => {
    const nonce = 78n;
    const message = buildV1CctpMessageForChain('arbitrum-sepolia', {
      amount: 1n,
      mintRecipient: receiver,
      beneficiary,
      nonce,
      headerRecipientAddress: '0x000000000000000000000000000000000000beef',
    });
    getTransactionReceipt.mockResolvedValue({
      logs: [encodeMessageSentLog(sourceCfg, message, `0x${'aa'.repeat(32)}`)],
    });

    const nonceKey = computeCctpUsedNonceKey(sourceCfg.cctpDomain, nonce);
    readContract.mockImplementation(({ functionName, args }: { functionName: string; args: unknown[] }) => {
      if (functionName === 'isReferenceProcessed') return false;
      if (functionName === 'usedNonces' && args[0] === nonceKey) return 1n;
      return 0n;
    });

    const pollSpy = jest.spyOn(
      CctpRelayerService.prototype as unknown as { pollIrisAttestation: () => Promise<string> },
      'pollIrisAttestation'
    );

    const service = new CctpRelayerService();
    await expect(
      service.relayTransfer(`0x${'aa'.repeat(32)}`, sourceCfg.caip2, 'r', beneficiary)
    ).rejects.toBeInstanceOf(CctpHttpError);
    expect(sendTransaction).not.toHaveBeenCalled();
    expect(pollSpy).not.toHaveBeenCalled();
  });

  test('does not mark credited when mint receipt fails proof', async () => {
    const message = buildV1CctpMessageForChain('arbitrum-sepolia', {
      amount: 1n,
      mintRecipient: receiver,
      beneficiary,
      nonce: 99n,
    });
    getTransactionReceipt.mockResolvedValue({
      logs: [encodeMessageSentLog(sourceCfg, message, `0x${'aa'.repeat(32)}`)],
    });

    const nonceKey = computeCctpUsedNonceKey(sourceCfg.cctpDomain, 99n);
    readContract.mockImplementation(({ functionName, args }: { functionName: string; args: unknown[] }) => {
      if (functionName === 'isReferenceProcessed') return false;
      if (functionName === 'usedNonces' && args[0] === nonceKey) return 0n;
      return 0n;
    });

    sendTransaction.mockResolvedValueOnce('0xmint');
    waitForTransactionReceipt.mockResolvedValueOnce({ status: 'reverted', logs: [] });

    const service = new CctpRelayerService();
    await expect(
      service.relayTransfer(`0x${'aa'.repeat(32)}`, sourceCfg.caip2, 'r', beneficiary)
    ).rejects.toBeInstanceOf(CctpHttpError);
    expect(sendTransaction).toHaveBeenCalledTimes(1);
  });
});

describe('CctpRelayerService mainnet configuration path', () => {
  const originalEnv = process.env;
  const receiver = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd';
  const beneficiary = '0x1111111111111111111111111111111111111111';

  beforeEach(() => {
    resetCctpNonceLedgerForTests();
    jest.clearAllMocks();
    jest
      .spyOn(CctpRelayerService.prototype as unknown as { pollIrisAttestation: () => Promise<string> }, 'pollIrisAttestation')
      .mockResolvedValue('0x' + 'ff'.repeat(65));
    process.env = {
      ...originalEnv,
      ENABLE_CCTP_RELAYER: 'true',
      RELAYER_PRIVATE_KEY:
        '0x0000000000000000000000000000000000000000000000000000000000000001',
      CCTP_BASE_RECEIVER_CONTRACT: receiver,
      X402_NETWORK: 'base',
      ARBITRUM_RPC_URL: 'http://localhost:0',
      BASE_RPC_URL: 'http://localhost:0',
    };
    readContract.mockImplementation(({ functionName }: { functionName: string }) => {
      if (functionName === 'isReferenceProcessed') return false;
      if (functionName === 'usedNonces') return 0n;
      return 0n;
    });
    waitForTransactionReceipt.mockImplementation(({ hash }: { hash: Hex }) => {
      if (hash === '0xmint') {
        return Promise.resolve({
          status: 'success',
          logs: [
            encodeMessageReceivedLog({
              caller: '0x0000000000000000000000000000000000000001',
              sourceDomain: CCTP_CONFIG.arbitrum.cctpDomain,
              nonce: 1n,
              sender: v1TokenMessengerBytes32('arbitrum'),
              messageBody: '0x',
              transmitter: CCTP_CONFIG.base.messageTransmitter as Hex,
            }),
          ],
        });
      }
      return Promise.resolve({ status: 'success', logs: [] });
    });
    sendTransaction.mockResolvedValueOnce('0xmint').mockResolvedValueOnce('0xcredit');
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('relays when source and deployment are both mainnet', async () => {
    const message = buildV1CctpMessageForChain('arbitrum', {
      amount: 1_000_000n,
      mintRecipient: receiver,
      beneficiary,
    });
    getTransactionReceipt.mockResolvedValue({
      logs: [encodeMessageSentLog(CCTP_CONFIG.arbitrum, message, `0x${'dd'.repeat(32)}`)],
    });

    const service = new CctpRelayerService();
    const result = await service.relayTransfer(
      `0x${'dd'.repeat(32)}`,
      CCTP_CONFIG.arbitrum.caip2,
      'ref',
      beneficiary
    );
    expect(result.status).toBe('CREDITED');
  });
});
