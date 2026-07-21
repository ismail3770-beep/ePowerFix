// Payment callback IP whitelist verification.
//
// Gateway POST callbacks must be accepted only from configured provider source
// addresses. In production an absent or blank allowlist fails closed; local
// development remains permissive for the simulated gateway callbacks.

import type { Request } from 'express'
import { env } from '../config/env.js'

function normalizeIp(value: string | undefined): string {
  const ip = value?.trim() || 'unknown'
  // Node commonly represents IPv4 peers through an IPv6-mapped address.
  return ip.startsWith('::ffff:') ? ip.slice('::ffff:'.length) : ip
}

export function verifyCallbackIp(
  req: Request,
): { ok: true } | { ok: false; ip: string } {
  // req.ip is calculated by Express from the trusted proxy chain configured in
  // server.ts. Do not read X-Forwarded-For directly: a client can prepend a
  // forged value to that header.
  const ip = normalizeIp(req.ip)
  const whitelist = env.PAYMENT_CALLBACK_IP_WHITELIST

  if (whitelist.length === 0) {
    // A missing allowlist must never silently expose production callbacks.
    return env.NODE_ENV === 'production' ? { ok: false, ip } : { ok: true }
  }

  if (whitelist.includes(ip)) return { ok: true }

  // Support IPv4 CIDR matching (for example, "192.168.1.0/24").
  for (const entry of whitelist) {
    if (entry.includes('/') && isIpInCidr(ip, entry)) return { ok: true }
  }

  return { ok: false, ip }
}

function isIpInCidr(ip: string, cidr: string): boolean {
  try {
    const parts = cidr.split('/')
    if (parts.length !== 2) return false

    const [range, bitsStr] = parts
    const bits = Number(bitsStr)
    if (!Number.isInteger(bits) || bits < 0 || bits > 32) return false

    const ipParts = ip.split('.').map((value) => Number(value))
    const rangeParts = range.split('.').map((value) => Number(value))
    if (ipParts.length !== 4 || rangeParts.length !== 4) return false
    if (ipParts.some((value) => !Number.isInteger(value) || value < 0 || value > 255)) {
      return false
    }
    if (
      rangeParts.some(
        (value) => !Number.isInteger(value) || value < 0 || value > 255,
      )
    ) {
      return false
    }

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
