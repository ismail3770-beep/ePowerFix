// Payment gateway types and configuration for SSLCommerz, bKash, and Nagad
// Sandbox/test mode when API keys are not configured.
// Production mode with real API calls when keys are set.

import { generateTestPaymentToken } from '@/lib/test-payment'

export interface PaymentConfig {
  storeId: string;
  storePassword: string;
  isLive: boolean;
  baseUrl: string;
}

export interface PaymentRequest {
  amount: number;
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  productName?: string;
  productCategory?: string;
}

export interface PaymentResponse {
  success: boolean;
  paymentUrl?: string;
  transactionId?: string;
  error?: string;
}

// ─── Config ──────────────────────────────────────────────────────────────────

function getConfig(type: 'sslcommerz' | 'bkash' | 'nagad'): PaymentConfig {
  switch (type) {
    case 'sslcommerz':
      return {
        storeId: process.env.SSLCOMMERZ_STORE_ID || '',
        storePassword: process.env.SSLCOMMERZ_STORE_PASSWORD || '',
        isLive: process.env.NODE_ENV === 'production',
        baseUrl: process.env.NODE_ENV === 'production'
          ? 'https://securepay.sslcommerz.com'
          : 'https://sandbox.sslcommerz.com',
      };
    case 'bkash':
      return {
        storeId: process.env.BKASH_STORE_ID || '',
        storePassword: process.env.BKASH_STORE_PASSWORD || '',
        isLive: process.env.NODE_ENV === 'production',
        baseUrl: process.env.NODE_ENV === 'production'
          ? 'https://pay.bkash.com'
          : 'https://tokenized.pay.bkash.com',
      };
    case 'nagad':
      return {
        storeId: process.env.NAGAD_MERCHANT_ID || '',
        storePassword: process.env.NAGAD_CHECKOUT_PRIVATE_KEY || '',
        isLive: process.env.NODE_ENV === 'production',
        baseUrl: process.env.NODE_ENV === 'production'
          ? 'https://api.nagad.com'
          : 'https://api.sandbox.nagad.com',
      };
  }
}

function isConfigured(type: 'sslcommerz' | 'bkash' | 'nagad'): boolean {
  const c = getConfig(type);
  return !!(c.storeId && c.storePassword);
}

// ─── SSLCommerz ────────────────────────────────────────────────────────────────

export async function initiateSSLCommerzPayment(
  req: PaymentRequest
): Promise<PaymentResponse> {
  const config = getConfig('sslcommerz');
  const transactionId = `SSL-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

  if (!isConfigured('sslcommerz')) {
    // Test mode: generate a one-time token and redirect
    if (process.env.NODE_ENV !== 'production') {
      const testToken = generateTestPaymentToken(req.orderId, transactionId);
      return {
        success: true,
        paymentUrl: `/api/payments/sslcommerz/ipn?status=SUCCESS&token=${testToken}`,
        transactionId,
      };
    }
    return { success: false, error: 'SSLCommerz gateway not configured. Set SSCOMMERZ_STORE_ID and SSCOMMERZ_STORE_PASSWORD env vars.' };
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
        success_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/payments/sslcommerz/ipn`,
        fail_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/payment/fail`,
        cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/payment/fail`,
        ipn_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/payments/sslcommerz/ipn`,
        cus_name: req.customerName,
        cus_email: req.customerEmail,
        cus_phone: req.customerPhone,
        cus_add1: req.address,
        prod_name: req.productName || 'Order Payment',
        prod_category: req.productCategory || 'electrical',
        shipping_method: 'NO',
        product_profile: 'general',
      }),
    });
    const data = await response.json();
    if (data.status === 'SUCCESS') {
      return { success: true, paymentUrl: data.GatewayPageURL, transactionId };
    }
    return { success: false, error: data.failedreason || 'SSLCommerz initiation failed' };
  } catch (error) {
    console.error('[SSLCommerz] API error:', error);
    return { success: false, error: 'Failed to connect to SSLCommerz gateway' };
  }
}

export async function validateSSLCommerzPayment(
  tranId: string
): Promise<PaymentResponse> {
  const config = getConfig('sslcommerz');

  if (!isConfigured('sslcommerz')) {
    // Test mode: accept any validation
    return { success: true, transactionId: tranId };
  }

  try {
    const response = await fetch(`${config.baseUrl}/validator/api/validationserverAPI.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        val_id: tranId,
        store_id: config.storeId,
        store_passwd: config.storePassword,
        format: 'json',
      }),
    });
    const data = await response.json();
    if (data.status === 'VALID') {
      return { success: true, transactionId: data.tran_id };
    }
    return { success: false, error: 'Invalid SSLCommerz payment' };
  } catch (error) {
    console.error('[SSLCommerz] Validation error:', error);
    return { success: false, error: 'SSLCommerz validation failed' };
  }
}

// ─── bKash ─────────────────────────────────────────────────────────────────────

export async function initiateBkashPayment(
  req: PaymentRequest
): Promise<PaymentResponse> {
  const config = getConfig('bkash');
  const transactionId = `BK-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

  if (!isConfigured('bkash')) {
    if (process.env.NODE_ENV !== 'production') {
      return {
        success: true,
        paymentUrl: `/api/payments/bkash/callback?status=success&paymentID=${transactionId}&order_id=${req.orderId}&amount=${req.amount}`,
        transactionId,
      };
    }
    return { success: false, error: 'bKash gateway not configured. Set BKASH_STORE_ID and BKASH_STORE_PASSWORD env vars.' };
  }

  // ── Real bKash Tokenized Checkout API ──
  try {
    // Step 1: Grant token
    const tokenRes = await fetch(`${config.baseUrl}/checkedout/get/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${config.storeId}:${config.storePassword}`).toString('base64')}`,
        'Accept': 'application/json',
      },
      body: JSON.stringify({ app_key: config.storeId, app_secret: config.storePassword }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.id_token) {
      return { success: false, error: tokenData.statusMessage || 'bKash token generation failed' };
    }

    // Step 2: Create payment
    const paymentRes = await fetch(`${config.baseUrl}/checkedout/payment/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenData.id_token}`,
        'X-App-Key': config.storeId,
      },
      body: JSON.stringify({
        amount: req.amount,
        currency: 'BDT',
        intent: 'sale',
        merchantInvoiceNumber: req.orderId,
        callbackURL: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/payments/bkash/callback`,
      }),
    });
    const paymentData = await paymentRes.json();
    if (paymentData.paymentID && paymentData.bkashURL) {
      return { success: true, paymentUrl: paymentData.bkashURL, transactionId: paymentData.paymentID };
    }
    return { success: false, error: paymentData.statusMessage || 'bKash payment creation failed' };
  } catch (error) {
    console.error('[bKash] API error:', error);
    return { success: false, error: 'Failed to connect to bKash gateway' };
  }
}

export async function validateBkashPayment(
  paymentID: string
): Promise<PaymentResponse> {
  const config = getConfig('bkash');

  if (!isConfigured('bkash')) {
    return { success: true, transactionId: paymentID };
  }

  try {
    const tokenRes = await fetch(`${config.baseUrl}/checkedout/get/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${config.storeId}:${config.storePassword}`).toString('base64')}`,
        'Accept': 'application/json',
      },
      body: JSON.stringify({ app_key: config.storeId, app_secret: config.storePassword }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.id_token) {return { success: false, error: 'bKash token failed' };}

    const executeRes = await fetch(`${config.baseUrl}/checkedout/payment/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenData.id_token}`,
        'X-App-Key': config.storeId,
      },
      body: JSON.stringify({ paymentID }),
    });
    const data = await executeRes.json();
    if (data.transactionStatus === 'completed') {
      return { success: true, transactionId: data.paymentID };
    }
    return { success: false, error: data.statusMessage || 'bKash payment not completed' };
  } catch (error) {
    console.error('[bKash] Validation error:', error);
    return { success: false, error: 'bKash validation failed' };
  }
}

// ─── Nagad ─────────────────────────────────────────────────────────────────────

export async function initiateNagadPayment(
  req: PaymentRequest
): Promise<PaymentResponse> {
  const config = getConfig('nagad');
  const transactionId = `NG-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

  if (!isConfigured('nagad')) {
    if (process.env.NODE_ENV !== 'production') {
      return {
        success: true,
        paymentUrl: `/api/payments/nagad/callback?status=Success&payment_ref_id=${transactionId}&order_id=${req.orderId}&amount=${req.amount}`,
        transactionId,
      };
    }
    return { success: false, error: 'Nagad gateway not configured. Set NAGAD_MERCHANT_ID and NAGAD_CHECKOUT_PRIVATE_KEY env vars.' };
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
        callbackURL: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/payments/nagad/callback`,
      }),
    });
    const initData = await initRes.json();
    if (!initData.paymentRefId) {
      return { success: false, error: initData.message || 'Nagad initialization failed' };
    }

    return {
      success: true,
      paymentUrl: `${config.baseUrl}/api/v2/cse/payment/${initData.paymentRefId}`,
      transactionId: initData.paymentRefId,
    };
  } catch (error) {
    console.error('[Nagad] API error:', error);
    return { success: false, error: 'Failed to connect to Nagad gateway' };
  }
}

export async function validateNagadPayment(
  paymentRefId: string
): Promise<PaymentResponse> {
  const config = getConfig('nagad');

  if (!isConfigured('nagad')) {
    // Test mode: accept (only safe because we control the test flow)
    return { success: true, transactionId: paymentRefId };
  }

  // Production: verify payment status with Nagad's verify API
  try {
    const verifyRes = await fetch(`${config.baseUrl}/api/v2/cse/payment/verify/${paymentRefId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Merchant-Id': config.storeId,
      },
    });
    const data = await verifyRes.json();
    if (data.paymentRefId && data.status === 'Payment Success') {
      return { success: true, transactionId: data.paymentRefId };
    }
    return { success: false, error: 'Nagad payment verification failed' };
  } catch (error) {
    console.error('[Nagad] Verification error:', error);
    return { success: false, error: 'Nagad verification failed' };
  }
}

// ─── Unified Payment Interface ─────────────────────────────────────────────────

const paymentMethods: Record<string, (req: PaymentRequest) => Promise<PaymentResponse>> = {
  sslcommerz: initiateSSLCommerzPayment,
  bkash: initiateBkashPayment,
  nagad: initiateNagadPayment,
};

export async function initiatePayment(
  method: string,
  req: PaymentRequest
): Promise<PaymentResponse> {
  const initiator = paymentMethods[method];
  if (!initiator) {
    return { success: false, error: `Unsupported payment method: ${method}` };
  }
  return initiator(req);
}