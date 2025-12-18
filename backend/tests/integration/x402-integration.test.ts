/**
 * x402 Integration Tests
 * 
 * Integration tests for the complete x402 payment flow.
 */

import request from 'supertest';
import express, { Express } from 'express';
import { x402Paywall, x402Enabled, getX402Config } from '../../src/middleware/x402';
import {
    X402PaymentRequest,
    X402PaymentPayload,
    X402ErrorCode,
} from '../../src/types/x402-types';

describe('x402 Integration Tests', () => {
    let app: Express;

    beforeEach(() => {
        app = express();
        app.use(express.json());

        // Reset environment
        delete process.env.ENABLE_X402;
        delete process.env.X402_PAYMENT_RECIPIENT;
    });

    describe('x402 Disabled Flow', () => {
        it('should pass through when x402 is disabled', async () => {
            process.env.ENABLE_X402 = 'false';

            app.get('/test', x402Paywall('0.01', 'Test endpoint'), (_req, res) => {
                res.json({ message: 'success' });
            });

            const response = await request(app).get('/test');

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('success');
        });

        it('should not require payment when disabled', async () => {
            // x402 disabled by default when env not set
            app.get('/protected', x402Paywall('1.00', 'Expensive endpoint'), (_req, res) => {
                res.json({ data: 'premium content' });
            });

            const response = await request(app).get('/protected');

            expect(response.status).toBe(200);
            expect(response.body.data).toBe('premium content');
        });
    });

    describe('x402 Enabled - Payment Required Flow', () => {
        beforeEach(() => {
            process.env.ENABLE_X402 = 'true';
            process.env.X402_PAYMENT_RECIPIENT = '0x1234567890123456789012345678901234567890';
            process.env.X402_NETWORK = 'base-sepolia';
        });

        it('should return 402 when no payment provided', async () => {
            app.get('/premium', x402Paywall('0.05', 'Premium data'), (_req, res) => {
                res.json({ data: 'premium' });
            });

            const response = await request(app).get('/premium');

            expect(response.status).toBe(402);
            expect(response.body.code).toBe(X402ErrorCode.PAYMENT_REQUIRED);
            expect(response.body.paymentRequest).toBeDefined();
        });

        it('should include payment request details in 402 response', async () => {
            app.get('/api/test', x402Paywall('0.05', 'Test premium'), (_req, res) => {
                res.json({ success: true });
            });

            const response = await request(app).get('/api/test');

            expect(response.status).toBe(402);

            const paymentRequest = response.body.paymentRequest;
            expect(paymentRequest.amount).toBe('50000'); // 0.05 USDC in smallest unit
            expect(paymentRequest.recipient).toBe('0x1234567890123456789012345678901234567890');
            expect(paymentRequest.chainId).toBe('eip155:84532'); // Base Sepolia
            expect(paymentRequest.expiresAt).toBeGreaterThan(Math.floor(Date.now() / 1000));
        });

        it('should include X-Payment-Required header', async () => {
            app.get('/api/premium', x402Paywall('0.10', 'Premium access'), (_req, res) => {
                res.json({ data: 'premium' });
            });

            const response = await request(app).get('/api/premium');

            expect(response.status).toBe(402);
            expect(response.headers['x-payment-required']).toBeDefined();

            // Decode and verify header
            const headerContent = Buffer.from(response.headers['x-payment-required'], 'base64').toString('utf-8');
            const paymentRequest = JSON.parse(headerContent) as X402PaymentRequest;

            expect(paymentRequest.amount).toBe('100000'); // 0.10 USDC
        });
    });

    describe('x402 Payment Validation', () => {
        beforeEach(() => {
            process.env.ENABLE_X402 = 'true';
            process.env.X402_PAYMENT_RECIPIENT = '0x1234567890123456789012345678901234567890';
        });

        it('should reject expired payment requests', async () => {
            app.get('/test-expired', x402Paywall('0.01', 'Test'), (_req, res) => {
                res.json({ success: true });
            });

            // Create an expired payment
            const expiredPayment: X402PaymentPayload = {
                paymentRequest: {
                    amount: '10000',
                    recipient: '0x1234567890123456789012345678901234567890',
                    token: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
                    chainId: 'eip155:84532',
                    reference: 'test-ref',
                    expiresAt: Math.floor(Date.now() / 1000) - 100, // Expired
                    facilitatorUrl: 'https://x402.coinbase.com',
                },
                transactionHash: '0xabc123',
                signature: 'sig',
                payer: '0x9876543210987654321098765432109876543210',
                timestamp: Math.floor(Date.now() / 1000) - 200,
            };

            const response = await request(app)
                .get('/test-expired')
                .set('X-Payment', Buffer.from(JSON.stringify(expiredPayment)).toString('base64'));

            expect(response.status).toBe(402);
            expect(response.body.code).toBe(X402ErrorCode.PAYMENT_EXPIRED);
        });

        it('should reject insufficient payment amount', async () => {
            app.get('/test-insufficient', x402Paywall('0.05', 'Test'), (_req, res) => {
                res.json({ success: true });
            });

            // Create payment with insufficient amount
            const insufficientPayment: X402PaymentPayload = {
                paymentRequest: {
                    amount: '30000', // 0.03 USDC, but 0.05 required
                    recipient: '0x1234567890123456789012345678901234567890',
                    token: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
                    chainId: 'eip155:84532',
                    reference: 'test-ref',
                    expiresAt: Math.floor(Date.now() / 1000) + 300,
                    facilitatorUrl: 'https://x402.coinbase.com',
                },
                transactionHash: '0xabc123',
                signature: 'sig',
                payer: '0x9876543210987654321098765432109876543210',
                timestamp: Math.floor(Date.now() / 1000),
            };

            const response = await request(app)
                .get('/test-insufficient')
                .set('X-Payment', Buffer.from(JSON.stringify(insufficientPayment)).toString('base64'));

            expect(response.status).toBe(402);
            expect(response.body.code).toBe(X402ErrorCode.PAYMENT_INSUFFICIENT);
        });
    });

    describe('x402 Configuration', () => {
        it('should correctly report enabled status', () => {
            process.env.ENABLE_X402 = 'true';
            expect(x402Enabled()).toBe(true);

            process.env.ENABLE_X402 = 'false';
            expect(x402Enabled()).toBe(false);

            delete process.env.ENABLE_X402;
            expect(x402Enabled()).toBe(false);
        });

        it('should return masked config for debugging', () => {
            process.env.ENABLE_X402 = 'true';
            process.env.X402_PAYMENT_RECIPIENT = '0x1234567890123456789012345678901234567890';
            process.env.X402_NETWORK = 'base-sepolia';

            const config = getX402Config();

            expect(config.enabled).toBe(true);
            expect(config.facilitator.network).toBe('base-sepolia');
            // Recipient should be masked
            expect(config.facilitator.recipientAddress).toBe('0x1234...7890');
        });

        it('should handle missing recipient gracefully', () => {
            process.env.ENABLE_X402 = 'true';
            delete process.env.X402_PAYMENT_RECIPIENT;

            app.get('/test-missing', x402Paywall('0.01', 'Test'), (_req, res) => {
                res.json({ success: true });
            });

            // Without recipient configured, should return 500
            return request(app)
                .get('/test-missing')
                .expect(500)
                .then(response => {
                    expect(response.body.code).toBe(X402ErrorCode.FACILITATOR_ERROR);
                });
        });
    });

    describe('x402 Multiple Price Points', () => {
        beforeEach(() => {
            process.env.ENABLE_X402 = 'true';
            process.env.X402_PAYMENT_RECIPIENT = '0x1234567890123456789012345678901234567890';
        });

        it('should support different prices for different endpoints', async () => {
            app.get('/cheap', x402Paywall('0.01', 'Cheap endpoint'), (_req, res) => {
                res.json({ tier: 'cheap' });
            });

            app.get('/expensive', x402Paywall('1.00', 'Expensive endpoint'), (_req, res) => {
                res.json({ tier: 'expensive' });
            });

            const cheapResponse = await request(app).get('/cheap');
            const expensiveResponse = await request(app).get('/expensive');

            expect(cheapResponse.body.paymentRequest.amount).toBe('10000');   // 0.01 USDC
            expect(expensiveResponse.body.paymentRequest.amount).toBe('1000000'); // 1.00 USDC
        });
    });

    describe('x402 Hardening - Local Validation', () => {
        beforeEach(() => {
            process.env.ENABLE_X402 = 'true';
            process.env.X402_PAYMENT_RECIPIENT = '0x1234567890123456789012345678901234567890';
            process.env.X402_NETWORK = 'base-sepolia';
        });

        it('should reject mismatched recipient address', async () => {
            app.get('/test-recipient', x402Paywall('0.01', 'Test'), (_req, res) => {
                res.json({ success: true });
            });

            const badRecipientPayment: X402PaymentPayload = {
                paymentRequest: {
                    amount: '10000',
                    recipient: '0xWRONG_RECIPIENT_ADDRESS_HERE_WRONG_ADDR', // Wrong recipient
                    token: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
                    chainId: 'eip155:84532',
                    reference: 'test-ref',
                    expiresAt: Math.floor(Date.now() / 1000) + 300,
                    facilitatorUrl: 'https://x402.coinbase.com',
                },
                transactionHash: '0xabc123',
                signature: 'sig',
                payer: '0x9876543210987654321098765432109876543210',
                timestamp: Math.floor(Date.now() / 1000),
            };

            const response = await request(app)
                .get('/test-recipient')
                .set('X-Payment', Buffer.from(JSON.stringify(badRecipientPayment)).toString('base64'));

            expect(response.status).toBe(402);
            expect(response.body.code).toBe(X402ErrorCode.PAYMENT_INVALID);
            expect(response.body.error).toContain('recipient mismatch');
        });

        it('should reject mismatched token address', async () => {
            app.get('/test-token', x402Paywall('0.01', 'Test'), (_req, res) => {
                res.json({ success: true });
            });

            const badTokenPayment: X402PaymentPayload = {
                paymentRequest: {
                    amount: '10000',
                    recipient: '0x1234567890123456789012345678901234567890',
                    token: '0xWRONG_TOKEN_ADDRESS_HERE_NOT_USDC_ADDR', // Wrong token
                    chainId: 'eip155:84532',
                    reference: 'test-ref',
                    expiresAt: Math.floor(Date.now() / 1000) + 300,
                    facilitatorUrl: 'https://x402.coinbase.com',
                },
                transactionHash: '0xabc123',
                signature: 'sig',
                payer: '0x9876543210987654321098765432109876543210',
                timestamp: Math.floor(Date.now() / 1000),
            };

            const response = await request(app)
                .get('/test-token')
                .set('X-Payment', Buffer.from(JSON.stringify(badTokenPayment)).toString('base64'));

            expect(response.status).toBe(402);
            expect(response.body.code).toBe(X402ErrorCode.PAYMENT_INVALID);
            expect(response.body.error).toContain('token mismatch');
        });

        it('should reject mismatched chain ID', async () => {
            app.get('/test-chain', x402Paywall('0.01', 'Test'), (_req, res) => {
                res.json({ success: true });
            });

            const badChainPayment: X402PaymentPayload = {
                paymentRequest: {
                    amount: '10000',
                    recipient: '0x1234567890123456789012345678901234567890',
                    token: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
                    chainId: 'eip155:1', // Wrong chain (mainnet ETH instead of Base Sepolia)
                    reference: 'test-ref',
                    expiresAt: Math.floor(Date.now() / 1000) + 300,
                    facilitatorUrl: 'https://x402.coinbase.com',
                },
                transactionHash: '0xabc123',
                signature: 'sig',
                payer: '0x9876543210987654321098765432109876543210',
                timestamp: Math.floor(Date.now() / 1000),
            };

            const response = await request(app)
                .get('/test-chain')
                .set('X-Payment', Buffer.from(JSON.stringify(badChainPayment)).toString('base64'));

            expect(response.status).toBe(402);
            expect(response.body.code).toBe(X402ErrorCode.PAYMENT_INVALID);
            expect(response.body.error).toContain('chain mismatch');
        });

        it('should reject oversized X-Payment headers', async () => {
            app.get('/test-oversize', x402Paywall('0.01', 'Test'), (_req, res) => {
                res.json({ success: true });
            });

            // Create a payload that exceeds 64KB when base64 encoded
            const oversizedData = 'x'.repeat(100 * 1024); // 100KB of data
            const oversizedBase64 = Buffer.from(oversizedData).toString('base64');

            const response = await request(app)
                .get('/test-oversize')
                .set('X-Payment', oversizedBase64);

            // Should be treated as invalid payment (parsed as null due to size)
            expect(response.status).toBe(402);
            expect(response.body.code).toBe(X402ErrorCode.PAYMENT_REQUIRED);
        });
    });
});
