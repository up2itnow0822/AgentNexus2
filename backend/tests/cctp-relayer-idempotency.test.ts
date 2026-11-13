import { resetCctpNonceLedgerForTests } from '../src/utils/cctpNonceLedger';
import {
  buildV1CctpMessageForChain,
  v1TokenMessengerBytes32,
} from './helpers/cctpTestMessage';
import { encodeMessageReceivedLog, encodeMessageSentLog } from './helpers/cctpTestLogs';
import { computeCctpUsedNonceKey } from '../src/utils/cctpMessage';
import { encodeFunctionData, keccak256, type Hex } from 'viem';

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

import { CctpRelayerService } from '../src/services/CctpRelayerService';
import { CCTP_CONFIG } from '../src/config/cctp';

describe('CctpRelayerService mint proof and idempotency', () => {
  const originalEnv = process.env;
  const receiver = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd';
  const beneficiary = '0x1111111111111111111111111111111111111111';
  const sourceCfg = CCTP_CONFIG['arbitrum-sepolia'];
  const destCfg = CCTP_CONFIG['base-sepolia'];
  let message: Hex;
  let messageHash: Hex;
  let usedNonceKey: Hex;
  let usedNonceConsumed = false;

  beforeAll(() => {
    message = buildV1CctpMessageForChain('arbitrum-sepolia', {
      amount: 1_000_000n,
      mintRecipient: receiver,
      beneficiary,
      nonce: 42n,
    });
    messageHash = keccak256(message);
    usedNonceKey = computeCctpUsedNonceKey(sourceCfg.cctpDomain, 42n);
  });

  beforeEach(() => {
    resetCctpNonceLedgerForTests();
    jest.clearAllMocks();
    usedNonceConsumed = false;

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
      logs: [encodeMessageSentLog(sourceCfg, message, `0x${'aa'.repeat(32)}`)],
    });

    readContract.mockImplementation(
      ({ functionName, args }: { functionName: string; args: unknown[] }) => {
        if (functionName === 'isReferenceProcessed') return false;
        if (functionName === 'usedNonces') {
          if (args[0] === usedNonceKey && usedNonceConsumed) return 1n;
          return 0n;
        }
        return 0n;
      }
    );

    waitForTransactionReceipt.mockImplementation(({ hash }: { hash: Hex }) => {
      if (hash === '0xmint') {
        usedNonceConsumed = true;
        return Promise.resolve({
          status: 'success',
          logs: [
            encodeMessageReceivedLog({
              caller: '0x0000000000000000000000000000000000000001',
              sourceDomain: sourceCfg.cctpDomain,
              nonce: 42n,
              sender: v1TokenMessengerBytes32('arbitrum-sepolia'),
              messageBody: '0x',
              transmitter: destCfg.messageTransmitter as Hex,
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

  test('credits after ABI-encoded MessageSent/Mint proof', async () => {
    const service = new CctpRelayerService();

    const result = await service.relayTransfer(
      `0x${'aa'.repeat(32)}`,
      sourceCfg.caip2,
      'client-ref-1',
      beneficiary
    );

    expect(result.status).toBe('CREDITED');
    expect(sendTransaction).toHaveBeenCalledTimes(2);
    expect(readContract).toHaveBeenCalledWith(
      expect.objectContaining({
        functionName: 'usedNonces',
        args: [usedNonceKey],
      })
    );
  });

  test('does not sign again for the same attested nonce', async () => {
    const service = new CctpRelayerService();
    await service.relayTransfer(`0x${'aa'.repeat(32)}`, sourceCfg.caip2, 'ref-1', beneficiary);
    sendTransaction.mockClear();

    const second = await service.relayTransfer(
      `0x${'bb'.repeat(32)}`,
      sourceCfg.caip2,
      'ref-2',
      beneficiary
    );
    expect(second.status).toBe('ALREADY_RELAYED');
    expect(sendTransaction).not.toHaveBeenCalled();
  });

  test('passes exact creditFromCctp arguments from attested message', async () => {
    const service = new CctpRelayerService();
    await service.relayTransfer(`0x${'cc'.repeat(32)}`, sourceCfg.caip2, 'ref-3', beneficiary);

    const creditCall = sendTransaction.mock.calls[1]![0] as { data: Hex; to: string };
    const expectedData = encodeFunctionData({
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
    expect(creditCall.data).toBe(expectedData);
  });
});
