// Admin router — mounts all admin sub-routers under /api/admin.
// All routes require admin authentication via the requireAdmin middleware.
//
// Migration target for ~40 Next.js admin route files under
// apps/web/src/app/api/admin/.

import { Router } from 'express'

import { requireAdmin } from '../../lib/auth.js'

import productsRouter from './products.js'
import categoriesRouter from './categories.js'
import brandsRouter from './brands.js'
import ordersRouter from './orders.js'
import servicesRouter, {
  serviceCategoriesRouter,
} from './services.js'
import bookingsRouter from './bookings.js'
import projectsRouter from './projects.js'
import projectKitsRouter from './project-kits.js'
import blogRouter from './blog.js'
import bannersRouter from './banners.js'
import couponsRouter from './coupons.js'
import flashSalesRouter from './flash-sales.js'
import taxesRouter from './taxes.js'
import usersRouter from './users.js'
import reviewsRouter from './reviews.js'
import returnsRouter from './returns.js'
import messagesRouter from './messages.js'
import newsletterRouter from './newsletter.js'
import quoteRequestsRouter from './quote-requests.js'
import productQuestionsRouter from './product-questions.js'
import shipmentsRouter from './shipments.js'
import settingsRouter from './settings.js'
import statsRouter from './stats.js'
import uploadRouter from './upload.js'
import aiProvidersRouter from './ai-providers.js'
import securityRouter from './security.js'

const router = Router()

// All admin routes require admin auth.
router.use(requireAdmin)

// Mount sub-routers. Path aliases match the Next.js source tree:
//   /api/admin/products           → productsRouter
//   /api/admin/categories         → categoriesRouter       (source: product-categories)
//   /api/admin/brands             → brandsRouter
//   /api/admin/orders             → ordersRouter
//   /api/admin/services           → servicesRouter
//   /api/admin/service-categories → serviceCategoriesRouter (named export from services.ts)
//   /api/admin/bookings           → bookingsRouter
//   /api/admin/projects           → projectsRouter
//   /api/admin/project-kits       → projectKitsRouter
//   /api/admin/blog               → blogRouter
//   /api/admin/banners            → bannersRouter
//   /api/admin/coupons            → couponsRouter
//   /api/admin/flash-sales        → flashSalesRouter
//   /api/admin/taxes              → taxesRouter
//   /api/admin/users              → usersRouter
//   /api/admin/reviews            → reviewsRouter
//   /api/admin/returns            → returnsRouter
//   /api/admin/messages           → messagesRouter
//   /api/admin/newsletter         → newsletterRouter
//   /api/admin/quote-requests     → quoteRequestsRouter
//   /api/admin/product-questions  → productQuestionsRouter
//   /api/admin/shipments          → shipmentsRouter
//   /api/admin/settings           → settingsRouter
//   /api/admin/stats              → statsRouter
//   /api/admin/upload             → uploadRouter
//   /api/admin/ai-providers       → aiProvidersRouter
//   /api/admin/security           → securityRouter

router.use('/products', productsRouter)
router.use('/categories', categoriesRouter)
router.use('/brands', brandsRouter)
router.use('/orders', ordersRouter)
router.use('/services', servicesRouter)
router.use('/service-categories', serviceCategoriesRouter)
router.use('/bookings', bookingsRouter)
router.use('/projects', projectsRouter)
router.use('/project-kits', projectKitsRouter)
router.use('/blog', blogRouter)
router.use('/banners', bannersRouter)
router.use('/coupons', couponsRouter)
router.use('/flash-sales', flashSalesRouter)
router.use('/taxes', taxesRouter)
router.use('/users', usersRouter)
router.use('/reviews', reviewsRouter)
router.use('/returns', returnsRouter)
router.use('/messages', messagesRouter)
router.use('/newsletter', newsletterRouter)
router.use('/quote-requests', quoteRequestsRouter)
router.use('/product-questions', productQuestionsRouter)
router.use('/shipments', shipmentsRouter)
router.use('/settings', settingsRouter)
router.use('/stats', statsRouter)
router.use('/upload', uploadRouter)
router.use('/ai-providers', aiProvidersRouter)
router.use('/security', securityRouter)

export default router
