import { resetCctpNonceLedgerForTests } from '../src/utils/cctpNonceLedger';
import { CCTP_CONFIG } from '../src/config/cctp';

const sendTransaction = jest.fn();
const getTransactionReceipt = jest.fn();
const waitForTransactionReceipt = jest.fn();
const readContract = jest.fn();

const receiver = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd';
const beneficiary = '0x1111111111111111111111111111111111111111';
const sourceTransmitter = CCTP_CONFIG['arbitrum-sepolia'].messageTransmitter;
const arbitrumSepoliaUsdc = CCTP_CONFIG['arbitrum-sepolia'].usdcAddress;

jest.mock('viem', () => {
  const actual = jest.requireActual<typeof import('viem')>('viem');
  const { buildV1CctpMessage } = require('./helpers/cctpTestMessage');
  const { CCTP_CONFIG: cfg } = require('../src/config/cctp');
  const message = buildV1CctpMessage({
    amount: 1_000_000n,
    mintRecipient: receiver,
    beneficiary,
    nonce: 42n,
    sourceDomain: cfg['arbitrum-sepolia'].cctpDomain,
    burnToken: cfg['arbitrum-sepolia'].usdcAddress,
  });

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
    parseEventLogs: jest.fn((args: { eventName?: string }) => {
      if (args.eventName === 'MessageSent') {
        return [{ args: { message } }];
      }
      return [{ args: {} }];
    }),
  };
});

import { CctpRelayerService } from '../src/services/CctpRelayerService';
import { encodeFunctionData, keccak256 } from 'viem';
import { buildV1CctpMessage } from './helpers/cctpTestMessage';

describe('CctpRelayerService nonce idempotency', () => {
  const originalEnv = process.env;
  let message: `0x${string}`;
  let messageHash: `0x${string}`;

  beforeAll(() => {
    message = buildV1CctpMessage({
      amount: 1_000_000n,
      mintRecipient: receiver,
      beneficiary,
      nonce: 42n,
      sourceDomain: CCTP_CONFIG['arbitrum-sepolia'].cctpDomain,
      burnToken: arbitrumSepoliaUsdc,
    });
    messageHash = keccak256(message);
  });

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
      ARBITRUM_RPC_URL: 'http://localhost:0',
      BASE_SEPOLIA_RPC_URL: 'http://localhost:0',
    };

    getTransactionReceipt.mockResolvedValue({
      logs: [{ address: sourceTransmitter, topics: [], data: '0x' }],
    });

    readContract.mockImplementation(({ functionName }: { functionName: string }) => {
      if (functionName === 'isReferenceProcessed') return false;
      if (functionName === 'usedNonces') return false;
      return false;
    });

    waitForTransactionReceipt.mockResolvedValue({ status: 'success', logs: [{ address: '0x1', topics: [], data: '0x' }] });
    sendTransaction.mockResolvedValueOnce('0xmint').mockResolvedValueOnce('0xcredit');
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('does not sign mint/credit again for the same attested nonce', async () => {
    const service = new CctpRelayerService();

    const first = await service.relayTransfer(
      '0x' + 'aa'.repeat(32),
      'eip155:421614',
      'client-ref-1',
      beneficiary
    );
    expect(first.status).toBe('CREDITED');
    expect(sendTransaction).toHaveBeenCalledTimes(2);

    sendTransaction.mockClear();

    const second = await service.relayTransfer(
      '0x' + 'bb'.repeat(32),
      'eip155:421614',
      'client-ref-2',
      beneficiary
    );
    expect(second.status).toBe('ALREADY_RELAYED');
    expect(sendTransaction).not.toHaveBeenCalled();
  });

  test('passes exact creditFromCctp arguments from attested message', async () => {
    const service = new CctpRelayerService();
    await service.relayTransfer(
      '0x' + 'cc'.repeat(32),
      'eip155:421614',
      'client-ref-3',
      beneficiary
    );

    const creditCall = sendTransaction.mock.calls[1]![0] as {
      data: `0x${string}`;
      to: string;
    };
    const creditData = encodeFunctionData({
      abi: [
        {
          name: 'creditFromCctp',
          type: 'function',
          inputs: [
            { name: 'referenceId', type: 'bytes32' },
            { name: 'beneficiary', type: 'address' },
            { name: 'amount', type: 'uint256' },
          ],
          outputs: [],
        },
      ],
      functionName: 'creditFromCctp',
      args: [messageHash, beneficiary, 1_000_000n],
    });

    expect(creditCall.to.toLowerCase()).toBe(receiver.toLowerCase());
    expect(creditCall.data).toBe(creditData);
  });
});
