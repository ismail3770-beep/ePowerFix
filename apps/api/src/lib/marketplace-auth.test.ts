import { describe, expect, it } from 'vitest'
import { evaluateProviderAccess } from './marketplace-auth'

const electrician = { id: 'user-1', role: 'ELECTRICIAN' }
const verifiedProfile = {
  id: 'provider-1',
  userId: 'user-1',
  status: 'VERIFIED',
  isActive: true,
}

describe('marketplace provider access', () => {
  it('requires the electrician role and matching provider ownership', () => {
    expect(evaluateProviderAccess({ id: 'user-1', role: 'CUSTOMER' }, null, false)).toEqual({
      ok: false,
      status: 403,
      code: 'PROVIDER_ROLE_REQUIRED',
    })
    expect(evaluateProviderAccess(electrician, null, false)).toEqual({
      ok: false,
      status: 404,
      code: 'PROVIDER_PROFILE_REQUIRED',
    })
    expect(evaluateProviderAccess(electrician, { ...verifiedProfile, userId: 'other-user' }, false))
      .toEqual({ ok: false, status: 404, code: 'PROVIDER_PROFILE_REQUIRED' })
  })

  it('allows draft profiles only on non-verified provider routes', () => {
    const draft = { ...verifiedProfile, status: 'DRAFT' }
    expect(evaluateProviderAccess(electrician, draft, false)).toEqual({ ok: true })
    expect(evaluateProviderAccess(electrician, draft, true)).toEqual({
      ok: false,
      status: 403,
      code: 'PROVIDER_NOT_VERIFIED',
    })
  })

  it('allows verified active providers and blocks suspended or inactive profiles', () => {
    expect(evaluateProviderAccess(electrician, verifiedProfile, true)).toEqual({ ok: true })
    expect(evaluateProviderAccess(electrician, { ...verifiedProfile, status: 'SUSPENDED' }, true))
      .toEqual({ ok: false, status: 403, code: 'PROVIDER_SUSPENDED' })
    expect(evaluateProviderAccess(electrician, { ...verifiedProfile, isActive: false }, false))
      .toEqual({ ok: false, status: 403, code: 'PROVIDER_SUSPENDED' })
  })
})
