// Cart routes
// Cart is managed client-side via a Zustand store (see packages/store/src/cart.ts
// and apps/web/src/store/cart-store.ts). This endpoint is a placeholder for a
// future server-side cart sync feature.

import { Router } from 'express'
import { asyncHandler } from '../lib/api-handler.js'
import { requireAuth, getAuthUser } from '../lib/auth.js'

const router = Router()

// ─── GET /api/cart — health check / future server-side cart sync ──────────────

router.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    // Cart is managed client-side via Zustand store
    // This endpoint can be used for server-side cart sync in the future
    const _user = getAuthUser(req)
    res.json({ data: { items: [] }, message: 'Cart is managed client-side' })
  })
)

export default router
