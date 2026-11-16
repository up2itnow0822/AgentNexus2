/** Circle CCTP V1 MessageTransmitter ABI (subset used by relayer). */

export const CCTP_MESSAGE_TRANSMITTER_ABI = [
  {
    anonymous: false,
    inputs: [{ indexed: false, internalType: 'bytes', name: 'message', type: 'bytes' }],
    name: 'MessageSent',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'caller', type: 'address' },
      { indexed: false, internalType: 'uint32', name: 'sourceDomain', type: 'uint32' },
      { indexed: true, internalType: 'uint64', name: 'nonce', type: 'uint64' },
      { indexed: false, internalType: 'bytes32', name: 'sender', type: 'bytes32' },
      { indexed: false, internalType: 'bytes', name: 'messageBody', type: 'bytes' },
    ],
    name: 'MessageReceived',
    type: 'event',
  },
  {
    inputs: [
      { internalType: 'bytes', name: 'message', type: 'bytes' },
      { internalType: 'bytes', name: 'attestation', type: 'bytes' },
    ],
    name: 'receiveMessage',
    outputs: [{ internalType: 'bool', name: 'success', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'bytes32', name: '_nonce', type: 'bytes32' }],
    name: 'usedNonces',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;
