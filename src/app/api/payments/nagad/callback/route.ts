import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validateNagadPayment } from '@/lib/payments'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const paymentRefId: string = body.payment_ref_id || ''
    const orderId: string = body.merchantOrderId || body.order_id || ''

    const validation = await validateNagadPayment(paymentRefId)

    if (!validation.success) {
      console.warn('[Nagad Callback] Validation failed for paymentRefId:', paymentRefId)
      return NextResponse.json({ error: 'Payment validation failed' }, { status: 400 })
    }

    // Look up the Payment record by transactionId (Nagad payment_ref_id)
    let payment = await db.payment.findUnique({
      where: { transactionId: paymentRefId },
      include: { order: true },
    })

    // Fallback: find by order id if transactionId not yet stored
    if (!payment && orderId) {
      payment = await db.payment.findFirst({
        where: { orderId, method: 'NAGAD' },
        include: { order: true },
      })
    }

    if (!payment || !payment.order) {
      console.warn('[Nagad Callback] Payment/order not found for paymentRefId:', paymentRefId)
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (payment.status === 'PAID') {
      return NextResponse.json({ success: true, message: 'Already processed' })
    }

    // Update Payment record with raw gateway response
    await db.payment.update({
      where: { id: payment.id },
      data: { status: 'PAID', paidAt: new Date(), paymentData: body as any },
    })

    // Update denormalized order status
    await db.order.update({
      where: { id: payment.order.id },
      data: { status: 'CONFIRMED', paymentStatus: 'PAID' },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Nagad Callback] Error:', error)
    return NextResponse.json({ error: 'Callback processing failed' }, { status: 500 })
  }
}
