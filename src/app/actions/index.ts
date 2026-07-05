"use server"

/**
 * Server Actions — type-safe, zero-network-round-trip mutations.
 *
 * These replace the old POST API routes for form submissions.
 * Benefits over API routes:
 *   - Full TypeScript type safety (no JSON serialization)
 *   - No client-side fetch needed (form action={action})
 *   - Automatic CSRF protection (same-origin only)
 *   - Progressive enhancement (works without JS)
 *
 * Usage in a page:
 *   import { submitContact } from '@/app/actions'
 *
 *   <form action={submitContact}>
 *     <input name="name" />
 *     <input name="email" type="email" />
 *     ...
 *     <button type="submit">Send</button>
 *   </form>
 */

import { z } from 'zod'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth'

// ─── Contact Form ─────────────────────────────────────────────────────────────

const contactSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().optional(),
  subject: z.string().min(1).max(200),
  message: z.string().min(1).max(5000),
})

export async function submitContact(formData: FormData) {
  const parsed = contactSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    phone: formData.get('phone') || undefined,
    subject: formData.get('subject'),
    message: formData.get('message'),
  })

  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.issues.map((i) => ({
        field: i.path.join('.'),
        message: i.message,
      })),
    }
  }

  const auth = await requireAuth()

  await db.contact.create({
    data: {
      userId: auth.ok ? auth.user!.id : null,
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      subject: parsed.data.subject,
      message: parsed.data.message,
      status: 'NEW',
    },
  })

  revalidatePath('/admin/messages')
  return { success: true, message: 'Message sent successfully' }
}

// ─── Newsletter Signup ───────────────────────────────────────────────────────

const newsletterSchema = z.object({
  email: z.string().email(),
})

export async function subscribeNewsletter(formData: FormData) {
  const parsed = newsletterSchema.safeParse({
    email: formData.get('email'),
  })

  if (!parsed.success) {
    return { success: false, error: 'Invalid email address' }
  }

  const email = parsed.data.email.toLowerCase().trim()
  const existing = await db.newsletter.findUnique({ where: { email } })

  if (existing) {
    if (existing.status === 'ACTIVE') {
      return { success: false, error: 'Already subscribed' }
    }
    await db.newsletter.update({
      where: { email },
      data: { status: 'ACTIVE' },
    })
    return { success: true, message: 'Re-subscribed successfully' }
  }

  await db.newsletter.create({ data: { email, status: 'ACTIVE' } })
  return { success: true, message: 'Subscribed successfully' }
}

// ─── Quote Request ───────────────────────────────────────────────────────────

const quoteSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(6),
  email: z.string().email().optional().or(z.literal('')),
  serviceType: z.string().min(1),
  description: z.string().min(1),
  address: z.string().optional(),
  budget: z.string().optional(),
})

export async function submitQuoteRequest(formData: FormData) {
  const parsed = quoteSchema.safeParse({
    name: formData.get('name'),
    phone: formData.get('phone'),
    email: formData.get('email') || '',
    serviceType: formData.get('serviceType'),
    description: formData.get('description'),
    address: formData.get('address') || undefined,
    budget: formData.get('budget') || undefined,
  })

  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.issues.map((i) => ({
        field: i.path.join('.'),
        message: i.message,
      })),
    }
  }

  const auth = await requireAuth()

  await db.quoteRequest.create({
    data: {
      userId: auth.ok ? auth.user!.id : null,
      name: parsed.data.name,
      phone: parsed.data.phone,
      email: parsed.data.email || null,
      serviceType: parsed.data.serviceType,
      description: parsed.data.description,
      address: parsed.data.address || null,
      budget: parsed.data.budget || null,
      status: 'PENDING',
    },
  })

  revalidatePath('/admin/quote-requests')
  return { success: true, message: 'Quote request submitted' }
}
