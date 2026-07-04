import { createHmac, createHash, randomBytes } from 'node:crypto'

// ── TOTP (RFC 6238) ────────────────────────────────────────
const TOTP_TIME_WINDOW = 30
const TOTP_DIGITS = 6

export function generateTOTPSecret(): Buffer {
  return randomBytes(20)
}

export function generateTOTP(secret: Buffer, time: number = Date.now()): string {
  const timeCode = Math.floor(time / 1000 / TOTP_TIME_WINDOW)
  const timeHex = timeCode.toString(16).padStart(16, '0')
  const timeBuf = Buffer.from(timeHex, 'hex')
  const hmac = createHmac('sha1', secret).update(timeBuf).digest('hex')

  const offset = parseInt(hmac.slice(-2), 16) & 0xf
  const binary =
    ((parseInt(hmac.substr(offset * 2, 2), 16) & 0x7f) << 24) |
    ((parseInt(hmac.substr((offset + 1) * 2, 2), 16) & 0xff) << 16) |
    ((parseInt(hmac.substr((offset + 2) * 2, 2), 16) & 0xff) << 8) |
    (parseInt(hmac.substr((offset + 3) * 2, 2), 16) & 0xff)

  const otp = binary % Math.pow(10, TOTP_DIGITS)
  return otp.toString().padStart(TOTP_DIGITS, '0')
}

export function validateTOTP(
  secret: Buffer,
  code: string,
  lastUsedWindow: number | null,
  windowRange: number = 1
): number | false {
  const currentTime = Math.floor(Date.now() / 1000 / TOTP_TIME_WINDOW)

  for (let offset = -windowRange; offset <= windowRange; offset++) {
    const w = currentTime + offset
    if (lastUsedWindow !== null && w <= lastUsedWindow) continue
    if (timingSafeEqual(generateTOTP(secret, w * TOTP_TIME_WINDOW * 1000), code)) {
      return w
    }
  }
  return false
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  const aBuf = Buffer.from(a)
  const bBuf = Buffer.from(b)
  let result = 0
  for (let i = 0; i < aBuf.length; i++) {
    result |= aBuf[i] ^ bBuf[i]
  }
  return result === 0
}

// ── Recovery Codes ───────────────────────
export function generateRecoveryCodes(count: number = 10): string[] {
  const codes: string[] = []
  const chars = '0123456789abcdef'
  for (let i = 0; i < count; i++) {
    let code = ''
    for (let j = 0; j < 4; j++) {
      for (let k = 0; k < 4; k++) {
        code += chars[Math.floor(Math.random() * chars.length)]
      }
      if (j < 3) code += ' '
    }
    codes.push(code)
  }
  return codes
}

export function validateRecoveryCode(code: string): string | null {
  const cleaned = code.replace(/\s/g, '').toLowerCase()
  if (!/^[a-f0-9]{16}$/.test(cleaned)) return null
  return cleaned.match(/.{1,4}/g)!.join(' ')
}

// ── Token Generation ───────────────────
export function generateSecureToken(): string {
  return randomBytes(32).toString('hex')
}

export function generateShortToken(): string {
  return randomBytes(16).toString('hex')
}

// ── Honeypot Value Generation ──────────────
const HONEYPOT_CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_.@*[]'

export function generateHoneypotFieldName(min: number = 6, max: number = 16): string {
  const len = min + Math.floor(Math.random() * (max - min + 1))
  let name = ''
  name += HONEYPOT_CHARS.substring(0, 26)[Math.floor(Math.random() * 26)]
  for (let i = 1; i < len; i++) {
    name += HONEYPOT_CHARS[Math.floor(Math.random() * HONEYPOT_CHARS.length)]
  }
  return name
}

export function generateHoneypotFieldValue(min: number = 6, max: number = 16): string {
  const len = min + Math.floor(Math.random() * (max - min + 1))
  let value = ''
  for (let i = 0; i < len; i++) {
    value += HONEYPOT_CHARS[Math.floor(Math.random() * HONEYPOT_CHARS.length)]
  }
  return value
}

// ── Secure Token Bucket ──────────────
export class TokenBucket {
  private maxTokens: number
  private refillRate: number

  constructor(maxTokens: number, refillRate: number) {
    this.maxTokens = maxTokens
    this.refillRate = refillRate
  }

  consume(
    bucket: { tokens: number; lastRefill: number },
    count: number = 1
  ): boolean {
    const now = Date.now() / 1000
    const elapsed = now - bucket.lastRefill
    bucket.tokens = Math.min(
      this.maxTokens,
      bucket.tokens + elapsed * this.refillRate
    )
    bucket.lastRefill = now

    if (bucket.tokens >= count) {
      bucket.tokens -= count
      return true
    }
    return false
  }

  createBucket(): { tokens: number; lastRefill: number } {
    return { tokens: this.maxTokens, lastRefill: Date.now() / 1000 }
  }
}