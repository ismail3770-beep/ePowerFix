import { PrismaClient } from '@prisma/client'

// Models that support soft-delete via the `isDeleted` field.
const SOFT_DELETE_MODELS = new Set([
  'user', 'brand', 'productCategory', 'product', 'serviceCategory', 'service',
  'serviceBooking', 'review', 'blogPost', 'project', 'projectKit', 'coupon', 'contact',
  'quoteRequest', 'newsletter', 'flashSale', 'tax', 'productQuestion',
])

// Query operations whose result depends on the `where` filter.
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
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
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

// Lazy singleton: the extended Prisma client is only created on first property access,
// NOT at module-evaluation time. This prevents build failures where DATABASE_URL
// may not be set during static analysis.
let _db: ReturnType<typeof createExtendedClient> | undefined

function getDb() {
  if (!_db) {
    _db = globalForPrisma.extendedDb ?? createExtendedClient()
    globalForPrisma.extendedDb = _db
  }
  return _db
}

// Use a Proxy so that `db.product.findMany(...)` triggers lazy initialization
export const db = new Proxy({} as ReturnType<typeof createExtendedClient>, {
  get(_target, prop) {
    const client = getDb()
    const value = (client as any)[prop]
    if (typeof value === 'function') {
      return value.bind(client)
    }
    return value
  },
})

export { PrismaClient }
