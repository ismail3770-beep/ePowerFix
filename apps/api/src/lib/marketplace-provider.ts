export const REQUIRED_PROVIDER_DOCUMENT_TYPES = [
  'NID_FRONT',
  'NID_BACK',
  'SELFIE',
  'ADDRESS_PROOF',
  'SKILL_PROOF',
] as const

type ProviderDocumentCheck = {
  type: string
  status: string
}

type ProviderSkillCheck = Record<string, unknown> & {
  isVerified?: boolean
}

type ProviderReadinessInput = {
  displayName: string
  yearsExperience: number
  documents: ProviderDocumentCheck[]
  skills: ProviderSkillCheck[]
  serviceZones: unknown[]
  availability: unknown[]
}

export type ProviderReadinessIssue =
  | 'DISPLAY_NAME_REQUIRED'
  | 'EXPERIENCE_REQUIRED'
  | 'SKILL_REQUIRED'
  | 'VERIFIED_SKILL_REQUIRED'
  | 'SERVICE_ZONE_REQUIRED'
  | 'AVAILABILITY_REQUIRED'
  | `DOCUMENT_REQUIRED:${typeof REQUIRED_PROVIDER_DOCUMENT_TYPES[number]}`
  | `DOCUMENT_NOT_APPROVED:${typeof REQUIRED_PROVIDER_DOCUMENT_TYPES[number]}`

export function getProviderSubmissionIssues(
  profile: ProviderReadinessInput,
): ProviderReadinessIssue[] {
  const issues: ProviderReadinessIssue[] = []
  if (profile.displayName.trim().length < 2) issues.push('DISPLAY_NAME_REQUIRED')
  if (!Number.isInteger(profile.yearsExperience) || profile.yearsExperience < 0) {
    issues.push('EXPERIENCE_REQUIRED')
  }
  if (profile.skills.length === 0) issues.push('SKILL_REQUIRED')
  if (profile.serviceZones.length === 0) issues.push('SERVICE_ZONE_REQUIRED')
  if (profile.availability.length === 0) issues.push('AVAILABILITY_REQUIRED')

  const types = new Set(profile.documents.map((document) => document.type))
  for (const type of REQUIRED_PROVIDER_DOCUMENT_TYPES) {
    if (!types.has(type)) issues.push(`DOCUMENT_REQUIRED:${type}`)
  }
  return issues
}

export function getProviderApprovalIssues(
  profile: ProviderReadinessInput,
): ProviderReadinessIssue[] {
  const issues = getProviderSubmissionIssues(profile)
  if (profile.skills.length > 0 && !profile.skills.some((skill) => skill.isVerified === true)) {
    issues.push('VERIFIED_SKILL_REQUIRED')
  }
  const statuses = new Map(
    profile.documents.map((document) => [document.type, document.status]),
  )
  for (const type of REQUIRED_PROVIDER_DOCUMENT_TYPES) {
    if (statuses.has(type) && statuses.get(type) !== 'APPROVED') {
      issues.push(`DOCUMENT_NOT_APPROVED:${type}`)
    }
  }
  return issues
}

export function isOwnedProviderStorageKey(
  storageKey: string,
  providerId: string,
): boolean {
  if (!storageKey || storageKey.length > 500) return false
  if (storageKey.includes('..') || storageKey.includes('\\')) return false
  if (/^[a-z][a-z\d+.-]*:\/\//i.test(storageKey)) return false
  return storageKey.startsWith(`marketplace/providers/${providerId}/`)
}
