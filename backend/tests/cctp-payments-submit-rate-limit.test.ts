import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { CctpRateLimitError } from '../src/utils/cctpErrors';
import { JWT_ALGORITHM } from '../src/config/jwt';

process.env.JWT_SECRET = 'test-jwt-secret-for-cctp-submit-rate-limit-tests';

const mockRelayTransfer = jest.fn();

jest.mock('../src/services/CctpRelayerService', () => ({
  CctpRelayerService: jest.fn().mockImplementation(() => ({
    relayTransfer: (...args: unknown[]) => mockRelayTransfer(...args),
  })),
}));

const WALLET_A = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const WALLET_B = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

const baseBody = {
  burnTxHash: '0x' + 'ab'.repeat(32),
  sourceChain: 'eip155:421614',
  referenceId: '0x' + 'cd'.repeat(32),
};

function authHeader(wallet: string, userId: string) {
  const token = jwt.sign(
    { id: userId, walletAddress: wallet },
    process.env.JWT_SECRET!,
    { algorithm: JWT_ALGORITHM, expiresIn: '1h' }
  );
  return { Authorization: `Bearer ${token}` };
}

function buildApp(rateLimitEnv: Record<string, string>) {
  jest.resetModules();
  mockRelayTransfer.mockResolvedValue({
    status: 'CREDITED',
    mintTx: '0xmint',
    creditTx: '0xcredit',
    beneficiary: WALLET_A,
  });

  for (const key of [
    'CCTP_SUBMIT_RATE_LIMIT_WINDOW_MS',
    'CCTP_SUBMIT_RATE_LIMIT_MAX_PER_USER',
    'CCTP_SUBMIT_RATE_LIMIT_MAX_PER_IP',
  ]) {
    delete process.env[key];
  }
  Object.assign(process.env, rateLimitEnv);

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const cctpPaymentsRouter = require('../src/routes/cctp-payments').default;

  const app = express();
  app.set('trust proxy', 1);
  app.use(express.json());
  app.use('/api/payments/cctp', cctpPaymentsRouter);
  return app;
}

async function postSubmit(
  app: express.Application,
  opts: {
    auth?: ReturnType<typeof authHeader>;
    forwardedFor?: string;
    referenceSuffix?: string;
  } = {}
) {
  const body = {
    ...baseBody,
    referenceId:
      opts.referenceSuffix != null
        ? `0x${Buffer.from(opts.referenceSuffix, 'utf8')
            .toString('hex')
            .padEnd(64, '0')
            .slice(0, 64)}`
        : baseBody.referenceId,
  };
  let req = request(app).post('/api/payments/cctp/submit').send(body);
  if (opts.auth) {
    req = req.set(opts.auth);
  }
  if (opts.forwardedFor) {
    req = req.set('X-Forwarded-For', opts.forwardedFor);
  }
  return req;
}

describe('CCTP POST /submit rate limits', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns 429 on the 11th request from the same user within the window', async () => {
    const app = buildApp({
      CCTP_SUBMIT_RATE_LIMIT_MAX_PER_USER: '10',
      CCTP_SUBMIT_RATE_LIMIT_MAX_PER_IP: '100',
    });

    const auth = authHeader(WALLET_A, 'user-a');

    for (let i = 0; i < 10; i++) {
      const res = await postSubmit(app, { auth, referenceSuffix: i.toString(16) });
      expect(res.status).toBe(200);
    }

    const limited = await postSubmit(app, { auth, referenceSuffix: 'lim' });
    expect(limited.status).toBe(429);
    expect(limited.body).toEqual({
      success: false,
      error: new CctpRateLimitError().clientMessage,
    });
    expect(limited.headers['ratelimit-limit']).toBeDefined();
    expect(limited.headers['ratelimit-remaining']).toBeDefined();
    expect(limited.headers['ratelimit-reset']).toBeDefined();
  });

  test('counts authenticated users separately for per-user limits', async () => {
    const app = buildApp({
      CCTP_SUBMIT_RATE_LIMIT_MAX_PER_USER: '10',
      CCTP_SUBMIT_RATE_LIMIT_MAX_PER_IP: '100',
    });

    const authA = authHeader(WALLET_A, 'user-a');
    const authB = authHeader(WALLET_B, 'user-b');

    for (let i = 0; i < 10; i++) {
      const res = await postSubmit(app, { auth: authA, referenceSuffix: `a${i}` });
      expect(res.status).toBe(200);
    }

    const userBFirst = await postSubmit(app, { auth: authB, referenceSuffix: 'b0' });
    expect(userBFirst.status).toBe(200);
  });

  test('enforces per-IP cap across different authenticated users', async () => {
    const app = buildApp({
      CCTP_SUBMIT_RATE_LIMIT_MAX_PER_USER: '100',
      CCTP_SUBMIT_RATE_LIMIT_MAX_PER_IP: '10',
    });

    const clientIp = '203.0.113.50';
    const authA = authHeader(WALLET_A, 'user-a');
    const authB = authHeader(WALLET_B, 'user-b');

    for (let i = 0; i < 10; i++) {
      const auth = i % 2 === 0 ? authA : authB;
      const res = await postSubmit(app, {
        auth,
        forwardedFor: clientIp,
        referenceSuffix: `ip${i}`,
      });
      expect(res.status).toBe(200);
    }

    const limited = await postSubmit(app, {
      auth: authB,
      forwardedFor: clientIp,
      referenceSuffix: 'ip-overflow',
    });
    expect(limited.status).toBe(429);
    expect(limited.body.success).toBe(false);
    expect(limited.body.error).toBe(new CctpRateLimitError().clientMessage);
  });

  test('unauthenticated requests receive 401 even when IP limit would apply after auth', async () => {
    const app = buildApp({
      CCTP_SUBMIT_RATE_LIMIT_MAX_PER_USER: '2',
      CCTP_SUBMIT_RATE_LIMIT_MAX_PER_IP: '2',
    });

    for (let i = 0; i < 5; i++) {
      const res = await postSubmit(app, {
        forwardedFor: '198.51.100.10',
        referenceSuffix: `na${i}`,
      });
      expect(res.status).toBe(401);
      expect(res.body.error).toBeDefined();
    }
    expect(mockRelayTransfer).not.toHaveBeenCalled();
  });
});
