# AgentNexus Backend Dockerfile
# Multi-stage build for production optimization

FROM node:20-bookworm-slim AS base

# Install system dependencies for native modules (required by ELIZAOS)
RUN apt-get update && apt-get upgrade -y && apt-get install -y --no-install-recommends \
  python3 \
  make \
  g++ \
  git \
  && rm -rf /var/lib/apt/lists/*

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
FROM base AS deps
RUN corepack enable && corepack prepare pnpm@10.28.2 --activate && pnpm install --frozen-lockfile

# Build stage
FROM base AS builder
RUN corepack enable && corepack prepare pnpm@10.28.2 --activate
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN pnpm prisma generate

# Build TypeScript
RUN pnpm run build
RUN pnpm prune --prod

# Production stage
FROM node:20-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production

# Refresh runtime OS packages to pick up security fixes from the current Debian repo snapshot
RUN apt-get update && apt-get upgrade -y && apt-get install -y --no-install-recommends \
  python3 \
  ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Copy necessary files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/scripts ./scripts

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start server without pnpm in the runtime image
CMD ["node", "dist/index.js"]

