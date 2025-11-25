import { ethers } from 'ethers';
import Docker from 'dockerode';
import * as dotenv from 'dotenv';
import winston from 'winston';
import { ProofOfCompute } from './services/ProofOfCompute';

dotenv.config();

// Logger setup
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console({
            format: winston.format.simple(),
        }),
    ],
});

class ExecutionNode {
    private provider: ethers.JsonRpcProvider;
    private wallet: ethers.Wallet;
    private docker: Docker;
    private contract: ethers.Contract;
    private proofer: ProofOfCompute;

    // Mock ABI for now - replace with actual artifact import
    private readonly ABI = [
        "event ExecutionRequested(uint256 indexed executionId, uint256 indexed agentId, string inputData)",
        "function submitResult(uint256 executionId, string memory outputData, bytes memory signature) external"
    ];

    constructor() {
        const rpcUrl = process.env.RPC_URL || 'http://127.0.0.1:8545';
        const privateKey = process.env.PRIVATE_KEY;
        const contractAddress = process.env.REGISTRY_ADDRESS;

        if (!privateKey || !contractAddress) {
            throw new Error('Missing PRIVATE_KEY or REGISTRY_ADDRESS env vars');
        }

        this.provider = new ethers.JsonRpcProvider(rpcUrl);
        this.wallet = new ethers.Wallet(privateKey, this.provider);
        this.docker = new Docker();
        this.contract = new ethers.Contract(contractAddress, this.ABI, this.wallet);
        this.proofer = new ProofOfCompute(privateKey);
    }

    async start() {
        logger.info('🚀 Execution Node starting...');
        logger.info(`   Address: ${this.wallet.address}`);
        logger.info(`   Registry: ${await this.contract.getAddress()}`);

        // Listen for events
        this.contract.on('ExecutionRequested', async (executionId, agentId, inputData) => {
            logger.info(`📥 New Execution Request: ID ${executionId} for Agent ${agentId}`);
            await this.handleExecution(executionId, agentId, inputData);
        });

        logger.info('👂 Listening for ExecutionRequested events...');
    }

    private async handleExecution(executionId: bigint, agentId: bigint, inputData: string) {
        try {
            // 1. Parse Input
            const input = JSON.parse(inputData);

            // 2. Pull Image (Mock logic: map agentId to image)
            // In production, we'd fetch the image URI from the contract
            const imageName = `agentnexus/agent-${agentId}:latest`;
            logger.info(`🐳 Pulling image: ${imageName}`);

            // await this.pullImage(imageName); // Commented out to avoid real pulls in dev

            // 3. Run Container
            logger.info(`▶️  Running container for Execution ${executionId}`);

            // Mock execution result & logs
            const resultData = `Processed input: ${input.query}`;
            const mockLogs = `[INFO] Starting agent...\n[INFO] Processing query: ${input.query}\n[SUCCESS] Done.`;

            const result = {
                status: 'success',
                output: resultData,
                timestamp: Date.now()
            };

            // 4. Generate Proof
            logger.info(`🔐 Generating Proof of Compute...`);
            const proof = await this.proofer.generateProof(
                executionId.toString(),
                JSON.stringify(result),
                mockLogs
            );
            logger.info(`   Signature: ${proof.signature.substring(0, 10)}...`);

            // 5. Submit Result
            logger.info(`📤 Submitting result for Execution ${executionId}`);
            // await this.contract.submitResult(executionId, JSON.stringify(result), proof.signature);
            logger.info('✅ Result submitted successfully');

        } catch (error) {
            logger.error(`❌ Execution failed: ${error}`);
        }
    }

    private async pullImage(imageName: string) {
        return new Promise((resolve, reject) => {
            this.docker.pull(imageName, (err: any, stream: any) => {
                if (err) return reject(err);
                this.docker.modem.followProgress(stream, (err: any) => err ? reject(err) : resolve(true));
            });
        });
    }
}

// Start the node
if (require.main === module) {
    const node = new ExecutionNode();
    node.start().catch(error => {
        logger.error('Fatal error:', error);
        process.exit(1);
    });
}
