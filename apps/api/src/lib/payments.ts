// Payment gateway integration helpers for SSLCommerz, bKash, and Nagad.
// Sandbox/test mode is used when API keys are not configured.
// Production mode makes real API calls when keys are set.

import { createHmac, timingSafeEqual } from 'node:crypto'

import { env } from '../config/env.js'
import {
  generateTestPaymentToken,
  isTestPaymentMode,
  type TestPaymentGateway,
} from './test-payment.js'

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
  // Internal route-owned destinations. Callers must never forward arbitrary
  // client input into these fields.
  callbackUrl?: string
  ipnCallbackUrl?: string
  failureCallbackUrl?: string
}

export type PaymentFailureKind = 'DEFINITIVE' | 'UNKNOWN'

export interface PaymentResponse {
  success: boolean
  paymentUrl?: string
  transactionId?: string
  // Present only when the gateway's server-side validation response includes a
  // parseable amount. Browser query parameters are never used for this value.
  verifiedAmount?: number
  // A gateway returned an amount field, but it was not a safe numeric value.
  // Treat this as manual review instead of treating it like a missing field.
  verifiedAmountInvalid?: boolean
  // A production gateway validation response omitted its amount entirely.
  verifiedAmountMissing?: boolean
  error?: string
  // DEFINITIVE means the gateway explicitly rejected an attempted payment.
  // UNKNOWN covers timeouts/network failures where the gateway might still have
  // accepted it, so the order reservation must remain intact.
  failureKind?: PaymentFailureKind
}

const SSL_COMMERZ_FAILURE_TOKEN_DOMAIN = 'epowerfix:sslcommerz-failure-token:v1'
const SSL_COMMERZ_FAILURE_TOKEN_TTL_MS = 35 * 60 * 1000
const BASE64_URL_SEGMENT = /^[A-Za-z0-9_-]+$/

type SSLCommerzFailureCallbackTokenPayload = {
  version: 1
  purpose: 'FAIL_OR_CANCEL'
  gateway: 'SSLCOMMERZ'
  orderId: string
  transactionId: string
  issuedAt: number
  expiresAt: number
}

function getSSLCommerzFailureTokenSigningKey(): Buffer | null {
  // Derive a separate HMAC key so this compact callback token cannot be used
  // interchangeably with an authentication JWT signature.
  if (!env.JWT_SECRET || env.JWT_SECRET.length < 32) return null
  return createHmac('sha256', env.JWT_SECRET)
    .update(SSL_COMMERZ_FAILURE_TOKEN_DOMAIN)
    .digest()
}

export function createSSLCommerzFailureCallbackToken(
  orderId: string,
  transactionId: string,
): string | null {
  const signingKey = getSSLCommerzFailureTokenSigningKey()
  if (!signingKey) return null

  const issuedAt = Date.now()
  const payload: SSLCommerzFailureCallbackTokenPayload = {
    version: 1,
    purpose: 'FAIL_OR_CANCEL',
    gateway: 'SSLCOMMERZ',
    orderId,
    transactionId,
    issuedAt,
    expiresAt: issuedAt + SSL_COMMERZ_FAILURE_TOKEN_TTL_MS,
  }
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = createHmac('sha256', signingKey)
    .update(encodedPayload)
    .digest('base64url')

  return `${encodedPayload}.${signature}`
}

export function verifySSLCommerzFailureCallbackToken(
  token: string,
): Pick<SSLCommerzFailureCallbackTokenPayload, 'orderId' | 'transactionId'> | null {
  if (!token || token.length > 2048) return null

  const [encodedPayload, suppliedSignature, extraSegment] = token.split('.')
  if (
    !encodedPayload ||
    !suppliedSignature ||
    extraSegment !== undefined ||
    !BASE64_URL_SEGMENT.test(encodedPayload) ||
    !BASE64_URL_SEGMENT.test(suppliedSignature)
  ) {
    return null
  }

  const signingKey = getSSLCommerzFailureTokenSigningKey()
  if (!signingKey) return null

  const expectedSignature = createHmac('sha256', signingKey)
    .update(encodedPayload)
    .digest()
  const suppliedSignatureBuffer = Buffer.from(suppliedSignature, 'base64url')
  if (
    expectedSignature.length !== suppliedSignatureBuffer.length ||
    !timingSafeEqual(expectedSignature, suppliedSignatureBuffer)
  ) {
    return null
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, 'base64url').toString('utf8'),
    ) as Record<string, unknown>
    if (
      payload.version !== 1 ||
      payload.purpose !== 'FAIL_OR_CANCEL' ||
      payload.gateway !== 'SSLCOMMERZ' ||
      typeof payload.orderId !== 'string' ||
      payload.orderId.length === 0 ||
      payload.orderId.length > 200 ||
      typeof payload.transactionId !== 'string' ||
      payload.transactionId.length === 0 ||
      payload.transactionId.length > 200 ||
      typeof payload.issuedAt !== 'number' ||
      !Number.isSafeInteger(payload.issuedAt) ||
      typeof payload.expiresAt !== 'number' ||
      !Number.isSafeInteger(payload.expiresAt) ||
      payload.expiresAt <= Date.now()
    ) {
      return null
    }

    return {
      orderId: payload.orderId,
      transactionId: payload.transactionId,
    }
  } catch {
    return null
  }
}

type ParsedVerifiedAmount = {
  amount?: number
  invalid: boolean
  missing: boolean
}

function parseVerifiedAmount(value: unknown): ParsedVerifiedAmount {
  if (value === undefined) return { invalid: false, missing: true }

  if (typeof value === 'number') {
    return Number.isFinite(value) && value >= 0
      ? { amount: value, invalid: false, missing: false }
      : { invalid: true, missing: false }
  }
  if (typeof value !== 'string' || !value.trim()) {
    return { invalid: true, missing: false }
  }

  const amount = Number(value)
  return Number.isFinite(amount) && amount >= 0
    ? { amount, invalid: false, missing: false }
    : { invalid: true, missing: false }
}

// ─── Callback URL helpers ────────────────────────────────────────────────────

function bkashCallbackUrl(request: PaymentRequest): string {
  if (request.callbackUrl) return request.callbackUrl
  if (env.BKASH_CALLBACK_URL) return env.BKASH_CALLBACK_URL
  return `${env.WEB_URL}/api/payments/bkash/callback`
}

function nagadCallbackUrl(request: PaymentRequest): string {
  if (request.callbackUrl) return request.callbackUrl
  if (env.NAGAD_CALLBACK_URL) return env.NAGAD_CALLBACK_URL
  return `${env.WEB_URL}/api/payments/nagad/callback`
}

function sslcommerzCallbackUrl(request: PaymentRequest): string {
  return request.callbackUrl || `${env.WEB_URL}/api/payments/sslcommerz/ipn`
}

function sslcommerzFailUrl(
  request: PaymentRequest,
  transactionId: string,
): string | null {
  const token = createSSLCommerzFailureCallbackToken(request.orderId, transactionId)
  if (!token) return null
  const callbackUrl =
    request.failureCallbackUrl || `${env.WEB_URL}/api/payments/sslcommerz/fail`
  return appendPaymentCallbackToken(callbackUrl, token)
}

export function appendPaymentCallbackToken(callbackUrl: string, token: string): string {
  const separator = callbackUrl.includes('?') ? '&' : '?'
  return `${callbackUrl}${separator}token=${encodeURIComponent(token)}`
}

function simulatedPaymentUrl(
  gateway: TestPaymentGateway,
  request: PaymentRequest,
  transactionId: string,
): string | null {
  if (!isTestPaymentMode()) return null

  const token = generateTestPaymentToken(request.orderId, transactionId, gateway)
  const callbackPath = request.callbackUrl || {
    SSLCOMMERZ: '/api/payments/sslcommerz/ipn',
    BKASH: '/api/payments/bkash/callback',
    NAGAD: '/api/payments/nagad/callback',
  }[gateway]
  return appendPaymentCallbackToken(callbackPath, token)
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
  const config = getConfig(type)
  switch (type) {
    case 'sslcommerz':
      return !!(config.storeId && config.storePassword)
    case 'bkash':
      // bKash also requires username/password for the Basic-auth token grant.
      return !!(
        config.storeId &&
        config.storePassword &&
        env.BKASH_USERNAME &&
        env.BKASH_PASSWORD
      )
    case 'nagad':
      return !!config.storeId
  }
}

// ─── SSLCommerz ──────────────────────────────────────────────────────────────

export async function initiateSSLCommerzPayment(
  request: PaymentRequest,
): Promise<PaymentResponse> {
  const config = getConfig('sslcommerz')
  const transactionId = `SSL-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`

  if (!isConfigured('sslcommerz')) {
    const paymentUrl = simulatedPaymentUrl('SSLCOMMERZ', request, transactionId)
    if (paymentUrl) {
      return { success: true, paymentUrl, transactionId }
    }
    return {
      success: false,
      error: 'SSLCommerz gateway not configured. Set SSLCOMMERZ_STORE_ID and SSLCOMMERZ_STORE_PASSWD env vars.',
      failureKind: 'DEFINITIVE',
    }
  }

  const failureUrl = sslcommerzFailUrl(request, transactionId)
  if (!failureUrl) {
    return {
      success: false,
      error: 'SSLCommerz requires a secure JWT_SECRET for failure and cancellation callbacks',
      failureKind: 'DEFINITIVE',
    }
  }
  const callbackUrl = sslcommerzCallbackUrl(request)

  try {
    const response = await fetch(`${config.baseUrl}/gwprocess/v4/api.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        store_id: config.storeId,
        store_passwd: config.storePassword,
        total_amount: request.amount,
        currency: 'BDT',
        tran_id: transactionId,
        success_url: callbackUrl,
        fail_url: failureUrl,
        cancel_url: failureUrl,
        ipn_url: request.ipnCallbackUrl || callbackUrl,
        cus_name: request.customerName,
        cus_email: request.customerEmail,
        cus_phone: request.customerPhone,
        cus_add1: request.address,
        prod_name: request.productName || 'Order Payment',
        prod_category: request.productCategory || 'electrical',
        shipping_method: 'NO',
        product_profile: 'general',
      }),
    })
    const data: any = await response.json()
    if (data.status === 'SUCCESS') {
      return { success: true, paymentUrl: data.GatewayPageURL, transactionId }
    }
    return {
      success: false,
      error: data.failedreason || 'SSLCommerz initiation failed',
      failureKind: 'DEFINITIVE',
    }
  } catch (error) {
    console.error('[SSLCommerz] API error:', error)
    return {
      success: false,
      error: 'Failed to connect to SSLCommerz gateway',
      failureKind: 'UNKNOWN',
    }
  }
}

export async function validateSSLCommerzPayment(
  validationId: string,
): Promise<PaymentResponse> {
  const config = getConfig('sslcommerz')

  if (!isConfigured('sslcommerz')) {
    // Only the route can complete an explicit one-time local test token. A
    // validator must never convert a caller-supplied transaction ID into a
    // successful payment when the real gateway is unavailable.
    return {
      success: false,
      error: 'SSLCommerz validation cannot run because the gateway is not configured',
      failureKind: 'UNKNOWN',
    }
  }

  try {
    const validationUrl = new URL(
      `${config.baseUrl}/validator/api/validationserverAPI.php`,
    )
    validationUrl.search = new URLSearchParams({
      val_id: validationId,
      store_id: config.storeId,
      store_passwd: config.storePassword,
      format: 'json',
    }).toString()
    // SSLCommerz v4 mandates GET query parameters, including store_passwd.
    // Never log this URL, and reject redirects so the credential-bearing query
    // cannot be forwarded to an unintended host.
    const response = await fetch(validationUrl, {
      headers: { Accept: 'application/json' },
      redirect: 'error',
      referrerPolicy: 'no-referrer',
    })
    if (!response.ok) {
      console.warn('[SSLCommerz] Validation endpoint returned HTTP', response.status)
      return {
        success: false,
        error: 'SSLCommerz validation could not be confirmed',
        failureKind: 'UNKNOWN',
      }
    }

    const data: any = await response.json()
    const status = typeof data.status === 'string' ? data.status.trim().toUpperCase() : ''
    if (status === 'VALID' || status === 'VALIDATED') {
      const parsedVerifiedAmount = parseVerifiedAmount(data.amount)
      return {
        success: true,
        transactionId: data.tran_id,
        verifiedAmount: parsedVerifiedAmount.amount,
        verifiedAmountInvalid: parsedVerifiedAmount.invalid,
        verifiedAmountMissing: parsedVerifiedAmount.missing,
      }
    }
    if (
      ['FAILED', 'FAIL', 'CANCELLED', 'CANCELED', 'EXPIRED', 'INVALID', 'INVALID_TRANSACTION', 'DECLINED', 'REJECTED'].includes(
        status,
      )
    ) {
      return {
        success: false,
        error: 'Invalid SSLCommerz payment',
        failureKind: 'DEFINITIVE',
      }
    }

    // Missing, pending, or provider-error statuses do not prove the payment
    // failed, so POST callbacks must not release stock or coupon reservations.
    return {
      success: false,
      error: 'SSLCommerz validation could not be confirmed',
      failureKind: 'UNKNOWN',
    }
  } catch {
    // Do not log the error object: some HTTP clients include the request URL,
    // which contains the provider-required store password query parameter.
    console.error('[SSLCommerz] Validation request failed')
    return {
      success: false,
      error: 'SSLCommerz validation could not be confirmed',
      failureKind: 'UNKNOWN',
    }
  }
}

// ─── bKash ────────────────────────────────────────────────────────────────────

export async function initiateBkashPayment(
  request: PaymentRequest,
): Promise<PaymentResponse> {
  const config = getConfig('bkash')
  const transactionId = `BK-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`

  if (!isConfigured('bkash')) {
    const paymentUrl = simulatedPaymentUrl('BKASH', request, transactionId)
    if (paymentUrl) {
      return { success: true, paymentUrl, transactionId }
    }
    return {
      success: false,
      error: 'bKash gateway not configured. Set BKASH_APP_KEY, BKASH_APP_SECRET, BKASH_USERNAME, BKASH_PASSWORD env vars.',
      failureKind: 'DEFINITIVE',
    }
  }

  try {
    // Step 1: Grant token (uses username:password Basic auth + app_key/app_secret in body).
    const tokenResponse = await fetch(`${config.baseUrl}/tokenized/checkout/token/grant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(
          `${env.BKASH_USERNAME}:${env.BKASH_PASSWORD}`,
        ).toString('base64')}`,
        Accept: 'application/json',
      },
      body: JSON.stringify({ app_key: config.storeId, app_secret: config.storePassword }),
    })
    const tokenData: any = await tokenResponse.json()
    if (!tokenData.id_token) {
      return {
        success: false,
        error: tokenData.statusMessage || 'bKash token generation failed',
        failureKind: 'DEFINITIVE',
      }
    }

    // Step 2: Create payment.
    const paymentResponse = await fetch(`${config.baseUrl}/tokenized/checkout/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenData.id_token}`,
        'X-App-Key': config.storeId,
      },
      body: JSON.stringify({
        amount: request.amount,
        currency: 'BDT',
        intent: 'sale',
        merchantInvoiceNumber: request.orderId,
        callbackURL: bkashCallbackUrl(request),
      }),
    })
    const paymentData: any = await paymentResponse.json()
    if (paymentData.paymentID && paymentData.bkashURL) {
      return {
        success: true,
        paymentUrl: paymentData.bkashURL,
        transactionId: paymentData.paymentID,
      }
    }
    return {
      success: false,
      error: paymentData.statusMessage || 'bKash payment creation failed',
      failureKind: 'DEFINITIVE',
    }
  } catch (error) {
    console.error('[bKash] API error:', error)
    return {
      success: false,
      error: 'Failed to connect to bKash gateway',
      failureKind: 'UNKNOWN',
    }
  }
}

export async function validateBkashPayment(
  paymentId: string,
): Promise<PaymentResponse> {
  const config = getConfig('bkash')

  if (!isConfigured('bkash')) {
    return {
      success: false,
      error: 'bKash validation cannot run because the gateway is not configured',
      failureKind: 'UNKNOWN',
    }
  }

  try {
    const tokenResponse = await fetch(`${config.baseUrl}/tokenized/checkout/token/grant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(
          `${env.BKASH_USERNAME}:${env.BKASH_PASSWORD}`,
        ).toString('base64')}`,
        Accept: 'application/json',
      },
      body: JSON.stringify({ app_key: config.storeId, app_secret: config.storePassword }),
    })
    if (!tokenResponse.ok) {
      console.warn('[bKash] Validation token endpoint returned HTTP', tokenResponse.status)
      return {
        success: false,
        error: 'bKash validation could not be confirmed',
        failureKind: 'UNKNOWN',
      }
    }

    const tokenData: any = await tokenResponse.json()
    if (!tokenData.id_token) {
      return {
        success: false,
        error: 'bKash validation could not be confirmed',
        failureKind: 'UNKNOWN',
      }
    }

    const executeResponse = await fetch(`${config.baseUrl}/tokenized/checkout/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenData.id_token}`,
        'X-App-Key': config.storeId,
      },
      body: JSON.stringify({ paymentID: paymentId }),
    })
    if (!executeResponse.ok) {
      console.warn('[bKash] Validation execute endpoint returned HTTP', executeResponse.status)
      return {
        success: false,
        error: 'bKash validation could not be confirmed',
        failureKind: 'UNKNOWN',
      }
    }

    const data: any = await executeResponse.json()
    const transactionStatus =
      typeof data.transactionStatus === 'string'
        ? data.transactionStatus.trim().toUpperCase()
        : ''
    if (transactionStatus === 'COMPLETED') {
      const parsedVerifiedAmount = parseVerifiedAmount(data.amount)
      return {
        success: true,
        transactionId: data.paymentID,
        verifiedAmount: parsedVerifiedAmount.amount,
        verifiedAmountInvalid: parsedVerifiedAmount.invalid,
        verifiedAmountMissing: parsedVerifiedAmount.missing,
      }
    }
    if (
      ['FAILED', 'FAIL', 'CANCELLED', 'CANCELED', 'EXPIRED', 'INVALID', 'DECLINED', 'REJECTED'].includes(
        transactionStatus,
      )
    ) {
      return {
        success: false,
        error: data.statusMessage || 'bKash payment not completed',
        failureKind: 'DEFINITIVE',
      }
    }

    return {
      success: false,
      error: 'bKash validation could not be confirmed',
      failureKind: 'UNKNOWN',
    }
  } catch (error) {
    console.error('[bKash] Validation error:', error)
    return {
      success: false,
      error: 'bKash validation could not be confirmed',
      failureKind: 'UNKNOWN',
    }
  }
}

// ─── Nagad ────────────────────────────────────────────────────────────────────

export async function initiateNagadPayment(
  request: PaymentRequest,
): Promise<PaymentResponse> {
  const config = getConfig('nagad')
  const transactionId = `NG-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`

  if (!isConfigured('nagad')) {
    const paymentUrl = simulatedPaymentUrl('NAGAD', request, transactionId)
    if (paymentUrl) {
      return { success: true, paymentUrl, transactionId }
    }
    return {
      success: false,
      error: 'Nagad gateway not configured. Set NAGAD_MERCHANT_ID env var.',
      failureKind: 'DEFINITIVE',
    }
  }

  try {
    const initResponse = await fetch(`${config.baseUrl}/api/v2/cse/initialize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        merchantId: config.storeId,
        orderId: request.orderId,
        amount: request.amount,
        currency: 'BDT',
        callbackURL: nagadCallbackUrl(request),
      }),
    })
    const initData: any = await initResponse.json()
    if (!initData.paymentRefId) {
      return {
        success: false,
        error: initData.message || 'Nagad initialization failed',
        failureKind: 'DEFINITIVE',
      }
    }

    return {
      success: true,
      paymentUrl: `${config.baseUrl}/api/v2/cse/payment/${initData.paymentRefId}`,
      transactionId: initData.paymentRefId,
    }
  } catch (error) {
    console.error('[Nagad] API error:', error)
    return {
      success: false,
      error: 'Failed to connect to Nagad gateway',
      failureKind: 'UNKNOWN',
    }
  }
}

export async function validateNagadPayment(
  paymentRefId: string,
): Promise<PaymentResponse> {
  const config = getConfig('nagad')

  if (!isConfigured('nagad')) {
    return {
      success: false,
      error: 'Nagad validation cannot run because the gateway is not configured',
      failureKind: 'UNKNOWN',
    }
  }

  try {
    const verifyResponse = await fetch(
      `${config.baseUrl}/api/v2/cse/payment/verify/${paymentRefId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Merchant-Id': config.storeId,
        },
      },
    )
    if (!verifyResponse.ok) {
      console.warn('[Nagad] Verification endpoint returned HTTP', verifyResponse.status)
      return {
        success: false,
        error: 'Nagad verification could not be confirmed',
        failureKind: 'UNKNOWN',
      }
    }

    const data: any = await verifyResponse.json()
    const status = typeof data.status === 'string' ? data.status.trim().toUpperCase() : ''
    if (data.paymentRefId && status === 'PAYMENT SUCCESS') {
      const parsedVerifiedAmount = parseVerifiedAmount(data.amount)
      return {
        success: true,
        transactionId: data.paymentRefId,
        verifiedAmount: parsedVerifiedAmount.amount,
        verifiedAmountInvalid: parsedVerifiedAmount.invalid,
        verifiedAmountMissing: parsedVerifiedAmount.missing,
      }
    }
    if (
      ['FAILED', 'FAIL', 'CANCELLED', 'CANCELED', 'EXPIRED', 'INVALID', 'INVALID_TRANSACTION', 'DECLINED', 'REJECTED'].includes(
        status,
      )
    ) {
      return {
        success: false,
        error: 'Nagad payment verification failed',
        failureKind: 'DEFINITIVE',
      }
    }

    return {
      success: false,
      error: 'Nagad verification could not be confirmed',
      failureKind: 'UNKNOWN',
    }
  } catch (error) {
    console.error('[Nagad] Verification error:', error)
    return {
      success: false,
      error: 'Nagad verification could not be confirmed',
      failureKind: 'UNKNOWN',
    }
  }
}

// ─── Unified Payment Interface ────────────────────────────────────────────────

const paymentMethods: Record<
  string,
  (request: PaymentRequest) => Promise<PaymentResponse>
> = {
  sslcommerz: initiateSSLCommerzPayment,
  bkash: initiateBkashPayment,
  nagad: initiateNagadPayment,
}

export async function initiatePayment(
  method: string,
  request: PaymentRequest,
): Promise<PaymentResponse> {
  const initiator = paymentMethods[method]
  if (!initiator) {
    return {
      success: false,
      error: `Unsupported payment method: ${method}`,
      failureKind: 'DEFINITIVE',
    }
  }
  return initiator(request)
}
