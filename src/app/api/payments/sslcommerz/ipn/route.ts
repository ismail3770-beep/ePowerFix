import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validateSSLCommerzPayment } from '@/lib/payments'
import { consumeTestPaymentToken } from '@/lib/test-payment'
import { verifyCallbackIp } from '@/lib/payment-callback-security'

/**
 * POST — SSLCommerz IPN callback.
 */
export async function POST(request: Request) {
  // H10: Reject IPN calls from IPs not on the gateway whitelist (if configured).
  const ipCheck = await verifyCallbackIp()
  if (!ipCheck.ok) {
    console.warn('[SSLCommerz IPN] Rejected IP:', ipCheck.ip)
    return new NextResponse('INVALID', { status: 200 })
  }

  try {
    const body = await request.json()
    const tranId: string = body.tran_id || ''

    const validation = await validateSSLCommerzPayment(tranId)
    if (!validation.success) {
      console.warn('[SSLCommerz IPN] Validation failed for tran_id:', tranId)
      return new NextResponse('INVALID', { status: 200 })
    }

    // Look up the Payment record by transactionId
    const payment = await db.payment.findUnique({
      where: { transactionId: tranId },
      include: { order: true },
    })

    if (!payment || !payment.order) {
      console.warn('[SSLCommerz IPN] Payment/order not found for tran_id:', tranId)
      return new NextResponse('INVALID', { status: 200 })
    }

    if (payment.status === 'PAID') {
      return new NextResponse('VALID', { status: 200 })
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

    return new NextResponse('VALID', { status: 200 })
  } catch (error) {
    console.error('[SSLCommerz IPN] Error:', error)
    return new NextResponse('INVALID', { status: 200 })
  }
}

/**
 * GET — Test-mode ONLY. Requires a valid one-time token generated server-side.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token') || ''
  const status = searchParams.get('status') || ''

  if (status !== 'SUCCESS') {
    return NextResponse.redirect(new URL('/payment/fail', request.url))
  }

  const tokenData = consumeTestPaymentToken(token)
  if (!tokenData) {
    console.warn('[SSLCommerz IPN] Invalid or expired test token')
    return NextResponse.redirect(new URL('/payment/fail', request.url))
  }

  const payment = await db.payment.findUnique({
    where: { transactionId: tokenData.tranId },
    include: { order: true },
  })
  if (payment && payment.order && payment.status !== 'PAID') {
    await db.payment.update({
      where: { id: payment.id },
      data: { status: 'PAID', paidAt: new Date(), paymentData: { source: 'test-mode', token: tokenData.tranId } as any },
    })
    await db.order.update({
      where: { id: payment.order.id },
      data: { status: 'CONFIRMED', paymentStatus: 'PAID' },
    })
  }

  const successUrl = new URL('/payment/success', request.url)
  if (payment?.order) successUrl.searchParams.set('order', payment.order.id)
  successUrl.searchParams.set('method', 'sslcommerz')
  return NextResponse.redirect(successUrl)
}