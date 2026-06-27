// ─── Core Types ───

// ── Security Events ──────────────────────────────────────────────
export type SecurityEventType =
  | 'WAF_BLOCK'
  | 'RATE_LIMIT'
  | 'IP_BLOCKED'
  | 'BOT_DETECTED'
  | 'BRUTE_FORCE'
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILURE'
  | 'HONEYPOT_TRIGGER'
  | 'CSP_VIOLATION'
  | 'AUTH_2FA_REQUIRED'
  | 'AUTH_2FA_SUCCESS'
  | 'AUTH_2FA_FAILURE'
  | 'SCAN_COMPLETED'
  | 'IP_WHITELISTED'
  | 'COUNTRY_BLOCKED'

export interface SecurityEvent {
  id: string
  type: SecurityEventType
  ip: string
  userAgent?: string
  path: string
  method: string
  details: Record<string, unknown>
  timestamp: Date
  score?: number
}

// ── WAF (Web Application Firewall) ──────────────────────────────
export type WAFCategory = 'xss' | 'sqli' | 'dir_traversal' | 'field_truncation' | 'aggressive' | 'php_code'

export interface WAFRule {
  id: string
  category: WAFCategory
  pattern: RegExp
  score: number
  description: string
  enabled: boolean
}

export interface WAFConfig {
  enabled: boolean
  mode: 'disabled' | 'learning' | 'enabled'
  failThreshold: number
  patterns: WAFCategory[]
  whitelistPaths: { path: string; params?: string[] }[]
  logOnly: boolean
}

// ── Rate Limiting ────────────────────────────────────────────────
export type RateLimitScope = 'global' | 'login' | 'register' | 'api' | '404'

export interface RateLimitConfig {
  enabled: boolean
  windowMs: number
  maxRequests: number
  scope: RateLimitScope
  blockDurationMs: number
  throttleEnabled: boolean
}

export interface RateLimitEntry {
  ip: string
  scope: RateLimitScope
  count: number
  windowStart: number
  blockedUntil?: number
}

// ── IP Guard ─────────────────────────────────────────────────────
export type IPRuleType = 'manual_block' | 'manual_bypass' | 'auto_block' | 'country_block' | 'pattern_block'

export interface IPRule {
  id: string
  type: IPRuleType
  ip?: string
  ipEnd?: string
  cidr?: string
  country?: string
  userAgent?: string
  referrer?: string
  reason: string
  createdAt: Date
  expiresAt?: Date
  offenses: number
  createdBy?: string
}

export interface IPGuardConfig {
  enabled: boolean
  autoBlockThreshold: number
  autoBlockDurationMs: number
  enableCountryBlocking: boolean
  blockedCountries: string[]
  allowedCountries: string[]
  trustedProxies: string[]
}

// ── Bot Detection ────────────────────────────────────────────────
export interface BotSignal {
  ip: string
  signals: Record<string, number>
  lastSeenAt: number
  isBot: boolean
  score: number
  identity?: string
}

export interface BotDetectorConfig {
  enabled: boolean
  minimumBotScore: number
  highReputationMinimum: number
  track404s: boolean
  fakeCrawlerDetection: boolean
  silentCaptchaEnabled: boolean
  silentCaptchaExpiry: number
}

// ── Auth Guard ───────────────────────────────────────────────────
export interface AuthGuardConfig {
  enabled: boolean
  maxLoginAttempts: number
  lockoutDurationMs: number
  failedAttemptWindowMs: number
  maskLoginErrors: boolean
  enable2FA: boolean
  twoFactorWindowSeconds: number
  twoFactorCodeDigits: number
  rememberDeviceDays: number
  captchaEnabled: boolean
  captchaOnFailedAttempts: number
}

// ── Security Headers ─────────────────────────────────────────────
export interface SecurityHeadersConfig {
  enabled: boolean
  contentSecurityPolicy: string | null
  contentSecurityPolicyReportOnly: boolean
  hsts: boolean
  hstsMaxAge: number
  hstsIncludeSubDomains: boolean
  hstsPreload: boolean
  xFrameOptions: 'DENY' | 'SAMEORIGIN' | 'ALLOW-FROM'
  xFrameAllowFrom?: string
  xContentTypeOptions: boolean
  referrerPolicy: string
  permissionsPolicy: Record<string, string[]>
  crossOriginOpenerPolicy: string
  crossOriginResourcePolicy: string
  crossOriginEmbedderPolicy: string
  xXSSProtection: boolean
  upgradeInsecureRequests: boolean
}

// ── Honeypot ─────────────────────────────────────────────────────
export interface HoneypotConfig {
  enabled: boolean
  fieldCount: number
  fieldNameLength: [number, number]
  fieldValueLength: [number, number]
  cookieCount: number
  rotationIntervalMs: number
}

// ── Audit Log ────────────────────────────────────────────────────
export interface AuditLogEntry {
  id: string
  timestamp: Date
  userId?: string
  action: string
  resource: string
  details: Record<string, unknown>
  ip: string
  userAgent: string
  path: string
}

// ── Security Scanner ─────────────────────────────────────────────
export interface SecurityScanResult {
  id: string
  scannedAt: Date
  score: number
  totalTests: number
  passedTests: number
  failedTests: number
  warnings: number
  issues: SecurityIssue[]
}

export interface SecurityIssue {
  test: string
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
  description: string
  fixable: boolean
  fixDescription?: string
  score: number
}

// ── Security Score ──────────────────────────────────────────────
export interface SecurityScore {
  overall: number
  categories: {
    firewall: number
    authentication: number
    rateLimiting: number
    botProtection: number
    ipManagement: number
    headers: number
    ssl: number
  }
  lastScanned: Date
}