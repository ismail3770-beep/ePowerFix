# ePowerFix Design System — FleetCart Reference (Production Grade)

## CRITICAL RULE: This must NOT look AI-generated.
- NO artificial gradients everywhere
- NO oversized shadows
- NO random animations
- NO cookie-cutter UI
- Clean, balanced, professional, human-designed feel

## Color Palette
- Primary: epf-500 (#0EA5E9) — sky blue
- Sidebar (admin): slate-900 (#0F172A)
- Background: white, slate-50 (sections)
- Text: slate-900 (headings), slate-600 (body), slate-400 (muted)
- Border: slate-200
- Success/Discount: emerald-500 (#10B981)
- Warning/Out-of-stock: red-500 (#EF4444)
- New badge: blue-500
- Accent stat colors: blue-500, pink-500, orange-500, emerald-500

## Typography
- Page title: text-[24px] font-bold text-slate-900
- Section title: text-[20px] font-bold text-slate-900
- Card title: text-[14px] font-semibold text-slate-800
- Body: text-[14px] text-slate-600
- Small/muted: text-[12px] text-slate-400
- Badge: text-[11px] font-bold

## Spacing (MANDATORY)
- Section padding: py-12 sm:py-16
- Container: max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8
- Card padding: p-4
- Grid gap: gap-4 (16px)
- Element gap: gap-2 (8px) or gap-3 (12px)

## Card Design (PremiumCard)
- Border: 1px solid slate-200
- Shadow: shadow-sm default
- Hover: hover:shadow-md (NOT shadow-xl — that's too much)
- Hover transform: hover:-translate-y-0.5 (subtle, NOT -translate-y-1)
- Transition: duration-200 (fast, NOT 300ms)
- Rounded: rounded-lg (8px, NOT rounded-xl — FleetCart uses subtle rounding)
- Image: aspect-square, object-contain, p-2, hover:scale-105

## Badges (matching FleetCart exactly)
- Discount: bg-emerald-500 text-white rounded text-[11px] font-bold px-2 py-0.5 (top-left)
- Out of Stock: bg-red-500 text-white rounded text-[11px] font-bold px-2 py-0.5
- New: bg-blue-500 text-white rounded text-[11px] font-bold px-2 py-0.5
- Featured: bg-epf-500 text-white rounded text-[11px] font-bold px-2 py-0.5

## Buttons (FleetCart style)
- Primary: bg-epf-500 hover:bg-epf-600 text-white rounded-lg h-10 px-5 font-semibold text-[14px]
- Secondary: bg-white border border-slate-300 hover:border-slate-400 text-slate-700 rounded-lg
- Icon button: h-8 w-8 rounded-lg hover:bg-slate-100

## Shop Page
- Grid: grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3
- Sidebar: 240px, Browse Categories + Price filter + Latest Products
- Toolbar: sort dropdown + view toggle + results count
- Pagination: numbered, active = epf-500

## Product Detail
- 2-column: gallery (left) + info (right)
- Gallery: large main image + thumbnail strip
- Info: title, price, rating, quantity, Add to Cart + Buy Now
- Trust badges: Free Delivery, Secure Payment, 24/7 Support
- Tabs: Description, Specifications, Reviews
- Related products: same card grid

## Blog/Services/Projects (same design language)
- Listing: 3-column grid + sidebar (Categories + Recent Posts)
- Card: image (h-48 object-cover), metadata (author + date), title, excerpt, "Read Post →"
- Detail: hero image + 2-column (content + sidebar), social share, tags
- Sidebar: Categories with counts + Recent Posts with thumbnails

## Cart/Checkout
- Progress bar: My Cart → Checkout → Complete
- Cart: 2-column (table + summary)
- Checkout: billing form + payment methods + order summary

## Login
- Split layout: branding panel (left) + form (right)
- Clean form with email, password, remember me, forgot password

## Admin Panel
- Sidebar: slate-900 bg, COLLAPSIBLE DROPDOWNS (collapsed by default)
  - Click menu → expand dropdown (smooth animation)
  - Click again → collapse
  - Only selected menu active
  - Icons from lucide-react
- Dashboard: 4 stat cards (colored), sales chart, latest orders table
- Tables: clean rows, status badges, hover:bg-slate-50
- Forms: clean inputs, labels above, rounded-lg

## DO NOT change
- Header component
- Footer component
- Brand color (epf-500)
- globals.css color variables
- Any backend/API code
- Any database schema
