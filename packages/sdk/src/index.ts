/**
 * @agentnexus/sdk
 * 
 * TypeScript SDK for the AgentNexus AI Agent Marketplace
 * 
 * @packageDocumentation
 */

// Main client export
export { AgentNexusClient } from './client';

// Type exports
export type {
    // Agent types
    Agent,
    AgentExecution,
    ExecutionStatus,

    // Payment types
    Payment,
    PaymentStatus,

    // Pipeline types (A2A Protocol)
    Pipeline,
    PipelineStep,
    PipelineStatus,
    StepStatus,

    // Entitlement types
    Entitlement,

    // Configuration types
    ChainConfig,
    ContractAddresses,
    AgentNexusConfig,

    // API types
    ApiResponse,
    PaginatedResponse
} from './types';

// Pre-configured chain configs
export const CHAIN_CONFIGS = {
    base: {
        chainId: 8453,
        name: 'Base',
        rpcUrl: 'https://mainnet.base.org',
        contracts: {
            escrow: '0x37A7B1f10b87f31ad916Fb3518118f8AA0d8d2fC',
            entitlements: '0x3c8f32F9cF41Dc255129d6Add447218053743b33'
        }
    },
    baseSepolia: {
        chainId: 84532,
        name: 'Base Sepolia',
        rpcUrl: 'https://sepolia.base.org',
        contracts: {
            escrow: '0x14F12c3F36DD6Fa860E21f7D51f696231057A8a0',
            entitlements: '0x1662AeCE70441B8482e09f04D3Ef3954a8E26C0d'
        }
    }
} as const;

// Version
export const VERSION = '0.1.0';
