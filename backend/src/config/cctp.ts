/**
 * Circle CCTP Configuration
 * 
 * Official contract addresses and domain IDs for Cross-Chain Transfer Protocol.
 * Source: https://developers.circle.com/stablecoins/docs/cctp-protocol-contract-addresses
 */

import type { CctpNetworkClass } from './cctpIris';

export interface CctpChainConfig {
    caip2: string;              // eip155:10 etc
    chainId: number;            // 10, 42161, 8453
    cctpDomain: number;         // Circle CCTP Domain ID
    networkClass: CctpNetworkClass;
    usdcAddress: string;        // USDC Token Contract
    tokenMessenger: string;     // TokenMessengerV2
    /** Circle CCTP V1 TokenMessenger — message header sender / recipient binding. */
    v1TokenMessenger: string;
    messageTransmitter: string; // MessageTransmitterV2
    rpcUrlEnv: string;          // Env var name for RPC URL
}

export const CCTP_CONFIG: Record<string, CctpChainConfig> = {
    // ============================================
    // MAINNETS
    // ============================================
    ethereum: {
        caip2: 'eip155:1',
        chainId: 1,
        cctpDomain: 0,
        networkClass: 'mainnet',
        usdcAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        // Using V1 (Legacy) contracts - the V1 signature is depositForBurn(uint256, uint32, bytes32, address)
        tokenMessenger: '0xBd3fa81B58Ba92a82136038B25aDec7066af3155', // V1 Legacy
        v1TokenMessenger: '0xBd3fa81B58Ba92a82136038B25aDec7066af3155',
        messageTransmitter: '0x0a992d191DEeC32aFe36203Ad87D7d289a738F81', // V1
        rpcUrlEnv: 'ETHEREUM_MAINNET_RPC_URL'
    },
    base: {
        caip2: 'eip155:8453',
        chainId: 8453,
        cctpDomain: 6,
        networkClass: 'mainnet',
        usdcAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        tokenMessenger: '0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d', // V2
        v1TokenMessenger: '0x1682Ae6375C4E4A97e4B583BC394c861A46D8962',
        messageTransmitter: '0xAD09780d193884d503182aD4588450C416D6F9D4', // V1/V2 MessageTransmitter (verified on-chain)
        rpcUrlEnv: 'BASE_RPC_URL'
    },
    arbitrum: {
        caip2: 'eip155:42161',
        chainId: 42161,
        cctpDomain: 3,
        networkClass: 'mainnet',
        usdcAddress: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
        tokenMessenger: '0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d', // V2
        v1TokenMessenger: '0x19330d10D9Cc8751218eaf51E8885D058642E08A',
        messageTransmitter: '0xC30362313FBBA5cf9163F0bb16a0e01f01A896ca',
        rpcUrlEnv: 'ARBITRUM_RPC_URL'
    },
    optimism: {
        caip2: 'eip155:10',
        chainId: 10,
        cctpDomain: 2,
        networkClass: 'mainnet',
        usdcAddress: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
        tokenMessenger: '0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d', // V2
        v1TokenMessenger: '0x2B4069517957735bE00ceE0fadAE88a26365528f',
        messageTransmitter: '0x4D41f22c5a0e5c74090899E5a8Fb597a8842b3e8',
        rpcUrlEnv: 'OPTIMISM_RPC_URL'
    },

    // ============================================
    // TESTNETS (Sepolia)
    // ============================================
    'base-sepolia': {
        caip2: 'eip155:84532',
        chainId: 84532,
        cctpDomain: 6,
        networkClass: 'testnet',
        usdcAddress: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
        tokenMessenger: '0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA',
        v1TokenMessenger: '0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5',
        messageTransmitter: '0x7865fAfC2db2093669d92c0F33AeEF291086BEFD', // V1/Testnet address
        rpcUrlEnv: 'BASE_SEPOLIA_RPC_URL'
    },
    'arbitrum-sepolia': {
        caip2: 'eip155:421614',
        chainId: 421614,
        cctpDomain: 3,
        networkClass: 'testnet',
        usdcAddress: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
        tokenMessenger: '0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA',
        v1TokenMessenger: '0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5',
        messageTransmitter: '0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275', // Discovered via localMessageTransmitter()
        rpcUrlEnv: 'ARBITRUM_RPC_URL'
    },
    'optimism-sepolia': {
        caip2: 'eip155:11155420',
        chainId: 11155420,
        cctpDomain: 2,
        networkClass: 'testnet',
        usdcAddress: '0x5fd84259d66Cd46123540766Be93DFE6D43130D5',
        tokenMessenger: '0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA',
        v1TokenMessenger: '0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5',
        messageTransmitter: '0x7865fAfC2db2093669d92c0F33AeEF291086BEFD',
        rpcUrlEnv: 'OPTIMISM_RPC_URL'
    },
    'ethereum-sepolia': {
        caip2: 'eip155:11155111',
        chainId: 11155111,
        cctpDomain: 0,
        networkClass: 'testnet',
        usdcAddress: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
        tokenMessenger: '0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA',
        v1TokenMessenger: '0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5',
        messageTransmitter: '0x7865fAfC2db2093669d92c0F33AeEF291086BEFD',
        rpcUrlEnv: 'ETHEREUM_SEPOLIA_RPC_URL'
    }
};
