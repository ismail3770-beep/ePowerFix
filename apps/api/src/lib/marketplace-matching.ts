export type RecommendationScheduleStatus = 'AVAILABLE' | 'UNAVAILABLE' | 'UNCONFIGURED'

export interface ProviderAvailabilityWindow {
  dayOfWeek: number
  startTime: string
  endTime: string
  isActive: boolean
}

export interface RecommendationScoreInput {
  rating: number
  yearsExperience: number
  skillYearsExperience: number | null
  skillProficiency: string | null
  jobsCompleted: number
  activeJobs: number
  scheduleStatus: RecommendationScheduleStatus
}

export interface RecommendationFactor {
  key: 'RATING' | 'EXPERIENCE' | 'SKILL' | 'AVAILABILITY' | 'WORKLOAD' | 'COMPLETION_HISTORY'
  points: number
  maxPoints: number
  explanation: string
}

const DHAKA_TIME_ZONE = 'Asia/Dhaka'
const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/

function roundScore(value: number): number {
  return Math.round(value * 100) / 100
}

function clamp(value: number, minimum: number, maximum: number): number {
  if (!Number.isFinite(value)) return minimum
  return Math.min(maximum, Math.max(minimum, value))
}

function getDhakaDayAndTime(targetAt: Date): { dayOfWeek: number; time: string } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: DHAKA_TIME_ZONE,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(targetAt)
  const weekday = parts.find((part) => part.type === 'weekday')?.value
  const hour = parts.find((part) => part.type === 'hour')?.value
  const minute = parts.find((part) => part.type === 'minute')?.value
  const dayMap: Readonly<Record<string, number>> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  }
  return {
    dayOfWeek: weekday === undefined ? -1 : (dayMap[weekday] ?? -1),
    time: `${hour ?? ''}:${minute ?? ''}`,
  }
}

function windowContains(
  window: ProviderAvailabilityWindow,
  dayOfWeek: number,
  time: string,
): boolean {
  if (
    !window.isActive ||
    !Number.isInteger(window.dayOfWeek) ||
    window.dayOfWeek < 0 ||
    window.dayOfWeek > 6 ||
    !TIME_PATTERN.test(window.startTime) ||
    !TIME_PATTERN.test(window.endTime)
  ) {
    return false
  }
  if (window.startTime <= window.endTime) {
    return window.dayOfWeek === dayOfWeek && window.startTime <= time && time <= window.endTime
  }
  // Overnight windows belong to their starting day and may continue into the next day.
  return (
    (window.dayOfWeek === dayOfWeek && time >= window.startTime) ||
    ((window.dayOfWeek + 1) % 7 === dayOfWeek && time <= window.endTime)
  )
}

export function evaluateProviderSchedule(
  windows: readonly ProviderAvailabilityWindow[],
  targetAt: Date,
): RecommendationScheduleStatus {
  const activeWindows = windows.filter((window) => window.isActive)
  if (activeWindows.length === 0) return 'UNCONFIGURED'
  if (Number.isNaN(targetAt.getTime())) return 'UNAVAILABLE'
  const { dayOfWeek, time } = getDhakaDayAndTime(targetAt)
  return activeWindows.some((window) => windowContains(window, dayOfWeek, time))
    ? 'AVAILABLE'
    : 'UNAVAILABLE'
}

export function scoreProviderRecommendation(input: RecommendationScoreInput): {
  score: number
  factors: RecommendationFactor[]
} {
  const rating = clamp(input.rating, 0, 5)
  const ratingPoints = roundScore((rating / 5) * 30)
  const relevantExperience = Math.max(
    clamp(input.yearsExperience, 0, 50),
    clamp(input.skillYearsExperience ?? 0, 0, 50),
  )
  const experiencePoints = roundScore((Math.min(relevantExperience, 10) / 10) * 20)
  const proficiencyPoints: Readonly<Record<string, number>> = {
    BEGINNER: 8,
    STANDARD: 13,
    ADVANCED: 17,
    EXPERT: 20,
  }
  const skillPoints = input.skillProficiency
    ? (proficiencyPoints[input.skillProficiency.toUpperCase()] ?? 10)
    : 15
  const availabilityPoints = input.scheduleStatus === 'AVAILABLE'
    ? 15
    : input.scheduleStatus === 'UNCONFIGURED'
      ? 3
      : 0
  const activeJobs = Math.max(0, Math.floor(input.activeJobs))
  const workloadPoints = activeJobs === 0 ? 10 : activeJobs === 1 ? 7 : activeJobs === 2 ? 4 : activeJobs === 3 ? 2 : 0
  const completionPoints = roundScore((Math.min(Math.max(0, input.jobsCompleted), 50) / 50) * 5)

  const factors: RecommendationFactor[] = [
    {
      key: 'RATING',
      points: ratingPoints,
      maxPoints: 30,
      explanation: `${rating.toFixed(2)}/5 provider rating`,
    },
    {
      key: 'EXPERIENCE',
      points: experiencePoints,
      maxPoints: 20,
      explanation: `${relevantExperience} relevant years of experience`,
    },
    {
      key: 'SKILL',
      points: skillPoints,
      maxPoints: 20,
      explanation: input.skillProficiency
        ? `${input.skillProficiency.toUpperCase()} verified skill proficiency`
        : 'No specific skill was required',
    },
    {
      key: 'AVAILABILITY',
      points: availabilityPoints,
      maxPoints: 15,
      explanation: input.scheduleStatus === 'AVAILABLE'
        ? 'Schedule covers the requested time'
        : input.scheduleStatus === 'UNCONFIGURED'
          ? 'Schedule is not configured; admin confirmation required'
          : 'Schedule does not cover the requested time',
    },
    {
      key: 'WORKLOAD',
      points: workloadPoints,
      maxPoints: 10,
      explanation: `${activeJobs} active marketplace job${activeJobs === 1 ? '' : 's'}`,
    },
    {
      key: 'COMPLETION_HISTORY',
      points: completionPoints,
      maxPoints: 5,
      explanation: `${Math.max(0, input.jobsCompleted)} completed marketplace job${input.jobsCompleted === 1 ? '' : 's'}`,
    },
  ]

  return {
    score: roundScore(factors.reduce((total, factor) => total + factor.points, 0)),
    factors,
  }
}
