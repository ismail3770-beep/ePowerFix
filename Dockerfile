# ============ BASE ============
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# ============ DEPS ============
FROM base AS deps
COPY package.json bun.lock ./
COPY apps/web/package.json ./apps/web/
COPY apps/api/package.json ./apps/api/
COPY packages/db/package.json ./packages/db/
COPY packages/types/package.json ./packages/types/
RUN corepack enable && bun install --frozen-lockfile

# ============ GENERATE PRISMA ============
FROM deps AS prisma
WORKDIR /app/packages/db
COPY packages/db/prisma ./prisma/
RUN bunx prisma generate

# ============ BUILD WEB ============
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=prisma /app/packages/db/node_modules/.prisma ./packages/db/node_modules/.prisma
COPY . .

RUN cd packages/db && bunx prisma generate
RUN cd apps/web && bun run build

# ============ PRODUCTION ============
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/web/public ./public
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]