/**
 * CCTP Payments API
 *
 * Endpoints for managing Cross-Chain Transfer Protocol (CCTP) payments.
 * Handled by the permissionless relayer service.
 */

import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import { CctpRelayerService } from '../services/CctpRelayerService';
import { authenticate } from '../middleware/auth';

const router: RouterType = Router();
const relayerService = new CctpRelayerService();

/**
 * POST /api/payments/cctp/submit
 *
 * Submit a CCTP burn transaction to be relayed to Base.
 * Credit beneficiary and amount are derived from the attested message (not the body).
 *
 * Body:
 * - burnTxHash: string (Source chain burn tx hash)
 * - sourceChain: string (CAIP-2 ID of source chain)
 * - referenceId: string (advisory; on-chain credit uses keccak256(messageBytes))
 */
router.post('/submit', authenticate, async (req: Request, res: Response) => {
  try {
    const { burnTxHash, sourceChain, referenceId, beneficiary } = req.body;

    if (!burnTxHash || !sourceChain || !referenceId) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    try {
      const result = await relayerService.relayTransfer(
        burnTxHash,
        sourceChain,
        referenceId,
        typeof beneficiary === 'string' ? beneficiary : undefined
      );

      res.status(200).json({
        success: true,
        status: result.status,
        mintTx: result.mintTx,
        creditTx: result.creditTx,
        beneficiary: result.beneficiary,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Relay failed';
      if (
        message.includes('does not match attested messageSender') ||
        message.includes('does not match attested burn amount')
      ) {
        res.status(400).json({ success: false, error: message });
        return;
      }
      console.error('Relay failed:', error);
      res.status(500).json({
        success: false,
        error: message,
      });
    }
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/payments/cctp/status/:referenceId
 *
 * Check status of a payment relay.
 * (Placeholder logic using idempotency check in future)
 */
router.get('/status/:referenceId', async (_req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented' });
});

export default router;
