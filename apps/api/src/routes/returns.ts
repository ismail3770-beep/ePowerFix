// Return request routes: list current user's returns
// Migrated from apps/web/src/app/api/returns/route.ts (Next.js → Express).
//
// Note: the source route is GET (the web client calls GET /api/returns?limit=10
// from profile/page.tsx). We preserve the GET method to keep the client
// contract intact. The POST endpoint for *creating* a return request lives
// at POST /api/orders/:id/return (see routes/orders.ts).

import { Router } from 'express'

import { db } from '../lib/db.js'
import { asyncHandler } from '../lib/api-handler.js'
import { requireAuth, getAuthUser } from '../lib/auth.js'

const router = Router()

// ─── GET /api/returns — list the current user's return requests ───────────────

router.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = getAuthUser(req)
    const limit = Math.min(
      50,
      Math.max(1, parseInt((req.query.limit as string) || '20', 10))
    )

    const returns = await db.returnRequest.findMany({
      where: { userId: user.id },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { order: { include: { items: true } } },
    })

    res.json({ data: returns })
  })
)

export default router
