import { getClientIP } from '../utils/ip-utils'

interface IPReputation {
  ip: string
  score: number
  lastSeen: number
  threatLevel: 'clean' | 'suspicious' | 'malicious'
}

const reputationCache = new Map<string, IPReputation>()
const CACHE_TTL = 3600000

export class IPReputationService {
  static getReputation(ip: string): IPReputation | null {
    const cached = reputationCache.get(ip)
    if (cached && Date.now() - cached.lastSeen < CACHE_TTL) {
      return cached
    }
    return null
  }

  static recordEvent(ip: string, isMalicious: boolean) {
    let rep = reputationCache.get(ip)
    if (!rep) {
      rep = { ip, score: 50, lastSeen: Date.now(), threatLevel: 'clean' }
    }

    if (isMalicious) {
      rep.score = Math.max(0, rep.score - 20)
    } else {
      rep.score = Math.min(100, rep.score + 5)
    }

    rep.lastSeen = Date.now()
    if (rep.score < 25) rep.threatLevel = 'malicious'
    else if (rep.score < 50) rep.threatLevel = 'suspicious'
    else rep.threatLevel = 'clean'

    reputationCache.set(ip, rep)
    return rep
  }

  static getMaliciousIPs(): IPReputation[] {
    return Array.from(reputationCache.values()).filter(r => r.threatLevel === 'malicious')
  }

  static getSuspiciousIPs(): IPReputation[] {
    return Array.from(reputationCache.values()).filter(r => r.threatLevel === 'suspicious')
  }

  static getAllReputations(): IPReputation[] {
    return Array.from(reputationCache.values())
  }
}