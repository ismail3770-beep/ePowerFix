const DECIMAL_MONEY = /^\d{1,10}(?:\.\d{1,2})?$/

export function normalizeMarketplaceMoney(
  value: string | null | undefined,
  fallback = '0.00',
): string {
  const candidate = value?.trim()
  if (!candidate || !DECIMAL_MONEY.test(candidate)) return fallback
  const amount = Number(candidate)
  if (!Number.isFinite(amount) || amount < 0 || amount > 99_999_999.99) return fallback
  return amount.toFixed(2)
}

export function isOwnedCustomerRequestStorageKey(
  storageKey: string,
  customerId: string,
): boolean {
  if (!storageKey || storageKey.length > 500) return false
  if (storageKey.includes('..') || storageKey.includes('\\')) return false
  if (/^[a-z][a-z\d+.-]*:\/\//i.test(storageKey)) return false
  return storageKey.startsWith(`marketplace/customers/${customerId}/requests/`)
}

export type RequestSubmissionIssue =
  | 'SERVICE_OR_SKILL_REQUIRED'
  | 'SCHEDULE_REQUIRED'
  | 'EMERGENCY_SURCHARGE_CONFIRMATION_REQUIRED'

export function getRequestSubmissionIssues(input: {
  serviceId: string | null
  skillId: string | null
  scheduledFor: Date | null
  isEmergency: boolean
  emergencySurcharge: string
  emergencySurchargeAccepted: boolean
}): RequestSubmissionIssue[] {
  const issues: RequestSubmissionIssue[] = []
  if (!input.serviceId && !input.skillId) issues.push('SERVICE_OR_SKILL_REQUIRED')
  if (!input.isEmergency && !input.scheduledFor) issues.push('SCHEDULE_REQUIRED')
  if (
    input.isEmergency &&
    Number(input.emergencySurcharge) > 0 &&
    !input.emergencySurchargeAccepted
  ) {
    issues.push('EMERGENCY_SURCHARGE_CONFIRMATION_REQUIRED')
  }
  return issues
}
