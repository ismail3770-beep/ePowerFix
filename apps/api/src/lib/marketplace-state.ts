// Server-side lifecycle literals are kept local because the API build's rootDir
// intentionally excludes workspace package sources. Shared DTOs mirror these
// values for transport, while this module remains the authoritative transition graph.
import { ApiError } from './api-handler.js'
type ProviderStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'VERIFIED'
  | 'REJECTED'
  | 'SUSPENDED'

type MarketplaceRequestStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'DISPATCHING'
  | 'ASSIGNED'
  | 'IN_SERVICE'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'DISPUTED'
  | 'RESOLVED'

type MarketplaceJobStatus =
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'EN_ROUTE'
  | 'ARRIVED'
  | 'INSPECTION'
  | 'QUOTE_PENDING'
  | 'QUOTE_APPROVED'
  | 'QUOTE_REJECTED'
  | 'IN_PROGRESS'
  | 'COMPLETED_PENDING_CONFIRMATION'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'DISPUTED'
  | 'RESOLVED'

type MarketplaceQuoteStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'ADMIN_REVIEW'
  | 'CUSTOMER_APPROVED'
  | 'CUSTOMER_REJECTED'
  | 'EXPIRED'
  | 'SUPERSEDED'

export type MarketplaceStateKind = 'provider' | 'request' | 'job' | 'quote'

type TransitionGraph<T extends string> = Readonly<Record<T, readonly T[]>>

export const PROVIDER_TRANSITIONS: TransitionGraph<ProviderStatus> = {
  DRAFT: ['SUBMITTED'],
  SUBMITTED: ['UNDER_REVIEW'],
  UNDER_REVIEW: ['VERIFIED', 'REJECTED'],
  VERIFIED: ['SUSPENDED'],
  REJECTED: ['DRAFT', 'SUBMITTED'],
  SUSPENDED: ['UNDER_REVIEW', 'VERIFIED'],
}

export const REQUEST_TRANSITIONS: TransitionGraph<MarketplaceRequestStatus> = {
  DRAFT: ['SUBMITTED', 'CANCELLED'],
  SUBMITTED: ['DISPATCHING', 'CANCELLED'],
  DISPATCHING: ['ASSIGNED', 'CANCELLED'],
  ASSIGNED: ['DISPATCHING', 'IN_SERVICE', 'CANCELLED'],
  IN_SERVICE: ['COMPLETED', 'CANCELLED', 'DISPUTED'],
  COMPLETED: ['DISPUTED'],
  CANCELLED: [],
  DISPUTED: ['RESOLVED'],
  RESOLVED: [],
}

export const JOB_TRANSITIONS: TransitionGraph<MarketplaceJobStatus> = {
  ASSIGNED: ['ACCEPTED', 'REJECTED', 'CANCELLED'],
  ACCEPTED: ['EN_ROUTE', 'CANCELLED'],
  REJECTED: ['ASSIGNED'],
  EN_ROUTE: ['ARRIVED', 'CANCELLED'],
  ARRIVED: ['INSPECTION'],
  INSPECTION: ['QUOTE_PENDING', 'CANCELLED'],
  QUOTE_PENDING: ['QUOTE_APPROVED', 'QUOTE_REJECTED', 'CANCELLED'],
  QUOTE_APPROVED: ['IN_PROGRESS', 'CANCELLED'],
  QUOTE_REJECTED: ['INSPECTION', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED_PENDING_CONFIRMATION', 'DISPUTED'],
  COMPLETED_PENDING_CONFIRMATION: ['COMPLETED', 'DISPUTED'],
  COMPLETED: ['DISPUTED'],
  CANCELLED: [],
  DISPUTED: ['RESOLVED'],
  RESOLVED: [],
}

export const QUOTE_TRANSITIONS: TransitionGraph<MarketplaceQuoteStatus> = {
  DRAFT: ['SUBMITTED', 'SUPERSEDED'],
  SUBMITTED: [
    'ADMIN_REVIEW',
    'CUSTOMER_APPROVED',
    'CUSTOMER_REJECTED',
    'EXPIRED',
    'SUPERSEDED',
  ],
  ADMIN_REVIEW: [
    'CUSTOMER_APPROVED',
    'CUSTOMER_REJECTED',
    'EXPIRED',
    'SUPERSEDED',
  ],
  CUSTOMER_APPROVED: [],
  CUSTOMER_REJECTED: ['SUPERSEDED'],
  EXPIRED: ['SUPERSEDED'],
  SUPERSEDED: [],
}

const GRAPHS = {
  provider: PROVIDER_TRANSITIONS,
  request: REQUEST_TRANSITIONS,
  job: JOB_TRANSITIONS,
  quote: QUOTE_TRANSITIONS,
} as const

export class MarketplaceTransitionError extends ApiError {
  readonly code = 'ILLEGAL_STATE_TRANSITION'

  constructor(
    readonly kind: MarketplaceStateKind,
    readonly from: string,
    readonly to: string,
  ) {
    super(`Illegal ${kind} transition from ${from} to ${to}`, 409, {
      code: 'ILLEGAL_STATE_TRANSITION',
      kind,
      from,
      to,
    })
  }
}

export function canMarketplaceTransition(
  kind: MarketplaceStateKind,
  from: string,
  to: string,
): boolean {
  const graph = GRAPHS[kind] as Readonly<Record<string, readonly string[]>>
  return graph[from]?.includes(to) ?? false
}

export function assertMarketplaceTransition(
  kind: MarketplaceStateKind,
  from: string,
  to: string,
): void {
  if (!canMarketplaceTransition(kind, from, to)) {
    throw new MarketplaceTransitionError(kind, from, to)
  }
}
