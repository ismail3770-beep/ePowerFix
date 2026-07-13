// Payment callback IP whitelist verification.
// Ported from apps/web/src/lib/payment-callback-security.ts — adapted for
// Express (takes a Request object instead of reading next/headers).
//
// H10: Payment callbacks (bKash, Nagad, SSLCommerz) should only be accepted
// from known gateway IP ranges. Configure the whitelist via the
// `PAYMENT_CALLBACK_IP_WHITELIST` env var (comma-separated list of IPs or
// CIDR ranges). When the env var is unset (e.g. in dev), all IPs are allowed.

import type { Request } from 'express'

export function verifyCallbackIp(
  req: Request
): { ok: true } | { ok: false; ip: string } {
  // x-forwarded-for can be a comma-separated list; the first entry is the
  // original client IP.
  const xff = (req.headers['x-forwarded-for'] as string | undefined) || ''
  const ip =
    xff.split(',')[0].trim() ||
    (req.headers['x-real-ip'] as string | undefined) ||
    req.ip ||
    'unknown'

  const whitelistRaw = process.env.PAYMENT_CALLBACK_IP_WHITELIST
  if (!whitelistRaw) {
    // Dev mode: no whitelist configured → allow all.
    return { ok: true }
  }

  const whitelist = whitelistRaw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  if (whitelist.length === 0) return { ok: true }
  if (whitelist.includes(ip)) return { ok: true }

  // Support simple CIDR matching (e.g. "192.168.1.0/24").
  for (const entry of whitelist) {
    if (entry.includes('/')) {
      if (isIpInCidr(ip, entry)) return { ok: true }
    }
  }

  return { ok: false, ip }
}

function isIpInCidr(ip: string, cidr: string): boolean {
  try {
    const [range, bitsStr] = cidr.split('/')
    const bits = parseInt(bitsStr, 10)
    if (isNaN(bits)) return false
    const ipParts = ip.split('.').map((n) => parseInt(n, 10))
    const rangeParts = range.split('.').map((n) => parseInt(n, 10))
    if (ipParts.length !== 4 || rangeParts.length !== 4) return false
    if (ipParts.some((n) => isNaN(n) || n < 0 || n > 255)) return false
    if (rangeParts.some((n) => isNaN(n) || n < 0 || n > 255)) return false

    const ipNum =
      (ipParts[0] << 24) | (ipParts[1] << 16) | (ipParts[2] << 8) | ipParts[3]
    const rangeNum =
      (rangeParts[0] << 24) |
      (rangeParts[1] << 16) |
      (rangeParts[2] << 8) |
      rangeParts[3]
    const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0
    return (ipNum & mask) === (rangeNum & mask)
  } catch {
    return false
  }
}
