# ePowerFix API — Docker image for Railway
# Uses Node.js 22 (LTS) — most reliable with Prisma

FROM node:22-slim

WORKDIR /app

# Copy Prisma schema first (needed by postinstall scripts)
COPY prisma ./prisma

# Copy workspace configs
COPY package.json turbo.json tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/types/package.json packages/types/package.json
COPY packages/api-client/package.json packages/api-client/package.json
COPY packages/store/package.json packages/store/package.json
COPY packages/utils/package.json packages/utils/package.json

# Install dependencies with npm (flat node_modules — Prisma compatible)
# npm creates flat node_modules which Prisma client can resolve correctly
RUN npm install --legacy-peer-deps --no-audit --no-fund

# Generate Prisma client
RUN npx prisma generate --schema=prisma/schema.prisma

# Install tsx globally for running TypeScript with Node.js
RUN npm install -g tsx

# Copy API source code
COPY apps/api ./apps/api
COPY packages ./packages

# Railway provides PORT env var at runtime
ENV NODE_ENV=production

EXPOSE 4000

# Start the Express API server with tsx (TypeScript runner for Node.js)
WORKDIR /app/apps/api
CMD ["tsx", "src/server.ts"]
