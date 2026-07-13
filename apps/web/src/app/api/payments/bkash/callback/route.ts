import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validateBkashPayment } from '@/lib/payments'
import { verifyCallbackIp } from '@/lib/payment-callback-security'

export async function POST(request: Request) {
  // H10: Reject callbacks from IPs not on the gateway whitelist (if configured).
  const ipCheck = await verifyCallbackIp()
  if (!ipCheck.ok) {
    console.warn('[bKash Callback] Rejected IP:', ipCheck.ip)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await request.json()

    const paymentID: string = body.paymentID || ''
    const orderNumber: string = body.merchantInvoiceNumber || ''

    const validation = await validateBkashPayment(paymentID)

    if (!validation.success) {
      console.warn('[bKash Callback] Validation failed for paymentID:', paymentID)
      return NextResponse.json({ error: 'Payment validation failed' }, { status: 400 })
    }

    // Look up the Payment record by transactionId (bKash paymentID)
    let payment = await db.payment.findUnique({
      where: { transactionId: paymentID },
      include: { order: true },
    })

    // Fallback: find by order number if transactionId not yet stored
    if (!payment && orderNumber) {
      const order = await db.order.findUnique({ where: { orderNumber } })
      if (order) {
        payment = await db.payment.findFirst({
          where: { orderId: order.id, method: 'BKASH' },
          include: { order: true },
        })
      }
    }

    if (!payment || !payment.order) {
      console.warn('[bKash Callback] Payment/order not found for paymentID:', paymentID)
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
    console.error('[bKash Callback] Error:', error)
    return NextResponse.json({ error: 'Callback processing failed' }, { status: 500 })
  }
}
