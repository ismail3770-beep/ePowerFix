// Transactional inventory and coupon reservation lifecycle for online orders.
// Reservation status is intentionally String-based to match the existing schema
// convention and preserve historical rows that default to NONE.

import { db } from './db.js'

export const ONLINE_PAYMENT_METHODS = new Set(['BKASH', 'NAGAD', 'SSLCOMMERZ'])
export const PAYMENT_RESERVATION_DURATION_MS = 30 * 60 * 1000

export type ReservationReleaseReason =
  | 'PAYMENT_INITIATION_FAILED'
  | 'PAYMENT_CALLBACK_FAILED'
  | 'EXPIRED'
  | 'ADMIN_CANCELLED'
  | 'ADMIN_DELETED'

type ReservationReleaseOutcome = {
  orderStatus: string
  paymentStatus: string
  note: string
}

const RELEASE_OUTCOMES: Record<ReservationReleaseReason, ReservationReleaseOutcome> = {
  PAYMENT_INITIATION_FAILED: {
    orderStatus: 'CANCELLED',
    paymentStatus: 'FAILED',
    note: 'Payment initiation failed; inventory and coupon reservation released',
  },
  PAYMENT_CALLBACK_FAILED: {
    orderStatus: 'CANCELLED',
    paymentStatus: 'FAILED',
    note: 'Payment was declined or failed; inventory and coupon reservation released',
  },
  EXPIRED: {
    orderStatus: 'CANCELLED',
    paymentStatus: 'EXPIRED',
    note: 'Payment reservation expired; inventory and coupon reservation released',
  },
  ADMIN_CANCELLED: {
    orderStatus: 'CANCELLED',
    paymentStatus: 'CANCELLED',
    note: 'Order cancelled by an administrator; inventory and coupon reservation released',
  },
  ADMIN_DELETED: {
    orderStatus: 'CANCELLED',
    paymentStatus: 'CANCELLED',
    note: 'Order deleted by an administrator; inventory and coupon reservation released',
  },
}

export type ReservationReleaseResult = {
  released: boolean
  orderId: string
}

/**
 * Idempotently releases an ACTIVE, unpaid online-order reservation.
 *
 * The conditional update is the claim: concurrent callbacks, expiry jobs, and
 * admin actions cannot restore the same stock or coupon usage twice. Callers
 * must invoke this inside the transaction that owns the broader state change.
 */
export async function releaseOrderReservation(
  tx: any,
  orderId: string,
  reason: ReservationReleaseReason,
): Promise<ReservationReleaseResult> {
  const outcome = RELEASE_OUTCOMES[reason]
  const releasedAt = new Date()

  const claim = await tx.order.updateMany({
    where: {
      id: orderId,
      reservationStatus: 'ACTIVE',
      paymentStatus: { not: 'PAID' },
    },
    data: {
      reservationStatus: 'RELEASED',
      reservationExpiresAt: null,
      reservationReleasedAt: releasedAt,
      reservationReleaseReason: reason,
      status: outcome.orderStatus,
      paymentStatus: outcome.paymentStatus,
    },
  })

  if (claim.count !== 1) {
    return { released: false, orderId }
  }

  const order = await tx.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      couponId: true,
      items: {
        select: {
          id: true,
          itemType: true,
          productId: true,
          variantId: true,
          projectKitId: true,
          quantity: true,
          inventoryReserved: true,
        },
      },
    },
  })

  if (!order) {
    throw new Error(`Unable to release missing order reservation ${orderId}`)
  }

  for (const item of order.items) {
    if (!item.inventoryReserved) continue

    if (item.itemType === 'PRODUCT' && item.variantId) {
      await tx.productVariant.updateMany({
        where: { id: item.variantId },
        data: { stock: { increment: item.quantity } },
      })
      continue
    }

    if (item.itemType === 'PRODUCT' && item.productId) {
      // inventoryReserved is set only for a physical product at reservation
      // time, so a later catalog change must not strand its stock.
      await tx.product.updateMany({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      })
      continue
    }

    if (item.itemType === 'PROJECT_KIT' && item.projectKitId) {
      await tx.projectKit.updateMany({
        where: { id: item.projectKitId },
        data: { stock: { increment: item.quantity } },
      })
    }
  }

  await tx.orderItem.updateMany({
    where: { orderId, inventoryReserved: true },
    data: { inventoryReserved: false },
  })

  if (order.couponId) {
    // Coupon usage was reserved when the order was created. Guard the counter
    // so corrupt legacy data can never turn it negative.
    await tx.coupon.updateMany({
      where: { id: order.couponId, usedCount: { gt: 0 } },
      data: { usedCount: { decrement: 1 } },
    })
    await tx.couponUsage.deleteMany({ where: { orderId } })
  }

  await tx.orderHistory.create({
    data: {
      orderId,
      status: outcome.orderStatus,
      note: outcome.note,
    },
  })

  return { released: true, orderId }
}

/**
 * Releases a bounded batch of expired active reservations. This intentionally
 * has no public order-id input; callers use the protected internal-job route.
 */
export async function releaseExpiredOrderReservations(limit = 100): Promise<{
  scanned: number
  released: number
  failed: number
}> {
  const safeLimit = Math.min(Math.max(Math.floor(limit), 1), 100)
  const candidates = await (db as any).order.findMany({
    where: {
      reservationStatus: 'ACTIVE',
      reservationExpiresAt: { lte: new Date() },
      paymentStatus: { not: 'PAID' },
    },
    select: { id: true },
    orderBy: { reservationExpiresAt: 'asc' },
    take: safeLimit,
  })

  let released = 0
  let failed = 0

  for (const candidate of candidates) {
    try {
      const result = await (db as any).$transaction((tx: any) =>
        releaseOrderReservation(tx, candidate.id, 'EXPIRED'),
      )
      if (result.released) released += 1
    } catch (error) {
      failed += 1
      console.error('[payment-reservations] failed to release expired order', candidate.id, error)
    }
  }

  return { scanned: candidates.length, released, failed }
}
/**
 * Starts an in-process expiry worker for the long-running API service.
 *
 * Every API instance may run this worker. `releaseOrderReservation` claims an
 * ACTIVE reservation atomically, so multiple instances cannot restore the
 * same stock or coupon usage twice. Runs never overlap within one process.
 */
export function startExpiredReservationCleanupWorker(
  intervalMs = 60_000,
): () => void {
  const safeIntervalMs = Math.max(1_000, Math.floor(intervalMs))
  let running = false

  const run = async (): Promise<void> => {
    if (running) return
    running = true

    try {
      const result = await releaseExpiredOrderReservations()
      if (result.failed > 0) {
        console.error(
          '[payment-reservations] expiry cleanup completed with failures',
          result,
        )
      } else if (result.released > 0) {
        console.info('[payment-reservations] expired reservations released', result)
      }
    } catch (error) {
      // Cleanup is a recovery path; a transient database failure must not
      // terminate the API process. The next interval retries safely.
      console.error('[payment-reservations] expiry cleanup failed', error)
    } finally {
      running = false
    }
  }

  // Recover reservations left behind while the service was unavailable, then
  // continue polling. `unref` lets test/dev shutdown proceed normally.
  void run()
  const timer = setInterval(() => {
    void run()
  }, safeIntervalMs)
  timer.unref?.()

  return () => clearInterval(timer)
}
