/**
 * HTTP server factory for AgentNexus backend.
 *
 * Node's default max HTTP header size (16KB) rejects large X-Payment headers
 * with 431 before Express middleware runs. We raise the limit so x402 can
 * enforce its own cap and return protocol-appropriate 402 responses.
 */
import { createServer, Server } from 'http';
import type { Application } from 'express';

/** Matches x402 middleware X-Payment cap (64KB). */
export const MAX_PAYMENT_HEADER_SIZE_BYTES = 64 * 1024;

/** Node default is 16KB; must exceed X-Payment cap so x402 middleware can respond with 402. */
export const AGENT_NEXUS_MAX_HTTP_HEADER_SIZE = MAX_PAYMENT_HEADER_SIZE_BYTES + 64 * 1024;

export function createAgentNexusHttpServer(app: Application): Server {
    return createServer({ maxHeaderSize: AGENT_NEXUS_MAX_HTTP_HEADER_SIZE }, app);
}
