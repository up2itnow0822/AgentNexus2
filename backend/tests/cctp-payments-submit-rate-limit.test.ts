import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { CctpRateLimitError } from '../src/utils/cctpErrors';
import { JWT_ALGORITHM } from '../src/config/jwt';
import { applyTrustProxySetting } from '../src/config/trustProxy';

process.env.JWT_SECRET = 'test-jwt-secret-for-cctp-submit-rate-limit-tests';

const mockRelayTransfer = jest.fn();

jest.mock('../src/services/CctpRelayerService', () => ({
  CctpRelayerService: jest.fn().mockImplementation(() => ({
    relayTransfer: (...args: unknown[]) => mockRelayTransfer(...args),
  })),
}));

const WALLET_A = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const WALLET_B = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

const GENERIC_LIMIT_BODY = {
  success: false,
  error: new CctpRateLimitError().clientMessage,
};

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
    'TRUST_PROXY_HOPS',
  ]) {
    delete process.env[key];
  }
  Object.assign(process.env, rateLimitEnv);

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const cctpPaymentsRouter = require('../src/routes/cctp-payments').default;

  const app = express();
  applyTrustProxySetting(app);
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

function expectGenericRateLimitBody(res: { body: { success?: boolean; error?: string } }) {
  expect(res.body).toEqual(GENERIC_LIMIT_BODY);
  const err = String(res.body.error ?? '');
  expect(err).not.toMatch(/token|auth|session|user|wallet|login/i);
}

describe('CCTP POST /submit rate limits', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns 429 on the 11th request from the same user within the window', async () => {
    const app = buildApp({
      TRUST_PROXY_HOPS: '1',
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
    expectGenericRateLimitBody(limited);
    expect(limited.headers['ratelimit-limit']).toBeDefined();
    expect(limited.headers['ratelimit-remaining']).toBeDefined();
    expect(limited.headers['ratelimit-reset']).toBeDefined();
  });

  test('does not invoke relayer on per-user 429', async () => {
    const app = buildApp({
      TRUST_PROXY_HOPS: '1',
      CCTP_SUBMIT_RATE_LIMIT_MAX_PER_USER: '10',
      CCTP_SUBMIT_RATE_LIMIT_MAX_PER_IP: '100',
    });

    const auth = authHeader(WALLET_A, 'user-side-effect');

    for (let i = 0; i < 10; i++) {
      await postSubmit(app, { auth, referenceSuffix: `se${i}` });
    }
    expect(mockRelayTransfer).toHaveBeenCalledTimes(10);

    const limited = await postSubmit(app, { auth, referenceSuffix: 'se-overflow' });
    expect(limited.status).toBe(429);
    expect(mockRelayTransfer).toHaveBeenCalledTimes(10);
  });

  test('counts authenticated users separately for per-user limits', async () => {
    const app = buildApp({
      TRUST_PROXY_HOPS: '1',
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
      TRUST_PROXY_HOPS: '1',
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
    expectGenericRateLimitBody(limited);
  });

  test('does not invoke relayer on per-IP 429', async () => {
    const app = buildApp({
      TRUST_PROXY_HOPS: '1',
      CCTP_SUBMIT_RATE_LIMIT_MAX_PER_USER: '100',
      CCTP_SUBMIT_RATE_LIMIT_MAX_PER_IP: '10',
    });

    const clientIp = '203.0.113.51';
    const auth = authHeader(WALLET_A, 'user-ip-side-effect');

    for (let i = 0; i < 10; i++) {
      await postSubmit(app, {
        auth,
        forwardedFor: clientIp,
        referenceSuffix: `ipe${i}`,
      });
    }
    expect(mockRelayTransfer).toHaveBeenCalledTimes(10);

    const limited = await postSubmit(app, {
      auth,
      forwardedFor: clientIp,
      referenceSuffix: 'ipe-overflow',
    });
    expect(limited.status).toBe(429);
    expect(mockRelayTransfer).toHaveBeenCalledTimes(10);
  });

  test('returns 429 for a burst of unauthenticated requests from one IP before auth', async () => {
    const app = buildApp({
      TRUST_PROXY_HOPS: '1',
      CCTP_SUBMIT_RATE_LIMIT_MAX_PER_IP: '10',
      CCTP_SUBMIT_RATE_LIMIT_MAX_PER_USER: '100',
    });

    const clientIp = '198.51.100.10';

    for (let i = 0; i < 10; i++) {
      const res = await postSubmit(app, {
        forwardedFor: clientIp,
        referenceSuffix: `na${i}`,
      });
      expect(res.status).toBe(401);
    }

    const limited = await postSubmit(app, {
      forwardedFor: clientIp,
      referenceSuffix: 'na-overflow',
    });
    expect(limited.status).toBe(429);
    expectGenericRateLimitBody(limited);
    expect(mockRelayTransfer).not.toHaveBeenCalled();
  });
});
