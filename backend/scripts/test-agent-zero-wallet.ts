import { AgentZero } from '../src/services/agentZero/AgentZero';
import { VectorMemory } from '../src/services/memory/VectorMemory';
import { AgentZeroAdapter } from '../src/services/agentZero/AgentZeroAdapter';
import { WalletService } from '../src/services/WalletService';
import { PrismaClient } from '@prisma/client';
import Docker from 'dockerode';
import { AgentZeroTierService } from '../src/services/agentZero/AgentZeroTierService';
import { agentZeroConfig } from '../src/config/agentZero';

// Mock OpenAI Key for testing
process.env.OPENAI_API_KEY = "sk-test-dummy-key";

// Mock dependencies
const mockPrisma = new PrismaClient();
const mockDocker = new Docker();
const mockWalletService = new WalletService();
const mockTierService = new AgentZeroTierService(mockPrisma, mockWalletService, agentZeroConfig);
const mockAdapter = new AgentZeroAdapter(mockDocker, mockPrisma, mockTierService, agentZeroConfig);

// Mock VectorMemory
const mockMemory = {
    searchMemories: async () => [],
    createMemory: async () => { },
} as unknown as VectorMemory;

async function main() {
    console.log("🚀 Starting Agent Zero Wallet Test...");

    // Instantiate AgentZero with WalletService
    const agent = new AgentZero(mockMemory, mockAdapter, mockWalletService);

    // Test 1: Check Wallet Tool
    console.log("\n1. Testing 'check_wallet' tool directly...");
    // We need to access the tool directly or simulate a run that triggers it.
    // Since tools are private, we'll simulate a run where the agent decides to check its wallet.
    // Or we can use the 'run' method and hope the LLM picks it up, but that requires an OpenAI key.
    // For this test, we'll inspect the private tools array if we can, or just rely on the fact that it compiles.

    // Actually, let's just verify the run method doesn't crash on the initial balance check.
    console.log("   Running agent loop (mocking OpenAI response would be ideal, but checking init logic first)...");

    try {
        // We expect this to fail if we don't mock OpenAI, but the balance check happens BEFORE OpenAI call.
        // So if we see the "Low balance" warning or pass that check, we know it works.
        // We'll catch the OpenAI error.
        await agent.run('test-user', 'Check my wallet balance');
    } catch (error: any) {
        if (error.message.includes('OPENAI_API_KEY')) {
            console.log("✅ Passed Balance Check (failed at OpenAI as expected)");
        } else {
            console.log(`⚠️ Unexpected error: ${error.message}`);
        }
    }

    // Test 2: Verify WalletService methods
    console.log("\n2. Verifying WalletService mocks...");
    const address = await mockWalletService.getAgentAddress('agent-zero');
    const balance = await mockWalletService.getBalance(address);
    console.log(`   Address: ${address}`);
    console.log(`   Balance: ${balance}`);

    if (address.startsWith('0x') && balance === '1.5') {
        console.log("✅ WalletService mocks working correctly");
    } else {
        console.error("❌ WalletService mocks failed");
    }
}

main().catch(console.error);
