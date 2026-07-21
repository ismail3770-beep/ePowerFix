import { describe, expect, it } from 'vitest'

import {
  evaluateProviderSchedule,
  scoreProviderRecommendation,
} from './marketplace-matching'

describe('marketplace provider recommendations', () => {
  it('evaluates regular and overnight windows in Bangladesh local time', () => {
    expect(evaluateProviderSchedule([
      { dayOfWeek: 1, startTime: '09:00', endTime: '17:00', isActive: true },
    ], new Date('2026-07-20T04:00:00.000Z'))).toBe('AVAILABLE') // Monday 10:00 Dhaka

    expect(evaluateProviderSchedule([
      { dayOfWeek: 1, startTime: '22:00', endTime: '02:00', isActive: true },
    ], new Date('2026-07-20T18:30:00.000Z'))).toBe('AVAILABLE') // Tuesday 00:30 Dhaka
  })

  it('distinguishes unavailable and unconfigured schedules', () => {
    const target = new Date('2026-07-20T04:00:00.000Z')
    expect(evaluateProviderSchedule([], target)).toBe('UNCONFIGURED')
    expect(evaluateProviderSchedule([
      { dayOfWeek: 1, startTime: '18:00', endTime: '20:00', isActive: true },
    ], target)).toBe('UNAVAILABLE')
    expect(evaluateProviderSchedule([
      { dayOfWeek: 1, startTime: 'bad', endTime: '20:00', isActive: true },
    ], target)).toBe('UNAVAILABLE')
  })

  it('produces a bounded score with factors totaling the score', () => {
    const result = scoreProviderRecommendation({
      rating: 4.5,
      yearsExperience: 8,
      skillYearsExperience: 6,
      skillProficiency: 'ADVANCED',
      jobsCompleted: 25,
      activeJobs: 1,
      scheduleStatus: 'AVAILABLE',
    })
    expect(result.score).toBe(84.5)
    expect(result.factors.reduce((sum, factor) => sum + factor.points, 0)).toBe(result.score)
    expect(result.factors.map((factor) => factor.key)).toEqual([
      'RATING',
      'EXPERIENCE',
      'SKILL',
      'AVAILABILITY',
      'WORKLOAD',
      'COMPLETION_HISTORY',
    ])
  })

  it('penalizes workload and unknown schedules while clamping malformed numbers', () => {
    const result = scoreProviderRecommendation({
      rating: Number.NaN,
      yearsExperience: -5,
      skillYearsExperience: null,
      skillProficiency: null,
      jobsCompleted: -1,
      activeJobs: 10,
      scheduleStatus: 'UNCONFIGURED',
    })
    expect(result.score).toBe(18)
    expect(result.score).toBeGreaterThanOrEqual(0)
    expect(result.score).toBeLessThanOrEqual(100)
  })
})
