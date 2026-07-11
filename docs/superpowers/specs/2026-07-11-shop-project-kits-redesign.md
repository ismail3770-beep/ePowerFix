# Shop & Project Kits Page Redesign

## Goal
Redesign the Shop page and Project Kits page to match the reference e-commerce layout: clean 6-column grid, simple product cards, simplified sidebar with categories/price/latest products.

## Reference Image Analysis
- **Grid**: 6 columns on desktop
- **Cards**: Simple design — product image, product name (2 lines), star rating + review count, price, cart icon button
- **Badges**: Square/rectangular colored tags (not pills): "-15%" (green), "Out of Stock" (red), "New" (green)
- **Left Sidebar**: 
  - "Browse Categories" with collapsible arrows (Electronics, Men's Fashion, etc.)
  - "Filters" section with Price range (min-max inputs + slider)
  - "Latest Products" section with 5 thumbnail previews
- **Toolbar**: "Shop" title, grid/list toggle icons, "Latest" sort dropdown, page size selector (20)
- **Pagination**: Page numbers at bottom

## Files to Modify

### 1. New Component: `src/components/epf/ShopCard.tsx`
Create a new simple product card component matching reference:
- Square product image (object-contain, p-3)
- Product name (2 lines, text-[13px])
- Star rating (5 stars) + "0 Review" text
- Price (sale price bold, compare price strikethrough)
- Small cart icon button (always visible, no hover-reveal)
- Square badge top-left (not pill)
- No wishlist button
- No hover animation effects

### 2. Modify: `src/app/shop/page.tsx`
- Change grid from `xl:grid-cols-4` to `lg:grid-cols-5 xl:grid-cols-6`
- Replace `PremiumCard` with new `ShopCard`
- Simplify sidebar:
  - "Browse Categories" with collapsible arrows (ChevronRight → rotate on expand)
  - Price range filter (min/max inputs + range slider)
  - "Latest Products" thumbnails (5 items)
  - Remove: Brands filter, Rating filter, In-stock toggle
- Toolbar changes:
  - Sort dropdown: "Latest" as default (rename from "Featured")
  - Add page size selector (20 per page)
  - Keep grid/list toggle
- Update skeletons to match new card layout

### 3. Modify: `src/app/project-kits/page.tsx`
- Change grid from `lg:grid-cols-5` to `lg:grid-cols-5 xl:grid-cols-6`
- Replace `KitCardGrid` with new `ShopCard` (adapted for kits)
- Simplify sidebar:
  - "Browse Categories" with difficulty levels (Beginner, Intermediate, Advanced)
  - Price range filter
  - "Latest Kits" thumbnails
  - Remove: Availability toggle
- Toolbar: Match shop page style

### 4. Modify: `src/components/epf/PremiumCard.tsx`
- No changes needed (keep for homepage, deals, etc.)
- ShopCard is separate component for shop/kit pages only

## Card Design Specification (ShopCard)

```
┌─────────────────────┐
│ [-15%]        [♡]   │  ← Badge (square, top-left) + Wishlist (top-right)
│                     │
│   [Product Image]   │  ← Square aspect ratio, object-contain
│                     │
├─────────────────────┤
│ Product Name Here   │  ← 2 lines max, text-[13px]
│ ★★★★★ 0 Review     │  ← Star rating + review count
│ $255.00  $300.00    │  ← Sale price + strikethrough compare
│ [🛒]               │  ← Cart button (always visible)
└─────────────────────┘
```

### Badge Styles:
- Discount: `bg-green-500 text-white` "-15%"
- Out of Stock: `bg-red-500 text-white` "Out of Stock"
- New: `bg-green-500 text-white` "New"
- Shape: `rounded-sm` (square, not rounded-full)

### Card Styles:
- Border: `border border-slate-200`
- Background: `bg-white`
- Hover: `hover:shadow-md` (subtle, no translate)
- Image: `aspect-square bg-slate-50 object-contain p-3`

## Sidebar Design Specification

### Categories Section:
```
Browse Categories
─────────────────
> Electronics
> Men's Fashion
> Consumer Electronics
> Watches
> Home Appliances
> Backpacks
> Women's Fashion
```
- Each item: `ChevronRight` icon + category name
- On expand: icon rotates, shows subcategories
- Active: `text-epf-500 font-semibold`

### Price Filter:
```
Filters
─────────────────
Price
[ 2 ] — [ 7499 ]
●────────────────○
```
- Min/max number inputs
- Range slider below
- Apply button

### Latest Products:
```
Latest Products
─────────────────
[img] Sennheiser...  ★★★★★ $255.00
[img] Bose QuietCo... ★★★★★ $349.00
[img] Beats Studio...  ★★★★★ $170.00
[img] Beats Fit Pr...  ★★★★★ $155.00
[img] Apple AirPods... ★★★★★ $299.00
```
- Small thumbnail (40x40)
- Product name (1 line, truncated)
- Star rating + price

## Implementation Order

1. Create `ShopCard.tsx` component
2. Update `shop/page.tsx` (grid + sidebar + toolbar)
3. Update `project-kits/page.tsx` (grid + sidebar + toolbar)
4. Test responsive behavior (mobile: 2 cols, tablet: 3-4 cols, desktop: 5-6 cols)

## Responsive Breakpoints
- Mobile (< 640px): 2 columns
- Tablet (640-1024px): 3 columns
- Desktop (1024-1280px): 4 columns
- Large (1280-1536px): 5 columns
- XL (> 1536px): 6 columns
