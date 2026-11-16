import {
  encodeAbiParameters,
  encodeEventTopics,
  getAbiItem,
  type Hex,
  type Log,
} from 'viem';
import { CCTP_CONFIG, type CctpChainConfig } from '../../src/config/cctp';
import { CCTP_MESSAGE_TRANSMITTER_ABI } from '../../src/abis/cctpMessageTransmitter';

type MessageTransmitterAbi = typeof CCTP_MESSAGE_TRANSMITTER_ABI;
type MessageTransmitterEvent = MessageTransmitterAbi[number] & { type: 'event' };

function encodeTransmitterEventLog(
  eventName: 'MessageSent' | 'MessageReceived',
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: any
): { topics: [Hex, ...Hex[]]; data: Hex } {
  const abiItem = getAbiItem({
    abi: CCTP_MESSAGE_TRANSMITTER_ABI,
    name: eventName,
  }) as MessageTransmitterEvent;

  const topics = encodeEventTopics({
    abi: CCTP_MESSAGE_TRANSMITTER_ABI,
    eventName,
    args,
  }) as [Hex, ...Hex[]];

  const nonIndexed = abiItem.inputs.filter((input) => !input.indexed);
  const data =
    nonIndexed.length === 0
      ? ('0x' as Hex)
      : encodeAbiParameters(
          nonIndexed,
          nonIndexed.map((input) => args[input.name as string])
        );

  return { topics, data };
}

export function encodeMessageSentLog(
  cfg: CctpChainConfig,
  message: Hex,
  txHash: Hex
): Log {
  const encoded = encodeTransmitterEventLog('MessageSent', { message });

  return {
    address: cfg.messageTransmitter as Hex,
    blockHash: `0x${'00'.repeat(32)}`,
    blockNumber: 1n,
    data: encoded.data,
    logIndex: 0,
    removed: false,
    topics: encoded.topics,
    transactionHash: txHash,
    transactionIndex: 0,
  };
}

export function encodeMessageReceivedLog(params: {
  caller: Hex;
  sourceDomain: number;
  nonce: bigint;
  sender: Hex;
  messageBody: Hex;
  transmitter: Hex;
}): Log {
  const encoded = encodeTransmitterEventLog('MessageReceived', {
    caller: params.caller,
    sourceDomain: params.sourceDomain,
    nonce: params.nonce,
    sender: params.sender,
    messageBody: params.messageBody,
  });

  return {
    address: params.transmitter,
    blockHash: `0x${'00'.repeat(32)}`,
    blockNumber: 2n,
    data: encoded.data,
    logIndex: 0,
    removed: false,
    topics: encoded.topics,
    transactionHash: `0x${'bb'.repeat(32)}`,
    transactionIndex: 0,
  };
}

export function arbSepoliaTransmitter(): CctpChainConfig {
  return CCTP_CONFIG['arbitrum-sepolia'];
}

export function arbMainnetTransmitter(): CctpChainConfig {
  return CCTP_CONFIG.arbitrum;
}
