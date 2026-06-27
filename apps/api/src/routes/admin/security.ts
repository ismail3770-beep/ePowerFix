import { Router, Request, Response } from 'express'
import { requireAdmin } from '../../middleware/auth'
import { AuditLogService, SecurityScannerService, IPReputationService, getAllLockedIPs, unlockIP, getRules, addRule, removeRule, getBotSignals } from '@epowerfix/security'

export const securityRouter = Router()

// All routes require admin
securityRouter.use(requireAdmin)

// ── Dashboard Stats ──
securityRouter.get('/stats', (_req: Request, res: Response) => {
  const stats = AuditLogService.getStats()
  const lockedIPs = getAllLockedIPs()
  const botSignals = getBotSignals()
  const ipReputation = IPReputationService.getAllReputations()
  const ipRules = getRules()

  res.json({
    success: true,
    data: {
      audit: stats,
      lockedIPs: lockedIPs.length,
      botSignals: botSignals.length,
      suspiciousBots: botSignals.filter(b => b.isBot).length,
      ipReputations: ipReputation.length,
      maliciousIPs: IPReputationService.getMaliciousIPs().length,
      ipRules: ipRules.length,
    }
  })
})

// ── Audit Log ──
securityRouter.get('/audit-logs', (req: Request, res: Response) => {
  const { type, ip, limit, offset } = req.query
  const result = AuditLogService.getLogs({
    type: type as string,
    ip: ip as string,
    limit: limit ? Number(limit) : 50,
    offset: offset ? Number(offset) : 0,
  })
  res.json({ success: true, ...result })
})

securityRouter.delete('/audit-logs', (_req: Request, res: Response) => {
  AuditLogService.clear()
  res.json({ success: true, message: 'Audit logs cleared' })
})

// ── Security Scanner ──
securityRouter.post('/scan', async (_req: Request, res: Response) => {
  try {
    const result = await SecurityScannerService.runFullScan()
    res.json({ success: true, data: result })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// ── Locked IPs (Brute Force) ──
securityRouter.get('/locked-ips', (_req: Request, res: Response) => {
  const locked = getAllLockedIPs()
  res.json({ success: true, data: locked })
})

securityRouter.post('/unlock-ip', (req: Request, res: Response) => {
  const { ip } = req.body
  if (!ip) return res.status(400).json({ success: false, error: 'IP is required' })
  unlockIP(ip)
  res.json({ success: true, message: `IP ${ip} unlocked` })
})

// ── IP Rules (Block/Whitelist) ──
securityRouter.get('/ip-rules', (req: Request, res: Response) => {
  const { type } = req.query
  const rules = getRules(type as string)
  res.json({ success: true, data: rules })
})

securityRouter.post('/ip-rules', (req: Request, res: Response) => {
  const rule = req.body
  if (!rule.type || !rule.ip) {
    return res.status(400).json({ success: false, error: 'type and ip are required' })
  }
  const newRule = addRule(rule)
  res.json({ success: true, data: newRule })
})

securityRouter.delete('/ip-rules/:id', (req: Request, res: Response) => {
  const removed = removeRule(req.params.id)
  if (!removed) {
    return res.status(404).json({ success: false, error: 'Rule not found' })
  }
  res.json({ success: true, message: 'Rule removed' })
})

// ── Bot Signals ──
securityRouter.get('/bot-signals', (_req: Request, res: Response) => {
  const signals = getBotSignals()
  res.json({ success: true, data: signals })
})

// ── IP Reputation ──
securityRouter.get('/ip-reputation', (_req: Request, res: Response) => {
  const all = IPReputationService.getAllReputations()
  res.json({ success: true, data: all })
})
