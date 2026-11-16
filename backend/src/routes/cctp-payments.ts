/**
 * CCTP Payments API
 */

import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import { CctpRelayerService } from '../services/CctpRelayerService.js';
import { authenticate } from '../middleware/auth.js';
import {
  cctpSubmitIpRateLimit,
  cctpSubmitUserRateLimit,
} from '../middleware/cctpSubmitRateLimit.js';
import { CctpHttpError } from '../utils/cctpErrors.js';
import { logSafeError } from '../utils/safeLog.js';

const router: RouterType = Router();
const relayerService = new CctpRelayerService();

router.post(
  '/submit',
  cctpSubmitIpRateLimit,
  authenticate,
  cctpSubmitUserRateLimit,
  async (req: Request, res: Response) => {
    try {
      const { burnTxHash, sourceChain, referenceId } = req.body;

      if (!burnTxHash || !sourceChain || !referenceId) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      if (!req.user?.walletAddress) {
        res.status(401).json({ error: 'Invalid or expired token' });
        return;
      }

      try {
        const result = await relayerService.relayTransfer(
          burnTxHash,
          sourceChain,
          referenceId,
          req.user.walletAddress
        );

        res.status(200).json({
          success: true,
          status: result.status,
          mintTx: result.mintTx,
          creditTx: result.creditTx,
          beneficiary: result.beneficiary,
        });
      } catch (error: unknown) {
        if (error instanceof CctpHttpError) {
          res.status(error.statusCode).json({ success: false, error: error.clientMessage });
          return;
        }
        logSafeError('cctp-payments', error);
        res.status(500).json({ success: false, error: 'CCTP relay failed' });
      }
    } catch (error) {
      logSafeError('cctp-payments', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

router.get('/status/:referenceId', async (_req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented' });
});

export default router;
