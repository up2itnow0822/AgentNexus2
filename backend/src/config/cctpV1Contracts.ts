/**
 * Circle CCTP V1 TokenMessenger addresses by CCTP domain ID and deployment class.
 * Source: https://developers.circle.com/cctp/v1/evm-smart-contracts
 */

import type { CctpNetworkClass } from './cctpIris';

export type CctpV1DomainId = 0 | 2 | 3 | 6;

export interface CctpV1CircleContracts {
  messengerAddress: string;
}

type V1ByNetworkClass = Record<CctpNetworkClass, CctpV1CircleContracts>;

export const CCTP_V1_CONTRACTS: Record<CctpV1DomainId, V1ByNetworkClass> = {
  0: {
    mainnet: {
      messengerAddress: '0xBd3fa81B58Ba92a82136038B25aDec7066af3155',
    },
    testnet: {
      messengerAddress: '0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5',
    },
  },
  2: {
    mainnet: {
      messengerAddress: '0x2B4069517957735bE00ceE0fadAE88a26365528f',
    },
    testnet: {
      messengerAddress: '0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5',
    },
  },
  3: {
    mainnet: {
      messengerAddress: '0x19330d10D9Cc8751218eaf51E8885D058642E08A',
    },
    testnet: {
      messengerAddress: '0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5',
    },
  },
  6: {
    mainnet: {
      messengerAddress: '0x1682Ae6375C4E4A97e4B583BC394c861A46D8962',
    },
    testnet: {
      messengerAddress: '0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5',
    },
  },
};

export function circleV1MessengerAddress(
  cctpDomain: number,
  networkClass: CctpNetworkClass
): string {
  const contracts = CCTP_V1_CONTRACTS[cctpDomain as CctpV1DomainId];
  if (!contracts) {
    throw new Error('Unsupported CCTP domain for V1 messenger lookup');
  }
  return contracts[networkClass].messengerAddress;
}
