// ─── ePowerFix Ultimate Security System ───

import { securityMiddleware } from './middleware/security'

export type {
  SecurityEvent,
  SecurityEventType,
  WAFRule,
  WAFCategory,
  BotSignal,
  IPRule,
  IPRuleType,
  AuditLogEntry,
  SecurityScanResult,
  SecurityIssue,
  SecurityScore,
  HoneypotConfig,
  RateLimitConfig,
  AuthGuardConfig,
  WAFConfig,
  IPGuardConfig,
  BotDetectorConfig,
  SecurityHeadersConfig,
  RateLimitScope,
  RateLimitEntry,
} from './types'

export { SecurityConfig, DefaultSecurityConfig } from './config'
export { securityMiddleware } from './middleware/security'

// Individual middleware exports
export { wafMiddleware } from './middleware/waf'
export { rateLimiterMiddleware, getRateLimitStatus, resetRateLimit } from './middleware/rate-limiter'
export { ipGuardMiddleware, addRule, removeRule, getRules, recordOffense, clearOffenses } from './middleware/ip-guard'
export { botDetectorMiddleware, recordBotSignal, getBotScore, getBotSignals } from './middleware/bot-detector'
export { authGuardMiddleware, getAllLockedIPs, unlockIP } from './middleware/auth-guard'
export { securityHeadersMiddleware } from './middleware/security-headers'

// Services
export { AuditLogService } from './services/audit-log'
export { SecurityScannerService } from './services/security-scanner'
export { IPReputationService } from './services/ip-reputation'

// Utils
export { parseIP, ipToBuffer, isIPInRange, getIPVersion, normalizeIP, hashIP, getClientIP } from './utils/ip-utils'
export { generateTOTP, validateTOTP, generateRecoveryCodes, validateRecoveryCode, generateSecureToken, generateShortToken } from './utils/crypto'
export { WAF_PATTERNS, XSS_PATTERNS, SQLI_PATTERNS, DIR_TRAVERSAL_PATTERNS, AGGRESSIVE_PATTERNS, KNOWN_BOT_UA_PATTERNS, SUSPICIOUS_PATHS } from './utils/patterns'