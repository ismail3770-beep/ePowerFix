'use client'

import { useState, useEffect, useCallback } from 'react'
import api from '@/lib/axios'
import {
  Shield, ShieldAlert, ShieldCheck, Bot, Ban, Unlock,
  Activity, Search, Trash2, Plus, X, AlertTriangle,
  CheckCircle2, XCircle, Info, Loader2, RefreshCw, Globe, Lock, Zap, FileWarning
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

// ── Types ──
interface ScanResult {
  id: string
  scannedAt: string
  score: number
  totalTests: number
  passedTests: number
  failedTests: number
  warnings: number
  issues: { test: string; severity: string; description: string; fixable: boolean; fixDescription?: string; score: number }[]
}

interface AuditLog {
  id: string
  timestamp: string
  action: string
  resource: string
  ip: string
  userAgent: string
  path: string
  details: Record<string, unknown>
}

interface IPRule {
  id: string
  type: string
  ip?: string
  cidr?: string
  reason: string
  createdAt: string
  expiresAt?: string
}

interface BotSignal {
  ip: string
  isBot: boolean
  score: number
  identity?: string
  lastSeenAt: number
}

interface SecurityStats {
  audit: {
    totalEvents: number
    lastHour: number
    lastDay: number
    lastWeek: number
    byType: Record<string, number>
    uniqueIPs: number
    blockedIPs: number
    topPaths: { path: string; count: number }[]
  }
  lockedIPs: number
  botSignals: number
  suspiciousBots: number
  ipReputations: number
  maliciousIPs: number
  ipRules: number
}

// ── Helpers ──
const severityColor = (s: string) => {
  switch (s) {
    case 'critical': return 'bg-red-500/10 text-red-500 border-red-500/20'
    case 'high': return 'bg-orange-500/10 text-orange-500 border-orange-500/20'
    case 'medium': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
    case 'low': return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
    default: return 'bg-green-500/10 text-green-500 border-green-500/20'
  }
}

const severityIcon = (s: string) => {
  switch (s) {
    case 'critical': case 'high': return <XCircle className="w-4 h-4 text-red-500" />
    case 'medium': return <AlertTriangle className="w-4 h-4 text-yellow-500" />
    case 'low': return <Info className="w-4 h-4 text-blue-500" />
    default: return <CheckCircle2 className="w-4 h-4 text-green-500" />
  }
}

const scoreColor = (score: number) => {
  if (score >= 80) return 'text-green-500'
  if (score >= 60) return 'text-yellow-500'
  if (score >= 40) return 'text-orange-500'
  return 'text-red-500'
}

const scoreBg = (score: number) => {
  if (score >= 80) return 'bg-green-500/10 border-green-500/30'
  if (score >= 60) return 'bg-yellow-500/10 border-yellow-500/30'
  if (score >= 40) return 'bg-orange-500/10 border-orange-500/30'
  return 'bg-red-500/10 border-red-500/30'
}

const eventTypeColor = (t: string) => {
  switch (t) {
    case 'WAF_BLOCK': return 'bg-purple-500/10 text-purple-400'
    case 'RATE_LIMIT': return 'bg-yellow-500/10 text-yellow-400'
    case 'IP_BLOCKED': return 'bg-red-500/10 text-red-400'
    case 'BOT_DETECTED': return 'bg-orange-500/10 text-orange-400'
    case 'BRUTE_FORCE': return 'bg-red-600/10 text-red-500'
    case 'LOGIN_SUCCESS': return 'bg-green-500/10 text-green-400'
    case 'LOGIN_FAILURE': return 'bg-pink-500/10 text-pink-400'
    default: return 'bg-gray-500/10 text-gray-400'
  }
}

export default function SecurityPage() {
  const [stats, setStats] = useState<SecurityStats | null>(null)
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [lockedIPs, setLockedIPs] = useState<{ ip: string; lockedUntil: number; attempts: number }[]>([])
  const [ipRules, setIpRules] = useState<IPRule[]>([])
  const [botSignals, setBotSignals] = useState<BotSignal[]>([])
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'audit' | 'scanner' | 'firewall' | 'ips' | 'bots'>('overview')
  const [showAddRule, setShowAddRule] = useState(false)
  const [newRuleIP, setNewRuleIP] = useState('')
  const [newRuleReason, setNewRuleReason] = useState('')

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await api.get('/api/admin/security/stats')
      setStats(data.data)
    } catch { /* silent */ }
  }, [])

  const fetchAuditLogs = useCallback(async () => {
    try {
      const { data } = await api.get('/api/admin/security/audit-logs', { params: { limit: 100 } })
      setAuditLogs(data.entries || [])
    } catch { /* silent */ }
  }, [])

  const fetchLockedIPs = useCallback(async () => {
    try {
      const { data } = await api.get('/api/admin/security/locked-ips')
      setLockedIPs(data.data || [])
    } catch { /* silent */ }
  }, [])

  const fetchIPRules = useCallback(async () => {
    try {
      const { data } = await api.get('/api/admin/security/ip-rules')
      setIpRules(data.data || [])
    } catch { /* silent */ }
  }, [])

  const fetchBotSignals = useCallback(async () => {
    try {
      const { data } = await api.get('/api/admin/security/bot-signals')
      setBotSignals((data.data || []).slice(0, 50))
    } catch { /* silent */ }
  }, [])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      await Promise.all([fetchStats(), fetchAuditLogs(), fetchLockedIPs(), fetchIPRules(), fetchBotSignals()])
      setLoading(false)
    }
    load()
  }, [fetchStats, fetchAuditLogs, fetchLockedIPs, fetchIPRules, fetchBotSignals])

  const handleScan = async () => {
    setScanning(true)
    try {
      const { data } = await api.post('/api/admin/security/scan')
      setScanResult(data.data)
      toast.success(`Scan complete — Score: ${data.data.score}/100`)
    } catch {
      toast.error('Scan failed')
    }
    setScanning(false)
  }

  const handleUnlockIP = async (ip: string) => {
    try {
      await api.post('/api/admin/security/unlock-ip', { ip })
      toast.success(`Unlocked ${ip}`)
      fetchLockedIPs()
      fetchStats()
    } catch {
      toast.error('Failed to unlock')
    }
  }

  const handleAddRule = async () => {
    if (!newRuleIP) return
    try {
      await api.post('/api/admin/security/ip-rules', {
        type: 'manual_block',
        ip: newRuleIP,
        reason: newRuleReason || 'Manual block by admin',
      })
      toast.success(`Blocked ${newRuleIP}`)
      setNewRuleIP('')
      setNewRuleReason('')
      setShowAddRule(false)
      fetchIPRules()
      fetchStats()
    } catch {
      toast.error('Failed to add rule')
    }
  }

  const handleRemoveRule = async (id: string) => {
    try {
      await api.delete(`/api/admin/security/ip-rules/${id}`)
      toast.success('Rule removed')
      fetchIPRules()
      fetchStats()
    } catch {
      toast.error('Failed to remove rule')
    }
  }

  const handleClearLogs = async () => {
    try {
      await api.delete('/api/admin/security/audit-logs')
      setAuditLogs([])
      toast.success('Logs cleared')
      fetchStats()
    } catch {
      toast.error('Failed to clear logs')
    }
  }

  const tabs = [
    { key: 'overview' as const, label: 'Overview', icon: Activity },
    { key: 'audit' as const, label: 'Audit Log', icon: Search },
    { key: 'scanner' as const, label: 'Scanner', icon: ShieldCheck },
    { key: 'firewall' as const, label: 'WAF', icon: Shield },
    { key: 'ips' as const, label: 'IP Management', icon: Globe },
    { key: 'bots' as const, label: 'Bot Detection', icon: Bot },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <Shield className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Security Center</h1>
            <p className="text-sm text-muted-foreground">Ultimate Security System — Real-time monitoring & protection</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => { fetchStats(); fetchAuditLogs(); fetchLockedIPs(); fetchIPRules(); fetchBotSignals(); }}>
          <RefreshCw className="w-4 h-4 mr-1" /> Refresh
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted/50 p-1 rounded-lg overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && stats && (
        <div className="space-y-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Events (24h)</p>
                    <p className="text-2xl font-bold">{stats.audit.lastDay}</p>
                  </div>
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Activity className="w-5 h-5 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Blocked IPs</p>
                    <p className="text-2xl font-bold">{stats.audit.blockedIPs}</p>
                  </div>
                  <div className="p-2 bg-red-500/10 rounded-lg">
                    <Ban className="w-5 h-5 text-red-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Locked (Brute Force)</p>
                    <p className="text-2xl font-bold">{stats.lockedIPs}</p>
                  </div>
                  <div className="p-2 bg-orange-500/10 rounded-lg">
                    <Lock className="w-5 h-5 text-orange-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Suspicious Bots</p>
                    <p className="text-2xl font-bold">{stats.suspiciousBots}</p>
                  </div>
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <Bot className="w-5 h-5 text-purple-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Security Score + Quick Scan */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> Quick Security Scan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Run a security scan to check JWT config, CORS, env vars, and dependencies.
                </p>
                <Button onClick={handleScan} disabled={scanning}>
                  {scanning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
                  {scanning ? 'Scanning...' : 'Run Security Scan'}
                </Button>
                {scanResult && (
                  <div className={`mt-4 p-4 rounded-lg border ${scoreBg(scanResult.score)}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Security Score</span>
                      <span className={`text-2xl font-bold ${scoreColor(scanResult.score)}`}>{scanResult.score}/100</span>
                    </div>
                    <div className="w-full bg-black/20 rounded-full h-2 mb-3">
                      <div
                        className={`h-2 rounded-full transition-all ${scanResult.score >= 80 ? 'bg-green-500' : scanResult.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${scanResult.score}%` }}
                      />
                    </div>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span className="text-green-400">{scanResult.passedTests} passed</span>
                      <span className="text-red-400">{scanResult.failedTests} failed</span>
                      <span className="text-yellow-400">{scanResult.warnings} warnings</span>
                    </div>
                    {scanResult.issues.filter(i => i.severity !== 'info').length > 0 && (
                      <div className="mt-3 space-y-2">
                        {scanResult.issues.filter(i => i.severity !== 'info').map((issue, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs">
                            {severityIcon(issue.severity)}
                            <div>
                              <span className="font-medium">{issue.test}:</span> {issue.description}
                              {issue.fixDescription && <span className="text-muted-foreground ml-1">→ {issue.fixDescription}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Event Types Breakdown */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileWarning className="w-4 h-4" /> Event Types (24h)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {Object.keys(stats.audit.byType).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No security events in the last 24 hours.</p>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(stats.audit.byType).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                        <Badge variant="outline" className={eventTypeColor(type)}>{type}</Badge>
                        <span className="text-sm font-mono font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-4 pt-3 border-t border-border/50 text-xs text-muted-foreground space-y-1">
                  <p>Total events logged: {stats.audit.totalEvents}</p>
                  <p>Unique IPs tracked: {stats.audit.uniqueIPs}</p>
                  <p>IP rules active: {stats.ipRules}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Audit Log Tab */}
      {activeTab === 'audit' && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Search className="w-4 h-4" /> Audit Log
              </CardTitle>
              <Button variant="outline" size="sm" onClick={handleClearLogs} className="text-red-400 hover:text-red-300">
                <Trash2 className="w-3 h-3 mr-1" /> Clear
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {auditLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No audit log entries yet. Security events will appear here.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground border-b border-border">
                      <th className="pb-2 pr-4">Time</th>
                      <th className="pb-2 pr-4">Type</th>
                      <th className="pb-2 pr-4">IP</th>
                      <th className="pb-2 pr-4">Path</th>
                      <th className="pb-2">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {auditLogs.slice(0, 50).map(log => (
                      <tr key={log.id} className="hover:bg-muted/30">
                        <td className="py-2 pr-4 whitespace-nowrap text-xs text-muted-foreground">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="py-2 pr-4">
                          <Badge variant="outline" className={`text-xs ${eventTypeColor(log.action)}`}>{log.action}</Badge>
                        </td>
                        <td className="py-2 pr-4 font-mono text-xs">{log.ip}</td>
                        <td className="py-2 pr-4 text-xs max-w-[200px] truncate">{log.resource}</td>
                        <td className="py-2 text-xs text-muted-foreground max-w-[250px] truncate">
                          {JSON.stringify(log.details).slice(0, 80)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Scanner Tab */}
      {activeTab === 'scanner' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> Security Scanner
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Full security scan checks JWT secret strength, CORS configuration, environment variable exposure, Node.js version, and dependency health.
            </p>
            <Button onClick={handleScan} disabled={scanning} size="lg">
              {scanning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
              {scanning ? 'Scanning...' : 'Run Full Security Scan'}
            </Button>
            {scanResult && (
              <div className="mt-6 space-y-4">
                <div className={`p-4 rounded-lg border ${scoreBg(scanResult.score)}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-semibold">Overall Score</span>
                    <span className={`text-3xl font-bold ${scoreColor(scanResult.score)}`}>{scanResult.score}/100</span>
                  </div>
                  <div className="w-full bg-black/20 rounded-full h-3 mb-2">
                    <div
                      className={`h-3 rounded-full transition-all ${scanResult.score >= 80 ? 'bg-green-500' : scanResult.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${scanResult.score}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Scanned at {new Date(scanResult.scannedAt).toLocaleString()}</p>
                </div>
                <div className="space-y-2">
                  {scanResult.issues.map((issue, i) => (
                    <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border ${severityColor(issue.severity)}`}>
                      {severityIcon(issue.severity)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{issue.test}</span>
                          <Badge variant="outline" className={severityColor(issue.severity)}>{issue.severity}</Badge>
                        </div>
                        <p className="text-sm">{issue.description}</p>
                        {issue.fixDescription && (
                          <p className="text-xs text-muted-foreground mt-1">Fix: {issue.fixDescription}</p>
                        )}
                      </div>
                      <span className="text-sm font-mono font-medium">{issue.score}/100</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* WAF Tab */}
      {activeTab === 'firewall' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" /> Web Application Firewall (WAF)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg border border-purple-500/20 bg-purple-500/5">
                <p className="text-xs text-muted-foreground mb-1">XSS Patterns</p>
                <p className="text-2xl font-bold text-purple-400">23</p>
                <p className="text-xs text-muted-foreground">Script injection, DOM events, eval()</p>
              </div>
              <div className="p-4 rounded-lg border border-red-500/20 bg-red-500/5">
                <p className="text-xs text-muted-foreground mb-1">SQLi Patterns</p>
                <p className="text-2xl font-bold text-red-400">30</p>
                <p className="text-xs text-muted-foreground">UNION, DROP, time-based blind</p>
              </div>
              <div className="p-4 rounded-lg border border-orange-500/20 bg-orange-500/5">
                <p className="text-xs text-muted-foreground mb-1">Total Patterns</p>
                <p className="text-2xl font-bold text-orange-400">100+</p>
                <p className="text-xs text-muted-foreground">XSS + SQLi + Dir Traversal + Aggressive</p>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-muted/30 border">
              <p className="text-sm font-medium mb-2">WAF Mode: <Badge variant="outline" className="ml-1">Learning (Log Only)</Badge></p>
              <p className="text-xs text-muted-foreground">
                WAF is currently in learning mode — it logs suspicious requests but does not block them.
                Switch to &quot;enabled&quot; mode in the config to activate blocking. Cumulative scoring: each request parameter is checked against all pattern categories.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/30 border">
              <p className="text-sm font-medium mb-2">Protected Categories</p>
              <div className="flex flex-wrap gap-2">
                {['XSS', 'SQL Injection', 'Directory Traversal', 'Field Truncation', 'Aggressive/Code Exec'].map(cat => (
                  <Badge key={cat} variant="outline">{cat}</Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* IP Management Tab */}
      {activeTab === 'ips' && (
        <div className="space-y-4">
          {/* Locked IPs */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Lock className="w-4 h-4 text-orange-500" /> Locked IPs (Brute Force)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {lockedIPs.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No IPs are currently locked.</p>
              ) : (
                <div className="space-y-2">
                  {lockedIPs.map(item => (
                    <div key={item.ip} className="flex items-center justify-between p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                      <div>
                        <span className="font-mono text-sm">{item.ip}</span>
                        <span className="text-xs text-muted-foreground ml-3">
                          {item.attempts} attempts — unlocks in {Math.max(0, Math.ceil((item.lockedUntil - Date.now()) / 60000))}m
                        </span>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleUnlockIP(item.ip)}>
                        <Unlock className="w-3 h-3 mr-1" /> Unlock
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* IP Rules */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Ban className="w-4 h-4" /> IP Rules
                </CardTitle>
                <Button variant="outline" size="sm" onClick={() => setShowAddRule(!showAddRule)}>
                  {showAddRule ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3 mr-1" />} Add Rule
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {showAddRule && (
                <div className="flex gap-2 mb-4 p-3 rounded-lg bg-muted/30 border">
                  <Input
                    placeholder="IP address (e.g. 192.168.1.1)"
                    value={newRuleIP}
                    onChange={e => setNewRuleIP(e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    placeholder="Reason"
                    value={newRuleReason}
                    onChange={e => setNewRuleReason(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={handleAddRule} size="sm">Block</Button>
                </div>
              )}
              {ipRules.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No IP rules configured. Add a block or whitelist rule above.</p>
              ) : (
                <div className="space-y-2">
                  {ipRules.map(rule => (
                    <div key={rule.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border">
                      <div className="flex items-center gap-3">
                        <Badge variant={rule.type === 'manual_bypass' ? 'default' : 'destructive'} className="text-xs">
                          {rule.type === 'manual_bypass' ? 'Whitelist' : rule.type === 'auto_block' ? 'Auto-Block' : 'Blocked'}
                        </Badge>
                        <span className="font-mono text-sm">{rule.ip || rule.cidr}</span>
                        <span className="text-xs text-muted-foreground">{rule.reason}</span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleRemoveRule(rule.id)} className="text-red-400 hover:text-red-300">
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bot Detection Tab */}
      {activeTab === 'bots' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Bot className="w-4 h-4" /> Bot Detection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div className="p-3 rounded-lg border bg-muted/30">
                <p className="text-xs text-muted-foreground">Tracked IPs</p>
                <p className="text-xl font-bold">{botSignals.length}</p>
              </div>
              <div className="p-3 rounded-lg border bg-orange-500/5 border-orange-500/20">
                <p className="text-xs text-muted-foreground">Flagged as Bots</p>
                <p className="text-xl font-bold text-orange-400">{botSignals.filter(b => b.isBot).length}</p>
              </div>
              <div className="p-3 rounded-lg border bg-blue-500/5 border-blue-500/20">
                <p className="text-xs text-muted-foreground">Known Good Bots</p>
                <p className="text-xl font-bold text-blue-400">{botSignals.filter(b => b.identity).length}</p>
              </div>
            </div>
            {botSignals.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No bot signals recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground border-b border-border">
                      <th className="pb-2 pr-4">IP</th>
                      <th className="pb-2 pr-4">Score</th>
                      <th className="pb-2 pr-4">Identity</th>
                      <th className="pb-2 pr-4">Bot?</th>
                      <th className="pb-2">Last Seen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {botSignals.map((bot, i) => (
                      <tr key={i} className="hover:bg-muted/30">
                        <td className="py-2 pr-4 font-mono text-xs">{bot.ip}</td>
                        <td className="py-2 pr-4">
                          <span className={`font-mono text-xs ${bot.score < 30 ? 'text-red-400' : bot.score < 60 ? 'text-yellow-400' : 'text-green-400'}`}>
                            {bot.score}
                          </span>
                        </td>
                        <td className="py-2 pr-4 text-xs">{bot.identity || '—'}</td>
                        <td className="py-2 pr-4">
                          <Badge variant={bot.isBot ? 'destructive' : 'default'} className="text-xs">
                            {bot.isBot ? 'Yes' : 'No'}
                          </Badge>
                        </td>
                        <td className="py-2 text-xs text-muted-foreground">
                          {new Date(bot.lastSeenAt * 1000).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}