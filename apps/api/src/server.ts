import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import morgan from 'morgan'

import { authRouter } from './routes/auth'
import { productsRouter } from './routes/products'
import { servicesRouter } from './routes/services'
import { servicesBookRouter } from './routes/services-book'
import { cartRouter } from './routes/cart'
import { ordersRouter } from './routes/orders'
import { returnsRouter } from './routes/returns'
import { notificationsRouter } from './routes/notifications'
import { addressesRouter } from './routes/addresses'
import { wishlistRouter } from './routes/wishlist'
import { reviewsRouter } from './routes/reviews'
import { couponsRouter } from './routes/coupons'
import { blogRouter } from './routes/blog'
import { brandsRouter } from './routes/brands'
import { projectsRouter } from './routes/projects'
import { contactRouter } from './routes/contact'
import { newsletterRouter } from './routes/newsletter'
import { quoteRequestsRouter } from './routes/quote-requests'
import { productCategoriesRouter } from './routes/product-categories'
import { adminRouter } from './routes/admin'
import { extraPublicRoutes } from './routes/public/extra'
import { apiLimiter } from './middleware/rate-limit'

const app = express()
const PORT = Number(process.env.API_PORT) || 4000

app.use(helmet())
app.use(cors({
  origin: process.env.CORS_ORIGIN || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  credentials: true,
}))
app.use(morgan('dev'))
app.use(cookieParser())
app.use(express.json({ limit: '10mb' }))

// Health check
app.get('/', (_req, res) => {
  res.json({ success: true, message: 'ePowerFix API running', timestamp: new Date().toISOString() })
})

// Public routes
app.use('/api/auth', authRouter)
app.use('/api/cart', apiLimiter, cartRouter)
app.use('/api/products', apiLimiter, productsRouter)
app.use('/api/services/book', apiLimiter, servicesBookRouter)
app.use('/api/services', apiLimiter, servicesRouter)
app.use('/api/orders', apiLimiter, ordersRouter)
app.use('/api/returns', apiLimiter, returnsRouter)
app.use('/api/notifications', apiLimiter, notificationsRouter)
app.use('/api/addresses', apiLimiter, addressesRouter)
app.use('/api/wishlist', apiLimiter, wishlistRouter)
app.use('/api/reviews', apiLimiter, reviewsRouter)
app.use('/api/coupons', apiLimiter, couponsRouter)
app.use('/api/blog', apiLimiter, blogRouter)
app.use('/api/brands', apiLimiter, brandsRouter)
app.use('/api/projects', apiLimiter, projectsRouter)
app.use('/api/contact', contactRouter)
app.use('/api/newsletter', apiLimiter, newsletterRouter)
app.use('/api/quote-requests', apiLimiter, quoteRequestsRouter)
app.use('/api/product-categories', apiLimiter, productCategoriesRouter)

// Public extra routes (comparison, flash-sales, Q&A)
app.use('/api', extraPublicRoutes)

// Admin routes (all protected)
app.use('/api/admin', adminRouter)

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Not found' })
})

// Global error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[API Error]', err)
  res.status(err.statusCode || 500).json({ success: false, error: err.message || 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`🚀 ePowerFix API running on port ${PORT}`)
  console.log(`   Health:  http://localhost:${PORT}/`)
  console.log(`   Public:  http://localhost:${PORT}/api/`)
  console.log(`   Admin:   http://localhost:${PORT}/api/admin/`)
})

export default app
