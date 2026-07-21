import { describe, expect, it } from 'vitest'
import {
  getProviderApprovalIssues,
  getProviderSubmissionIssues,
  isOwnedProviderStorageKey,
  REQUIRED_PROVIDER_DOCUMENT_TYPES,
} from './marketplace-provider'

function completeProfile(status = 'PENDING', skillVerified = true) {
  return {
    displayName: 'Verified Electrician',
    yearsExperience: 5,
    documents: REQUIRED_PROVIDER_DOCUMENT_TYPES.map((type) => ({ type, status })),
    skills: [{ id: 'skill-1', isVerified: skillVerified }],
    serviceZones: [{ id: 'zone-1' }],
    availability: [{ dayOfWeek: 1 }],
  }
}

describe('provider onboarding readiness', () => {
  it('requires every identity/evidence document plus skill, coverage, and schedule', () => {
    const issues = getProviderSubmissionIssues({
      displayName: '',
      yearsExperience: -1,
      documents: [],
      skills: [],
      serviceZones: [],
      availability: [],
    })

    expect(issues).toContain('DISPLAY_NAME_REQUIRED')
    expect(issues).toContain('EXPERIENCE_REQUIRED')
    expect(issues).toContain('SKILL_REQUIRED')
    expect(issues).toContain('SERVICE_ZONE_REQUIRED')
    expect(issues).toContain('AVAILABILITY_REQUIRED')
    for (const type of REQUIRED_PROVIDER_DOCUMENT_TYPES) {
      expect(issues).toContain(`DOCUMENT_REQUIRED:${type}`)
    }
  })

  it('allows a complete profile to submit but requires approved documents and a verified skill for approval', () => {
    expect(getProviderSubmissionIssues(completeProfile())).toEqual([])
    expect(getProviderApprovalIssues(completeProfile())).toHaveLength(
      REQUIRED_PROVIDER_DOCUMENT_TYPES.length,
    )
    expect(getProviderApprovalIssues(completeProfile('APPROVED', false))).toEqual([
      'VERIFIED_SKILL_REQUIRED',
    ])
    expect(getProviderApprovalIssues(completeProfile('APPROVED'))).toEqual([])
  })

  it('only accepts non-URL, traversal-safe keys inside the provider namespace', () => {
    expect(isOwnedProviderStorageKey(
      'marketplace/providers/provider-1/nid/front.webp',
      'provider-1',
    )).toBe(true)
    expect(isOwnedProviderStorageKey(
      'marketplace/providers/provider-2/nid/front.webp',
      'provider-1',
    )).toBe(false)
    expect(isOwnedProviderStorageKey(
      'marketplace/providers/provider-1/../other/secret',
      'provider-1',
    )).toBe(false)
    expect(isOwnedProviderStorageKey('https://example.com/document.webp', 'provider-1')).toBe(false)
  })
})
