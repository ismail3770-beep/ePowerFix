/**
 * Notification helpers — create notifications for admins or specific users.
 *
 * Used by order/return/status API routes to alert admins when a customer
 * places an order, requests a return, or when an admin updates an order
 * status (the customer gets notified).
 *
 * All helpers are fire-and-forget safe: they catch errors internally so a
 * notification failure never breaks the parent transaction.
 */

import { db } from '@/lib/db'

/**
 * Create a notification for a single user.
 */
export async function notifyUser(
  userId: string,
  title: string,
  message: string,
  type: string = 'INFO',
  relatedId?: string,
): Promise<void> {
  try {
    await db.notification.create({
      data: { userId, title, message, type, relatedId: relatedId || null },
    })
  } catch (err) {
    // Never let notification failure break the parent operation.
    console.error('[notifications] failed to create notification:', err)
  }
}

/**
 * Notify ALL active admin users (used when a customer places an order,
 * requests a return, etc. — every admin should see it in the bell icon).
 */
export async function notifyAdmins(
  title: string,
  message: string,
  type: string = 'INFO',
  relatedId?: string,
): Promise<void> {
  try {
    const admins = await db.user.findMany({
      where: { role: 'ADMIN', isActive: true, isDeleted: false },
      select: { id: true },
    })
    if (admins.length === 0) {return}

    await db.notification.createMany({
      data: admins.map((a: any) => ({
        userId: a.id,
        title,
        message,
        type,
        relatedId: relatedId || null,
      })),
    })
  } catch (err) {
    console.error('[notifications] failed to notify admins:', err)
  }
}
