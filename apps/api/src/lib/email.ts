// Email utility for ePowerFix API.
// Uses the Resend API (https://resend.com) for transactional email delivery.
//
// Set RESEND_API_KEY and EMAIL_FROM in your .env to enable.
// If RESEND_API_KEY is absent, email sending is silently skipped (dev-safe).

const RESEND_API_URL = 'https://api.resend.com/emails'

function getResendApiKey(): string | undefined {
  return process.env.RESEND_API_KEY?.trim() || undefined
}

function getEmailFrom(): string {
  return process.env.EMAIL_FROM?.trim() || 'ePowerFix <noreply@epowerfix.com.bd>'
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OrderEmailData {
  orderNumber: string
  customerName?: string | null
  customerEmail?: string | null
  total: number
  paymentMethod: string
  address?: string | null
  items?: Array<{
    productName: string
    quantity: number
    price: number
  }>
}

// ─── Template ────────────────────────────────────────────────────────────────

function buildOrderConfirmationHtml(order: OrderEmailData): string {
  const formatPrice = (n: number) => '৳' + Number(n).toLocaleString('en-BD')
  const paymentLabel: Record<string, string> = {
    COD: 'Cash on Delivery',
    BKASH: 'bKash',
    NAGAD: 'Nagad',
    SSLCOMMERZ: 'Card / Mobile Banking',
  }

  const itemRows = (order.items ?? [])
    .map(
      (item) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;font-size:14px;color:#1f2328">${item.productName}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;font-size:14px;color:#57606a;text-align:center">${item.quantity}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;font-size:14px;color:#1f2328;text-align:right">${formatPrice(item.price * item.quantity)}</td>
      </tr>`,
    )
    .join('')

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Order Confirmed</title></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,'Segoe UI',sans-serif">
  <div style="max-width:600px;margin:32px auto;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb">
    <!-- Header -->
    <div style="background:#1e3a5f;padding:28px 32px">
      <h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.3px">ePowerFix</h1>
      <p style="margin:6px 0 0;font-size:13px;color:#94a3b8">Electrical Products &amp; Services</p>
    </div>

    <!-- Body -->
    <div style="padding:32px">
      <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#1f2328">Order Confirmed ✓</h2>
      <p style="margin:0 0 24px;font-size:15px;color:#57606a">
        Hi ${order.customerName || 'Customer'},<br>
        Thank you for your order. We've received it and will process it shortly.
      </p>

      <!-- Order details box -->
      <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:6px;padding:20px;margin-bottom:24px">
        <table style="width:100%;border-collapse:collapse">
          <tr>
            <td style="padding:4px 0;font-size:13px;color:#57606a;width:140px">Order Number</td>
            <td style="padding:4px 0;font-size:14px;font-weight:600;color:#1f2328">#${order.orderNumber}</td>
          </tr>
          <tr>
            <td style="padding:4px 0;font-size:13px;color:#57606a">Payment Method</td>
            <td style="padding:4px 0;font-size:14px;color:#1f2328">${paymentLabel[order.paymentMethod] ?? order.paymentMethod}</td>
          </tr>
          ${order.address ? `<tr>
            <td style="padding:4px 0;font-size:13px;color:#57606a">Delivery To</td>
            <td style="padding:4px 0;font-size:14px;color:#1f2328">${order.address}</td>
          </tr>` : ''}
        </table>
      </div>

      ${
        itemRows
          ? `<!-- Order items -->
      <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
        <thead>
          <tr style="background:#f8fafc">
            <th style="padding:8px 12px;font-size:12px;font-weight:600;color:#57606a;text-align:left;border-bottom:1px solid #e5e7eb">Item</th>
            <th style="padding:8px 12px;font-size:12px;font-weight:600;color:#57606a;text-align:center;border-bottom:1px solid #e5e7eb">Qty</th>
            <th style="padding:8px 12px;font-size:12px;font-weight:600;color:#57606a;text-align:right;border-bottom:1px solid #e5e7eb">Amount</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>`
          : ''
      }

      <!-- Total -->
      <div style="text-align:right;padding:12px 0;border-top:2px solid #e5e7eb">
        <span style="font-size:13px;color:#57606a;margin-right:16px">Total</span>
        <span style="font-size:18px;font-weight:700;color:#1e3a5f">${formatPrice(order.total)}</span>
      </div>

      <p style="margin:24px 0 0;font-size:13px;color:#57606a">
        You can track your order at <a href="https://epowerfix.com.bd/order-track" style="color:#3b82d4">epowerfix.com.bd/order-track</a>
        using your order number and phone number.
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#f8fafc;border-top:1px solid #e5e7eb;padding:20px 32px;text-align:center">
      <p style="margin:0;font-size:12px;color:#94a3b8">ePowerFix &mdash; Your trusted electrical partner in Bangladesh</p>
    </div>
  </div>
</body>
</html>`
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Sends an order confirmation email to the customer.
 * Silently skips if RESEND_API_KEY is not configured or customerEmail is absent.
 * Never throws — email failures must not break the order flow.
 */
export async function sendOrderConfirmation(order: OrderEmailData): Promise<void> {
  const apiKey = getResendApiKey()
  if (!apiKey || !order.customerEmail) return

  try {
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: getEmailFrom(),
        to: [order.customerEmail],
        subject: `Order Confirmed — #${order.orderNumber} | ePowerFix`,
        html: buildOrderConfirmationHtml(order),
      }),
    })

    if (!response.ok) {
      const body = await response.text().catch(() => '')
      console.error(`[email] Resend error ${response.status}:`, body)
    }
  } catch (err) {
    console.error('[email] sendOrderConfirmation failed:', err)
  }
}
