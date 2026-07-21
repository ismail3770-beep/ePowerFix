# ePowerFix API — Bun image for Railway
FROM oven/bun:1.3.14-slim

WORKDIR /app

# Install from the repository's pinned Bun lockfile. Copy workspace manifests
# first so dependency installation remains cacheable when source files change.
COPY package.json bun.lock turbo.json tsconfig.base.json ./
COPY prisma ./prisma
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY apps/mobile/package.json apps/mobile/package.json
COPY packages/api-client/package.json packages/api-client/package.json
COPY packages/store/package.json packages/store/package.json
COPY packages/types/package.json packages/types/package.json
COPY packages/utils/package.json packages/utils/package.json

RUN bun install --frozen-lockfile

COPY apps/api ./apps/api
COPY packages ./packages

RUN bun x prisma generate --schema=prisma/schema.prisma \
  && bun run --cwd apps/api typecheck

ENV NODE_ENV=production
EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD bun -e "const port=process.env.PORT||'4000';const response=await fetch('http://127.0.0.1:'+port+'/api/health');if(!response.ok)process.exit(1)"

CMD ["bun", "run", "--cwd", "apps/api", "start"]
