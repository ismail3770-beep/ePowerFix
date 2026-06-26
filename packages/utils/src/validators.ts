import { z } from 'zod'

export const phoneSchema = z
  .string()
  .regex(/^(\+880|0)1[3-9]\d{8}$/, 'Valid BD phone required')
export const emailSchema = z.string().email('Valid email required')
export const passwordSchema = z.string().min(6, 'Minimum 6 characters')
export const bdtAmountSchema = z.number().min(0, 'Amount must be positive')
