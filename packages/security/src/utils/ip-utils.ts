import { createHash } from 'node:crypto'

export function parseIP(ip: string): Buffer {
  if (ip.includes('.')) {
    const parts = ip.split('.').map(Number)
    if (parts.length !== 4 || parts.some(p => isNaN(p) || p < 0 || p > 255)) {
      throw new Error(`Invalid IPv4: ${ip}`)
    }
    const buf = Buffer.alloc(16)
    buf[10] = 0xff
    buf[11] = 0xff
    buf[12] = parts[0]
    buf[13] = parts[1]
    buf[14] = parts[2]
    buf[15] = parts[3]
    return buf
  }
  if (ip.includes(':')) {
    return ipv6ToBuffer(ip)
  }
  throw new Error(`Invalid IP address: ${ip}`)
}

export function ipToBuffer(ip: string): Buffer {
  return parseIP(ip)
}

export function getIPVersion(ip: string): 'IPv4' | 'IPv6' {
  return ip.includes(':') ? 'IPv6' : 'IPv4'
}

function ipv6ToBuffer(ip: string): Buffer {
  let full = ip
  const doubleColonCount = (full.match(/::/g) || []).length
  if (doubleColonCount === 1) {
    const parts = full.split('::')
    const left = parts[0] ? parts[0].split(':') : []
    const right = parts[1] ? parts[1].split(':') : []
    const missing = 8 - left.length - right.length
    full = [...left, ...Array(missing).fill('0'), ...right].join(':')
  }
  const groups = full.split(':').map(g => parseInt(g, 16) || 0)
  if (groups.length !== 8) throw new Error(`Invalid IPv6: ${ip}`)
  const buf = Buffer.alloc(16)
  for (let i = 0; i < 8; i++) {
    buf.writeUInt16BE(groups[i], i * 2)
  }
  return buf
}

export function isIPInRange(ip: string, cidr: string): boolean {
  const [network, prefixStr] = cidr.split('/')
  if (!prefixStr) return ip === network

  const prefix = parseInt(prefixStr, 10)
  const ipBuf = parseIP(ip)
  const netBuf = parseIP(network)

  if (prefix === 0) return true
  if (prefix > 128) return false

  const fullBytes = Math.floor(prefix / 8)
  const remainingBits = prefix % 8

  for (let i = 0; i < fullBytes; i++) {
    if (ipBuf[i] !== netBuf[i]) return false
  }

  if (remainingBits > 0 && fullBytes < 16) {
    const mask = 0xff << (8 - remainingBits)
    if ((ipBuf[fullBytes] & mask) !== (netBuf[fullBytes] & mask)) return false
  }

  return true
}

export function normalizeIP(ip: string): string {
  const cleaned = ip.replace(/:\d+$/, '')
  if (cleaned.startsWith('::ffff:')) {
    return cleaned.replace('::ffff:', '')
  }
  return cleaned.toLowerCase()
}

export function hashIP(ip: string, secret: string): string {
  return createHash('sha256').update(`${ip}:${secret}`).digest('hex').substring(0, 16)
}

export function getClientIP(
  req: { headers: Record<string, string | string[] | undefined>; ip?: string; connection?: { remoteAddress?: string } },
  trustedProxies: string[] = []
): string {
  const xff = req.headers['x-forwarded-for']
  if (xff) {
    const ips = Array.isArray(xff) ? xff[0] : xff
    const chain = ips.split(',').map(s => s.trim())
    for (let i = chain.length - 1; i >= 0; i--) {
      if (i === chain.length - 1 || trustedProxies.includes(chain[i + 1])) {
        if (!trustedProxies.includes(chain[i])) {
          return normalizeIP(chain[i])
        }
      } else {
        break
      }
    }
    return normalizeIP(chain[chain.length - 1])
  }

  const cfIP = req.headers['cf-connecting-ip']
  if (cfIP) {
    const ip = Array.isArray(cfIP) ? cfIP[0] : cfIP
    return normalizeIP(ip)
  }

  const realIP = req.headers['x-real-ip']
  if (realIP) {
    const ip = Array.isArray(realIP) ? realIP[0] : realIP
    return normalizeIP(ip)
  }

  return normalizeIP(req.ip || req.connection?.remoteAddress || '0.0.0.0')
}