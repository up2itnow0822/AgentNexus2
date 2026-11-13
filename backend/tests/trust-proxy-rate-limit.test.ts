/**
 * Ensures express-rate-limit keys on the proxy-appended client IP behind Railway.
 */
import express from 'express';
import rateLimit from 'express-rate-limit';
import request from 'supertest';

describe('Express trust proxy (Railway)', () => {
  /**
   * With `trust proxy: 1`, Express uses the right-most (proxy-appended) address in
   * X-Forwarded-For, not a client-forged left-most entry.
   */
  it('rate-limits on proxy-appended IP when X-Forwarded-For has a forged left entry', async () => {
    const app = express();
    app.set('trust proxy', 1);

    const limiter = rateLimit({
      windowMs: 60_000,
      max: 2,
      standardHeaders: false,
      legacyHeaders: false,
    });

    app.post('/test', limiter, (_req, res) => {
      res.sendStatus(204);
    });

    const proxyAppendedClient = '1.2.3.4';
    const forgedLeftA = `6.6.6.6, ${proxyAppendedClient}`;
    const forgedLeftB = `7.7.7.7, ${proxyAppendedClient}`;

    await request(app).post('/test').set('X-Forwarded-For', forgedLeftA).expect(204);
    await request(app).post('/test').set('X-Forwarded-For', forgedLeftA).expect(204);
    await request(app).post('/test').set('X-Forwarded-For', forgedLeftA).expect(429);

    await request(app).post('/test').set('X-Forwarded-For', forgedLeftB).expect(429);

    await request(app)
      .post('/test')
      .set('X-Forwarded-For', `6.6.6.6, 198.51.100.77`)
      .expect(204);
  });
});
