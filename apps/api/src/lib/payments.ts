// Payment gateway integration helpers for SSLCommerz, bKash, and Nagad.
// Ported from apps/web/src/lib/payments.ts.
//
// Sandbox/test mode is used when API keys are not configured.
// Production mode makes real API calls when keys are set.
//
// ENV VAR MAPPING (differs from web — aligned with apps/api/.env.example):
//   SSLCommerz: SSLCOMMERZ_STORE_ID, SSLCOMMERZ_STORE_PASSWD
//   bKash:      BKASH_APP_KEY, BKASH_APP_SECRET, BKASH_USERNAME, BKASH_PASSWORD, BKASH_CALLBACK_URL
//   Nagad:      NAGAD_MERCHANT_ID, NAGAD_CALLBACK_URL
//
// Callback URLs are constructed from env.BKASH_CALLBACK_URL /
// env.NAGAD_CALLBACK_URL when set, otherwise derived from env.WEB_URL.

import { env } from '../config/env.js'
import { generateTestPaymentToken } from './test-payment.js'

export interface PaymentConfig {
  storeId: string
  storePassword: string
  isLive: boolean
  baseUrl: string
}

export interface PaymentRequest {
  amount: number
  orderId: string
  customerName: string
  customerEmail: string
  customerPhone: string
  address: string
  productName?: string
  productCategory?: string
}

export interface PaymentResponse {
  success: boolean
  paymentUrl?: string
  transactionId?: string
  error?: string
}

// ─── Callback URL helpers ────────────────────────────────────────────────────

function bkashCallbackUrl(): string {
  if (env.BKASH_CALLBACK_URL) return env.BKASH_CALLBACK_URL
  return `${env.WEB_URL}/api/payments/bkash/callback`
}

function nagadCallbackUrl(): string {
  if (env.NAGAD_CALLBACK_URL) return env.NAGAD_CALLBACK_URL
  return `${env.WEB_URL}/api/payments/nagad/callback`
}

function sslcommerzCallbackUrl(): string {
  return `${env.WEB_URL}/api/payments/sslcommerz/ipn`
}

function sslcommerzFailUrl(): string {
  return `${env.WEB_URL}/payment/fail`
}

// ─── Config ──────────────────────────────────────────────────────────────────

function getConfig(type: 'sslcommerz' | 'bkash' | 'nagad'): PaymentConfig {
  switch (type) {
    case 'sslcommerz':
      return {
        storeId: env.SSLCOMMERZ_STORE_ID || '',
        storePassword: env.SSLCOMMERZ_STORE_PASSWD || '',
        isLive: env.NODE_ENV === 'production',
        baseUrl:
          env.NODE_ENV === 'production'
            ? 'https://securepay.sslcommerz.com'
            : 'https://sandbox.sslcommerz.com',
      }
    case 'bkash':
      return {
        // bKash tokenized checkout uses app_key/app_secret in the body and
        // username/password for the Basic-auth token grant.
        storeId: env.BKASH_APP_KEY || '',
        storePassword: env.BKASH_APP_SECRET || '',
        isLive: env.NODE_ENV === 'production',
        baseUrl:
          env.NODE_ENV === 'production'
            ? 'https://tokenized.pay.bkash.com'
            : 'https://tokenized.sandbox.bkash.com',
      }
    case 'nagad':
      return {
        storeId: env.NAGAD_MERCHANT_ID || '',
        storePassword: '',
        isLive: env.NODE_ENV === 'production',
        baseUrl:
          env.NODE_ENV === 'production'
            ? 'https://api.nagad.com'
            : 'https://api.sandbox.nagad.com',
      }
  }
}

function isConfigured(type: 'sslcommerz' | 'bkash' | 'nagad'): boolean {
  const c = getConfig(type)
  switch (type) {
    case 'sslcommerz':
      return !!(c.storeId && c.storePassword)
    case 'bkash':
      // bKash also requires username/password for the Basic-auth token grant.
      return !!(c.storeId && c.storePassword && env.BKASH_USERNAME && env.BKASH_PASSWORD)
    case 'nagad':
      return !!c.storeId
  }
}

// ─── SSLCommerz ────────────────────────────────────────────────────────────────

export async function initiateSSLCommerzPayment(
  req: PaymentRequest
): Promise<PaymentResponse> {
  const config = getConfig('sslcommerz')
  const transactionId = `SSL-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`

  if (!isConfigured('sslcommerz')) {
    // Test mode: generate a one-time token and redirect
    if (env.NODE_ENV !== 'production') {
      const testToken = generateTestPaymentToken(req.orderId, transactionId)
      return {
        success: true,
        paymentUrl: `/api/payments/sslcommerz/ipn?status=SUCCESS&token=${testToken}`,
        transactionId,
      }
    }
    return {
      success: false,
      error: 'SSLCommerz gateway not configured. Set SSLCOMMERZ_STORE_ID and SSLCOMMERZ_STORE_PASSWD env vars.',
    }
  }

  // ── Real SSLCommerz API call ──
  try {
    const response = await fetch(`${config.baseUrl}/gwprocess/v4/api.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        store_id: config.storeId,
        store_passwd: config.storePassword,
        total_amount: req.amount,
        currency: 'BDT',
        tran_id: transactionId,
        success_url: sslcommerzCallbackUrl(),
        fail_url: sslcommerzFailUrl(),
        cancel_url: sslcommerzFailUrl(),
        ipn_url: sslcommerzCallbackUrl(),
        cus_name: req.customerName,
        cus_email: req.customerEmail,
        cus_phone: req.customerPhone,
        cus_add1: req.address,
        prod_name: req.productName || 'Order Payment',
        prod_category: req.productCategory || 'electrical',
        shipping_method: 'NO',
        product_profile: 'general',
      }),
    })
    const data: any = await response.json()
    if (data.status === 'SUCCESS') {
      return { success: true, paymentUrl: data.GatewayPageURL, transactionId }
    }
    return { success: false, error: data.failedreason || 'SSLCommerz initiation failed' }
  } catch (error) {
    console.error('[SSLCommerz] API error:', error)
    return { success: false, error: 'Failed to connect to SSLCommerz gateway' }
  }
}

export async function validateSSLCommerzPayment(
  tranId: string
): Promise<PaymentResponse> {
  const config = getConfig('sslcommerz')

  if (!isConfigured('sslcommerz')) {
    // Test mode: accept any validation
    return { success: true, transactionId: tranId }
  }

  try {
    const response = await fetch(
      `${config.baseUrl}/validator/api/validationserverAPI.php`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          val_id: tranId,
          store_id: config.storeId,
          store_passwd: config.storePassword,
          format: 'json',
        }),
      }
    )
    const data: any = await response.json()
    if (data.status === 'VALID') {
      return { success: true, transactionId: data.tran_id }
    }
    return { success: false, error: 'Invalid SSLCommerz payment' }
  } catch (error) {
    console.error('[SSLCommerz] Validation error:', error)
    return { success: false, error: 'SSLCommerz validation failed' }
  }
}

// ─── bKash ────────────────────────────────────────────────────────────────────

export async function initiateBkashPayment(
  req: PaymentRequest
): Promise<PaymentResponse> {
  const config = getConfig('bkash')
  const transactionId = `BK-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`

  if (!isConfigured('bkash')) {
    if (env.NODE_ENV !== 'production') {
      return {
        success: true,
        paymentUrl: `/api/payments/bkash/callback?status=success&paymentID=${transactionId}&order_id=${req.orderId}&amount=${req.amount}`,
        transactionId,
      }
    }
    return {
      success: false,
      error: 'bKash gateway not configured. Set BKASH_APP_KEY, BKASH_APP_SECRET, BKASH_USERNAME, BKASH_PASSWORD env vars.',
    }
  }

  // ── Real bKash Tokenized Checkout API ──
  try {
    // Step 1: Grant token (uses username:password Basic auth + app_key/app_secret in body)
    const tokenRes = await fetch(`${config.baseUrl}/tokenized/checkout/token/grant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(
          `${env.BKASH_USERNAME}:${env.BKASH_PASSWORD}`
        ).toString('base64')}`,
        Accept: 'application/json',
      },
      body: JSON.stringify({ app_key: config.storeId, app_secret: config.storePassword }),
    })
    const tokenData: any = await tokenRes.json()
    if (!tokenData.id_token) {
      return { success: false, error: tokenData.statusMessage || 'bKash token generation failed' }
    }

    // Step 2: Create payment
    const paymentRes = await fetch(`${config.baseUrl}/tokenized/checkout/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenData.id_token}`,
        'X-App-Key': config.storeId,
      },
      body: JSON.stringify({
        amount: req.amount,
        currency: 'BDT',
        intent: 'sale',
        merchantInvoiceNumber: req.orderId,
        callbackURL: bkashCallbackUrl(),
      }),
    })
    const paymentData: any = await paymentRes.json()
    if (paymentData.paymentID && paymentData.bkashURL) {
      return { success: true, paymentUrl: paymentData.bkashURL, transactionId: paymentData.paymentID }
    }
    return { success: false, error: paymentData.statusMessage || 'bKash payment creation failed' }
  } catch (error) {
    console.error('[bKash] API error:', error)
    return { success: false, error: 'Failed to connect to bKash gateway' }
  }
}

export async function validateBkashPayment(
  paymentID: string
): Promise<PaymentResponse> {
  const config = getConfig('bkash')

  if (!isConfigured('bkash')) {
    return { success: true, transactionId: paymentID }
  }

  try {
    const tokenRes = await fetch(`${config.baseUrl}/tokenized/checkout/token/grant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(
          `${env.BKASH_USERNAME}:${env.BKASH_PASSWORD}`
        ).toString('base64')}`,
        Accept: 'application/json',
      },
      body: JSON.stringify({ app_key: config.storeId, app_secret: config.storePassword }),
    })
    const tokenData: any = await tokenRes.json()
    if (!tokenData.id_token) return { success: false, error: 'bKash token failed' }

    const executeRes = await fetch(`${config.baseUrl}/tokenized/checkout/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenData.id_token}`,
        'X-App-Key': config.storeId,
      },
      body: JSON.stringify({ paymentID }),
    })
    const data: any = await executeRes.json()
    if (data.transactionStatus === 'completed') {
      return { success: true, transactionId: data.paymentID }
    }
    return { success: false, error: data.statusMessage || 'bKash payment not completed' }
  } catch (error) {
    console.error('[bKash] Validation error:', error)
    return { success: false, error: 'bKash validation failed' }
  }
}

// ─── Nagad ────────────────────────────────────────────────────────────────────

export async function initiateNagadPayment(
  req: PaymentRequest
): Promise<PaymentResponse> {
  const config = getConfig('nagad')
  const transactionId = `NG-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`

  if (!isConfigured('nagad')) {
    if (env.NODE_ENV !== 'production') {
      return {
        success: true,
        paymentUrl: `/api/payments/nagad/callback?status=Success&payment_ref_id=${transactionId}&order_id=${req.orderId}&amount=${req.amount}`,
        transactionId,
      }
    }
    return {
      success: false,
      error: 'Nagad gateway not configured. Set NAGAD_MERCHANT_ID env var.',
    }
  }

  // ── Real Nagad API ──
  try {
    // Step 1: Initialize
    const initRes = await fetch(`${config.baseUrl}/api/v2/cse/initialize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        merchantId: config.storeId,
        orderId: req.orderId,
        amount: req.amount,
        currency: 'BDT',
        callbackURL: nagadCallbackUrl(),
      }),
    })
    const initData: any = await initRes.json()
    if (!initData.paymentRefId) {
      return { success: false, error: initData.message || 'Nagad initialization failed' }
    }

    return {
      success: true,
      paymentUrl: `${config.baseUrl}/api/v2/cse/payment/${initData.paymentRefId}`,
      transactionId: initData.paymentRefId,
    }
  } catch (error) {
    console.error('[Nagad] API error:', error)
    return { success: false, error: 'Failed to connect to Nagad gateway' }
  }
}

export async function validateNagadPayment(
  paymentRefId: string
): Promise<PaymentResponse> {
  const config = getConfig('nagad')

  if (!isConfigured('nagad')) {
    // Test mode: accept (only safe because we control the test flow)
    return { success: true, transactionId: paymentRefId }
  }

  // Production: verify payment status with Nagad's verify API
  try {
    const verifyRes = await fetch(
      `${config.baseUrl}/api/v2/cse/payment/verify/${paymentRefId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Merchant-Id': config.storeId,
        },
      }
    )
    const data: any = await verifyRes.json()
    if (data.paymentRefId && data.status === 'Payment Success') {
      return { success: true, transactionId: data.paymentRefId }
    }
    return { success: false, error: 'Nagad payment verification failed' }
  } catch (error) {
    console.error('[Nagad] Verification error:', error)
    return { success: false, error: 'Nagad verification failed' }
  }
}

// ─── Unified Payment Interface ─────────────────────────────────────────────────

const paymentMethods: Record<string, (req: PaymentRequest) => Promise<PaymentResponse>> = {
  sslcommerz: initiateSSLCommerzPayment,
  bkash: initiateBkashPayment,
  nagad: initiateNagadPayment,
}

export async function initiatePayment(
  method: string,
  req: PaymentRequest
): Promise<PaymentResponse> {
  const initiator = paymentMethods[method]
  if (!initiator) {
    return { success: false, error: `Unsupported payment method: ${method}` }
  }
  return initiator(req)
}
