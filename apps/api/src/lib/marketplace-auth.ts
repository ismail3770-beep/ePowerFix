import type { NextFunction, Request, Response } from 'express'
import { env } from '../config/env.js'
import { getAuthUser, type SessionUser } from './auth.js'
import { db } from './db.js'

type ProviderAccessProfile = {
  id: string
  userId: string
  status: string
  isActive: boolean
}

type ProviderAccessDecision =
  | { ok: true }
  | {
      ok: false
      status: 403 | 404
      code:
        | 'PROVIDER_ROLE_REQUIRED'
        | 'PROVIDER_PROFILE_REQUIRED'
        | 'PROVIDER_NOT_VERIFIED'
        | 'PROVIDER_SUSPENDED'
    }

export function evaluateProviderAccess(
  user: Pick<SessionUser, 'id' | 'role'>,
  profile: ProviderAccessProfile | null,
  verifiedOnly: boolean,
): ProviderAccessDecision {
  if (user.role !== 'ELECTRICIAN') {
    return { ok: false, status: 403, code: 'PROVIDER_ROLE_REQUIRED' }
  }
  if (!profile || profile.userId !== user.id) {
    return { ok: false, status: 404, code: 'PROVIDER_PROFILE_REQUIRED' }
  }
  if (!profile.isActive || profile.status === 'SUSPENDED') {
    return { ok: false, status: 403, code: 'PROVIDER_SUSPENDED' }
  }
  if (verifiedOnly && profile.status !== 'VERIFIED') {
    return { ok: false, status: 403, code: 'PROVIDER_NOT_VERIFIED' }
  }
  return { ok: true }
}

function sendMarketplaceError(
  res: Response,
  status: number,
  code: string,
  error: string,
): void {
  res.status(status).json({ error, code })
}

export function requireMarketplaceEnabled(
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!env.MARKETPLACE_ENABLED) {
    sendMarketplaceError(res, 404, 'MARKETPLACE_DISABLED', 'Marketplace is not available')
    return
  }
  next()
}

export function requireMarketplacePaymentsEnabled(
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!env.MARKETPLACE_ENABLED || !env.MARKETPLACE_PAYMENTS_ENABLED) {
    sendMarketplaceError(
      res,
      404,
      'MARKETPLACE_PAYMENTS_DISABLED',
      'Marketplace payments are not available',
    )
    return
  }
  next()
}

export function requireProviderOnboardingEnabled(
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!env.MARKETPLACE_ENABLED || !env.PROVIDER_ONBOARDING_ENABLED) {
    sendMarketplaceError(
      res,
      404,
      'PROVIDER_ONBOARDING_DISABLED',
      'Provider onboarding is not available',
    )
    return
  }
  next()
}

async function enforceProviderAccess(
  req: Request,
  res: Response,
  next: NextFunction,
  verifiedOnly: boolean,
): Promise<void> {
  const user = getAuthUser(req)
  const profile: ProviderAccessProfile | null = await db.providerProfile.findUnique({
    where: { userId: user.id },
    select: { id: true, userId: true, status: true, isActive: true },
  })
  const decision = evaluateProviderAccess(user, profile, verifiedOnly)

  if (!decision.ok) {
    const messages = {
      PROVIDER_ROLE_REQUIRED: 'Electrician access required',
      PROVIDER_PROFILE_REQUIRED: 'Provider profile not found',
      PROVIDER_NOT_VERIFIED: 'Verified provider access required',
      PROVIDER_SUSPENDED: 'Provider access is suspended',
    } as const
    sendMarketplaceError(res, decision.status, decision.code, messages[decision.code])
    return
  }

  ;(req as any).provider = profile
  next()
}

export async function requireProvider(req: Request, res: Response, next: NextFunction) {
  await enforceProviderAccess(req, res, next, false)
}

export async function requireVerifiedProvider(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  await enforceProviderAccess(req, res, next, true)
}

export function getMarketplaceProvider(req: Request): ProviderAccessProfile {
  return (req as any).provider
}
