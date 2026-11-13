import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getJwtSecret, JWT_ALGORITHM, isJwtConfigured } from '../config/jwt.js';
import { logSafeError } from '../utils/safeLog.js';

export interface AuthUser {
  id: string;
  walletAddress: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

export function validateAuthUserPayload(payload: unknown): AuthUser | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }
  const record = payload as Record<string, unknown>;
  if (typeof record.id !== 'string' || record.id.length === 0) {
    return null;
  }
  if (typeof record.walletAddress !== 'string' || !ADDRESS_RE.test(record.walletAddress)) {
    return null;
  }
  if (typeof record.exp !== 'number') {
    return null;
  }
  return { id: record.id, walletAddress: record.walletAddress };
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  if (!isJwtConfigured()) {
    res.status(503).json({ error: 'Authentication unavailable' });
    return;
  }

  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({ error: 'No authorization header provided' });
      return;
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const secret = getJwtSecret();
    const decoded = jwt.verify(token, secret, { algorithms: [JWT_ALGORITHM] });
    const user = validateAuthUserPayload(decoded);
    if (!user) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    logSafeError('auth', error);
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }
};
