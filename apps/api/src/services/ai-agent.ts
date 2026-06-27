import ZAI from 'z-ai-web-dev-sdk'
import { db } from '@epowerfix/db'

// ======================== TYPES ========================

interface ToolDefinition {
  name: string
  description: string
  parameters: Record<string, { type: string; description: string; required?: boolean; enum?: string[] }>
}

interface ToolCall {
  tool: string
  params: Record<string, any>
}

interface AgentMessage {
  role: 'user' | 'assistant'
  content: string
  toolCalls?: ToolCall[]
  toolResults?: Array<{ tool: string; success: boolean; data: any; error?: string }>
}

// ======================== SYSTEM PROMPT ========================

const SYSTEM_PROMPT = `You are **ePowerFix AI Assistant** — an intelligent admin agent that manages the ePowerFix e-commerce & service booking platform (electrical products & services in Bangladesh).

## Your Capabilities
You have access to tools that let you manage the entire backend: products, orders, users, service bookings, reviews, coupons, contacts, and more.

## Language
- Respond in the same language the user writes in (Bengali or English).
- If the user writes in Bengali, respond in Bengali. If English, respond in English.

## How You Work
1. Understand what the user wants to do.
2. Decide which tool(s) to call.
3. Output a JSON block with your tool calls.
4. After receiving results, provide a clear, helpful summary to the user.

## Tool Call Format
When you need to call tools, respond with ONLY a JSON object (no markdown, no extra text):
{"toolCalls": [{"tool": "tool_name", "params": {}}]}

## Important Rules
- For listing/filtering, always ask if the user wants specific filters.
- For updates, confirm the action before executing.
- Be helpful and proactive — suggest next steps.
- Keep responses concise and actionable.
- For product queries, include relevant details like price, stock, and status.
- For order queries, include status, total, and timeline.
- Never invent data — only report what the tools return.

## Available Tools
See the tool definitions provided in each request for the complete list of available tools and their parameters.`

// ======================== TOOL DEFINITIONS ========================

const toolDefinitions: ToolDefinition[] = [
  {
    name: 'get_dashboard_stats',
    description: 'Get dashboard overview: total products, orders, users, revenue, bookings, pending items, recent orders',
    parameters: {},
  },
  {
    name: 'list_products',
    description: 'List products with optional search, category filter, and status filter',
    parameters: {
      search: { type: 'string', description: 'Search by product name or SKU' },
      status: { type: 'string', description: 'Filter by status', enum: ['active', 'inactive'] },
      page: { type: 'string', description: 'Page number (default: 1)' },
      limit: { type: 'string', description: 'Items per page (default: 20)' },
    },
  },
  {
    name: 'get_product',
    description: 'Get detailed information about a specific product by ID',
    parameters: {
      id: { type: 'string', description: 'Product ID', required: true },
    },
  },
  {
    name: 'update_product_status',
    description: 'Activate or deactivate a product',
    parameters: {
      id: { type: 'string', description: 'Product ID', required: true },
      isActive: { type: 'boolean', description: 'Set to true to activate, false to deactivate', required: true },
    },
  },
  {
    name: 'delete_product',
    description: 'Soft-delete a product (move to trash)',
    parameters: {
      id: { type: 'string', description: 'Product ID', required: true },
    },
  },
  {
    name: 'list_orders',
    description: 'List orders with optional status filter and search',
    parameters: {
      status: { type: 'string', description: 'Filter by order status', enum: ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED'] },
      search: { type: 'string', description: 'Search by order number' },
      page: { type: 'string', description: 'Page number (default: 1)' },
      limit: { type: 'string', description: 'Items per page (default: 20)' },
    },
  },
  {
    name: 'get_order',
    description: 'Get detailed information about a specific order including items',
    parameters: {
      id: { type: 'string', description: 'Order ID', required: true },
    },
  },
  {
    name: 'update_order_status',
    description: 'Update order status (e.g., confirm, ship, deliver, cancel)',
    parameters: {
      id: { type: 'string', description: 'Order ID', required: true },
      status: { type: 'string', description: 'New order status', required: true, enum: ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED'] },
    },
  },
  {
    name: 'list_users',
    description: 'List users (customers and admins) with optional search',
    parameters: {
      search: { type: 'string', description: 'Search by name or email' },
      role: { type: 'string', description: 'Filter by role', enum: ['CUSTOMER', 'ADMIN'] },
      page: { type: 'string', description: 'Page number (default: 1)' },
      limit: { type: 'string', description: 'Items per page (default: 20)' },
    },
  },
  {
    name: 'update_user_status',
    description: 'Activate or deactivate a user account',
    parameters: {
      id: { type: 'string', description: 'User ID', required: true },
      isActive: { type: 'boolean', description: 'Set to true to activate, false to deactivate', required: true },
    },
  },
  {
    name: 'list_bookings',
    description: 'List service bookings with optional status filter',
    parameters: {
      status: { type: 'string', description: 'Filter by booking status', enum: ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] },
      page: { type: 'string', description: 'Page number (default: 1)' },
      limit: { type: 'string', description: 'Items per page (default: 20)' },
    },
  },
  {
    name: 'update_booking_status',
    description: 'Update a service booking status',
    parameters: {
      id: { type: 'string', description: 'Booking ID', required: true },
      status: { type: 'string', description: 'New booking status', required: true, enum: ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] },
    },
  },
  {
    name: 'list_reviews',
    description: 'List product reviews with optional status filter',
    parameters: {
      status: { type: 'string', description: 'Filter by review status', enum: ['PENDING', 'APPROVED', 'REJECTED'] },
      page: { type: 'string', description: 'Page number (default: 1)' },
      limit: { type: 'string', description: 'Items per page (default: 20)' },
    },
  },
  {
    name: 'update_review_status',
    description: 'Approve or reject a product review',
    parameters: {
      id: { type: 'string', description: 'Review ID', required: true },
      status: { type: 'string', description: 'New status', required: true, enum: ['APPROVED', 'REJECTED'] },
    },
  },
  {
    name: 'list_contacts',
    description: 'List contact form messages',
    parameters: {
      status: { type: 'string', description: 'Filter by status', enum: ['NEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] },
      page: { type: 'string', description: 'Page number (default: 1)' },
      limit: { type: 'string', description: 'Items per page (default: 20)' },
    },
  },
  {
    name: 'update_contact_status',
    description: 'Update contact message status',
    parameters: {
      id: { type: 'string', description: 'Contact ID', required: true },
      status: { type: 'string', description: 'New status', required: true, enum: ['NEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] },
    },
  },
  {
    name: 'list_coupons',
    description: 'List all discount coupons',
    parameters: {
      page: { type: 'string', description: 'Page number (default: 1)' },
      limit: { type: 'string', description: 'Items per page (default: 20)' },
    },
  },
  {
    name: 'create_coupon',
    description: 'Create a new discount coupon',
    parameters: {
      code: { type: 'string', description: 'Coupon code (e.g., SAVE10)', required: true },
      discountType: { type: 'string', description: 'PERCENTAGE or FIXED', required: true, enum: ['PERCENTAGE', 'FIXED'] },
      discountValue: { type: 'number', description: 'Discount value (percentage or fixed amount)', required: true },
      minOrderAmount: { type: 'number', description: 'Minimum order amount to use coupon' },
      maxDiscount: { type: 'number', description: 'Maximum discount amount (for percentage)' },
      usageLimit: { type: 'number', description: 'Total usage limit' },
      perUserLimit: { type: 'number', description: 'Per user usage limit' },
      expiresAt: { type: 'string', description: 'Expiry date (ISO string, e.g., 2025-12-31T23:59:59Z)' },
      isActive: { type: 'boolean', description: 'Whether the coupon is active' },
    },
  },
  {
    name: 'toggle_coupon_status',
    description: 'Activate or deactivate a coupon',
    parameters: {
      id: { type: 'string', description: 'Coupon ID', required: true },
      isActive: { type: 'boolean', description: 'Set to true to activate, false to deactivate', required: true },
    },
  },
  {
    name: 'get_revenue_report',
    description: 'Get revenue report with daily/monthly breakdown',
    parameters: {
      period: { type: 'string', description: 'Report period', enum: ['today', 'this_week', 'this_month', 'this_year'] },
    },
  },
  {
    name: 'list_services',
    description: 'List all services with optional search',
    parameters: {
      search: { type: 'string', description: 'Search by service name' },
      page: { type: 'string', description: 'Page number (default: 1)' },
      limit: { type: 'string', description: 'Items per page (default: 20)' },
    },
  },
  {
    name: 'list_brands',
    description: 'List all product brands',
    parameters: {
      page: { type: 'string', description: 'Page number (default: 1)' },
      limit: { type: 'string', description: 'Items per page (default: 20)' },
    },
  },
  {
    name: 'list_categories',
    description: 'List all product categories',
    parameters: {},
  },
  {
    name: 'list_returns',
    description: 'List return/refund requests with optional status filter',
    parameters: {
      status: { type: 'string', description: 'Filter by status', enum: ['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED'] },
      page: { type: 'string', description: 'Page number (default: 1)' },
      limit: { type: 'string', description: 'Items per page (default: 20)' },
    },
  },
  {
    name: 'update_return_status',
    description: 'Update return request status',
    parameters: {
      id: { type: 'string', description: 'Return request ID', required: true },
      status: { type: 'string', description: 'New status', required: true, enum: ['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED'] },
    },
  },
  {
    name: 'list_blogs',
    description: 'List all blog posts',
    parameters: {
      page: { type: 'string', description: 'Page number (default: 1)' },
      limit: { type: 'string', description: 'Items per page (default: 20)' },
    },
  },
]

// ======================== TOOL EXECUTORS ========================

async function executeTool(toolName: string, params: Record<string, any>): Promise<any> {
  const page = Number(params.page) || 1
  const limit = Number(params.limit) || 20
  const skip = (page - 1) * limit

  switch (toolName) {
    // ---------- Dashboard ----------
    case 'get_dashboard_stats': {
      const thisMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      const [
        totalProducts, activeProducts,
        totalOrders, pendingOrders,
        totalUsers, totalBookings,
        totalRevenue, monthlyRevenue,
        pendingBookings, unreadContacts, totalReviews,
        totalServices, totalContacts,
        pendingReturns, totalReturns,
      ] = await Promise.all([
        db.product.count(),
        db.product.count({ where: { isActive: true } }),
        db.order.count(),
        db.order.count({ where: { status: 'PENDING' } }),
        db.user.count(),
        db.serviceBooking.count(),
        db.order.aggregate({ where: { paymentStatus: 'PAID' }, _sum: { total: true } }),
        db.order.aggregate({ where: { paymentStatus: 'PAID', createdAt: { gte: thisMonth } }, _sum: { total: true } }),
        db.serviceBooking.count({ where: { status: 'PENDING' } }),
        db.contact.count({ where: { status: 'NEW' } }),
        db.review.count({ where: { status: 'APPROVED' } }),
        db.service.count({ where: { isActive: true } }),
        db.contact.count(),
        db.returnRequest.count({ where: { status: 'PENDING' } }),
        db.returnRequest.count(),
      ])
      const recentOrders = await db.order.findMany({
        take: 5, orderBy: { createdAt: 'desc' },
        select: { id: true, orderNumber: true, total: true, status: true, createdAt: true },
      })
      return {
        totalProducts, activeProducts, totalOrders, pendingOrders,
        totalUsers, totalBookings,
        totalRevenue: totalRevenue._sum.total || 0,
        monthlyRevenue: monthlyRevenue._sum.total || 0,
        pendingBookings, unreadContacts, totalReviews,
        totalServices, totalContacts, pendingReturns, totalReturns,
        recentOrders,
      }
    }

    // ---------- Products ----------
    case 'list_products': {
      const where: any = {}
      if (params.search) {
        where.OR = [
          { name: { contains: String(params.search), mode: 'insensitive' } },
          { sku: { contains: String(params.search) } },
        ]
      }
      if (params.status === 'inactive') where.isActive = false
      else if (params.status === 'active') where.isActive = true

      const [data, total] = await Promise.all([
        db.product.findMany({
          where, skip, take: limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true, name: true, nameBn: true, sku: true, price: true,
            salePrice: true, stock: true, isActive: true, isFeatured: true,
            createdAt: true,
            category: { select: { name: true } },
            brand: { select: { name: true } },
          },
        }),
        db.product.count({ where }),
      ])
      return { data, total, page, totalPages: Math.ceil(total / limit) }
    }

    case 'get_product': {
      const product = await db.product.findUnique({
        where: { id: params.id },
        include: {
          category: { select: { name: true, nameBn: true } },
          brand: { select: { name: true, logo: true } },
          variants: true,
          _count: { select: { reviews: true, orderItems: true } },
        },
      })
      if (!product) throw new Error('Product not found')
      return product
    }

    case 'update_product_status': {
      const product = await db.product.update({
        where: { id: params.id },
        data: { isActive: params.isActive },
        select: { id: true, name: true, isActive: true },
      })
      return { message: `Product "${product.name}" is now ${product.isActive ? 'active' : 'inactive'}`, product }
    }

    case 'delete_product': {
      const product = await db.product.update({
        where: { id: params.id },
        data: { isDeleted: true },
        select: { id: true, name: true },
      })
      return { message: `Product "${product.name}" moved to trash`, product }
    }

    // ---------- Orders ----------
    case 'list_orders': {
      const where: any = {}
      if (params.status) where.status = params.status
      if (params.search) where.orderNumber = { contains: String(params.search), mode: 'insensitive' }

      const [data, total] = await Promise.all([
        db.order.findMany({
          where, skip, take: limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true, orderNumber: true, total: true, status: true,
            paymentStatus: true, paymentMethod: true,
            createdAt: true, updatedAt: true,
            user: { select: { name: true, email: true, phone: true } },
            _count: { select: { items: true } },
          },
        }),
        db.order.count({ where }),
      ])
      return { data, total, page, totalPages: Math.ceil(total / limit) }
    }

    case 'get_order': {
      const order = await db.order.findUnique({
        where: { id: params.id },
        include: {
          items: true,
          user: { select: { name: true, email: true, phone: true } },
          address: true,
          payment: true,
          histories: { orderBy: { createdAt: 'desc' } },
        },
      })
      if (!order) throw new Error('Order not found')
      return order
    }

    case 'update_order_status': {
      const order = await db.order.findUnique({
        where: { id: params.id },
        select: { id: true, orderNumber: true, status: true, userId: true },
      })
      if (!order) throw new Error('Order not found')

      const updated = await db.order.update({
        where: { id: params.id },
        data: { status: params.status },
      })
      await db.orderHistory.create({
        data: {
          orderId: params.id,
          status: params.status,
          note: `Status updated to ${params.status} via AI Agent`,
        },
      })
      await db.notification.create({
        data: {
          userId: order.userId,
          title: 'Order Status Updated',
          message: `Your order #${order.orderNumber} status has been updated to ${params.status}`,
          type: 'ORDER',
        },
      })
      return { message: `Order #${order.orderNumber} status updated to ${params.status}`, orderNumber: order.orderNumber, newStatus: params.status }
    }

    // ---------- Users ----------
    case 'list_users': {
      const where: any = {}
      if (params.role) where.role = params.role
      if (params.search) {
        where.OR = [
          { name: { contains: String(params.search), mode: 'insensitive' } },
          { email: { contains: String(params.search), mode: 'insensitive' } },
        ]
      }

      const [data, total] = await Promise.all([
        db.user.findMany({
          where, skip, take: limit,
          orderBy: { createdAt: 'desc' },
          select: { id: true, name: true, email: true, phone: true, role: true, isActive: true, createdAt: true },
        }),
        db.user.count({ where }),
      ])
      return { data, total, page, totalPages: Math.ceil(total / limit) }
    }

    case 'update_user_status': {
      const user = await db.user.update({
        where: { id: params.id },
        data: { isActive: params.isActive },
        select: { id: true, name: true, email: true, isActive: true },
      })
      return { message: `User "${user.name}" is now ${user.isActive ? 'active' : 'inactive'}`, user }
    }

    // ---------- Bookings ----------
    case 'list_bookings': {
      const where: any = {}
      if (params.status) where.status = params.status

      const [data, total] = await Promise.all([
        db.serviceBooking.findMany({
          where, skip, take: limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true, status: true, preferredDate: true, preferredTime: true,
            address: true, createdAt: true,
            service: { select: { name: true, nameBn: true, price: true } },
            user: { select: { name: true, email: true, phone: true } },
          },
        }),
        db.serviceBooking.count({ where }),
      ])
      return { data, total, page, totalPages: Math.ceil(total / limit) }
    }

    case 'update_booking_status': {
      const booking = await db.serviceBooking.update({
        where: { id: params.id },
        data: { status: params.status },
        select: { id: true, status: true, user: { select: { name: true } } },
      })
      return { message: `Booking status updated to ${params.status}`, booking }
    }

    // ---------- Reviews ----------
    case 'list_reviews': {
      const where: any = {}
      if (params.status) where.status = params.status

      const [data, total] = await Promise.all([
        db.review.findMany({
          where, skip, take: limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true, rating: true, comment: true, status: true, createdAt: true,
            user: { select: { name: true } },
            product: { select: { name: true } },
          },
        }),
        db.review.count({ where }),
      ])
      return { data, total, page, totalPages: Math.ceil(total / limit) }
    }

    case 'update_review_status': {
      const review = await db.review.update({
        where: { id: params.id },
        data: { status: params.status },
        select: { id: true, rating: true, status: true, product: { select: { name: true } } },
      })
      return { message: `Review ${params.status.toLowerCase()} for product "${review.product?.name}"`, review }
    }

    // ---------- Contacts ----------
    case 'list_contacts': {
      const where: any = {}
      if (params.status) where.status = params.status

      const [data, total] = await Promise.all([
        db.contact.findMany({
          where, skip, take: limit,
          orderBy: { createdAt: 'desc' },
          select: { id: true, name: true, email: true, subject: true, status: true, createdAt: true, message: true },
        }),
        db.contact.count({ where }),
      ])
      return { data, total, page, totalPages: Math.ceil(total / limit) }
    }

    case 'update_contact_status': {
      const contact = await db.contact.update({
        where: { id: params.id },
        data: { status: params.status },
        select: { id: true, name: true, subject: true, status: true },
      })
      return { message: `Contact "${contact.subject}" marked as ${params.status}`, contact }
    }

    // ---------- Coupons ----------
    case 'list_coupons': {
      const [data, total] = await Promise.all([
        db.coupon.findMany({
          skip, take: limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true, code: true, discountType: true, discountValue: true,
            isActive: true, usageLimit: true, usedCount: true,
            expiresAt: true, createdAt: true,
          },
        }),
        db.coupon.count(),
      ])
      return { data, total, page, totalPages: Math.ceil(total / limit) }
    }

    case 'create_coupon': {
      const coupon = await db.coupon.create({
        data: {
          code: params.code,
          discountType: params.discountType,
          discountValue: Number(params.discountValue),
          minOrderAmount: params.minOrderAmount ? Number(params.minOrderAmount) : null,
          maxDiscount: params.maxDiscount ? Number(params.maxDiscount) : null,
          usageLimit: params.usageLimit ? Number(params.usageLimit) : null,
          perUserLimit: params.perUserLimit ? Number(params.perUserLimit) : null,
          expiresAt: params.expiresAt ? new Date(params.expiresAt) : null,
          isActive: params.isActive !== undefined ? params.isActive : true,
        },
      })
      return { message: `Coupon "${params.code}" created successfully`, coupon }
    }

    case 'toggle_coupon_status': {
      const coupon = await db.coupon.update({
        where: { id: params.id },
        data: { isActive: params.isActive },
        select: { id: true, code: true, isActive: true },
      })
      return { message: `Coupon "${coupon.code}" is now ${coupon.isActive ? 'active' : 'inactive'}`, coupon }
    }

    // ---------- Revenue ----------
    case 'get_revenue_report': {
      let startDate: Date
      const now = new Date()
      switch (params.period) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          break
        case 'this_week':
          startDate = new Date(now)
          startDate.setDate(now.getDate() - now.getDay())
          break
        case 'this_month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          break
        case 'this_year':
          startDate = new Date(now.getFullYear(), 0, 1)
          break
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      }

      const orders = await db.order.findMany({
        where: { paymentStatus: 'PAID', createdAt: { gte: startDate } },
        select: { total: true, createdAt: true, status: true },
        orderBy: { createdAt: 'asc' },
      })

      const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0)
      const orderCount = orders.length

      // Group by day
      const dailyMap = new Map<string, number>()
      for (const o of orders) {
        const day = o.createdAt.toISOString().split('T')[0]
        dailyMap.set(day, (dailyMap.get(day) || 0) + o.total)
      }
      const daily = Object.fromEntries(dailyMap)

      // Overall all-time revenue
      const allTimeRevenue = await db.order.aggregate({
        where: { paymentStatus: 'PAID' },
        _sum: { total: true },
      })

      return {
        period: params.period,
        totalRevenue,
        orderCount,
        averageOrder: orderCount > 0 ? totalRevenue / orderCount : 0,
        dailyBreakdown: daily,
        allTimeRevenue: allTimeRevenue._sum.total || 0,
      }
    }

    // ---------- Services ----------
    case 'list_services': {
      const where: any = {}
      if (params.search) {
        where.OR = [
          { name: { contains: String(params.search), mode: 'insensitive' } },
          { nameBn: { contains: String(params.search) } },
        ]
      }
      const [data, total] = await Promise.all([
        db.service.findMany({
          where, skip, take: limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true, name: true, nameBn: true, price: true, priceType: true,
            isActive: true, createdAt: true,
            category: { select: { name: true } },
          },
        }),
        db.service.count({ where }),
      ])
      return { data, total, page, totalPages: Math.ceil(total / limit) }
    }

    // ---------- Brands ----------
    case 'list_brands': {
      const [data, total] = await Promise.all([
        db.brand.findMany({
          skip, take: limit,
          orderBy: { name: 'asc' },
          select: { id: true, name: true, logo: true, isActive: true, _count: { select: { products: true } } },
        }),
        db.brand.count(),
      ])
      return { data, total, page, totalPages: Math.ceil(total / limit) }
    }

    // ---------- Categories ----------
    case 'list_categories': {
      const data = await db.productCategory.findMany({
        orderBy: { name: 'asc' },
        select: { id: true, name: true, nameBn: true, isActive: true, _count: { select: { products: true } } },
      })
      return { data }
    }

    // ---------- Returns ----------
    case 'list_returns': {
      const where: any = {}
      if (params.status) where.status = params.status

      const [data, total] = await Promise.all([
        db.returnRequest.findMany({
          where, skip, take: limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true, status: true, reason: true, createdAt: true,
            order: { select: { orderNumber: true, total: true } },
            user: { select: { name: true, email: true } },
          },
        }),
        db.returnRequest.count({ where }),
      ])
      return { data, total, page, totalPages: Math.ceil(total / limit) }
    }

    case 'update_return_status': {
      const ret = await db.returnRequest.update({
        where: { id: params.id },
        data: { status: params.status },
        select: { id: true, status: true, order: { select: { orderNumber: true } } },
      })
      return { message: `Return request for order #${ret.order?.orderNumber} updated to ${params.status}`, ret }
    }

    // ---------- Blogs ----------
    case 'list_blogs': {
      const [data, total] = await Promise.all([
        db.blogPost.findMany({
          skip, take: limit,
          orderBy: { createdAt: 'desc' },
          select: { id: true, title: true, titleBn: true, slug: true, isActive: true, createdAt: true },
        }),
        db.blogPost.count(),
      ])
      return { data, total, page, totalPages: Math.ceil(total / limit) }
    }

    default:
      throw new Error(`Unknown tool: ${toolName}`)
  }
}

// ======================== AGENT CLASS ========================

// In-memory conversation store (use Redis/DB in production)
const conversations = new Map<string, AgentMessage[]>()

function getConversation(sessionId: string): AgentMessage[] {
  if (!conversations.has(sessionId)) {
    conversations.set(sessionId, [])
  }
  return conversations.get(sessionId)!
}

function pruneConversation(sessionId: string, maxMessages = 30) {
  const history = getConversation(sessionId)
  if (history.length > maxMessages) {
    // Keep first 2 messages (system context) and last maxMessages
    const pruned = history.slice(-maxMessages)
    conversations.set(sessionId, pruned)
  }
}

function formatToolsForPrompt(): string {
  let toolsStr = '## Available Tools\n\n'
  for (const tool of toolDefinitions) {
    toolsStr += `### ${tool.name}\n${tool.description}\nParameters:\n`
    for (const [key, val] of Object.entries(tool.parameters)) {
      const req = val.required ? ' (required)' : ' (optional)'
      const enums = val.enum ? ` [${val.enum.join(', ')}]` : ''
      toolsStr += `- ${key}: ${val.type}${enums}${req} — ${val.description}\n`
    }
    toolsStr += '\n'
  }
  return toolsStr
}

function formatHistoryForLLM(history: AgentMessage[]): Array<{ role: 'user' | 'assistant'; content: string }> {
  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = []

  for (const msg of history) {
    if (msg.role === 'user') {
      messages.push({ role: 'user', content: msg.content })
    } else if (msg.role === 'assistant') {
      let content = msg.content
      if (msg.toolCalls && msg.toolCalls.length > 0) {
        content += '\n\n[Tool Calls: ' + JSON.stringify(msg.toolCalls) + ']'
      }
      if (msg.toolResults && msg.toolResults.length > 0) {
        content += '\n\n[Tool Results: ' + JSON.stringify(msg.toolResults) + ']'
      }
      messages.push({ role: 'assistant', content })
    }
  }

  return messages
}

export class AIAgent {
  private zai: ZAI | null = null
  private maxRetries = 2

  async init() {
    if (!this.zai) {
      this.zai = await ZAI.create()
    }
    return this
  }

  async chat(sessionId: string, userMessage: string): Promise<{
    response: string
    toolCallsExecuted: number
    sessionId: string
  }> {
    if (!this.zai) throw new Error('AI Agent not initialized. Call init() first.')

    const history = getConversation(sessionId)
    history.push({ role: 'user', content: userMessage })

    // Build LLM messages
    const toolsPrompt = formatToolsForPrompt()
    const systemMessage = SYSTEM_PROMPT + '\n\n' + toolsPrompt
    const llmHistory = formatHistoryForLLM(history)

    let totalToolCalls = 0
    let continueLoop = true
    let maxIterations = 5 // Safety: max tool call rounds

    while (continueLoop && maxIterations > 0) {
      maxIterations--
      continueLoop = false

      // Call LLM
      const completion = await this.zai.chat.completions.create({
        messages: [
          { role: 'assistant', content: systemMessage },
          ...llmHistory,
        ],
        thinking: { type: 'disabled' },
      })

      const responseText = completion.choices[0]?.message?.content || ''

      // Try to parse tool calls from response
      try {
        // Extract JSON from response (handle markdown code blocks too)
        let jsonStr = responseText.trim()
        const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/)
        if (jsonMatch) {
          jsonStr = jsonMatch[1].trim()
        }

        // Try to parse as tool calls
        const parsed = JSON.parse(jsonStr)

        if (parsed.toolCalls && Array.isArray(parsed.toolCalls) && parsed.toolCalls.length > 0) {
          // Execute tools
          const toolResults: Array<{ tool: string; success: boolean; data: any; error?: string }> = []

          for (const tc of parsed.toolCalls) {
            try {
              const result = await executeTool(tc.tool, tc.params || {})
              toolResults.push({ tool: tc.tool, success: true, data: result })
              totalToolCalls++
            } catch (err: any) {
              toolResults.push({ tool: tc.tool, success: false, data: null, error: err.message })
            }
          }

          // Add assistant message with tool calls and results to history
          history.push({
            role: 'assistant',
            content: `Executed ${parsed.toolCalls.map((tc: ToolCall) => tc.tool).join(', ')}`,
            toolCalls: parsed.toolCalls,
            toolResults,
          })

          // Continue loop to generate final response with tool results
          llmHistory.push({
            role: 'assistant',
            content: `I called the following tools:\n${JSON.stringify(parsed.toolCalls)}\n\nResults:\n${JSON.stringify(toolResults, null, 2)}\n\nNow provide a helpful, human-readable summary to the user based on these results.`,
          })
          continueLoop = true
        } else {
          // No tool calls, this is the final response
          history.push({ role: 'assistant', content: responseText })
          pruneConversation(sessionId)
          return { response: responseText, toolCallsExecuted: totalToolCalls, sessionId }
        }
      } catch {
        // Not JSON — treat as natural language response
        history.push({ role: 'assistant', content: responseText })
        pruneConversation(sessionId)
        return { response: responseText, toolCallsExecuted: totalToolCalls, sessionId }
      }
    }

    // Fallback: get one more response
    const finalCompletion = await this.zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: systemMessage },
        ...llmHistory,
      ],
      thinking: { type: 'disabled' },
    })

    const finalText = finalCompletion.choices[0]?.message?.content || 'Sorry, I could not process your request.'
    history.push({ role: 'assistant', content: finalText })
    pruneConversation(sessionId)

    return { response: finalText, toolCallsExecuted: totalToolCalls, sessionId }
  }

  clearSession(sessionId: string) {
    conversations.delete(sessionId)
  }
}

// Singleton instance
let agentInstance: AIAgent | null = null

export async function getAIAgent(): Promise<AIAgent> {
  if (!agentInstance) {
    agentInstance = new AIAgent()
    await agentInstance.init()
  }
  return agentInstance
}