import type {
  WAFConfig, RateLimitConfig, IPGuardConfig,
  BotDetectorConfig, AuthGuardConfig, SecurityHeadersConfig, HoneypotConfig
} from './types'

export interface SecurityConfig {
  waf: WAFConfig
  rateLimiter: RateLimitConfig[]
  ipGuard: IPGuardConfig
  botDetector: BotDetectorConfig
  authGuard: AuthGuardConfig
  headers: SecurityHeadersConfig
  honeypot: HoneypotConfig
  enableAuditLog: boolean
  blockResponseStatusCode: number
  blockResponseMessage: string
  trustedProxies: string[]
  excludedPaths: string[]
}

export const DefaultSecurityConfig: SecurityConfig = {
  waf: {
    enabled: true,
    mode: 'learning',
    failThreshold: 100,
    patterns: ['xss', 'sqli', 'dir_traversal', 'field_truncation', 'aggressive'],
    whitelistPaths: [],
    logOnly: true,
  },
  rateLimiter: [
    { enabled: true, windowMs: 60000, maxRequests: 1000, scope: 'global', blockDurationMs: 60000, throttleEnabled: true },
    { enabled: true, windowMs: 900000, maxRequests: 15, scope: 'login', blockDurationMs: 900000, throttleEnabled: false },
    { enabled: true, windowMs: 900000, maxRequests: 5, scope: 'register', blockDurationMs: 900000, throttleEnabled: false },
    { enabled: true, windowMs: 60000, maxRequests: 50, scope: '404', blockDurationMs: 60000, throttleEnabled: true },
  ],
  ipGuard: {
    enabled: true,
    autoBlockThreshold: 5,
    autoBlockDurationMs: 604800000,
    enableCountryBlocking: false,
    blockedCountries: [],
    allowedCountries: [],
    trustedProxies: [],
  },
  botDetector: {
    enabled: true,
    minimumBotScore: 25,
    highReputationMinimum: 75,
    track404s: true,
    fakeCrawlerDetection: true,
    silentCaptchaEnabled: false,
    silentCaptchaExpiry: 600,
  },
  authGuard: {
    enabled: true,
    maxLoginAttempts: 20,
    lockoutDurationMs: 14400000,
    failedAttemptWindowMs: 900000,
    maskLoginErrors: true,
    enable2FA: false,
    twoFactorWindowSeconds: 30,
    twoFactorCodeDigits: 6,
    rememberDeviceDays: 30,
    captchaEnabled: false,
    captchaOnFailedAttempts: 3,
  },
  headers: {
    enabled: true,
    contentSecurityPolicy: null,
    contentSecurityPolicyReportOnly: false,
    hsts: false,
    hstsMaxAge: 31536000,
    hstsIncludeSubDomains: true,
    hstsPreload: true,
    xFrameOptions: 'DENY',
    xContentTypeOptions: true,
    referrerPolicy: 'strict-origin-when-cross-origin',
    permissionsPolicy: {
      'camera': [], 'microphone': [], 'geolocation': [],
      'payment': ['self'], 'usb': [],
    },
    crossOriginOpenerPolicy: 'same-origin',
    crossOriginResourcePolicy: 'same-origin',
    crossOriginEmbedderPolicy: 'require-corp',
    xXSSProtection: true,
    upgradeInsecureRequests: false,
  },
  honeypot: {
    enabled: false,
    fieldCount: 3,
    fieldNameLength: [6, 16],
    fieldValueLength: [6, 16],
    cookieCount: 3,
    rotationIntervalMs: 3600000,
  },
  enableAuditLog: true,
  blockResponseStatusCode: 403,
  blockResponseMessage: 'Access Denied - Security Policy Violation',
  trustedProxies: [],
  excludedPaths: ['/api/health', '/api/payments/sslcommerz/ipn', '/api/payments/bkash/callback', '/api/payments/nagad/callback', '/api/payments/sslcommerz/callback', '/api/payments/nagad/verify', '/api/admin', '/api/auth'],
}