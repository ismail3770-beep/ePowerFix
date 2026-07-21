import { ApiError } from './api-handler.js'

export type MarketplaceCaseStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'REJECTED'

const CASE_TRANSITIONS: Readonly<Record<MarketplaceCaseStatus, readonly MarketplaceCaseStatus[]>> = {
  OPEN: ['UNDER_REVIEW'],
  UNDER_REVIEW: ['RESOLVED', 'REJECTED'],
  RESOLVED: [],
  REJECTED: [],
}

export function canMarketplaceCaseTransition(from: string, to: string): boolean {
  return CASE_TRANSITIONS[from as MarketplaceCaseStatus]?.includes(
    to as MarketplaceCaseStatus,
  ) ?? false
}

export function assertMarketplaceCaseTransition(from: string, to: string): void {
  if (!canMarketplaceCaseTransition(from, to)) {
    throw new ApiError(`Illegal case transition from ${from} to ${to}`, 409, {
      code: 'ILLEGAL_STATE_TRANSITION',
      kind: 'case',
      from,
      to,
    })
  }
}

export function isMarketplaceUniqueConstraintError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002'
}
