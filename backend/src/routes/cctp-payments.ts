/**
 * CCTP Payments API
 * 
 * Endpoints for managing Cross-Chain Transfer Protocol (CCTP) payments.
 * Handled by the permissionless relayer service.
 */

import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import rateLimit from 'express-rate-limit';
import { CctpRelayerService } from '../services/CctpRelayerService.js';

const router: RouterType = Router();
const relayerService = new CctpRelayerService();

/** Conservative per-IP cap on relay submissions (fixed defaults, not env-driven). */
const cctpSubmitRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many CCTP submit requests; try again later' },
});

function clientSafeRelayErrorMessage(): string {
  return 'Relay failed';
}

/**
 * POST /api/payments/cctp/submit
 * 
 * Submit a CCTP burn transaction to be relayed to Base.
 * 
 * Body:
 * - burnTxHash: string (Source chain burn tx hash)
 * - sourceChain: string (CAIP-2 ID of source chain)
 * - referenceId: string (advisory; on-chain credit uses keccak256(messageBytes))
 * - beneficiary: string (Address of the user/agent)
 * - amount: string (Must equal attested burn amount in smallest unit)
 */
router.post('/submit', cctpSubmitRateLimit, async (req: Request, res: Response) => {
    try {
        const { burnTxHash, sourceChain, referenceId, beneficiary, amount } = req.body;

        if (!burnTxHash || !sourceChain || !referenceId || !beneficiary || !amount) {
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }

        // Trigger relay in background (or await if blocking needed, assuming async for now)
        // For better UX, we can start it and return 202, but for simplicity here we await to catch initial errors
        // Ideally: Queue it. Here: Await it.

        try {
            const result = await relayerService.relayTransfer(
                burnTxHash,
                sourceChain,
                referenceId,
                beneficiary,
                amount
            );

            res.status(200).json({
                success: true,
                status: result.status,
                mintTx: result.mintTx,
                creditTx: result.creditTx
            });
        } catch {
            console.error('CCTP relay submit failed');
            res.status(500).json({
                success: false,
                error: clientSafeRelayErrorMessage(),
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
    // TODO: Implement status check against database or contract events
    res.status(501).json({ error: 'Not implemented' });
});

export default router;
