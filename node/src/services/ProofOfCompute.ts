import { ethers } from 'ethers';
import crypto from 'crypto';

export interface Proof {
    executionId: string;
    resultHash: string;
    logHash: string;
    signature: string;
    timestamp: number;
}

export class ProofOfCompute {
    private wallet: ethers.Wallet;

    constructor(privateKey: string) {
        this.wallet = new ethers.Wallet(privateKey);
    }

    /**
     * Generate a cryptographic proof of execution
     * @param executionId The unique ID of the execution
     * @param result The output data from the agent
     * @param logs The stdout/stderr logs from the container
     */
    async generateProof(executionId: string, result: string, logs: string): Promise<Proof> {
        const timestamp = Date.now();

        // 1. Hash the result
        const resultHash = ethers.keccak256(ethers.toUtf8Bytes(result));

        // 2. Hash the logs (Proof of Work/Compute)
        // In a real system, we might require a specific "salt" or "difficulty" here
        const logHash = ethers.keccak256(ethers.toUtf8Bytes(logs));

        // 3. Create the payload to sign
        // We pack the data to ensure deterministic byte order
        const payload = ethers.solidityPackedKeccak256(
            ['string', 'bytes32', 'bytes32', 'uint256'],
            [executionId, resultHash, logHash, timestamp]
        );

        // 4. Sign the payload
        const signature = await this.wallet.signMessage(ethers.getBytes(payload));

        return {
            executionId,
            resultHash,
            logHash,
            signature,
            timestamp
        };
    }

    /**
     * Verify a proof (Client-side or On-chain simulation)
     */
    verifyProof(proof: Proof, signerAddress: string): boolean {
        const payload = ethers.solidityPackedKeccak256(
            ['string', 'bytes32', 'bytes32', 'uint256'],
            [proof.executionId, proof.resultHash, proof.logHash, proof.timestamp]
        );

        const recoveredAddress = ethers.verifyMessage(ethers.getBytes(payload), proof.signature);
        return recoveredAddress.toLowerCase() === signerAddress.toLowerCase();
    }
}
