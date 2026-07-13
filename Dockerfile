# ePowerFix API — Docker image for Railway
# Uses Node.js 22 + pnpm (workspace protocol support + flat node_modules for Prisma)

FROM node:22-slim

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

# Copy Prisma schema first (needed by postinstall scripts)
COPY prisma ./prisma

# Copy workspace configs (pnpm-workspace.yaml needed for workspace:* protocol)
COPY package.json turbo.json tsconfig.base.json ./
COPY pnpm-workspace.yaml ./
COPY .npmrc ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/types/package.json packages/types/package.json
COPY packages/api-client/package.json packages/api-client/package.json
COPY packages/store/package.json packages/store/package.json
COPY packages/utils/package.json packages/utils/package.json

# Install dependencies with pnpm
# .npmrc has node-linker=hoisted for flat node_modules (Prisma compatible)
RUN pnpm install --no-frozen-lockfile

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
