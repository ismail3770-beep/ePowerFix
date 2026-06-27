import type { AuditLogEntry, SecurityEvent } from '../types'

const log: AuditLogEntry[] = []
const MAX_LOG_SIZE = 10000

export class AuditLogService {
  static record(event: SecurityEvent, userId?: string): AuditLogEntry {
    const entry: AuditLogEntry = {
      id: event.id,
      timestamp: event.timestamp,
      userId,
      action: event.type,
      resource: `${event.method} ${event.path}`,
      details: event.details,
      ip: event.ip,
      userAgent: event.userAgent || '',
      path: event.path,
    }
    log.push(entry)
    if (log.length > MAX_LOG_SIZE) {
      log.splice(0, log.length - MAX_LOG_SIZE)
    }
    return entry
  }

  static getLogs(options?: {
    limit?: number
    offset?: number
    type?: string
    ip?: string
    startDate?: Date
    endDate?: Date
  }): { entries: AuditLogEntry[]; total: number } {
    let filtered = [...log]
    if (options?.type) {
      filtered = filtered.filter(e => e.action === options.type)
    }
    if (options?.ip) {
      filtered = filtered.filter(e => e.ip === options.ip)
    }
    if (options?.startDate) {
      filtered = filtered.filter(e => e.timestamp >= options.startDate)
    }
    if (options?.endDate) {
      filtered = filtered.filter(e => e.timestamp <= options.endDate)
    }
    filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    const total = filtered.length
    const offset = options?.offset || 0
    const limit = options?.limit || 50
    return { entries: filtered.slice(offset, offset + limit), total }
  }

  static getStats() {
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 3600000)
    const oneDayAgo = new Date(now.getTime() - 86400000)
    const oneWeekAgo = new Date(now.getTime() - 604800000)

    const lastHour = log.filter(e => e.timestamp >= oneHourAgo)
    const lastDay = log.filter(e => e.timestamp >= oneDayAgo)
    const lastWeek = log.filter(e => e.timestamp >= oneWeekAgo)

    const byType: Record<string, number> = {}
    for (const entry of lastDay) {
      byType[entry.action] = (byType[entry.action] || 0) + 1
    }

    const uniqueIPs = new Set(log.map(e => e.ip)).size
    const blockedIPs = new Set(
      log
        .filter(e => e.action === 'IP_BLOCKED' || e.action === 'BRUTE_FORCE')
        .map(e => e.ip)
    ).size

    const pathCounts: Record<string, number> = {}
    for (const entry of lastWeek) {
      const p = entry.path.split('?')[0]
      pathCounts[p] = (pathCounts[p] || 0) + 1
    }
    const topPaths = Object.entries(pathCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(entry => ({ path: entry[0], count: entry[1] }))

    return {
      totalEvents: log.length,
      lastHour: lastHour.length,
      lastDay: lastDay.length,
      lastWeek: lastWeek.length,
      byType,
      uniqueIPs,
      blockedIPs,
      topPaths,
    }
  }

  static clear() {
    log.length = 0
  }

  static getLogCount() {
    return log.length
  }
}