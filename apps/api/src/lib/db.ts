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

  return basePrisma.$extends({
    query: Object.fromEntries(
      [...SOFT_DELETE_MODELS].map((model) => [
        model,
        {
          $allOperations({ operation, args, query }: { operation: any; args: any; query: any }) {
            if (FILTERED_OPERATIONS.has(operation)) {
              const where = (args as any).where
              if (where === undefined || where?.isDeleted === undefined) {
                (args as any).where = { ...(where ?? {}), isDeleted: false }
              }
            }
            return query(args)
          },
        },
      ]),
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
