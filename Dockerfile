FROM oven/bun:1.3-alpine

WORKDIR /app

# Copy lockfile first for better caching
COPY package.json bun.lock* ./
COPY packages/db/package.json packages/db/
COPY packages/config/package.json packages/config/
COPY packages/types/package.json packages/types/
COPY packages/utils/package.json packages/utils/
COPY apps/api/package.json apps/api/

# Install all dependencies
RUN bun install --frozen-lockfile || bun install

# Copy source code
COPY packages/ packages/
COPY apps/api/ apps/api/
COPY turbo.json ./

# Generate Prisma client
RUN cd packages/db && bunx prisma generate

# Expose port (Render provides PORT env var)
EXPOSE 4000

# Start the API server with bun
WORKDIR /app
CMD ["bun", "apps/api/src/server.ts"]