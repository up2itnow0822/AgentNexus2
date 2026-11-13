/**
 * CCTP Relayer Service
 */

import {
  createPublicClient,
  createWalletClient,
  http,
  encodeFunctionData,
  parseEventLogs,
  keccak256,
  type Hex,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base, baseSepolia } from 'viem/chains';
import axios from 'axios';
import { CCTP_CONFIG, type CctpChainConfig } from '../config/cctp';
import {
  getCctpIrisBaseUrl,
  resolveCctpNetworkClassFromEnv,
  type CctpNetworkClass,
} from '../config/cctpIris';
import { CCTP_MESSAGE_TRANSMITTER_ABI } from '../abis/cctpMessageTransmitter';
import {
  assertCctpCreditRequest,
  computeCctpUsedNonceKey,
  decodeCctpBurnMessage,
  normalizeAddress,
  type DecodedCctpBurn,
} from '../utils/cctpMessage';
import {
  assertCctpBurnToken,
  assertCctpHeaderDomains,
  assertCctpNetworkClassMatch,
  assertMessageTransmitterEmitter,
} from '../utils/cctpValidation';
import {
  clearCctpNonceInFlight,
  peekCctpNonceRelay,
  recordCctpNonceRelay,
  tryBeginCctpNonceRelay,
  type CctpNonceRelayResult,
} from '../utils/cctpNonceLedger';
import {
  CctpBeneficiaryForbiddenError,
  CctpHttpError,
  CctpRelayUnavailableError,
  CctpValidationError,
} from '../utils/cctpErrors';
import { logSafeError } from '../utils/safeLog';

const RECEIVER_ABI = [
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
  {
    name: 'isReferenceProcessed',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'referenceId', type: 'bytes32' }],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;

export { CCTP_MESSAGE_TRANSMITTER_ABI };

function hexToBytes(hex: string): Uint8Array {
  const normalized = hex.startsWith('0x') ? hex.slice(2) : hex;
  const out = new Uint8Array(normalized.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(normalized.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

function parseMessageSentBytes(logs: Parameters<typeof parseEventLogs>[0]['logs']): Hex {
  const parsed = parseEventLogs({
    abi: CCTP_MESSAGE_TRANSMITTER_ABI,
    eventName: 'MessageSent',
    logs,
  });
  if (parsed.length === 0) {
    throw new CctpValidationError();
  }
  const sent = parsed[0] as unknown as { args: { message: Hex } };
  return sent.args.message;
}

export class CctpRelayerService {
  private relayerAccount;

  constructor() {
    const privateKey = process.env.RELAYER_PRIVATE_KEY;
    if (!privateKey) {
      console.warn('[CCTP Relayer] relayer signing key not configured');
    } else {
      this.relayerAccount = privateKeyToAccount(privateKey as `0x${string}`);
    }
  }

  async relayTransfer(
    burnTxHash: string,
    sourceChainCaip2: string,
    referenceId: string,
    authenticatedWalletAddress: string
  ): Promise<CctpNonceRelayResult & { beneficiary: string }> {
    if (!process.env.ENABLE_CCTP_RELAYER || process.env.ENABLE_CCTP_RELAYER !== 'true') {
      throw new CctpRelayUnavailableError();
    }
    if (!this.relayerAccount) {
      throw new CctpRelayUnavailableError();
    }

    const networkClass = resolveCctpNetworkClassFromEnv();
    const sourceConfig = Object.values(CCTP_CONFIG).find((c) => c.caip2 === sourceChainCaip2);
    if (!sourceConfig) {
      throw new CctpValidationError();
    }
    assertCctpNetworkClassMatch(sourceConfig, networkClass);

    const destNetworkKey = networkClass === 'mainnet' ? 'base' : 'base-sepolia';
    const destConfig = CCTP_CONFIG[destNetworkKey];
    const destChain = networkClass === 'mainnet' ? base : baseSepolia;

    const sourceRpc = process.env[sourceConfig.rpcUrlEnv];
    const destRpc = process.env[destConfig.rpcUrlEnv];
    if (!sourceRpc || !destRpc) {
      throw new CctpRelayUnavailableError();
    }

    const sourcePublicClient = createPublicClient({ transport: http(sourceRpc) });
    const destPublicClient = createPublicClient({ chain: destChain, transport: http(destRpc) });

    const receipt = await sourcePublicClient.getTransactionReceipt({
      hash: burnTxHash as Hex,
    });

    assertMessageTransmitterEmitter(receipt.logs, sourceConfig.messageTransmitter);

    const transmitterLogs = receipt.logs.filter(
      (log) =>
        normalizeAddress(log.address) === normalizeAddress(sourceConfig.messageTransmitter)
    );

    const messageBytes = parseMessageSentBytes(transmitterLogs);
    const messageHash = keccak256(messageBytes);
    const decoded = decodeCctpBurnMessage(messageBytes);
    const messageRaw = hexToBytes(messageBytes);
    assertCctpHeaderDomains(messageRaw, sourceConfig);
    assertCctpBurnToken(messageRaw, 116, sourceConfig.usdcAddress);

    if (
      normalizeAddress(decoded.beneficiary) !== normalizeAddress(authenticatedWalletAddress)
    ) {
      throw new CctpBeneficiaryForbiddenError();
    }

    const receiverAddress = process.env.CCTP_BASE_RECEIVER_CONTRACT;
    if (!receiverAddress) {
      throw new CctpRelayUnavailableError();
    }

    const creditMeta = assertCctpCreditRequest({
      messageBytes,
      claimedAmount: decoded.amount.toString(),
      receiverAddress,
    });

    const alreadyOnChain = await destPublicClient.readContract({
      address: receiverAddress as Hex,
      abi: RECEIVER_ABI,
      functionName: 'isReferenceProcessed',
      args: [messageHash],
    });
    if (alreadyOnChain) {
      const cached = peekCctpNonceRelay(decoded.attestationNonceKey);
      if (cached) {
        return { ...cached, status: 'ALREADY_RELAYED', beneficiary: decoded.beneficiary };
      }
      return {
        status: 'ALREADY_RELAYED',
        mintTx: '',
        creditTx: '',
        beneficiary: decoded.beneficiary,
      };
    }

    const existing = peekCctpNonceRelay(decoded.attestationNonceKey);
    if (existing) {
      return {
        ...existing,
        status: 'ALREADY_RELAYED',
        beneficiary: decoded.beneficiary,
      };
    }

    const begin = tryBeginCctpNonceRelay(decoded.attestationNonceKey);
    if (begin === 'completed') {
      const done = peekCctpNonceRelay(decoded.attestationNonceKey);
      if (done) {
        return { ...done, status: 'ALREADY_RELAYED', beneficiary: decoded.beneficiary };
      }
    }
    if (begin === 'in_flight') {
      throw new CctpHttpError(409, 'CCTP relay already in progress');
    }

    try {
      if (referenceId && referenceId.toLowerCase() !== messageHash.toLowerCase()) {
        console.warn('[CCTP Relayer] client referenceId ignored for on-chain idempotency');
      }

      const attestation = await this.pollIrisAttestation(messageHash, networkClass);

      const mintProven = await this.isDestinationMintProven(destPublicClient, destConfig, decoded);

      let mintTx = '';
      const walletClient = createWalletClient({
        account: this.relayerAccount,
        chain: destChain,
        transport: http(destRpc),
      });

      if (!mintProven) {
        mintTx = await walletClient.sendTransaction({
          chain: destChain,
          to: destConfig.messageTransmitter as Hex,
          data: encodeFunctionData({
            abi: CCTP_MESSAGE_TRANSMITTER_ABI,
            functionName: 'receiveMessage',
            args: [messageBytes, attestation],
          }),
        });

        const mintReceipt = await destPublicClient.waitForTransactionReceipt({
          hash: mintTx as Hex,
        });
        if (mintReceipt.status !== 'success') {
          throw new CctpValidationError();
        }

        const received = parseEventLogs({
          abi: CCTP_MESSAGE_TRANSMITTER_ABI,
          eventName: 'MessageReceived',
          logs: mintReceipt.logs,
        });
        if (received.length === 0) {
          const provenAfter = await this.isDestinationMintProven(
            destPublicClient,
            destConfig,
            decoded
          );
          if (!provenAfter) {
            throw new CctpValidationError();
          }
        }
      }

      const creditTx = await walletClient.sendTransaction({
        chain: destChain,
        to: receiverAddress as Hex,
        data: encodeFunctionData({
          abi: RECEIVER_ABI,
          functionName: 'creditFromCctp',
          args: [messageHash, decoded.beneficiary, creditMeta.amount],
        }),
      });

      const creditReceipt = await destPublicClient.waitForTransactionReceipt({
        hash: creditTx as Hex,
      });
      if (creditReceipt.status !== 'success') {
        throw new CctpValidationError();
      }

      const result: CctpNonceRelayResult = {
        status: 'CREDITED',
        mintTx,
        creditTx,
      };
      recordCctpNonceRelay(decoded.attestationNonceKey, result);

      return {
        ...result,
        beneficiary: decoded.beneficiary,
      };
    } catch (error) {
      clearCctpNonceInFlight(decoded.attestationNonceKey);
      if (error instanceof CctpHttpError) {
        throw error;
      }
      logSafeError('CCTP Relayer', error);
      throw new CctpHttpError(500, 'CCTP relay failed');
    }
  }

  private async isDestinationMintProven(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    destPublicClient: any,
    destConfig: CctpChainConfig,
    decoded: DecodedCctpBurn
  ): Promise<boolean> {
    try {
      const nonceKey = computeCctpUsedNonceKey(decoded.sourceDomain, decoded.nonce);
      const used = (await destPublicClient.readContract({
        address: destConfig.messageTransmitter as Hex,
        abi: CCTP_MESSAGE_TRANSMITTER_ABI,
        functionName: 'usedNonces',
        args: [nonceKey],
      })) as bigint;
      return used > 0n;
    } catch {
      return false;
    }
  }

  private async pollIrisAttestation(
    messageHash: string,
    networkClass: CctpNetworkClass
  ): Promise<Hex> {
    const irisUrl = getCctpIrisBaseUrl(networkClass);

    let attempts = 0;
    while (attempts < 20) {
      try {
        const response = await axios.get(`${irisUrl}/attestations/${messageHash}`);
        if (response.data.status === 'complete' && response.data.attestation) {
          return response.data.attestation as Hex;
        }
      } catch {
        // pending / not found
      }
      await new Promise((r) => setTimeout(r, 5000));
      attempts++;
    }
    throw new CctpValidationError();
  }
}
