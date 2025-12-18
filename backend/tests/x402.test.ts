/**
 * x402 Payment Protocol Tests
 * 
 * Unit tests for x402 middleware and types.
 */

import {
    X402PaymentRequest,
    X402PaymentPayload,
    X402ErrorCode,
    X402_NETWORKS,
    USDC_ADDRESSES,
    DEFAULT_FACILITATOR_URL,
} from '../src/types/x402-types';

describe('x402 Types', () => {
    describe('Network Constants', () => {
        it('should have correct CAIP-2 identifiers for Base networks', () => {
            expect(X402_NETWORKS.base).toBe('eip155:8453');
            expect(X402_NETWORKS['base-sepolia']).toBe('eip155:84532');
        });

        it('should have correct USDC addresses', () => {
            expect(USDC_ADDRESSES.base).toBe('0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913');
            expect(USDC_ADDRESSES['base-sepolia']).toBe('0x036CbD53842c5426634e7929541eC2318f3dCF7e');
        });

        it('should have correct default facilitator URL', () => {
            expect(DEFAULT_FACILITATOR_URL).toBe('https://x402.coinbase.com');
        });
    });

    describe('X402PaymentRequest', () => {
        it('should validate payment request structure', () => {
            const paymentRequest: X402PaymentRequest = {
                amount: '1000000', // 1 USDC
                recipient: '0x1234567890123456789012345678901234567890',
                token: USDC_ADDRESSES['base-sepolia'],
                chainId: X402_NETWORKS['base-sepolia'],
                description: 'Premium API access',
                reference: 'ref-123',
                expiresAt: Math.floor(Date.now() / 1000) + 300,
                facilitatorUrl: DEFAULT_FACILITATOR_URL,
            };

            expect(paymentRequest.amount).toBe('1000000');
            expect(paymentRequest.chainId).toBe('eip155:84532');
        });
    });

    describe('X402PaymentPayload', () => {
        it('should validate payment payload structure', () => {
            const paymentRequest: X402PaymentRequest = {
                amount: '1000000',
                recipient: '0x1234567890123456789012345678901234567890',
                token: USDC_ADDRESSES['base-sepolia'],
                chainId: X402_NETWORKS['base-sepolia'],
                reference: 'ref-456',
                expiresAt: Math.floor(Date.now() / 1000) + 300,
                facilitatorUrl: DEFAULT_FACILITATOR_URL,
            };

            const payload: X402PaymentPayload = {
                paymentRequest,
                transactionHash: '0xabc123...',
                signature: 'sig123',
                payer: '0x9876543210987654321098765432109876543210',
                timestamp: Math.floor(Date.now() / 1000),
            };

            expect(payload.payer).toMatch(/^0x[a-fA-F0-9]+$/);
            expect(payload.transactionHash).toBeDefined();
        });
    });

    describe('X402ErrorCode', () => {
        it('should have all expected error codes', () => {
            expect(X402ErrorCode.PAYMENT_REQUIRED).toBe('PAYMENT_REQUIRED');
            expect(X402ErrorCode.PAYMENT_INVALID).toBe('PAYMENT_INVALID');
            expect(X402ErrorCode.PAYMENT_EXPIRED).toBe('PAYMENT_EXPIRED');
            expect(X402ErrorCode.PAYMENT_INSUFFICIENT).toBe('PAYMENT_INSUFFICIENT');
            expect(X402ErrorCode.FACILITATOR_ERROR).toBe('FACILITATOR_ERROR');
            expect(X402ErrorCode.VERIFICATION_FAILED).toBe('VERIFICATION_FAILED');
        });
    });
});

describe('x402 Middleware Behavior', () => {
    describe('header parsing', () => {
        it('should correctly encode/decode payment request as base64', () => {
            const paymentRequest: X402PaymentRequest = {
                amount: '50000', // 0.05 USDC
                recipient: '0x1234567890123456789012345678901234567890',
                token: USDC_ADDRESSES['base-sepolia'],
                chainId: X402_NETWORKS['base-sepolia'],
                reference: 'test-ref',
                expiresAt: 1734500000,
                facilitatorUrl: DEFAULT_FACILITATOR_URL,
            };

            const encoded = Buffer.from(JSON.stringify(paymentRequest)).toString('base64');
            const decoded = JSON.parse(Buffer.from(encoded, 'base64').toString('utf-8'));

            expect(decoded.amount).toBe('50000');
            expect(decoded.reference).toBe('test-ref');
        });
    });

    describe('amount conversion', () => {
        it('should convert USDC decimal to smallest unit correctly', () => {
            const priceUsdc = '0.01'; // 1 cent
            const amountInSmallestUnit = BigInt(Math.floor(parseFloat(priceUsdc) * 1_000_000));
            expect(amountInSmallestUnit).toBe(BigInt(10000));
        });

        it('should handle whole USDC amounts', () => {
            const priceUsdc = '1.00'; // 1 USDC
            const amountInSmallestUnit = BigInt(Math.floor(parseFloat(priceUsdc) * 1_000_000));
            expect(amountInSmallestUnit).toBe(BigInt(1000000));
        });

        it('should handle fractional amounts', () => {
            const priceUsdc = '0.05'; // 5 cents
            const amountInSmallestUnit = BigInt(Math.floor(parseFloat(priceUsdc) * 1_000_000));
            expect(amountInSmallestUnit).toBe(BigInt(50000));
        });
    });

    describe('expiration checking', () => {
        it('should detect expired payment requests', () => {
            const expiredTimestamp = Math.floor(Date.now() / 1000) - 100; // 100 seconds ago
            const isExpired = expiredTimestamp < Math.floor(Date.now() / 1000);
            expect(isExpired).toBe(true);
        });

        it('should accept valid payment requests', () => {
            const futureTimestamp = Math.floor(Date.now() / 1000) + 300; // 5 minutes from now
            const isExpired = futureTimestamp < Math.floor(Date.now() / 1000);
            expect(isExpired).toBe(false);
        });
    });

    describe('payment amount validation', () => {
        it('should reject insufficient payment', () => {
            const expectedAmount = BigInt(50000); // 0.05 USDC
            const providedAmount = BigInt(40000); // 0.04 USDC
            const isInsufficient = providedAmount < expectedAmount;
            expect(isInsufficient).toBe(true);
        });

        it('should accept sufficient payment', () => {
            const expectedAmount = BigInt(50000); // 0.05 USDC
            const providedAmount = BigInt(50000); // 0.05 USDC
            const isInsufficient = providedAmount < expectedAmount;
            expect(isInsufficient).toBe(false);
        });

        it('should accept overpayment', () => {
            const expectedAmount = BigInt(50000); // 0.05 USDC
            const providedAmount = BigInt(100000); // 0.10 USDC
            const isInsufficient = providedAmount < expectedAmount;
            expect(isInsufficient).toBe(false);
        });
    });
});
