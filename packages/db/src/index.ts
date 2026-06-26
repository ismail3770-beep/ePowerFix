import { PrismaClient } from '@prisma/client'

// Models that support soft-delete via the `isDeleted` field.
// Reads on these models automatically exclude soft-deleted rows unless
// the caller explicitly sets `isDeleted` in the `where` clause (the opt-out valve
// used by trash-view routes: { where: { isDeleted: true } }).
const SOFT_DELETE_MODELS = new Set([
  'user', 'brand', 'productCategory', 'product', 'serviceCategory', 'service',
  'serviceBooking', 'review', 'blogPost', 'project', 'coupon', 'contact',
  'quoteRequest', 'newsletter', 'flashSale', 'tax', 'productQuestion',
])

// Query operations whose result depends on the `where` filter.
const FILTERED_OPERATIONS = new Set([
  'findMany', 'findFirst', 'findUnique', 'count', 'aggregate', 'groupBy',
])

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const basePrisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
  })

// Client extension: globally inject `isDeleted: false` into reads on soft-delete models.
//
// Behavior:
// - Applies only to models listed in SOFT_DELETE_MODELS.
// - Applies only to read operations in FILTERED_OPERATIONS.
// - If the caller already provides `where.isDeleted` (true OR false), it is left untouched.
//   This is how admin trash routes opt out — they pass `isDeleted: true` explicitly.
//
// Known limitation: this does NOT auto-filter nested relation includes
// (e.g. `db.product.findMany({ include: { reviews: true } })`). Each relation loads via
// a separate query and this extension filters at the top-level model. Nested relations
// must be filtered explicitly where needed (e.g. `include: { reviews: { where: { isDeleted: false } } }`).
export const db = basePrisma.$extends({
  query: Object.fromEntries(
    [...SOFT_DELETE_MODELS].map((model) => [
      model,
      {
        $allOperations({ operation, args, query }: { operation: any; args: any; query: any }) {
          if (FILTERED_OPERATIONS.has(operation)) {
            const where = (args as any).where
            // Inject only if caller didn't explicitly address isDeleted.
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

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = basePrisma

export { PrismaClient }

// Re-export commonly used Prisma types
// NOTE: When using PostgreSQL, uncomment enum re-exports below
// export { UserRole, OrderStatus, PaymentStatus, ServiceBookingStatus } from '@prisma/client'
