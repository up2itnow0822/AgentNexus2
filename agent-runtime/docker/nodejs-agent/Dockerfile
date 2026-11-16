# AgentNexus Node.js Agent Template
# Optimized for security and minimal attack surface

# node:24.22.3-alpine
FROM node:24.22.3-alpine@sha256:116b800c3754b440ee0aa3ed2f20f5bf3d99a554bfd9adeea09ea8017f6e85f5

# Use existing node user (uid/gid 1000) for security
# Node alpine image comes with node:node user pre-configured

# Set working directory
WORKDIR /app

# Install dependencies as root
COPY package*.json ./
RUN npm ci --only=production && \
    npm cache clean --force

# Copy agent code
COPY agent.js .
COPY utils.js* ./

# Create output directory (use node user since it's uid 1000)
RUN mkdir -p /tmp/output && chown 1000:1000 /tmp/output

# Switch to non-root user (uid 1000 = node user)
USER 1000

# Set environment variables
ENV NODE_ENV=production
ENV OUTPUT_DIR=/tmp/output

# Run the agent
CMD ["node", "agent.js"]