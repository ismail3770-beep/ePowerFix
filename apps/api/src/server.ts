// ePowerFix Express API Server
// Main entry point — sets up middleware, routes, and starts the server.

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import compression from 'compression'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'

import { env } from './config/env.js'
import { errorHandler, notFoundHandler } from './lib/api-handler.js'
import { startExpiredReservationCleanupWorker } from './lib/order-reservations.js'

// ─── Route imports ────────────────────────────────────────────────────────────
import healthRoutes from './routes/health.js'
import authRoutes from './routes/auth.js'
import productRoutes from './routes/products.js'
import categoryRoutes from './routes/categories.js'
import brandRoutes from './routes/brands.js'
import orderRoutes from './routes/orders.js'
import serviceRoutes from './routes/services.js'
import projectRoutes from './routes/projects.js'
import projectKitRoutes from './routes/project-kits.js'
import blogRoutes from './routes/blog.js'
import reviewRoutes from './routes/reviews.js'
import wishlistRoutes from './routes/wishlist.js'
import cartRoutes from './routes/cart.js'
import paymentRoutes from './routes/payments.js'
import searchRoutes from './routes/search.js'
import contactRoutes from './routes/contact.js'
import newsletterRoutes from './routes/newsletter.js'
import quoteRequestRoutes from './routes/quote-requests.js'
import bannerRoutes from './routes/banners.js'
import settingsRoutes from './routes/settings.js'
import notificationRoutes from './routes/notifications.js'
import addressRoutes from './routes/addresses.js'
import couponRoutes from './routes/coupons.js'
import returnRoutes from './routes/returns.js'
import downloadRoutes from './routes/downloads.js'
import aiRoutes from './routes/ai.js'
import marketplaceRoutes from './routes/marketplace.js'
import adminRoutes from './routes/admin/index.js'

// ─── App setup ────────────────────────────────────────────────────────────────

const app = express()

// Trust proxy (needed for rate limiting behind reverse proxy)
app.set('trust proxy', 1)

// ─── Security & utility middleware ────────────────────────────────────────────

app.use(helmet())
app.use(compression())
app.use(
  cors({
    origin: [
      env.WEB_URL,
      'http://localhost:3000',
      'http://localhost:3001',
      'capacitor://localhost', // mobile app
      'http://localhost',
    ],
    credentials: true,
  })
)
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(cookieParser())
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'))

// ─── Rate limiting ────────────────────────────────────────────────────────────

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requests per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
})

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50, // 50 auth attempts per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts, please try again later.' },
})

app.use('/api', apiLimiter)
app.use('/api/auth', authLimiter)

// ─── Health check (before routes, no rate limit) ──────────────────────────────

app.get('/health', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store')
  res.json({
    status: 'ok',
    service: 'ePowerFix API',
    timestamp: new Date().toISOString(),
    version: '0.3.0',
    environment: env.NODE_ENV,
  })
})

// ─── API routes ───────────────────────────────────────────────────────────────

app.use('/api/health', healthRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/brands', brandRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/services', serviceRoutes)
app.use('/api/projects', projectRoutes)
app.use('/api/project-kits', projectKitRoutes)
app.use('/api/blog', blogRoutes)
app.use('/api/reviews', reviewRoutes)
app.use('/api/wishlist', wishlistRoutes)
app.use('/api/cart', cartRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/search', searchRoutes)
app.use('/api/contact', contactRoutes)
app.use('/api/newsletter', newsletterRoutes)
app.use('/api/quote-requests', quoteRequestRoutes)
app.use('/api/banners', bannerRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/addresses', addressRoutes)
app.use('/api/coupons', couponRoutes)
app.use('/api/returns', returnRoutes)
app.use('/api/downloads', downloadRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/marketplace', marketplaceRoutes)
app.use('/api/admin', adminRoutes)

// API root info
app.get('/api', (_req, res) => {
  res.json({
    name: 'ePowerFix API',
    version: '0.3.0',
    liveness: '/health',
    readiness: '/api/health',
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      orders: '/api/orders',
      services: '/api/services',
      marketplace: '/api/marketplace',
      projects: '/api/projects',
      blog: '/api/blog',
      admin: '/api/admin',
    },
  })
})

// ─── Error handling ───────────────────────────────────────────────────────────

app.use(notFoundHandler)
app.use(errorHandler)

// ─── Start server ─────────────────────────────────────────────────────────────

// Railway injects PORT at runtime; env validation supplies the local fallback.
const PORT = env.PORT
const HOST = env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost'

app.listen(PORT, HOST, () => {
  console.log(`🚀 ePowerFix API running at http://${HOST}:${PORT}`)
  console.log(`📋 Liveness: http://${HOST}:${PORT}/health`)
  console.log(`✅ Readiness: http://${HOST}:${PORT}/api/health`)
  console.log(`🌍 Environment: ${env.NODE_ENV}`)
  console.log(`🌐 Web URL: ${env.WEB_URL}`)

  // Railway runs this API as a long-lived service. Start the idempotent
  // cleanup worker here so abandoned online-payment reservations eventually
  // release inventory and coupon usage without relying on an external cron.
  if (env.NODE_ENV !== 'test' && env.DATABASE_URL) {
    startExpiredReservationCleanupWorker()
    console.log('⏱️ Payment reservation expiry cleanup worker started')
  }
})

export default app
