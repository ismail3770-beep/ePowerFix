import { Router } from 'express'
import { productsRouter } from './products'
import { servicesRouter } from './services'
import { ordersRouter } from './orders'
import { returnsRouter } from './returns'
import { shipmentsRouter } from './shipments'
import { usersRouter } from './users'
import { bookingsRouter } from './bookings'
import { blogRouter } from './blog'
import { brandsRouter } from './brands'
import { couponsRouter } from './coupons'
import { reviewsRouter } from './reviews'
import { projectsRouter } from './projects'
import { productCategoriesRouter } from './product-categories'
import { serviceCategoriesRouter } from './service-categories'
import { statsRouter } from './stats'
import { messagesRouter } from './messages'
import { quoteRequestsRouter } from './quote-requests'
import { newsletterRouter } from './newsletter'
import { flashSaleRoutes } from './flash-sales'
import { taxRoutes } from './taxes'
import { productQuestionRoutes } from './product-questions'

export const adminRouter = Router()

adminRouter.use('/products', productsRouter)
adminRouter.use('/services', servicesRouter)
adminRouter.use('/orders', ordersRouter)
adminRouter.use('/returns', returnsRouter)
adminRouter.use('/shipments', shipmentsRouter)
adminRouter.use('/users', usersRouter)
adminRouter.use('/bookings', bookingsRouter)
adminRouter.use('/blog', blogRouter)
adminRouter.use('/brands', brandsRouter)
adminRouter.use('/coupons', couponsRouter)
adminRouter.use('/reviews', reviewsRouter)
adminRouter.use('/projects', projectsRouter)
adminRouter.use('/product-categories', productCategoriesRouter)
adminRouter.use('/service-categories', serviceCategoriesRouter)
adminRouter.use('/stats', statsRouter)
adminRouter.use('/messages', messagesRouter)
adminRouter.use('/quote-requests', quoteRequestsRouter)
adminRouter.use('/newsletter', newsletterRouter)
adminRouter.use('/flash-sales', flashSaleRoutes)
adminRouter.use('/taxes', taxRoutes)
adminRouter.use('/product-questions', productQuestionRoutes)
