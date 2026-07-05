import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { initiatePayment } from '@/lib/payments'
import { requireAuth } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'
import { headers } from 'next/headers'

const initiatePaymentSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  paymentMethod: z.enum(['sslcommerz', 'bkash', 'nagad']),
  amount: z.number().positive('Amount must be positive'),
  customerName: z.string().min(1, 'Customer name is required'),
  customerPhone: z.string().min(1, 'Customer phone is required'),
  customerEmail: z.string().optional(),
  address: z.string().min(1, 'Address is required'),
})

export async function POST(request: Request) {
  const ip = (await headers()).get('x-forwarded-for') || 'unknown'
  const rl = checkRateLimit(`payment:${ip}`, 5, 10 * 60 * 1000)
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many payment attempts. Try again later.' }, { status: 429 })
  }

  const auth = await requireAuth()
  if (!auth.ok) return auth.response!

  try {
    const body = await request.json()
    const parsed = initiatePaymentSchema.parse(body)

    // Find the order and verify status
    const order = await db.order.findUnique({
      where: { id: parsed.orderId },
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    if (order.status !== 'PENDING') {
      return NextResponse.json(
        { error: `Order is already ${order.status}, cannot initiate payment` },
        { status: 400 }
      )
    }

    if (Number(order.total) !== parsed.amount) {
      return NextResponse.json(
        { error: 'Amount mismatch' },
        { status: 400 }
      )
    }

    // Initiate payment with the selected gateway
    const paymentResult = await initiatePayment(parsed.paymentMethod, {
      amount: parsed.amount,
      orderId: order.id,
      customerName: parsed.customerName,
      customerEmail: parsed.customerEmail || '',
      customerPhone: parsed.customerPhone,
      address: parsed.address,
      productName: `Order #${order.orderNumber}`,
      productCategory: 'electrical',
    })

    if (!paymentResult.success || !paymentResult.paymentUrl) {
      return NextResponse.json(
        { error: paymentResult.error || 'Payment initiation failed' },
        { status: 400 }
      )
    }

    const methodUpper = parsed.paymentMethod.toUpperCase() as 'SSLCOMMERZ' | 'BKASH' | 'NAGAD'

    // Update order with payment method (denormalized status stays PENDING until webhook)
    await db.order.update({
      where: { id: order.id },
      data: {
        paymentMethod: methodUpper,
        paymentStatus: 'PENDING',
      },
    })

    // Create a Payment record storing the gateway transactionId
    await db.payment.create({
      data: {
        orderId: order.id,
        amount: parsed.amount,
        method: methodUpper,
        status: 'PENDING',
        transactionId: paymentResult.transactionId || null,
        paymentData: { initiated: true } as any,
      },
    })

    return NextResponse.json({
      paymentUrl: paymentResult.paymentUrl,
      transactionId: paymentResult.transactionId,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error initiating payment:', error)
    return NextResponse.json(
      { error: 'Failed to initiate payment' },
      { status: 500 }
    )
  }
}