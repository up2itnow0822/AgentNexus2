import jwt from 'jsonwebtoken';
import express from 'express';
import request from 'supertest';

const TEST_SECRET = 'unit-test-jwt-secret-32-chars-min';

describe('authenticate middleware', () => {
  const originalEnv = process.env;

  const loadAuthModule = () => {
    jest.resetModules();
    process.env.JWT_SECRET = TEST_SECRET;
    return require('../src/middleware/auth') as typeof import('../src/middleware/auth');
  };

  afterEach(() => {
    process.env = { ...originalEnv };
    jest.resetModules();
  });

  it('rejects requests when JWT_SECRET is not configured', async () => {
    jest.resetModules();
    delete process.env.JWT_SECRET;
    const { authenticate } = require('../src/middleware/auth');
    const app = express();
    app.get('/protected', authenticate, (_req, res) => res.json({ ok: true }));

    const res = await request(app).get('/protected');
    expect(res.status).toBe(503);
  });

  it('rejects missing bearer token with 401', async () => {
    const { authenticate } = loadAuthModule();
    const app = express();
    app.get('/protected', authenticate, (_req, res) => res.json({ ok: true }));

    const res = await request(app).get('/protected');
    expect(res.status).toBe(401);
  });

  it('rejects forged token signed with wrong secret', async () => {
    const { authenticate } = loadAuthModule();
    const app = express();
    app.get('/protected', authenticate, (_req, res) => res.json({ ok: true }));

    const token = jwt.sign(
      { id: 'u1', walletAddress: '0x1111111111111111111111111111111111111111' },
      'wrong-secret-value',
      { algorithm: 'HS256' }
    );

    const res = await request(app).get('/protected').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(401);
  });

  it('rejects token signed with unsupported algorithm', async () => {
    const { authenticate } = loadAuthModule();
    const app = express();
    app.get('/protected', authenticate, (_req, res) => res.json({ ok: true }));

    const token = jwt.sign(
      { id: 'u1', walletAddress: '0x1111111111111111111111111111111111111111' },
      TEST_SECRET,
      { algorithm: 'HS384' }
    );

    const res = await request(app).get('/protected').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(401);
  });

  it('rejects payload missing required walletAddress claim', async () => {
    const { authenticate, validateAuthUserPayload } = loadAuthModule();
    expect(validateAuthUserPayload({ id: 'u1' })).toBeNull();
    expect(validateAuthUserPayload({ id: 1, walletAddress: '0x1111111111111111111111111111111111111111' })).toBeNull();

    const app = express();
    app.get('/protected', authenticate, (_req, res) => res.json({ ok: true }));

    const token = jwt.sign({ id: 'u1' }, TEST_SECRET, { algorithm: 'HS256' });
    const res = await request(app).get('/protected').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(401);
  });

  it('accepts valid HS256 token with required claims', async () => {
    const { authenticate } = loadAuthModule();
    const app = express();
    app.get('/protected', authenticate, (req, res) => res.json({ wallet: req.user?.walletAddress }));

    const token = jwt.sign(
      { id: 'u1', walletAddress: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' },
      TEST_SECRET,
      { algorithm: 'HS256' }
    );

    const res = await request(app).get('/protected').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.wallet).toBe('0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
  });
});
