/**
 * Ensures express-rate-limit keys on the client IP behind Railway's single-hop proxy.
 */
import express from 'express';
import rateLimit from 'express-rate-limit';
import request from 'supertest';

describe('Express trust proxy (Railway)', () => {
  /**
   * Railway forwards one hop via X-Forwarded-For; `trust proxy: 1` uses the left-most
   * client address for rate limiting instead of the edge proxy IP.
   */
  it('rate-limits per X-Forwarded-For client when trust proxy is 1', async () => {
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

    const clientA = '203.0.113.44';
    const clientB = '198.51.100.77';

    await request(app).post('/test').set('X-Forwarded-For', clientA).expect(204);
    await request(app).post('/test').set('X-Forwarded-For', clientA).expect(204);
    await request(app).post('/test').set('X-Forwarded-For', clientA).expect(429);

    await request(app).post('/test').set('X-Forwarded-For', clientB).expect(204);
  });
});
