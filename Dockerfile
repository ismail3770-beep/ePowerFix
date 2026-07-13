# ePowerFix API — Docker image for Railway
# Uses Bun runtime (avoids Node.js EOL issues with Nixpacks)

FROM oven/bun:1.1

WORKDIR /app

# Copy workspace configs and install dependencies
COPY package.json bun.lock turbo.json tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/types/package.json packages/types/package.json
COPY packages/api-client/package.json packages/api-client/package.json
COPY packages/store/package.json packages/store/package.json
COPY packages/utils/package.json packages/utils/package.json

RUN bun install --frozen-lockfile

# Copy Prisma schema and generate client
COPY prisma ./prisma
RUN bunx prisma generate --schema=prisma/schema.prisma

# Copy API source code
COPY apps/api ./apps/api
COPY packages ./packages

# Railway provides PORT env var at runtime; NODE_ENV set by Railway
ENV NODE_ENV=production

EXPOSE 4000

# Start the Express API server
WORKDIR /app/apps/api
CMD ["bun", "run", "start"]
