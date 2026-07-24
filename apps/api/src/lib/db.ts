// Prisma client singleton for Express API
// Mirrors the soft-delete extension from apps/web/src/lib/db.ts

import { PrismaClient } from '@prisma/client'
import { env } from '../config/env.js'

const SOFT_DELETE_MODELS = new Set([
  'user', 'brand', 'productCategory', 'product', 'serviceCategory', 'service',
  'serviceBooking', 'review', 'blogPost', 'project', 'projectKit', 'coupon', 'contact',
  'quoteRequest', 'newsletter', 'flashSale', 'tax', 'productQuestion',
])

const FILTERED_OPERATIONS = new Set([
  'findMany', 'findFirst', 'findUnique', 'count', 'aggregate', 'groupBy',
])

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  extendedDb: ReturnType<typeof createExtendedClient> | undefined
}

function createExtendedClient() {
  const basePrisma =
    globalForPrisma.prisma ??
    new PrismaClient({
      log: env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    })

  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = basePrisma
  }

  // Prisma's $extends generics don't support dynamically-constructed model maps.
  // The `as any` on Object.fromEntries is unavoidable for dynamic extensions.
  // See: https://github.com/prisma/prisma/issues/18629
  return basePrisma.$extends({
    query: Object.fromEntries(
      [...SOFT_DELETE_MODELS].map((model) => [
        model,
        {
          $allOperations({ operation, args, query }: {
            operation: string
            args: { where?: Record<string, unknown> }
            query: (args: unknown) => Promise<unknown>
          }) {
            if (FILTERED_OPERATIONS.has(operation)) {
              const where = args.where
              if (where === undefined || where?.isDeleted === undefined) {
                args.where = { ...(where ?? {}), isDeleted: false }
              }
            }
            return query(args)
          },
        },
      ]),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ) as any,
  })
}

function getExtendedClient() {
  if (!globalForPrisma.extendedDb) {
    globalForPrisma.extendedDb = createExtendedClient()
  }
  return globalForPrisma.extendedDb
}

export const db = getExtendedClient()

export { PrismaClient }
