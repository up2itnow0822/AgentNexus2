import { resetCctpNonceLedgerForTests } from '../src/utils/cctpNonceLedger';

const sendTransaction = jest.fn();
const getTransactionReceipt = jest.fn();

const receiver = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd';
const beneficiary = '0x1111111111111111111111111111111111111111';

jest.mock('viem', () => {
  const actual = jest.requireActual<typeof import('viem')>('viem');
  const { buildV1CctpMessage } = require('./helpers/cctpTestMessage');
  const message = buildV1CctpMessage({
    amount: 1_000_000n,
    mintRecipient: receiver,
    beneficiary,
    nonce: 42n,
    sourceDomain: 3,
  });

  return {
    ...actual,
    createPublicClient: jest.fn(() => ({
      getTransactionReceipt,
    })),
    createWalletClient: jest.fn(() => ({
      sendTransaction,
    })),
    parseEventLogs: jest.fn(() => [
      {
        args: {
          message,
        },
      },
    ]),
  };
});

import { CctpRelayerService } from '../src/services/CctpRelayerService';

describe('CctpRelayerService nonce idempotency', () => {
  const originalEnv = process.env;

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
      X402_NETWORK: 'base-sepolia',
      ARBITRUM_SEPOLIA_RPC_URL: 'http://localhost:0',
      BASE_SEPOLIA_RPC_URL: 'http://localhost:0',
    };
    getTransactionReceipt.mockResolvedValue({ logs: [] });
    sendTransaction
      .mockResolvedValueOnce('0xmint')
      .mockResolvedValueOnce('0xcredit');
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('does not sign mint/credit again for the same attested nonce', async () => {
    const service = new CctpRelayerService();

    const first = await service.relayTransfer(
      '0x' + 'aa'.repeat(32),
      'eip155:421614',
      'client-ref-1'
    );
    expect(first.status).toBe('CREDITED');
    expect(sendTransaction).toHaveBeenCalledTimes(2);

    const second = await service.relayTransfer(
      '0x' + 'bb'.repeat(32),
      'eip155:421614',
      'client-ref-2'
    );
    expect(second.status).toBe('ALREADY_RELAYED');
    expect(sendTransaction).toHaveBeenCalledTimes(2);
  });
});
