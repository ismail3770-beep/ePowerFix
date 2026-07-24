// Express Request augmentation — provides type-safe access to req.user
// throughout the API without `(req as any).user` casts.

import type { SessionUser } from '../lib/auth.js'

declare global {
  namespace Express {
    interface Request {
      user?: SessionUser
    }
  }
}

export {}
