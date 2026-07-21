import { describe, expect, it } from 'vitest'
import { releaseOrderReservation } from './order-reservations'

type RecordedUpdate = {
  where: unknown
  data: unknown
}

type FakeTransactionOptions = {
  claimCounts?: number[]
  couponId?: string | null
  items?: Array<{
    id: string
    itemType: string
    productId: string | null
    variantId: string | null
    projectKitId: string | null
    quantity: number
    inventoryReserved: boolean
  }>
}

function createFakeTransaction(options: FakeTransactionOptions = {}) {
  const claimCounts = [...(options.claimCounts ?? [1])]
  const productUpdates: RecordedUpdate[] = []
  const variantUpdates: RecordedUpdate[] = []
  const projectKitUpdates: RecordedUpdate[] = []
  const orderItemUpdates: RecordedUpdate[] = []
  const couponUpdates: RecordedUpdate[] = []
  const couponUsageDeletes: unknown[] = []
  const historyCreates: unknown[] = []
  const orderClaims: RecordedUpdate[] = []

  const tx = {
    order: {
      updateMany: async (args: RecordedUpdate) => {
        orderClaims.push(args)
        return { count: claimCounts.shift() ?? 0 }
      },
      findUnique: async () => ({
        id: 'order-1',
        couponId: options.couponId ?? null,
        items: options.items ?? [],
      }),
    },
    product: {
      updateMany: async (args: RecordedUpdate) => {
        productUpdates.push(args)
        return { count: 1 }
      },
    },
    productVariant: {
      updateMany: async (args: RecordedUpdate) => {
        variantUpdates.push(args)
        return { count: 1 }
      },
    },
    projectKit: {
      updateMany: async (args: RecordedUpdate) => {
        projectKitUpdates.push(args)
        return { count: 1 }
      },
    },
    orderItem: {
      updateMany: async (args: RecordedUpdate) => {
        orderItemUpdates.push(args)
        return { count: 1 }
      },
    },
    coupon: {
      updateMany: async (args: RecordedUpdate) => {
        couponUpdates.push(args)
        return { count: 1 }
      },
    },
    couponUsage: {
      deleteMany: async (args: unknown) => {
        couponUsageDeletes.push(args)
        return { count: 1 }
      },
    },
    orderHistory: {
      create: async (args: unknown) => {
        historyCreates.push(args)
        return args
      },
    },
  }

  return {
    tx,
    records: {
      orderClaims,
      productUpdates,
      variantUpdates,
      projectKitUpdates,
      orderItemUpdates,
      couponUpdates,
      couponUsageDeletes,
      historyCreates,
    },
  }
}

const reservedItems = [
  {
    id: 'product-item',
    itemType: 'PRODUCT',
    productId: 'product-1',
    variantId: null,
    projectKitId: null,
    quantity: 2,
    inventoryReserved: true,
  },
  {
    id: 'variant-item',
    itemType: 'PRODUCT',
    productId: 'product-1',
    variantId: 'variant-1',
    projectKitId: null,
    quantity: 3,
    inventoryReserved: true,
  },
  {
    id: 'kit-item',
    itemType: 'PROJECT_KIT',
    productId: null,
    variantId: null,
    projectKitId: 'kit-1',
    quantity: 4,
    inventoryReserved: true,
  },
  {
    id: 'service-item',
    itemType: 'SERVICE',
    productId: null,
    variantId: null,
    projectKitId: null,
    quantity: 1,
    inventoryReserved: false,
  },
]

describe('releaseOrderReservation', () => {
  it('restores every reserved inventory identity and coupon usage transactionally', async () => {
    const { tx, records } = createFakeTransaction({
      couponId: 'coupon-1',
      items: reservedItems,
    })

    const result = await releaseOrderReservation(tx, 'order-1', 'EXPIRED')

    expect(result).toEqual({ released: true, orderId: 'order-1' })
    expect(records.orderClaims).toHaveLength(1)
    expect(records.orderClaims[0]).toMatchObject({
      where: {
        id: 'order-1',
        reservationStatus: 'ACTIVE',
        paymentStatus: { not: 'PAID' },
      },
      data: {
        reservationStatus: 'RELEASED',
        reservationReleaseReason: 'EXPIRED',
        status: 'CANCELLED',
        paymentStatus: 'EXPIRED',
      },
    })
    expect(records.productUpdates).toEqual([
      { where: { id: 'product-1' }, data: { stock: { increment: 2 } } },
    ])
    expect(records.variantUpdates).toEqual([
      { where: { id: 'variant-1' }, data: { stock: { increment: 3 } } },
    ])
    expect(records.projectKitUpdates).toEqual([
      { where: { id: 'kit-1' }, data: { stock: { increment: 4 } } },
    ])
    expect(records.orderItemUpdates).toEqual([
      {
        where: { orderId: 'order-1', inventoryReserved: true },
        data: { inventoryReserved: false },
      },
    ])
    expect(records.couponUpdates).toEqual([
      {
        where: { id: 'coupon-1', usedCount: { gt: 0 } },
        data: { usedCount: { decrement: 1 } },
      },
    ])
    expect(records.couponUsageDeletes).toEqual([{ where: { orderId: 'order-1' } }])
    expect(records.historyCreates).toHaveLength(1)
  })

  it('uses the reservation claim to make repeated release exactly-once', async () => {
    const { tx, records } = createFakeTransaction({
      claimCounts: [1, 0],
      couponId: 'coupon-1',
      items: reservedItems,
    })

    const first = await releaseOrderReservation(tx, 'order-1', 'PAYMENT_CALLBACK_FAILED')
    const second = await releaseOrderReservation(tx, 'order-1', 'EXPIRED')

    expect(first.released).toBe(true)
    expect(second).toEqual({ released: false, orderId: 'order-1' })
    expect(records.orderClaims).toHaveLength(2)
    expect(records.productUpdates).toHaveLength(1)
    expect(records.variantUpdates).toHaveLength(1)
    expect(records.projectKitUpdates).toHaveLength(1)
    expect(records.couponUpdates).toHaveLength(1)
    expect(records.couponUsageDeletes).toHaveLength(1)
    expect(records.historyCreates).toHaveLength(1)
  })

  it('does not restore inventory or coupon usage when the unpaid active claim fails', async () => {
    const { tx, records } = createFakeTransaction({
      claimCounts: [0],
      couponId: 'coupon-1',
      items: reservedItems,
    })

    const result = await releaseOrderReservation(tx, 'order-1', 'ADMIN_CANCELLED')

    expect(result).toEqual({ released: false, orderId: 'order-1' })
    expect(records.orderClaims[0]).toMatchObject({
      where: { paymentStatus: { not: 'PAID' } },
    })
    expect(records.productUpdates).toHaveLength(0)
    expect(records.variantUpdates).toHaveLength(0)
    expect(records.projectKitUpdates).toHaveLength(0)
    expect(records.orderItemUpdates).toHaveLength(0)
    expect(records.couponUpdates).toHaveLength(0)
    expect(records.couponUsageDeletes).toHaveLength(0)
    expect(records.historyCreates).toHaveLength(0)
  })
})
