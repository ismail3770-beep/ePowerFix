# ePowerFix API — Docker image for Railway
# Uses Node.js 22 + pnpm (workspace protocol support + flat node_modules for Prisma)

FROM node:22-slim

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy Prisma schema first (needed by postinstall scripts)
COPY prisma ./prisma

# Copy workspace configs (pnpm-workspace.yaml needed for workspace:* protocol)
COPY package.json turbo.json tsconfig.base.json ./
COPY pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/types/package.json packages/types/package.json
COPY packages/api-client/package.json packages/api-client/package.json
COPY packages/store/package.json packages/store/package.json
COPY packages/utils/package.json packages/utils/package.json

# Install dependencies with pnpm (supports workspace:* protocol)
# Use --shamefully-hoist for flat node_modules (Prisma compatibility)
RUN pnpm install --no-frozen-lockfile --shamefully-hoist

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
