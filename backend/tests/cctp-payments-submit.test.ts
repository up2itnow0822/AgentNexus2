import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';

const mockRelayTransfer = jest.fn();

jest.mock('../src/services/CctpRelayerService', () => ({
  CctpRelayerService: jest.fn().mockImplementation(() => ({
    relayTransfer: (...args: unknown[]) => mockRelayTransfer(...args),
  })),
}));

import cctpPaymentsRouter from '../src/routes/cctp-payments';

describe('POST /api/payments/cctp/submit', () => {
  const app = express();
  app.use(express.json());
  app.use('/api/payments/cctp', cctpPaymentsRouter);

  // Matches auth middleware module constant when JWT_SECRET is unset at import time.
  const JWT_SECRET = 'default-secret-key-change-in-production';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const authHeader = () => {
    const token = jwt.sign(
      { id: 'user-1', walletAddress: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' },
      JWT_SECRET
    );
    return { Authorization: `Bearer ${token}` };
  };

  const baseBody = {
    burnTxHash: '0x' + 'ab'.repeat(32),
    sourceChain: 'eip155:421614',
    referenceId: '0x' + 'cd'.repeat(32),
  };

  test('rejects unauthenticated submit', async () => {
    const res = await request(app).post('/api/payments/cctp/submit').send(baseBody);
    expect(res.status).toBe(401);
    expect(mockRelayTransfer).not.toHaveBeenCalled();
  });

  test('rejects mismatched beneficiary from optional body field', async () => {
    mockRelayTransfer.mockRejectedValueOnce(
      new Error(
        'Claimed beneficiary 0x2222222222222222222222222222222222222222 does not match attested messageSender 0x1111111111111111111111111111111111111111'
      )
    );

    const res = await request(app)
      .post('/api/payments/cctp/submit')
      .set(authHeader())
      .send({
        ...baseBody,
        beneficiary: '0x2222222222222222222222222222222222222222',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/does not match attested messageSender/);
  });

  test('accepts authenticated submit without client beneficiary', async () => {
    mockRelayTransfer.mockResolvedValueOnce({
      status: 'CREDITED',
      mintTx: '0xmint',
      creditTx: '0xcredit',
      beneficiary: '0x1111111111111111111111111111111111111111',
    });

    const res = await request(app)
      .post('/api/payments/cctp/submit')
      .set(authHeader())
      .send(baseBody);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.beneficiary).toBe('0x1111111111111111111111111111111111111111');
    expect(mockRelayTransfer).toHaveBeenCalledWith(
      baseBody.burnTxHash,
      baseBody.sourceChain,
      baseBody.referenceId,
      undefined
    );
  });
});
