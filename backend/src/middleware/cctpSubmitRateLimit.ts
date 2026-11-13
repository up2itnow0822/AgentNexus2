import rateLimit, { type Options, type RateLimitRequestHandler } from 'express-rate-limit';
import type { Request } from 'express';
import { CctpRateLimitError } from '../utils/cctpErrors.js';

const DEFAULT_WINDOW_MS = 15 * 60 * 1000;
const DEFAULT_MAX = 10;

const RATE_LIMIT_MESSAGE = new CctpRateLimitError().clientMessage;

function parsePositiveInt(envVal: string | undefined, fallback: number): number {
  if (envVal === undefined || envVal === '') {
    return fallback;
  }
  const n = Number.parseInt(envVal, 10);
  if (!Number.isFinite(n) || n <= 0) {
    return fallback;
  }
  return n;
}

export function getCctpSubmitRateLimitConfig() {
  return {
    windowMs: parsePositiveInt(process.env.CCTP_SUBMIT_RATE_LIMIT_WINDOW_MS, DEFAULT_WINDOW_MS),
    maxPerUser: parsePositiveInt(process.env.CCTP_SUBMIT_RATE_LIMIT_MAX_PER_USER, DEFAULT_MAX),
    maxPerIp: parsePositiveInt(process.env.CCTP_SUBMIT_RATE_LIMIT_MAX_PER_IP, DEFAULT_MAX),
  };
}

const rateLimitJsonHandler: NonNullable<Options['handler']> = (_req, res, _next, options) => {
  const message =
    typeof options.message === 'string' ? options.message : RATE_LIMIT_MESSAGE;
  res.status(429).json({
    success: false,
    error: message,
  });
};

function baseRateLimitOptions(windowMs: number, max: number): Pick<
  Options,
  'windowMs' | 'max' | 'standardHeaders' | 'legacyHeaders' | 'message' | 'handler'
> {
  return {
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: RATE_LIMIT_MESSAGE,
    handler: rateLimitJsonHandler,
  };
}

function cctpSubmitUserKey(req: Request): string {
  const user = req.user;
  if (!user) {
    return 'anonymous';
  }
  return user.id || user.walletAddress;
}

export function createCctpSubmitUserRateLimit(
  overrides?: Partial<Options>
): RateLimitRequestHandler {
  const cfg = getCctpSubmitRateLimitConfig();
  return rateLimit({
    ...baseRateLimitOptions(cfg.windowMs, cfg.maxPerUser),
    keyGenerator: (req) => cctpSubmitUserKey(req),
    ...overrides,
  });
}

export function createCctpSubmitIpRateLimit(
  overrides?: Partial<Options>
): RateLimitRequestHandler {
  const cfg = getCctpSubmitRateLimitConfig();
  return rateLimit({
    ...baseRateLimitOptions(cfg.windowMs, cfg.maxPerIp),
    ...overrides,
  });
}

export const cctpSubmitUserRateLimit = createCctpSubmitUserRateLimit();
export const cctpSubmitIpRateLimit = createCctpSubmitIpRateLimit();
