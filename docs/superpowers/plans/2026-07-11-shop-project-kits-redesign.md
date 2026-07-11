# Shop & Project Kits Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign Shop page and Project Kits page to match reference e-commerce layout with 6-column grid, simple product cards, and simplified sidebar.

**Architecture:** Create new `ShopCard` component for simple card design, update shop and project-kits pages to use 6-column grid and simplified sidebar layout.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, Zustand, TanStack Query, Lucide React icons

---

## File Structure

| File | Action | Purpose |
|------|--------|---------|
| `src/components/epf/ShopCard.tsx` | Create | New simple product card component |
| `src/app/shop/page.tsx` | Modify | Grid 6-col, sidebar, toolbar |
| `src/app/project-kits/page.tsx` | Modify | Grid 6-col, sidebar, toolbar |

---

### Task 1: Create ShopCard Component

**Files:**
- Create: `src/components/epf/ShopCard.tsx`

- [ ] **Step 1: Create ShopCard component with basic structure**

```tsx
"use client";

import { useState } from "react";
import { ShoppingCart, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store";
import { toast } from "sonner";

export interface ShopCardData {
  id: string;
  name: string;
  price: number;
  salePrice?: number | null;
  comparePrice?: number | null;
  image?: string;
  images?: string[];
  stock?: number;
  rating?: number;
  reviewCount?: number;
  badge?: string;
  isFeatured?: boolean;
  isBestDeal?: boolean;
}

interface ShopCardProps {
  data: ShopCardData;
  onCardClick?: (id: string) => void;
  className?: string;
}

export function ShopCard({ data, onCardClick, className }: ShopCardProps) {
  const [imgError, setImgError] = useState(false);
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);

  const imageUrl = data.image || data.images?.[0] || "";

  // Pricing
  const hasDiscount =
    data.comparePrice != null && data.comparePrice > data.price;
  const discountPercent = hasDiscount
    ? Math.round(((data.comparePrice! - data.price) / data.comparePrice!) * 100)
    : 0;
  const displayPrice = data.salePrice ?? data.price;
  const originalPrice = data.comparePrice ?? data.salePrice ?? null;
  const showOriginal = originalPrice != null && originalPrice > displayPrice;

  // Badge
  const badgeText =
    data.badge ||
    (discountPercent > 0
      ? `-${discountPercent}%`
      : data.isBestDeal
      ? "Best Deal"
      : data.isFeatured
      ? "Featured"
      : null);

  // Badge color
  const getBadgeColor = () => {
    if (badgeText?.includes("Out of Stock")) return "bg-red-500";
    if (badgeText?.includes("New")) return "bg-green-500";
    return "bg-epf-500";
  };

  const handleClick = () => {
    if (onCardClick) onCardClick(data.id);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    addItem({
      itemType: "PRODUCT",
      productId: data.id,
      productName: data.name,
      productImage: imageUrl,
      price: Number(displayPrice),
      quantity: 1,
    });

    setAdded(true);
    toast.success("Added to cart", { description: data.name });
    setTimeout(() => setAdded(false), 1500);
  };

  const stars = Math.round(data.rating || 0);

  return (
    <div
      onClick={handleClick}
      className={cn(
        "group relative flex flex-col bg-white rounded-lg overflow-hidden",
        "border border-slate-200",
        "hover:shadow-md transition-all duration-200",
        "cursor-pointer",
        className
      )}
    >
      {/* Image Area */}
      <div className="relative aspect-square bg-slate-50 overflow-hidden">
        {imageUrl && !imgError ? (
          <img
            src={imageUrl}
            alt={data.name}
            className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingCart className="w-8 h-8 text-slate-300" />
          </div>
        )}

        {/* Badge — square style */}
        {badgeText && (
          <span
            className={cn(
              "absolute top-2 left-2 z-10 px-2 py-0.5 text-[11px] font-bold text-white rounded-sm leading-tight",
              getBadgeColor()
            )}
          >
            {badgeText}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 px-3 pt-2 pb-3 gap-1">
        {/* Name */}
        <h4 className="text-[13px] font-normal text-slate-800 line-clamp-2 leading-[1.4] min-h-[2.4rem] group-hover:text-epf-600 transition-colors">
          {data.name}
        </h4>

        {/* Rating */}
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "h-3 w-3",
                  i < stars
                    ? "fill-yellow-400 text-yellow-400"
                    : "fill-slate-200 text-slate-200"
                )}
              />
            ))}
          </div>
          <span className="text-[11px] text-slate-500">
            {data.reviewCount || 0} Review
          </span>
        </div>

        {/* Price */}
        <div className="mt-auto pt-1 flex items-baseline gap-1.5 flex-wrap">
          {showOriginal && (
            <del className="text-[12px] font-normal text-slate-400">
              ${Number(originalPrice).toLocaleString()}
            </del>
          )}
          <span className="text-[14px] font-bold text-slate-900">
            ${Number(displayPrice).toLocaleString()}
          </span>
        </div>

        {/* Cart Button */}
        <button
          onClick={handleAddToCart}
          disabled={added}
          className={cn(
            "mt-2 w-full h-8 flex items-center justify-center gap-1.5 rounded-md text-[12px] font-semibold transition-colors",
            added
              ? "bg-green-500 text-white"
              : "bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-700"
          )}
        >
          <ShoppingCart className="h-3.5 w-3.5" />
          {added ? "Added!" : "Add to Cart"}
        </button>
      </div>
    </div>
  );
}

export function ShopCardSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <div className="aspect-square bg-slate-100 animate-pulse" />
      <div className="p-3 space-y-2">
        <div className="h-3 w-full bg-slate-100 rounded animate-pulse" />
        <div className="h-3 w-2/3 bg-slate-100 rounded animate-pulse" />
        <div className="flex items-center gap-1">
          <div className="h-3 w-16 bg-slate-100 rounded animate-pulse" />
        </div>
        <div className="h-4 w-20 bg-slate-100 rounded animate-pulse" />
        <div className="h-8 w-full bg-slate-100 rounded animate-pulse" />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify component compiles**

Run: `npx tsc --noEmit src/components/epf/ShopCard.tsx`
Expected: No errors

---

### Task 2: Update Shop Page — Grid & Toolbar

**Files:**
- Modify: `src/app/shop/page.tsx`

- [ ] **Step 1: Update imports to include ShopCard**

At top of file, add ShopCard import after PremiumCard import:

```tsx
import {
  ShopCard,
  ShopCardSkeleton,
  type ShopCardData,
} from "@/components/epf/ShopCard";
```

- [ ] **Step 2: Update grid columns from 4 to 6**

Find the grid class in loading skeleton (line ~1142):
```tsx
// Change from:
<div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
// To:
<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
```

Find the product grid (line ~1173):
```tsx
// Change from:
<div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
// To:
<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
```

- [ ] **Step 3: Replace PremiumCard with ShopCard in product grid**

Find the product mapping (line ~1174-1180):
```tsx
// Change from:
{processedProducts.map((product) => (
  <PremiumCard
    key={product.id}
    data={productToCardData(product)}
    onCardClick={handleCardClick}
  />
))}
// To:
{processedProducts.map((product) => (
  <ShopCard
    key={product.id}
    data={productToCardData(product)}
    onCardClick={handleCardClick}
  />
))}
```

- [ ] **Step 4: Replace PremiumCardSkeleton with ShopCardSkeleton**

Find skeleton mapping (line ~1143-1145):
```tsx
// Change from:
{Array.from({ length: 8 }).map((_, i) => (
  <PremiumCardSkeleton key={i} />
))}
// To:
{Array.from({ length: 8 }).map((_, i) => (
  <ShopCardSkeleton key={i} />
))}
```

- [ ] **Step 5: Update productToCardData helper to include rating/reviewCount**

Find the helper function (line ~126-141):
```tsx
// Change from:
function productToCardData(p: Product): PremiumCardData {
  return {
    id: p.id,
    name: p.name,
    price: p.price,
    salePrice: p.salePrice ?? null,
    comparePrice: p.comparePrice ?? null,
    images: p.images || [],
    image: p.image || p.images?.[0] || undefined,
    isFeatured: p.isFeatured,
    isBestDeal: p.isBestDeal,
    stock: p.stock,
    sku: p.sku,
    category: p.category?.name || null,
  };
}
// To:
function productToCardData(p: Product): ShopCardData {
  return {
    id: p.id,
    name: p.name,
    price: p.price,
    salePrice: p.salePrice ?? null,
    comparePrice: p.comparePrice ?? null,
    images: p.images || [],
    image: p.image || p.images?.[0] || undefined,
    isFeatured: p.isFeatured,
    isBestDeal: p.isBestDeal,
    stock: p.stock,
    rating: p.rating,
    reviewCount: p.reviewCount ?? p.reviews,
  };
}
```

- [ ] **Step 6: Update toolbar — sort default to "Latest"**

Find SORT_OPTIONS (line ~113-119):
```tsx
// Change from:
const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "popular", label: "Popular" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
];
// To:
const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Latest" },
  { value: "featured", label: "Featured" },
  { value: "popular", label: "Popular" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
];
```

Find default sort state (line ~797):
```tsx
// Change from:
const [sort, setSort] = useState<SortOption>("featured");
// To:
const [sort, setSort] = useState<SortOption>("newest");
```

- [ ] **Step 7: Add page size selector to toolbar**

After the sort dropdown (around line ~1073), add page size selector:
```tsx
{/* Page size selector */}
<div className="relative">
  <select
    value={PRODUCTS_PER_PAGE}
    onChange={(e) => {
      /* page size change handler */
    }}
    className="appearance-none h-9 pl-3 pr-9 border border-slate-200 rounded-lg bg-white text-[13px] font-medium text-slate-700 cursor-pointer hover:border-slate-300 focus:outline-none focus:border-epf-500"
  >
    <option value={20}>20</option>
    <option value={40}>40</option>
    <option value={60}>60</option>
  </select>
  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
</div>
```

- [ ] **Step 8: Verify shop page compiles**

Run: `npx tsc --noEmit src/app/shop/page.tsx`
Expected: No errors

---

### Task 3: Update Shop Page — Sidebar

**Files:**
- Modify: `src/app/shop/page.tsx`

- [ ] **Step 1: Simplify sidebar — remove brands section**

Find the FilterSidebar component and remove the brands section entirely. Keep only:
1. Categories (with collapsible arrows)
2. Price range filter
3. Latest Products

- [ ] **Step 2: Update categories to use collapsible arrows**

Update category items to use `ChevronRight` with rotation:
```tsx
{categories.map((cat) => (
  <button
    key={cat.id}
    onClick={() => handleCategorySelect(cat.id)}
    className={cn(
      "flex items-center gap-2 w-full py-1.5 text-left text-[13px] transition-colors",
      selectedCategoryId === cat.id
        ? "text-epf-500 font-semibold"
        : "text-slate-600 hover:text-slate-900"
    )}
  >
    <ChevronRight className="h-3.5 w-3.5 shrink-0" />
    <span className="truncate">{cat.name}</span>
  </button>
))}
```

- [ ] **Step 3: Update Latest Products section with thumbnails**

```tsx
<div className="mt-6">
  <h4 className="text-sm font-semibold text-slate-900 mb-3">
    Latest Products
  </h4>
  <div className="space-y-3">
    {latestProducts.map((product) => (
      <div
        key={product.id}
        onClick={() => handleCardClick(product.id)}
        className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 rounded-lg p-1.5 transition-colors"
      >
        <div className="w-10 h-10 bg-slate-100 rounded-md overflow-hidden shrink-0">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-4 h-4 text-slate-300" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] text-slate-600 truncate">{product.name}</p>
          <p className="text-[12px] font-semibold text-slate-900">
            ${product.price}
          </p>
        </div>
      </div>
    ))}
  </div>
</div>
```

- [ ] **Step 4: Verify sidebar compiles**

Run: `npx tsc --noEmit src/app/shop/page.tsx`
Expected: No errors

---

### Task 4: Update Project Kits Page — Grid & Card

**Files:**
- Modify: `src/app/project-kits/page.tsx`

- [ ] **Step 1: Update imports to include ShopCard**

```tsx
import {
  ShopCard,
  ShopCardSkeleton,
  type ShopCardData,
} from "@/components/epf/ShopCard";
```

- [ ] **Step 2: Update grid columns**

Find GRID constant (line ~80-81):
```tsx
// Change from:
const GRID =
  "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4";
// To:
const GRID =
  "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4";
```

- [ ] **Step 3: Create kitToCardData helper**

Add after the parseImages helper:
```tsx
function kitToCardData(kit: Kit): ShopCardData {
  const images = parseImages(kit.images);
  const cover = kit.coverImage || images[0] || "";
  return {
    id: kit.id,
    name: kit.title,
    price: kit.price,
    salePrice: kit.salePrice,
    image: cover,
    images: images,
    stock: kit.stock,
  };
}
```

- [ ] **Step 4: Replace KitCardGrid with ShopCard in grid view**

Find the grid rendering section and replace KitCardGrid with ShopCard:
```tsx
{viewMode === "grid" ? (
  <div className={GRID}>
    {kits.map((kit) => (
      <ShopCard
        key={kit.id}
        data={kitToCardData(kit)}
        onCardClick={(id) => {
          setSelectedProjectId(id);
          setProjectDetailOpen(true);
        }}
      />
    ))}
  </div>
) : (
  /* list view stays the same */
)}
```

- [ ] **Step 5: Update kit badge to use square style**

In the KitCardGrid component, update badge:
```tsx
// Change from rounded pill:
<span className="absolute top-2 left-2 z-10 bg-epf-500 text-white text-[11px] font-bold px-1.5 py-0.5 leading-tight tracking-wide">
// To square:
<span className="absolute top-2 left-2 z-10 bg-epf-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-sm leading-tight">
```

- [ ] **Step 6: Verify project-kits page compiles**

Run: `npx tsc --noEmit src/app/project-kits/page.tsx`
Expected: No errors

---

### Task 5: Update Project Kits Page — Sidebar

**Files:**
- Modify: `src/app/project-kits/page.tsx`

- [ ] **Step 1: Simplify sidebar to match reference**

Update sidebar to show:
1. Categories (difficulty levels as categories)
2. Price range filter
3. Latest Kits thumbnails

Remove availability toggle section.

- [ ] **Step 2: Update sidebar with Latest Kits thumbnails**

```tsx
<div className="mt-6">
  <h4 className="text-sm font-semibold text-slate-900 mb-3">
    Latest Kits
  </h4>
  <div className="space-y-3">
    {latestKits.map((kit) => (
      <div
        key={kit.id}
        onClick={() => {
          setSelectedProjectId(kit.id);
          setProjectDetailOpen(true);
        }}
        className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 rounded-lg p-1.5 transition-colors"
      >
        <div className="w-10 h-10 bg-slate-100 rounded-md overflow-hidden shrink-0">
          {kit.coverImage ? (
            <img
              src={kit.coverImage}
              alt={kit.title}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Boxes className="w-4 h-4 text-slate-300" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] text-slate-600 truncate">{kit.title}</p>
          <p className="text-[12px] font-semibold text-slate-900">
            ৳{Number(kit.salePrice || kit.price).toLocaleString()}
          </p>
        </div>
      </div>
    ))}
  </div>
</div>
```

- [ ] **Step 3: Verify sidebar compiles**

Run: `npx tsc --noEmit src/app/project-kits/page.tsx`
Expected: No errors

---

### Task 6: Final Verification

- [ ] **Step 1: Run full TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors across project

- [ ] **Step 2: Run build to verify no runtime errors**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 3: Test shop page in browser**

1. Navigate to `/shop`
2. Verify 6-column grid on desktop
3. Verify simple cards with image, name, rating, price, cart button
4. Verify sidebar shows categories, price filter, latest products
5. Verify sort dropdown defaults to "Latest"
6. Verify mobile responsive (2 columns)

- [ ] **Step 4: Test project kits page in browser**

1. Navigate to `/project-kits`
2. Verify 6-column grid on desktop
3. Verify sidebar shows categories, price filter, latest kits
4. Verify mobile responsive

- [ ] **Step 5: Commit changes**

```bash
git add src/components/epf/ShopCard.tsx src/app/shop/page.tsx src/app/project-kits/page.tsx
git commit -m "feat: redesign shop and project-kits pages with 6-col grid and simple cards"
```
