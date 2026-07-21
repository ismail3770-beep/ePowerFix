// Shared marketplace contracts. Decimal values cross API boundaries as strings
// so web/mobile clients never lose precision by coercing money to JavaScript numbers.

import type { BaseEntity, ID, ISODateString } from './index'

export type MarketplaceMoney = string

export type ProviderStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'VERIFIED'
  | 'REJECTED'
  | 'SUSPENDED'

export type MarketplaceRequestStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'DISPATCHING'
  | 'ASSIGNED'
  | 'IN_SERVICE'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'DISPUTED'
  | 'RESOLVED'

export type MarketplaceJobStatus =
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

export type MarketplaceQuoteStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'ADMIN_REVIEW'
  | 'CUSTOMER_APPROVED'
  | 'CUSTOMER_REJECTED'
  | 'EXPIRED'
  | 'SUPERSEDED'

export type MarketplaceReviewStatus = 'PUBLISHED' | 'HIDDEN'
export type MarketplaceCaseStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'REJECTED'
export type MarketplaceDisputeCategory =
  | 'PAYMENT'
  | 'WORK_QUALITY'
  | 'PROVIDER_CONDUCT'
  | 'PROPERTY_DAMAGE'
  | 'NO_SHOW'
  | 'OTHER'
export type MarketplacePayoutStatus = 'DRAFT' | 'APPROVED' | 'PAID' | 'FAILED'

export type MarketplaceErrorCode =
  | 'MARKETPLACE_DISABLED'
  | 'MARKETPLACE_PAYMENTS_DISABLED'
  | 'MARKETPLACE_PAYMENT_REQUIRED'
  | 'PROVIDER_ONBOARDING_DISABLED'
  | 'PROVIDER_ROLE_REQUIRED'
  | 'PROVIDER_PROFILE_REQUIRED'
  | 'PROVIDER_NOT_VERIFIED'
  | 'PROVIDER_SUSPENDED'
  | 'FORBIDDEN'
  | 'ILLEGAL_STATE_TRANSITION'
  | 'IDEMPOTENCY_CONFLICT'
  | 'WARRANTY_EXPIRED'
  | 'CASE_ALREADY_EXISTS'

export interface MarketplaceProviderSummary extends BaseEntity {
  userId: ID
  displayName: string
  status: ProviderStatus
  yearsExperience: number
  rating: MarketplaceMoney
  reviewCount: number
  jobsCompleted: number
  isActive: boolean
}

export interface MarketplaceServiceRequestSummary extends BaseEntity {
  customerId: ID
  serviceId?: ID | null
  skillId?: ID | null
  status: MarketplaceRequestStatus
  problemSummary: string
  scheduledFor?: ISODateString | null
  isEmergency: boolean
  districtName: string
  areaName?: string | null
}

export interface MarketplaceJobSummary extends BaseEntity {
  requestId: ID
  providerId?: ID | null
  status: MarketplaceJobStatus
  assignedAt?: ISODateString | null
  acceptedAt?: ISODateString | null
  completedAt?: ISODateString | null
}

export interface MarketplaceQuoteSummary extends BaseEntity {
  jobId: ID
  providerId: ID
  version: number
  status: MarketplaceQuoteStatus
  subtotal: MarketplaceMoney
  feeTotal: MarketplaceMoney
  taxTotal: MarketplaceMoney
  total: MarketplaceMoney
  expiresAt?: ISODateString | null
}

export type MarketplaceRecommendationScheduleStatus =
  | 'AVAILABLE'
  | 'UNAVAILABLE'
  | 'UNCONFIGURED'

export interface MarketplaceRecommendationFactor {
  key:
    | 'RATING'
    | 'EXPERIENCE'
    | 'SKILL'
    | 'AVAILABILITY'
    | 'WORKLOAD'
    | 'COMPLETION_HISTORY'
  points: number
  maxPoints: number
  explanation: string
}

export interface MarketplaceProviderRecommendation {
  providerId: ID
  displayName: string
  score: number
  scheduleStatus: MarketplaceRecommendationScheduleStatus
  rating: MarketplaceMoney
  reviewCount: number
  jobsCompleted: number
  activeJobs: number
  factors: MarketplaceRecommendationFactor[]
  warnings: string[]
}

export interface MarketplaceSkill extends BaseEntity {
  name: string
  nameBn?: string | null
  slug: string
  description?: string | null
  sortOrder: number
  isActive: boolean
}

export interface MarketplaceServiceZone extends BaseEntity {
  name: string
  nameBn?: string | null
  slug: string
  isActive: boolean
  district: {
    id: ID
    name: string
    nameBn?: string | null
    division: { id: ID; name: string; nameBn?: string | null }
  }
  upazila?: { id: ID; name: string; nameBn?: string | null } | null
}

export interface MarketplaceRequestAttachment {
  id: ID
  type: 'IMAGE' | 'VIDEO' | 'DOCUMENT'
  storageKey: string
  caption?: string | null
  sortOrder: number
  createdAt: ISODateString
}

export interface MarketplaceProviderPublicSummary {
  id: ID
  displayName: string
  displayNameBn?: string | null
  rating: MarketplaceMoney
  reviewCount?: number
  jobsCompleted: number
}

export interface MarketplaceRequestJobSummary extends MarketplaceJobSummary {
  enRouteAt?: ISODateString | null
  arrivedAt?: ISODateString | null
  provider?: MarketplaceProviderPublicSummary | null
}

export interface MarketplaceCustomerRequest extends MarketplaceServiceRequestSummary {
  description?: string | null
  serviceAddress: string
  serviceZoneId: ID
  emergencySurcharge: MarketplaceMoney
  cancellationReason?: string | null
  submittedAt?: ISODateString | null
  completedAt?: ISODateString | null
  cancelledAt?: ISODateString | null
  service?: { id: ID; name: string; nameBn?: string | null; slug?: string } | null
  skill?: { id: ID; name: string; nameBn?: string | null; slug?: string } | null
  serviceZone: MarketplaceServiceZone
  attachments: MarketplaceRequestAttachment[]
  job?: MarketplaceRequestJobSummary | null
}

export interface MarketplaceQuoteLineItem {
  id: ID
  type: string
  description: string
  quantity: MarketplaceMoney
  unitPrice: MarketplaceMoney
  total: MarketplaceMoney
  sortOrder: number
  createdAt: ISODateString
}

export interface MarketplaceCustomerQuote extends MarketplaceQuoteSummary {
  notes?: string | null
  submittedAt?: ISODateString | null
  customerDecisionAt?: ISODateString | null
  customerDecisionNote?: string | null
  lineItems: MarketplaceQuoteLineItem[]
}

export interface MarketplaceJobStatusHistory {
  id: ID
  fromStatus?: MarketplaceJobStatus | null
  toStatus: MarketplaceJobStatus
  note?: string | null
  createdAt: ISODateString
}

export interface MarketplaceCustomerJob extends MarketplaceJobSummary {
  enRouteAt?: ISODateString | null
  arrivedAt?: ISODateString | null
  workStartedAt?: ISODateString | null
  customerConfirmedAt?: ISODateString | null
  warrantyEndsAt?: ISODateString | null
  request: MarketplaceCustomerRequest
  provider?: MarketplaceProviderPublicSummary | null
  statusHistory: MarketplaceJobStatusHistory[]
  quotes: MarketplaceCustomerQuote[]
}

export interface CreateMarketplaceRequestPayload {
  serviceId?: ID | null
  skillId?: ID | null
  serviceZoneId: ID
  idempotencyKey?: string
  problemSummary: string
  description?: string | null
  serviceAddress: string
  areaName?: string | null
  latitude?: number | null
  longitude?: number | null
  scheduledFor?: ISODateString | null
  isEmergency: boolean
  emergencySurchargeAccepted: boolean
  attachments?: Array<{
    type: 'IMAGE' | 'VIDEO' | 'DOCUMENT'
    storageKey: string
    caption?: string | null
  }>
}

export interface MarketplaceArrivalOtp {
  code: string
  expiresAt: ISODateString
}

export interface MarketplacePaymentInitiation {
  id: ID
  jobId: ID
  quoteId?: ID | null
  type: string
  method: string
  status: string
  currency: string
  amount: MarketplaceMoney
  paymentUrl?: string | null
  reused: boolean
  paidAt?: ISODateString | null
  createdAt: ISODateString
}

export interface MarketplaceApiError {
  error: string
  code: MarketplaceErrorCode
  details?: unknown
}

export interface MarketplaceNotification {
  id: ID
  template: string
  title: string
  message: string
  payload: unknown
  status: string
  entityType: string
  entityId: ID
  deliveredAt: ISODateString | null
  readAt: ISODateString | null
  createdAt: ISODateString
}

export interface MarketplaceNotificationListResponse {
  data: {
    data: MarketplaceNotification[]
    total: number
    page: number
    limit: number
    totalPages: number
  }
  unreadCount: number
}

export type ProviderDocumentType =
  | 'NID_FRONT'
  | 'NID_BACK'
  | 'SELFIE'
  | 'ADDRESS_PROOF'
  | 'SKILL_PROOF'
export type ProviderDocumentStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface MarketplaceProviderDocument {
  id: ID
  type: ProviderDocumentType
  status: ProviderDocumentStatus
  rejectionReason?: string | null
  expiresAt?: ISODateString | null
  createdAt: ISODateString
  updatedAt: ISODateString
}

export interface MarketplaceProviderSkill {
  id: ID
  yearsExperience: number
  proficiency?: string | null
  isVerified: boolean
  verifiedAt?: ISODateString | null
  skill: MarketplaceSkill
}

export interface MarketplaceProviderZone {
  id: ID
  travelRadiusKm: number
  emergencyAvailable: boolean
  isActive: boolean
  serviceZone: MarketplaceServiceZone
}

export interface MarketplaceProviderAvailability {
  id: ID
  dayOfWeek: number
  startTime: string
  endTime: string
  isActive: boolean
}

export interface MarketplaceProviderProfile extends MarketplaceProviderSummary {
  displayNameBn?: string | null
  bio?: string | null
  emergencyAvailable: boolean
  submittedAt?: ISODateString | null
  reviewedAt?: ISODateString | null
  rejectionReason?: string | null
  documents: MarketplaceProviderDocument[]
  skills: MarketplaceProviderSkill[]
  serviceZones: MarketplaceProviderZone[]
  availability: MarketplaceProviderAvailability[]
}

export type ProviderReadinessIssue =
  | 'DISPLAY_NAME_REQUIRED'
  | 'EXPERIENCE_REQUIRED'
  | 'SKILL_REQUIRED'
  | 'VERIFIED_SKILL_REQUIRED'
  | 'SERVICE_ZONE_REQUIRED'
  | 'AVAILABILITY_REQUIRED'
  | `DOCUMENT_REQUIRED:${ProviderDocumentType}`
  | `DOCUMENT_NOT_APPROVED:${ProviderDocumentType}`

export interface MarketplaceProviderDashboard {
  profile: MarketplaceProviderProfile
  readinessIssues: ProviderReadinessIssue[]
  jobs: {
    total: number
    byStatus: Partial<Record<MarketplaceJobStatus, number>>
    recent: Array<{
      id: ID
      status: MarketplaceJobStatus
      assignedAt?: ISODateString | null
      acceptedAt?: ISODateString | null
      completedAt?: ISODateString | null
      createdAt: ISODateString
      request: {
        problemSummary: string
        scheduledFor?: ISODateString | null
        isEmergency: boolean
        serviceZone: { name: string; nameBn?: string | null }
      }
    }>
  }
  finance: {
    currency: string
    netEarnings: MarketplaceMoney
    availableForPayout: MarketplaceMoney
    payouts: Array<{
      id: ID
      status: MarketplacePayoutStatus
      currency: string
      netAmount: MarketplaceMoney
      paidAt?: ISODateString | null
      createdAt: ISODateString
    }>
  }
}

export interface MarketplacePublicReview {
  id: ID
  rating: number
  comment?: string | null
  customerLabel: string
  createdAt: ISODateString
}

export interface MarketplacePublicProvider {
  id: ID
  displayName: string
  displayNameBn?: string | null
  bio?: string | null
  avatar?: string | null
  yearsExperience: number
  rating: MarketplaceMoney
  reviewCount: number
  jobsCompleted: number
  emergencyAvailable: boolean
  reviewedAt?: ISODateString | null
  createdAt: ISODateString
  skills: MarketplaceProviderSkill[]
  serviceZones: MarketplaceProviderZone[]
  availability: Omit<MarketplaceProviderAvailability, 'isActive'>[]
  reviews: MarketplacePublicReview[]
}

export interface MarketplaceAdminProviderListItem extends MarketplaceProviderSummary {
  submittedAt?: ISODateString | null
  reviewedAt?: ISODateString | null
  user: { id: ID; name: string; email: string; phone?: string | null }
  _count: { documents: number; skills: number; serviceZones: number }
}

export interface MarketplaceAdminProviderSummary {
  total: number
  byStatus: Partial<Record<ProviderStatus, number>>
  awaitingReview: number
}
