import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { CctpBeneficiaryForbiddenError } from '../src/utils/cctpErrors';

process.env.JWT_SECRET = 'test-jwt-secret-for-cctp-submit-tests';

const mockRelayTransfer = jest.fn();

jest.mock('../src/services/CctpRelayerService', () => ({
  CctpRelayerService: jest.fn().mockImplementation(() => ({
    relayTransfer: (...args: unknown[]) => mockRelayTransfer(...args),
  })),
}));

import cctpPaymentsRouter from '../src/routes/cctp-payments';
import { JWT_ALGORITHM } from '../src/config/jwt';

describe('POST /api/payments/cctp/submit', () => {
  const app = express();
  app.use(express.json());
  app.use('/api/payments/cctp', cctpPaymentsRouter);

  const JWT_SECRET = process.env.JWT_SECRET!;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const authHeader = (wallet = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa') => {
    const token = jwt.sign(
      { id: 'user-1', walletAddress: wallet },
      JWT_SECRET,
      { algorithm: JWT_ALGORITHM, expiresIn: '1h' }
    );
    return { Authorization: `Bearer ${token}` };
  };

  const baseBody = {
    burnTxHash: '0x' + 'ab'.repeat(32),
    sourceChain: 'eip155:421614',
    referenceId: '0x' + 'cd'.repeat(32),
  };

  test('rejects unauthenticated submit with 401', async () => {
    const res = await request(app).post('/api/payments/cctp/submit').send(baseBody);
    expect(res.status).toBe(401);
    expect(mockRelayTransfer).not.toHaveBeenCalled();
  });

  test('rejects forged token with wrong secret', async () => {
    const token = jwt.sign(
      { id: 'user-1', walletAddress: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' },
      'not-the-configured-secret',
      { algorithm: JWT_ALGORITHM, expiresIn: '1h' }
    );

    const res = await request(app)
      .post('/api/payments/cctp/submit')
      .set('Authorization', `Bearer ${token}`)
      .send(baseBody);

    expect(res.status).toBe(401);
    expect(mockRelayTransfer).not.toHaveBeenCalled();
  });

  test('rejects unsupported JWT algorithm', async () => {
    const token = jwt.sign(
      { id: 'user-1', walletAddress: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' },
      JWT_SECRET,
      { algorithm: 'HS384' }
    );

    const res = await request(app)
      .post('/api/payments/cctp/submit')
      .set('Authorization', `Bearer ${token}`)
      .send(baseBody);

    expect(res.status).toBe(401);
  });

  test('returns 403 when attested beneficiary does not match authenticated wallet', async () => {
    mockRelayTransfer.mockRejectedValueOnce(new CctpBeneficiaryForbiddenError());

    const res = await request(app)
      .post('/api/payments/cctp/submit')
      .set(authHeader())
      .send(baseBody);

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Beneficiary not authorized for this relay');
  });

  test('accepts authenticated submit and passes wallet to relayer', async () => {
    mockRelayTransfer.mockResolvedValueOnce({
      status: 'CREDITED',
      mintTx: '0xmint',
      creditTx: '0xcredit',
      beneficiary: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    });

    const res = await request(app)
      .post('/api/payments/cctp/submit')
      .set(authHeader())
      .send(baseBody);

    expect(res.status).toBe(200);
    expect(mockRelayTransfer).toHaveBeenCalledWith(
      baseBody.burnTxHash,
      baseBody.sourceChain,
      baseBody.referenceId,
      '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
    );
  });
});
