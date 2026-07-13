# 📱 ePowerFix App — Build Guide

> **Goal:** Build mobile app for ePowerFix (electrical services + e-commerce + projects, Bangladesh)
> **Strategy:** PWA first (Week 1-2) → React Native Expo (Month 4+, if needed)
> **NO Flutter** — would waste existing Next.js codebase

---

## 🎯 Decision Summary

### Recommended Path

```
NOW (Week 1-2)
   ↓
   Build PWA on top of existing Next.js
   ↓
   - Installable on phone home screen
   - Works offline (catalog cached)
   - Push notifications via Firebase
   - SAME codebase as website (zero duplication)
   ↓
MONTH 4+ (IF 5,000+ active users OR 100+ daily orders)
   ↓
   Build React Native + Expo app
   ↓
   - Submit to Play Store + App Store
   - Reuse API/types/utils from Next.js via Turborepo monorepo
   - PWA remains as web fallback
```

### Why NOT Flutter?

| Reason | Impact |
|--------|--------|
| Existing 200+ TypeScript files wasted | ❌ Massive rewrite |
| Dart is new language for team | ❌ Slow onboarding |
| Flutter Web has poor SEO | ❌ Products won't rank on Google |
| Can't share code with Next.js | ❌ Double maintenance |
| Hiring Dart devs in BD is hard | ❌ Talent scarcity |

### Why React Native (Expo) over Flutter (when native needed)?

| Reason | Benefit |
|--------|---------|
| TypeScript (same as Next.js) | ✅ Team productive immediately |
| Expo handles build/submit | ✅ No Xcode/Android Studio needed |
| Shared code via monorepo | ✅ API client, types, utils reused |
| 90% of npm packages work | ✅ Rich ecosystem |
| More BD developers available | ✅ Easy hiring |

---

## 📦 Phase 1: PWA Setup (Immediate — Week 1-2)

### What is PWA?

Progressive Web App = your website behaves like a native app:
- ✅ Installable on home screen (Android + iOS)
- ✅ Full-screen, no browser chrome
- ✅ Works offline (cached pages)
- ✅ Push notifications
- ✅ Access to camera, GPS, etc.
- ❌ NOT in Play Store / App Store

### Why PWA First?

1. **Zero new codebase** — uses existing Next.js
2. **1-2 days to set up** vs 2-3 months for native
3. **All features work** — payments, auth, cart, everything
4. **SEO preserved** — Google indexes all pages
5. **Single update** — change once, web + app both update
6. **Free** — no app store fees ($25 Play Store, $99/yr Apple)

### PWA Setup Steps

#### Step 1: Install PWA Package

```bash
cd /home/z/ePowerFix
bun add @ducanh2912/next-pwa
```

#### Step 2: Configure `next.config.ts`

```typescript
import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
  },
});

const nextConfig: NextConfig = {
  // ... existing config
};

export default withPWA(nextConfig);
```

#### Step 3: Create `public/manifest.json`

```json
{
  "name": "ePowerFix — Electrical Services & Products",
  "short_name": "ePowerFix",
  "description": "Electrical services, products, and projects in Bangladesh",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#ffffff",
  "theme_color": "#f59e0b",
  "categories": ["shopping", "business", "utilities"],
  "lang": "bn",
  "dir": "ltr",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-maskable-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ],
  "shortcuts": [
    {
      "name": "Shop",
      "url": "/shop",
      "icons": [{ "src": "/icons/shop-96.png", "sizes": "96x96" }]
    },
    {
      "name": "Services",
      "url": "/services",
      "icons": [{ "src": "/icons/service-96.png", "sizes": "96x96" }]
    },
    {
      "name": "Track Order",
      "url": "/order-track",
      "icons": [{ "src": "/icons/track-96.png", "sizes": "96x96" }]
    }
  ]
}
```

#### Step 4: Add Manifest + Theme to `src/app/layout.tsx`

```tsx
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ePowerFix",
  },
  // ... existing metadata
};

export const viewport: Viewport = {
  themeColor: "#f59e0b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};
```

#### Step 5: Generate App Icons

Use Image-Generation skill to create:
- `icon-192.png` (192×192)
- `icon-512.png` (512×512)
- `icon-maskable-512.png` (512×512, with safe padding)
- `apple-touch-icon.png` (180×180)

Place in `public/icons/`.

#### Step 6: Add "Install App" Smart Banner

Create `src/components/epf/InstallPrompt.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show after 30s on site, if not already installed
      const installed = localStorage.getItem("pwa-installed");
      if (!installed) {
        setTimeout(() => setShow(true), 30000);
      }
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      localStorage.setItem("pwa-installed", "true");
    }
    setShow(false);
    setDeferredPrompt(null);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-sm rounded-lg border bg-background p-4 shadow-lg md:bottom-4">
      <button
        onClick={() => setShow(false)}
        className="absolute right-2 top-2"
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-primary/10 p-2">
          <Download className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold">ইনস্টল করুন ePowerFix</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            হোম স্ক্রিনে রাখুন, দ্রুত অর্ডার করুন
          </p>
          <Button
            size="sm"
            className="mt-2 w-full"
            onClick={handleInstall}
          >
            ইনস্টল করুন
          </Button>
        </div>
      </div>
    </div>
  );
}
```

Add to `src/app/layout.tsx`:
```tsx
<InstallPrompt />
```

#### Step 7: Set Up Push Notifications (Firebase)

1. Create Firebase project at https://console.firebase.google.com
2. Enable Cloud Messaging
3. Install FCM:
   ```bash
   bun add firebase
   ```
4. Create `src/lib/firebase.ts`:
   ```typescript
   import { initializeApp } from "firebase/app";
   import { getMessaging, isSupported } from "firebase/messaging";

   const firebaseConfig = {
     apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
     authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
     projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
     messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_SENDER_ID,
     appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
   };

   const app = initializeApp(firebaseConfig);

   export const messaging = async () => {
     const supported = await isSupported();
     return supported ? getMessaging(app) : null;
   };
   ```
5. Create service worker `public/firebase-messaging-sw.js`
6. Add notification permission request UI
7. Create admin API to send push notifications (order updates, deals)

#### Step 8: Offline Support

The PWA service worker (from Step 2) automatically caches:
- Static assets (JS, CSS, images)
- Product catalog pages
- Homepage

For dynamic data offline:
- Use IndexedDB to cache last-seen products
- Show "You're offline" banner with cached content
- Queue orders made offline → sync when online

#### Step 9: Test PWA

**Android (Chrome):**
1. Open site in Chrome
2. Menu → "Install app"
3. Verify icon on home screen
4. Open from home screen → full screen, no browser

**iOS (Safari):**
1. Open site in Safari
2. Share → "Add to Home Screen"
3. Open from home screen

**Verify:**
- ✅ Lighthouse PWA audit (score 100)
- ✅ Works offline
- ✅ Push notification received
- ✅ Installable

#### Step 10: Promote PWA

- Facebook post: "আমাদের অ্যাপ ব্রাউজার থেকেই ইনস্টল করুন!"
- Add banner on website: "Install our app"
- QR code on flyers: scans to website → install prompt
- YouTube video tutorial: "How to install ePowerFix app"

---

## 📦 Phase 2: React Native App (Month 4+ — Conditional)

> **Trigger:** Only build native app when:
> - 5,000+ active PWA users, OR
> - 100+ daily orders, OR
> - Users actively requesting Play Store app

### Step 1: Set Up Monorepo (Turborepo)

Restructure to share code between web and mobile:

```
ePowerFix/
├── apps/
│   ├── web/              ← Existing Next.js (moved here)
│   │   ├── src/
│   │   ├── package.json
│   │   └── next.config.ts
│   └── mobile/           ← New Expo app
│       ├── app/
│       ├── package.json
│       └── app.config.ts
├── packages/
│   ├── api/              ← Shared API client (extracted from /src/lib/api.ts)
│   │   ├── src/
│   │   └── package.json
│   ├── types/            ← Shared TypeScript types
│   │   ├── src/
│   │   └── package.json
│   ├── utils/            ← Shared utilities
│   │   ├── src/
│   │   └── package.json
│   ├── ui/               ← Shared UI primitives (buttons, inputs)
│   │   ├── src/
│   │   └── package.json
│   └── config/           ← Shared config (env, constants)
│       ├── src/
│       └── package.json
├── turbo.json
├── package.json
└── bun.lock
```

**Install Turborepo:**
```bash
cd /home/z/ePowerFix
bun add -d turbo
bunx create-turbo@latest
```

### Step 2: Extract Shared Code

Move these from Next.js to `packages/`:

| File | Destination |
|------|-------------|
| `src/lib/api.ts` | `packages/api/src/client.ts` |
| `src/lib/admin-api.ts` | `packages/api/src/admin.ts` |
| `src/lib/types.ts` (create if not exist) | `packages/types/src/` |
| `src/lib/utils.ts` | `packages/utils/src/` |
| `src/lib/payments.ts` (shared logic) | `packages/api/src/payments.ts` |
| Constants (URLs, etc.) | `packages/config/src/` |

### Step 3: Create Expo App

```bash
cd apps
bunx create-expo-app mobile --template tabs
cd mobile
```

### Step 4: Install Expo Packages

```bash
bun add expo-router expo-secure-store expo-notifications
bun add @react-native-async-storage/async-storage
bun add react-native-safe-area-context
bun add expo-image expo-linear-gradient
bun add @expo/vector-icons
```

### Step 5: App Structure (Expo Router)

```
apps/mobile/app/
├── _layout.tsx              ← Root layout (providers, auth gate)
├── (tabs)/
│   ├── _layout.tsx          ← Bottom tab navigation
│   ├── index.tsx            ← Home
│   ├── shop.tsx             ← Shop
│   ├── services.tsx         ← Services
│   ├── cart.tsx             ← Cart
│   └── profile.tsx          ← Profile
├── product/[id].tsx         ← Product detail
├── checkout.tsx             ← Checkout
├── order-track.tsx          ← Order tracking
├── service/[id].tsx         ← Service detail
├── book-service/[id].tsx    ← Service booking
├── project-kits.tsx         ← Project kits list
├── project-kit/[slug].tsx   ← Project kit detail
├── login.tsx                ← Login
├── register.tsx             ← Register
└── search.tsx               ← Search
```

### Step 6: Build Key Screens

#### Home Screen (`app/(tabs)/index.tsx`)
- Hero banner carousel
- Category grid (services, shop, projects, kits)
- Featured products (horizontal scroll)
- Flash deals section
- Trust bar (warranty, delivery, support)
- Bottom: install prompt (if PWA fallback)

#### Shop Screen (`app/(tabs)/shop.tsx`)
- Search bar (top)
- Category filter chips
- Sort dropdown (price, popularity, newest)
- Product grid (2 columns)
- Infinite scroll pagination
- Filter button → bottom sheet with full filters

#### Product Detail (`app/product/[id].tsx`)
- Image gallery (swipeable)
- Title, price, rating
- Stock status
- Quantity selector
- Add to cart / Buy now
- Wishlist button
- Description, specs
- Reviews section
- Related products

#### Cart & Checkout
- Cart items list (swipe to remove)
- Quantity edit
- Coupon code input
- Address selection
- Payment method (bKash, Nagad, SSL)
- Order summary
- Place order → confirmation

### Step 7: Integrate Payments

**bKash (native):**
```bash
bun add bkash-payment-react-native
```
Or use WebView approach (simpler, reuses existing web flow):
```tsx
import { WebView } from "react-native-webview";

// Open your existing /api/payments/initiate endpoint in WebView
```

**Recommendation:** Use WebView approach first — reuses existing payment logic, no extra SDK. Add native SDKs later if needed.

### Step 8: Push Notifications

```bash
bun add expo-notifications
```

Configure in `app.config.ts`:
```typescript
export default {
  expo: {
    // ...
    plugins: ["expo-notifications"],
    notification: {
      icon: "./assets/notification-icon.png",
      color: "#f59e0b",
    },
  },
};
```

### Step 9: Build & Submit

**Play Store:**
```bash
bunx eas-cli build --platform android --profile production
bunx eas-cli submit -p android --latest
```

**App Store:**
```bash
bunx eas-cli build --platform ios --profile production
bunx eas-cli submit -p ios --latest
```

**Play Store listing:**
- Title: `ePowerFix — Electrical Services & Products`
- Short description: `ইলেকট্রিক্যাল সার্ভিস, প্রোডাক্ট ও প্রজেক্ট — সবকিছু এক অ্যাপে`
- Category: Shopping
- Screenshots: 5 (home, shop, product, cart, profile)
- Privacy policy URL: `https://epowerfix.com.bd/privacy`

**App Store listing:**
- Same content
- Requires Apple Developer account ($99/year)

### Step 10: App Store Optimization (ASO)

- **Keywords:** electrical, wiring, bangladesh, arduino, project, bkash, shopping
- **Title:** ePowerFix — Electrical BD
- **Rating:** Prompt happy customers to rate (in-app prompt after successful order)
- **Update frequency:** Monthly updates keep ranking fresh

---

## 🔄 Code Sharing Strategy

### What Can Be Shared (Web + Mobile)?

| Code | Share Method | Savings |
|------|--------------|---------|
| API client (`fetch` wrappers) | `packages/api` | ~80% reuse |
| TypeScript types | `packages/types` | 100% reuse |
| Utility functions | `packages/utils` | 90% reuse |
| Validation schemas (zod) | `packages/utils` | 100% reuse |
| Business logic (pricing, cart calc) | `packages/utils` | 100% reuse |
| Constants (URLs, config) | `packages/config` | 100% reuse |

### What CANNOT Be Shared?

| Code | Why |
|------|-----|
| UI components | Web uses div/HTML, mobile uses View/Text |
| Styling | Tailwind (web) vs StyleSheet (mobile) |
| Navigation | Next.js router vs Expo Router |
| Image components | next/image vs expo-image |
| Platform APIs | Browser APIs vs React Native modules |

### Recommended UI Approach

For shared UI, use **Tamagui** or **NativeWind**:

- **NativeWind:** Tailwind for React Native — write same className for web + mobile
- **Tamagui:** Cross-platform UI kit with shared styling

**Recommendation:** Use **NativeWind** (matches existing Tailwind knowledge):
```bash
bun add nativewind
```

Then components can be shared:
```tsx
// Works on both web (Next.js) and mobile (Expo)
<View className="flex-1 bg-white p-4">
  <Text className="text-lg font-bold">ePowerFix</Text>
</View>
```

---

## 📊 Effort & Timeline Estimate

### Phase 1: PWA (1-2 weeks)

| Task | Effort |
|------|--------|
| Install + configure next-pwa | 2 hours |
| Create manifest.json | 1 hour |
| Generate icons | 2 hours |
| Add install prompt UI | 3 hours |
| Firebase push notifications | 1-2 days |
| Offline caching testing | 1 day |
| **TOTAL** | **~1 week** |

### Phase 2: React Native App (4-8 weeks)

| Task | Effort |
|------|--------|
| Set up Turborepo monorepo | 2-3 days |
| Extract shared packages | 3-5 days |
| Create Expo project + routing | 1 day |
| Build auth screens | 2-3 days |
| Build home + shop + product | 5-7 days |
| Build cart + checkout | 3-5 days |
| Build service + project screens | 3-5 days |
| Build profile + orders | 2-3 days |
| Payment integration (WebView) | 2-3 days |
| Push notifications | 1-2 days |
| Testing + bug fixes | 5-7 days |
| Play Store submission + review | 3-7 days |
| App Store submission + review | 7-14 days |
| **TOTAL** | **6-10 weeks** |

### Team Required

**PWA (Phase 1):** 1 Next.js developer (you or existing dev) — 1 week

**React Native (Phase 2):**
- 1 React Native developer (full-time, 6-8 weeks)
- 1 designer (part-time, for app-specific UI)
- OR use a contractor/freelancer for 2-3 months

---

## 💰 Cost Comparison

| Approach | Initial Cost | Monthly Cost | Time |
|----------|-------------|--------------|------|
| **PWA only** | 0 ৳ (DIY) | 0 ৳ | 1 week |
| **PWA + React Native** | 1-3 lakh ৳ (dev) | 0 ৳ | 2-3 months |
| **Flutter (NOT recommended)** | 3-5 lakh ৳ (full rewrite) | 0 ৳ | 4-6 months |
| **Hire agency for native** | 5-10 lakh ৳ | 5,000 ৳ (maintenance) | 3-6 months |

---

## 🎯 Recommendation Summary

### DO THIS ✅

1. **Now (Week 1-2):** Set up PWA on existing Next.js
   - 1 week effort, zero cost
   - App-like experience immediately
   - Users can install from browser

2. **Month 2-3:** Promote PWA aggressively
   - "Install our app" campaign
   - QR codes on flyers
   - YouTube tutorial

3. **Month 4+ (IF needed):** Build React Native + Expo
   - Only if PWA hits 5,000+ users
   - Use Turborepo to share code
   - Submit to Play Store + App Store

### DON'T DO THIS ❌

1. **Don't build Flutter app** — wastes existing code
2. **Don't build native app first** — premature, expensive
3. **Don't maintain 3 codebases** (web + Android + iOS) — use shared monorepo
4. **Don't skip PWA** — it's free app experience with no downside

---

## 📋 Agent Task Checklist

### PWA Setup (Priority C)

| Task ID | Task |
|---------|------|
| APP-1 | Install `@ducanh2912/next-pwa` |
| APP-2 | Configure PWA in `next.config.ts` |
| APP-3 | Create `public/manifest.json` |
| APP-4 | Generate app icons (192, 512, maskable, apple-touch) |
| APP-5 | Add manifest link in `layout.tsx` |
| APP-6 | Add viewport + themeColor metadata |
| APP-7 | Create `InstallPrompt.tsx` component |
| APP-8 | Test PWA install on Android Chrome |
| APP-9 | Test PWA install on iOS Safari |
| APP-10 | Set up Firebase project for push notifications |
| APP-11 | Install `firebase` package |
| APP-12 | Create `src/lib/firebase.ts` |
| APP-13 | Create `public/firebase-messaging-sw.js` |
| APP-14 | Add notification permission UI |
| APP-15 | Create admin API to send push notifications |
| APP-16 | Run Lighthouse PWA audit (target: 100) |
| APP-17 | Add "Install App" banner to homepage |
| APP-18 | Create QR code linking to site (for flyers) |

### React Native App (Priority F — Conditional)

| Task ID | Task |
|---------|------|
| RN-1 | Set up Turborepo monorepo |
| RN-2 | Move Next.js to `apps/web/` |
| RN-3 | Create `packages/api`, `packages/types`, `packages/utils` |
| RN-4 | Extract shared code from Next.js |
| RN-5 | Create Expo app in `apps/mobile/` |
| RN-6 | Install Expo Router + dependencies |
| RN-7 | Configure app.config.ts |
| RN-8 | Build root layout (auth gate, providers) |
| RN-9 | Build tab navigation |
| RN-10 | Build home screen |
| RN-11 | Build shop screen |
| RN-12 | Build product detail screen |
| RN-13 | Build cart screen |
| RN-14 | Build checkout screen |
| RN-15 | Build order tracking screen |
| RN-16 | Build service screens |
| RN-17 | Build project kit screens |
| RN-18 | Build profile + auth screens |
| RN-19 | Integrate payments (WebView approach) |
| RN-20 | Configure push notifications |
| RN-21 | Add analytics (Firebase/GA4) |
| RN-22 | Test on Android device |
| RN-23 | Test on iOS device |
| RN-24 | Create Play Store listing |
| RN-25 | Build + submit to Play Store |
| RN-26 | Create App Store listing |
| RN-27 | Build + submit to App Store |
| RN-28 | Implement ASO (keywords, screenshots) |
| RN-29 | Set up crash reporting (Sentry) |
| RN-30 | Plan v1.1 features based on user feedback |

---

## 📚 Resources

- **PWA Docs:** https://nextjs.org/docs/app/building-your-application/configuring/progressive-web-apps
- **next-pwa:** https://github.com/DuCanhGH/next-pwa
- **Expo Docs:** https://docs.expo.dev
- **Expo Router:** https://docs.expo.dev/router/introduction
- **Turborepo:** https://turbo.build/repo/docs
- **NativeWind:** https://www.nativewind.dev
- **Firebase Cloud Messaging:** https://firebase.google.com/docs/cloud-messaging

---

*End of document. For full business context, see [LAUNCH_ROADMAP.md](./LAUNCH_ROADMAP.md).*
