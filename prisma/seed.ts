/**
 * ePowerFix seed script.
 *
 * Creates:
 *   - 1 admin user
 *   - 1 default tax rate (VAT 15%)
 *   - 1 default site-settings row
 *   - 1 disabled AI provider entry (set apiKey to enable)
 *   - Marketplace skill catalog and Dhaka pilot service zones
 *   - Demo data: 2 brands, 3 product categories, 10 products
 *   - Demo data: 1 service category, 5 services
 *   - Demo data: 3 published blog posts
 *
 * Idempotent: re-running the script upserts everything safely.
 *
 * Usage:
 *   bun prisma/seed.ts
 */
import { db } from "../src/lib/db";
import bcrypt from "bcryptjs";
import { seedMarketplaceCatalog } from "./seed-marketplace";

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

/** Hash a plaintext password with bcrypt (10 rounds). */
function hashPassword(plain: string): string {
  return bcrypt.hashSync(plain, 10);
}

/** Verify a bcrypt hash against a plaintext (used for sanity-check logging). */
function verifyPassword(plain: string, hash: string): boolean {
  return bcrypt.compareSync(plain, hash);
}

// ----------------------------------------------------------------------------
// Seed
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// Demo seed helpers
// ----------------------------------------------------------------------------

async function seedDemoBrands(db: any) {
  const brands = [
    {
      id: "seed-brand-schneider",
      name: "Schneider Electric",
      nameBn: "শ্নাইডার ইলেকট্রিক",
      slug: "schneider-electric",
      country: "France",
      website: "https://www.se.com",
    },
    {
      id: "seed-brand-havells",
      name: "Havells",
      nameBn: "হ্যাভেলস",
      slug: "havells",
      country: "India",
      website: "https://www.havells.com",
    },
  ];

  for (const b of brands) {
    await db.brand.upsert({
      where: { slug: b.slug },
      update: { name: b.name, nameBn: b.nameBn, isActive: true, isDeleted: false },
      create: { ...b, isActive: true, isDeleted: false },
    });
  }
  console.log(`  ✓ Demo brands: ${brands.map((b) => b.name).join(", ")}`);
}

async function seedDemoCategories(db: any) {
  const categories = [
    {
      id: "seed-cat-electrical",
      name: "Electrical Components",
      nameBn: "বৈদ্যুতিক যন্ত্রাংশ",
      slug: "electrical-components",
      sortOrder: 1,
    },
    {
      id: "seed-cat-lighting",
      name: "Lighting",
      nameBn: "আলোক সরঞ্জাম",
      slug: "lighting",
      sortOrder: 2,
    },
    {
      id: "seed-cat-tools",
      name: "Electrician Tools",
      nameBn: "ইলেকট্রিশিয়ান সরঞ্জাম",
      slug: "electrician-tools",
      sortOrder: 3,
    },
  ];

  for (const c of categories) {
    await db.productCategory.upsert({
      where: { slug: c.slug },
      update: { name: c.name, nameBn: c.nameBn, isActive: true, isDeleted: false },
      create: { ...c, isActive: true, isDeleted: false },
    });
  }
  console.log(`  ✓ Demo categories: ${categories.map((c) => c.name).join(", ")}`);
}

async function seedDemoProducts(db: any) {
  const placeholder = (w: number, h: number) =>
    `https://placehold.co/${w}x${h}/e2e8f0/475569?text=ePowerFix`;

  const products = [
    {
      id: "seed-prod-mcb-1",
      name: "Schneider iC60N 16A MCB",
      nameBn: "শ্নাইডার iC60N 16A MCB",
      slug: "schneider-ic60n-16a-mcb",
      description: "Schneider Electric iC60N 16A single-pole miniature circuit breaker. DIN rail mount. Suitable for residential and light commercial installations.",
      shortDesc: "16A single-pole MCB, DIN rail, IEC 60898-1 certified",
      price: 850,
      salePrice: 720,
      stock: 150,
      sku: "SE-MCB-16A",
      brandId: "seed-brand-schneider",
      categoryId: "seed-cat-electrical",
      images: JSON.stringify([placeholder(400, 400)]),
      tags: JSON.stringify(["mcb", "circuit breaker", "schneider"]),
      isFeatured: true,
      isBestDeal: false,
    },
    {
      id: "seed-prod-mcb-2",
      name: "Schneider iC60N 32A MCB",
      nameBn: "শ্নাইডার iC60N 32A MCB",
      slug: "schneider-ic60n-32a-mcb",
      description: "Schneider Electric iC60N 32A single-pole miniature circuit breaker for higher load circuits. DIN rail mount.",
      shortDesc: "32A single-pole MCB, DIN rail mount",
      price: 1100,
      salePrice: 950,
      stock: 80,
      sku: "SE-MCB-32A",
      brandId: "seed-brand-schneider",
      categoryId: "seed-cat-electrical",
      images: JSON.stringify([placeholder(400, 400)]),
      tags: JSON.stringify(["mcb", "circuit breaker", "schneider"]),
      isFeatured: false,
      isBestDeal: true,
    },
    {
      id: "seed-prod-rccb-1",
      name: "Schneider Acti9 RCCB 40A 30mA",
      nameBn: "শ্নাইডার Acti9 RCCB 40A",
      slug: "schneider-acti9-rccb-40a",
      description: "Residual current circuit breaker (RCCB) 40A, 30mA sensitivity. Two-pole, Type AC. Provides earth leakage protection.",
      shortDesc: "RCCB 40A 30mA, 2-pole, Type AC protection",
      price: 2400,
      salePrice: null,
      stock: 45,
      sku: "SE-RCCB-40A",
      brandId: "seed-brand-schneider",
      categoryId: "seed-cat-electrical",
      images: JSON.stringify([placeholder(400, 400)]),
      tags: JSON.stringify(["rccb", "earth leakage", "schneider"]),
      isFeatured: true,
      isBestDeal: false,
    },
    {
      id: "seed-prod-socket-1",
      name: "Havells Crabtree 16A Switch Socket",
      nameBn: "হ্যাভেলস Crabtree 16A সুইচ সকেট",
      slug: "havells-crabtree-16a-switch-socket",
      description: "Havells Crabtree 16A switch socket with shutter. White modular design. Suitable for all modular plates.",
      shortDesc: "16A modular switch socket with safety shutter",
      price: 320,
      salePrice: 280,
      stock: 500,
      sku: "HV-SS-16A",
      brandId: "seed-brand-havells",
      categoryId: "seed-cat-electrical",
      images: JSON.stringify([placeholder(400, 400)]),
      tags: JSON.stringify(["socket", "switch", "havells", "modular"]),
      isFeatured: false,
      isBestDeal: true,
    },
    {
      id: "seed-prod-led-1",
      name: "Havells Adore 9W LED Bulb (Pack of 4)",
      nameBn: "হ্যাভেলস Adore 9W LED বাল্ব (৪ প্যাক)",
      slug: "havells-adore-9w-led-bulb-pack-4",
      description: "Energy-efficient 9W LED bulb with 850 lumens output. Cool white 6500K. E27 base. BEE 5-star rated. Pack of 4 bulbs.",
      shortDesc: "9W LED, 850lm, 6500K, E27 — Pack of 4",
      price: 580,
      salePrice: 499,
      stock: 300,
      sku: "HV-LED-9W-4PK",
      brandId: "seed-brand-havells",
      categoryId: "seed-cat-lighting",
      images: JSON.stringify([placeholder(400, 400)]),
      tags: JSON.stringify(["led", "bulb", "havells", "energy saving"]),
      isFeatured: true,
      isBestDeal: true,
    },
    {
      id: "seed-prod-led-2",
      name: "Havells Endura Neo 18W LED Panel",
      nameBn: "হ্যাভেলস Endura Neo 18W LED প্যানেল",
      slug: "havells-endura-neo-18w-led-panel",
      description: "Slim 18W LED panel light, 1600 lumens. Recessed mount, 225mm cut-out. Neutral white 4000K. Driver included.",
      shortDesc: "18W slim LED panel, 1600lm, 4000K neutral white",
      price: 1800,
      salePrice: 1550,
      stock: 60,
      sku: "HV-LED-PANEL-18W",
      brandId: "seed-brand-havells",
      categoryId: "seed-cat-lighting",
      images: JSON.stringify([placeholder(400, 400)]),
      tags: JSON.stringify(["led panel", "ceiling light", "havells"]),
      isFeatured: false,
      isBestDeal: false,
    },
    {
      id: "seed-prod-wire-1",
      name: "Havells Lifeline 2.5mm² Single Core Wire (90m)",
      nameBn: "হ্যাভেলস Lifeline 2.5mm² সিঙ্গেল কোর তার (৯০মি)",
      slug: "havells-lifeline-2-5mm-wire-90m",
      description: "PVC insulated single-core copper wire, 2.5mm² cross-section. 90-metre coil. Suitable for power circuits, ISI marked.",
      shortDesc: "2.5mm² copper wire, PVC insulated, 90m coil",
      price: 3200,
      salePrice: 2950,
      stock: 120,
      sku: "HV-WIRE-2P5-90",
      brandId: "seed-brand-havells",
      categoryId: "seed-cat-electrical",
      images: JSON.stringify([placeholder(400, 400)]),
      tags: JSON.stringify(["wire", "cable", "copper", "havells"]),
      isFeatured: false,
      isBestDeal: false,
    },
    {
      id: "seed-prod-tester-1",
      name: "Professional Non-Contact Voltage Tester",
      nameBn: "প্রফেশনাল নন-কন্টাক্ট ভোল্টেজ টেস্টার",
      slug: "professional-non-contact-voltage-tester",
      description: "Non-contact AC voltage detector, 12–1000V range. LED and buzzer alert. Auto power-off. Pocket clip included.",
      shortDesc: "Non-contact voltage tester, 12–1000V, LED + buzzer",
      price: 650,
      salePrice: 550,
      stock: 200,
      sku: "TOOL-NCVT-01",
      brandId: "seed-brand-schneider",
      categoryId: "seed-cat-tools",
      images: JSON.stringify([placeholder(400, 400)]),
      tags: JSON.stringify(["tester", "voltage", "tool", "safety"]),
      isFeatured: false,
      isBestDeal: true,
    },
    {
      id: "seed-prod-screwdriver-1",
      name: "Insulated Electrician Screwdriver Set (6-piece)",
      nameBn: "ইন্সুলেটেড ইলেকট্রিশিয়ান স্ক্রু-ড্রাইভার সেট (৬-পিস)",
      slug: "insulated-electrician-screwdriver-set-6pc",
      description: "VDE-certified 1000V insulated screwdriver set. 6 pieces: 3 flat-head + 3 Phillips. Chrome vanadium steel tips. Ergonomic handles.",
      shortDesc: "6-pc VDE 1000V insulated screwdriver set",
      price: 1200,
      salePrice: null,
      stock: 90,
      sku: "TOOL-SCREWSET-6",
      brandId: "seed-brand-havells",
      categoryId: "seed-cat-tools",
      images: JSON.stringify([placeholder(400, 400)]),
      tags: JSON.stringify(["screwdriver", "insulated", "tool", "vde"]),
      isFeatured: true,
      isBestDeal: false,
    },
    {
      id: "seed-prod-pliers-1",
      name: "Insulated Combination Pliers 200mm",
      nameBn: "ইন্সুলেটেড কম্বিনেশন প্লায়ার্স ২০০মি.মি.",
      slug: "insulated-combination-pliers-200mm",
      description: "VDE-certified 1000V insulated combination pliers. 200mm length. Chrome-nickel steel. Suitable for live electrical work.",
      shortDesc: "200mm VDE 1000V combination pliers",
      price: 750,
      salePrice: 680,
      stock: 150,
      sku: "TOOL-PLIERS-200",
      brandId: "seed-brand-schneider",
      categoryId: "seed-cat-tools",
      images: JSON.stringify([placeholder(400, 400)]),
      tags: JSON.stringify(["pliers", "insulated", "tool", "vde"]),
      isFeatured: false,
      isBestDeal: false,
    },
  ];

  for (const p of products) {
    await db.product.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name, price: p.price, salePrice: p.salePrice ?? null,
        stock: p.stock, isFeatured: p.isFeatured, isBestDeal: p.isBestDeal,
        isActive: true, isDeleted: false,
      },
      create: { ...p, isActive: true, isDeleted: false, rating: 0, reviewCount: 0 },
    });
  }
  console.log(`  ✓ Demo products: ${products.length} items seeded`);
}

async function seedDemoServices(db: any) {
  // Service category
  await db.serviceCategory.upsert({
    where: { slug: "electrical-services" },
    update: { name: "Electrical Services", isActive: true, isDeleted: false },
    create: {
      id: "seed-svccat-electrical",
      name: "Electrical Services",
      nameBn: "বৈদ্যুতিক সেবা",
      slug: "electrical-services",
      sortOrder: 1,
      isActive: true,
      isDeleted: false,
    },
  });

  const placeholder = (w: number, h: number) =>
    `https://placehold.co/${w}x${h}/e2e8f0/475569?text=ePowerFix`;

  const services = [
    {
      id: "seed-svc-wiring",
      name: "Full House Electrical Wiring",
      nameBn: "সম্পূর্ণ বাড়ির ওয়্যারিং",
      slug: "full-house-electrical-wiring",
      description: "Complete new electrical wiring for residential properties. Includes conduit installation, distribution board setup, earthing, and testing. Compliant with BNBC standards.",
      shortDesc: "Complete residential wiring with DB setup and earthing",
      basePrice: 15000,
      priceUnit: "per_call",
      categoryId: "seed-svccat-electrical",
      images: JSON.stringify([placeholder(400, 300)]),
      isFeatured: true,
      isBestDeal: false,
    },
    {
      id: "seed-svc-fan",
      name: "Ceiling Fan Installation",
      nameBn: "সিলিং ফ্যান ইন্সটলেশন",
      slug: "ceiling-fan-installation",
      description: "Professional installation of ceiling fans including mounting, wiring, and balancing. Works with all fan types and sizes. Includes safety check.",
      shortDesc: "Ceiling fan fitting with wiring and safety check",
      basePrice: 500,
      priceUnit: "per_call",
      categoryId: "seed-svccat-electrical",
      images: JSON.stringify([placeholder(400, 300)]),
      isFeatured: true,
      isBestDeal: true,
    },
    {
      id: "seed-svc-db",
      name: "Distribution Board Upgrade",
      nameBn: "ডিস্ট্রিবিউশন বোর্ড আপগ্রেড",
      slug: "distribution-board-upgrade",
      description: "Replace outdated or unsafe distribution boards with modern MCB/RCCB panels. Includes load balancing, labelling, and earth fault testing.",
      shortDesc: "DB replacement with MCB/RCCB panel and earth testing",
      basePrice: 5000,
      priceUnit: "per_call",
      categoryId: "seed-svccat-electrical",
      images: JSON.stringify([placeholder(400, 300)]),
      isFeatured: false,
      isBestDeal: false,
    },
    {
      id: "seed-svc-ac",
      name: "AC Installation & Servicing",
      nameBn: "এসি ইন্সটলেশন ও সার্ভিসিং",
      slug: "ac-installation-servicing",
      description: "Split or window AC installation with copper pipe laying, drainage, and electrical connection. Also offers gas top-up, coil cleaning, and annual servicing.",
      shortDesc: "AC installation and annual servicing package",
      basePrice: 2000,
      priceUnit: "per_call",
      categoryId: "seed-svccat-electrical",
      images: JSON.stringify([placeholder(400, 300)]),
      isFeatured: true,
      isBestDeal: false,
    },
    {
      id: "seed-svc-fault",
      name: "Electrical Fault Detection & Repair",
      nameBn: "বৈদ্যুতিক ত্রুটি শনাক্তকরণ ও মেরামত",
      slug: "electrical-fault-detection-repair",
      description: "Emergency and scheduled fault finding service. Covers tripped MCBs, short circuits, power outages, flickering lights, and faulty sockets. Fast response.",
      shortDesc: "Emergency fault finding and repair — fast response",
      basePrice: 800,
      priceUnit: "per_call",
      categoryId: "seed-svccat-electrical",
      images: JSON.stringify([placeholder(400, 300)]),
      isFeatured: false,
      isBestDeal: true,
    },
  ];

  for (const s of services) {
    await db.service.upsert({
      where: { slug: s.slug },
      update: {
        name: s.name, basePrice: s.basePrice,
        isFeatured: s.isFeatured, isBestDeal: s.isBestDeal,
        isActive: true, isDeleted: false,
      },
      create: { ...s, isActive: true, isDeleted: false, rating: 0, reviewCount: 0 },
    });
  }
  console.log(`  ✓ Demo services: ${services.length} items seeded`);
}

async function seedDemoBlogPosts(db: any) {
  const posts = [
    {
      id: "seed-blog-mcb-guide",
      title: "How to Choose the Right MCB for Your Home",
      titleBn: "বাড়ির জন্য সঠিক MCB বেছে নেওয়ার গাইড",
      slug: "how-to-choose-right-mcb-for-home",
      excerpt: "Learn how to select the correct ampere rating, breaking capacity, and curve type for residential circuit breakers.",
      content: `## What is an MCB?

A Miniature Circuit Breaker (MCB) is an automatic electrical switch that protects a circuit from damage caused by overload or short circuit. Unlike fuses, MCBs can be reset after tripping.

## Key Parameters to Consider

### 1. Current Rating (Ampere)
Choose the MCB rating based on the connected load:
- **Lighting circuits:** 6A or 10A
- **Socket/power circuits:** 16A
- **Air conditioners:** 20A or 32A
- **Water heaters:** 20A

### 2. Breaking Capacity
The breaking capacity (kA rating) must exceed the maximum prospective short-circuit current at the installation point. For most homes in Bangladesh, **6kA** is sufficient.

### 3. Tripping Curve
- **Curve B (3–5× In):** Sensitive loads — lighting, electronics
- **Curve C (5–10× In):** General purpose — sockets, appliances
- **Curve D (10–20× In):** High inrush loads — motors, transformers

## Recommended Brands
Schneider Electric, Havells, and ABB are the most reliable brands available in Bangladesh with proper ISI/IEC certification.

## Safety Tip
Always use a certified electrician for installation. Never oversize an MCB to "stop tripping" — this defeats the protection purpose.`,
      author: "ePowerFix Team",
      tags: JSON.stringify(["mcb", "circuit breaker", "electrical safety", "guide"]),
      isPublished: true,
      coverImage: "https://placehold.co/800x400/e2e8f0/475569?text=MCB+Guide",
    },
    {
      id: "seed-blog-led-savings",
      title: "LED vs CFL: How Much Can You Save on Electricity?",
      titleBn: "LED বনাম CFL: বিদ্যুৎ বিলে কতটা সাশ্রয় করা সম্ভব?",
      slug: "led-vs-cfl-electricity-savings",
      excerpt: "A detailed comparison of LED and CFL bulbs in terms of energy consumption, lifespan, and cost savings for Bangladeshi households.",
      content: `## The Lighting Revolution

Bangladesh has seen a massive shift from incandescent and CFL bulbs to LED lighting over the past decade. But is the upgrade worth it?

## Energy Consumption Comparison

| Type | Power (lm equivalent to 60W) | Lifespan |
|------|-------------------------------|----------|
| Incandescent | 60W | 1,000 hours |
| CFL | 14W | 8,000 hours |
| LED | 9W | 25,000 hours |

## Cost Savings Example

Assuming 8 hours/day usage and ৳8/kWh electricity rate:

- **Incandescent:** 60W × 8h × 365 × ৳8/1000 = **৳1,402/year**
- **CFL:** 14W × 8h × 365 × ৳8/1000 = **৳327/year**
- **LED:** 9W × 8h × 365 × ৳8/1000 = **৳210/year**

## Verdict

Switching just 10 bulbs from incandescent to LED saves approximately **৳11,920/year**. The payback period for LED bulbs is typically under 6 months.

## Tips for Buying LED Bulbs in Bangladesh
1. Look for BEE star rating (4 or 5 stars)
2. Check lumen output, not just wattage
3. Choose 6500K (cool white) for work areas, 3000K (warm white) for bedrooms
4. Buy from certified brands: Havells, Philips, Osram`,
      author: "ePowerFix Team",
      tags: JSON.stringify(["led", "cfl", "energy saving", "electricity bill"]),
      isPublished: true,
      coverImage: "https://placehold.co/800x400/e2e8f0/475569?text=LED+vs+CFL",
    },
    {
      id: "seed-blog-earthing",
      title: "Why Proper Earthing is Critical for Your Home's Safety",
      titleBn: "বাড়ির নিরাপত্তায় আর্থিং কেন অপরিহার্য",
      slug: "why-proper-earthing-is-critical-home-safety",
      excerpt: "Understand the different earthing systems, why they matter, and what to do if your home lacks proper earth connections.",
      content: `## What is Electrical Earthing?

Electrical earthing (grounding) is a safety mechanism that provides a low-resistance path for fault currents to flow safely into the ground, preventing electric shock and equipment damage.

## Why Earthing Fails in Many Bangladeshi Homes

1. **Aging installations:** Many older buildings were wired without proper earth conductors
2. **Dry soil conditions:** High soil resistivity in some areas increases earth resistance
3. **Corrosion:** Earth electrodes corrode over time, increasing resistance
4. **Improper installation:** Earth wires connected to neutral instead of true earth

## Signs of Poor Earthing
- Mild tingling sensation when touching appliances
- Frequent tripping of RCCB/ELCB
- Electrical noise in audio/video equipment
- Corrosion on metal parts of appliances

## Testing Your Earthing

An earth resistance test (using a proper earth tester) should show:
- **Residential:** < 5 Ω
- **Commercial:** < 2 Ω
- **Hospitals/Data centres:** < 1 Ω

## Solutions

- **Pipe earthing:** Buried copper or GI pipe with charcoal/salt treatment — most common in Bangladesh
- **Plate earthing:** Copper or GI plate buried at 2.5m depth
- **Chemical earthing:** Permanent solution with maintenance-free compound

Contact a qualified ePowerFix electrician for an earthing audit and upgrade.`,
      author: "ePowerFix Team",
      tags: JSON.stringify(["earthing", "grounding", "electrical safety", "home wiring"]),
      isPublished: true,
      coverImage: "https://placehold.co/800x400/e2e8f0/475569?text=Earthing+Safety",
    },
  ];

  for (const p of posts) {
    await db.blogPost.upsert({
      where: { slug: p.slug },
      update: { title: p.title, isPublished: p.isPublished, isDeleted: false },
      create: { ...p, isDeleted: false },
    });
  }
  console.log(`  ✓ Demo blog posts: ${posts.length} articles seeded`);
}

// ----------------------------------------------------------------------------
// Seed
// ----------------------------------------------------------------------------

async function seed() {
  console.log("→ Seeding ePowerFix database…");

  // ------------------------------------------------------------------
  // 1. Admin user
  //    Credentials are read from environment variables so that no real
  //    password is ever committed to the repository. Set ADMIN_EMAIL and
  //    ADMIN_PASSWORD in your .env file before running the seed.
  // ------------------------------------------------------------------
  const adminEmail = process.env.ADMIN_EMAIL || "admin@epowerfix.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "change-me-on-first-login";
  const adminName = process.env.ADMIN_NAME || "ePowerFix Admin";
  const adminNameBn = process.env.ADMIN_NAME_BN || "ই-পাওয়ার ফিক্স অ্যাডমিন";
  const adminPhone = process.env.ADMIN_PHONE || "+880000000000";

  const admin = await db.user.upsert({
    where: { email: adminEmail },
    update: {
      // Re-hash the password on every run so the credentials always work.
      password: hashPassword(adminPassword),
      role: "ADMIN",
      isActive: true,
      isDeleted: false,
      emailVerified: true,
    },
    create: {
      name: adminName,
      nameBn: adminNameBn,
      email: adminEmail,
      phone: adminPhone,
      password: hashPassword(adminPassword),
      role: "ADMIN",
      isActive: true,
      emailVerified: true,
    },
  });
  console.log(`  ✓ Admin user: ${admin.email} (id=${admin.id})`);
  if (!verifyPassword(adminPassword, admin.password)) {
    throw new Error("Admin password hash verification failed");
  }

  // ------------------------------------------------------------------
  // 2. Default tax rate (VAT 15%) — referenced by products
  // ------------------------------------------------------------------
  const tax = await db.tax.upsert({
    where: { id: "seed-vat-15" },
    update: {},
    create: {
      id: "seed-vat-15",
      name: "VAT 15%",
      rate: 15,
      type: "PERCENTAGE",
      isActive: true,
    },
  });
  console.log(`  ✓ Tax: ${tax.name} (id=${tax.id})`);

  // ------------------------------------------------------------------
  // 3. Site settings (single row)
  // ------------------------------------------------------------------
  await db.siteSettings.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
  });
  console.log("  ✓ SiteSettings (default)");

  // ------------------------------------------------------------------
  // 4. AI provider (disabled by default — set apiKey to enable)
  // ------------------------------------------------------------------
  await db.aiProvider.upsert({
    where: { id: "seed-ai-openai" },
    update: {},
    create: {
      id: "seed-ai-openai",
      name: "OpenAI (seed)",
      type: "OPENAI",
      apiKey: null,
      baseUrl: "https://api.openai.com/v1",
      defaultModel: "gpt-4o-mini",
      enabled: false,
      isBuiltIn: true,
      sortOrder: 1,
      config: JSON.stringify({ notes: "seed entry — set apiKey to enable" }),
    },
  });
  console.log("  ✓ AiProvider: OpenAI (seed, disabled)");

  // ------------------------------------------------------------------
  // 5. Electrician marketplace operational catalog
  // ------------------------------------------------------------------
  await seedMarketplaceCatalog(db);
  console.log("  ✓ Marketplace catalog: skills and Dhaka pilot zones");

  // ------------------------------------------------------------------
  // 6. Demo storefront data
  // ------------------------------------------------------------------
  await seedDemoBrands(db);
  await seedDemoCategories(db);
  await seedDemoProducts(db);
  await seedDemoServices(db);
  await seedDemoBlogPosts(db);

  // ------------------------------------------------------------------
  // Done
  // ------------------------------------------------------------------
  console.log("✓ Seed complete.");

  const counts = {
    users: await db.user.count(),
    taxes: await db.tax.count(),
    siteSettings: await db.siteSettings.count(),
    aiProviders: await db.aiProvider.count(),
    marketplaceSkills: await db.skill.count(),
    serviceZones: await db.serviceZone.count(),
    brands: await db.brand.count(),
    productCategories: await db.productCategory.count(),
    products: await db.product.count(),
    serviceCategories: await db.serviceCategory.count(),
    services: await db.service.count(),
    blogPosts: await db.blogPost.count(),
  };
  console.log("Counts:", JSON.stringify(counts, null, 2));
}

seed()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
