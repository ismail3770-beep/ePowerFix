/**
 * ePowerFix SQLite seed script.
 *
 * Creates an admin user, several customers, catalog entities (categories,
 * brands, products), sample orders with items, services, blog posts, coupons,
 * banners, reviews, newsletter subscribers, contact messages and quote
 * requests.
 *
 * Idempotent: re-running the script upserts the admin user and skips entities
 * that already exist (matched by their natural unique key — email / slug /
 * code / orderNumber, etc.).
 *
 * Usage:
 *   bun prisma/seed.ts
 */
import { db } from "@epowerfix/db";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

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

/** Stringify a value as JSON (for String-typed array/Json fields). */
function j(v: unknown): string {
  return JSON.stringify(v);
}

/** Generate a unique order number like EPF-YYYYMMDD-XXXX. */
function orderNumber(seq: number): string {
  const d = new Date();
  const ymd =
    `${d.getFullYear()}` +
    `${String(d.getMonth() + 1).padStart(2, "0")}` +
    `${String(d.getDate()).padStart(2, "0")}`;
  return `EPF-${ymd}-${String(seq).padStart(4, "0")}`;
}

// ----------------------------------------------------------------------------
// Seed
// ----------------------------------------------------------------------------

async function seed() {
  console.log("→ Seeding ePowerFix SQLite database…");

  // ------------------------------------------------------------------
  // 1. Users (1 admin + 3 customers)
  // ------------------------------------------------------------------
  const adminEmail = "admin@epowerfix.com";
  const adminPassword = "***REDACTED***";

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
      id: uuidv4(),
      name: "ePowerFix Admin",
      nameBn: "ই-পাওয়ার ফিক্স অ্যাডমিন",
      email: adminEmail,
      phone: "+880000000000",
      password: hashPassword(adminPassword),
      role: "ADMIN",
      isActive: true,
      emailVerified: true,
    },
  });
  console.log(`  ✓ Admin user: ${admin.email} (id=${admin.id})`);
  // sanity-check the hash
  if (!verifyPassword(adminPassword, admin.password)) {
    throw new Error("Admin password hash verification failed");
  }

  const customerSpecs = [
    {
      name: "Rahim Uddin",
      email: "rahim@example.com",
      phone: "+880171111111",
    },
    {
      name: "Karim Ahmed",
      email: "karim@example.com",
      phone: "+880172222222",
    },
    {
      name: "Fatima Begum",
      email: "fatima@example.com",
      phone: "+880173333333",
    },
  ];
  const customers: Awaited<ReturnType<typeof db.user.upsert>>[] = [];
  for (const c of customerSpecs) {
    const user = await db.user.upsert({
      where: { email: c.email },
      update: {},
      create: {
        id: uuidv4(),
        name: c.name,
        email: c.email,
        phone: c.phone,
        password: hashPassword("customer123"),
        role: "CUSTOMER",
        isActive: true,
        emailVerified: true,
      },
    });
    customers.push(user);
    console.log(`  ✓ Customer: ${user.email} (id=${user.id})`);
  }

  // ------------------------------------------------------------------
  // 2. Product categories (4)
  // ------------------------------------------------------------------
  const categorySpecs = [
    {
      name: "Solar Panels",
      nameBn: "সোলার প্যানেল",
      slug: "solar-panels",
      icon: "sun",
      sortOrder: 1,
    },
    {
      name: "Inverters",
      nameBn: "ইনভার্টার",
      slug: "inverters",
      icon: "zap",
      sortOrder: 2,
    },
    {
      name: "Batteries",
      nameBn: "ব্যাটারি",
      slug: "batteries",
      icon: "battery",
      sortOrder: 3,
    },
    {
      name: "Wiring & Cables",
      nameBn: "ওয়্যারিং ও কেবল",
      slug: "wiring-cables",
      icon: "cable",
      sortOrder: 4,
    },
  ];
  const categories: Awaited<ReturnType<typeof db.productCategory.upsert>>[] = [];
  for (const c of categorySpecs) {
    const cat = await db.productCategory.upsert({
      where: { slug: c.slug },
      update: {},
      create: {
        id: uuidv4(),
        name: c.name,
        nameBn: c.nameBn,
        slug: c.slug,
        icon: c.icon,
        sortOrder: c.sortOrder,
        isActive: true,
      },
    });
    categories.push(cat);
    console.log(`  ✓ Category: ${cat.name} (id=${cat.id})`);
  }

  // ------------------------------------------------------------------
  // 3. Brands (4)
  // ------------------------------------------------------------------
  const brandSpecs = [
    { name: "Tesla", slug: "tesla", country: "USA", website: "https://www.tesla.com" },
    { name: "LG", slug: "lg", country: "South Korea", website: "https://www.lg.com" },
    { name: "Luminous", slug: "luminous", country: "India", website: "https://www.luminousindia.com" },
    { name: "Hoppecke", slug: "hoppecke", country: "Germany", website: "https://www.hoppecke.com" },
  ];
  const brands: Awaited<ReturnType<typeof db.brand.upsert>>[] = [];
  for (const b of brandSpecs) {
    const brand = await db.brand.upsert({
      where: { slug: b.slug },
      update: {},
      create: {
        id: uuidv4(),
        name: b.name,
        slug: b.slug,
        country: b.country,
        website: b.website,
        isActive: true,
      },
    });
    brands.push(brand);
    console.log(`  ✓ Brand: ${brand.name} (id=${brand.id})`);
  }

  // ------------------------------------------------------------------
  // 4. Tax (1) — used by products
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
  // 5. Products (6) — distributed across categories & brands
  // ------------------------------------------------------------------
  const productSpecs = [
    {
      name: "Tesla 400W Mono Solar Panel",
      slug: "tesla-400w-mono-solar-panel",
      sku: "TESLA-PANEL-400",
      description: "High-efficiency 400W monocrystalline solar panel with 25-year performance warranty.",
      shortDesc: "400W monocrystalline solar panel",
      price: 28000,
      salePrice: 26500,
      costPrice: 22000,
      stock: 50,
      categorySlug: "solar-panels",
      brandSlug: "tesla",
      tags: ["solar", "panel", "mono"],
      isFeatured: true,
    },
    {
      name: "LG 450W Neon R Solar Panel",
      slug: "lg-450w-neon-r-solar-panel",
      sku: "LG-PANEL-450",
      description: "Premium LG Neon R 450W solar panel with improved temperature coefficient.",
      shortDesc: "450W premium solar panel",
      price: 32000,
      salePrice: null,
      costPrice: 25000,
      stock: 35,
      categorySlug: "solar-panels",
      brandSlug: "lg",
      tags: ["solar", "panel", "premium"],
      isFeatured: true,
    },
    {
      name: "Luminous 1500VA Pure Sine Wave Inverter",
      slug: "luminous-1500va-inverter",
      sku: "LUM-INV-1500",
      description: "1500VA pure sine wave inverter suitable for home and small office use.",
      shortDesc: "1500VA pure sine wave inverter",
      price: 18500,
      salePrice: 17000,
      costPrice: 14000,
      stock: 80,
      categorySlug: "inverters",
      brandSlug: "luminous",
      tags: ["inverter", "sine-wave"],
      isFeatured: false,
    },
    {
      name: "Tesla Powerwall 13.5kWh Battery",
      slug: "tesla-powerwall-13-5kwh",
      sku: "TESLA-PW-135",
      description: "Tesla Powerwall 13.5kWh lithium-ion home battery storage system.",
      shortDesc: "13.5kWh lithium-ion battery",
      price: 450000,
      salePrice: null,
      costPrice: 380000,
      stock: 10,
      categorySlug: "batteries",
      brandSlug: "tesla",
      tags: ["battery", "lithium", "storage"],
      isFeatured: true,
    },
    {
      name: "Hoppecke 12V 200Ah Gel Battery",
      slug: "hoppecke-12v-200ah-gel",
      sku: "HOP-BAT-12V200",
      description: "Hoppecke 12V 200Ah gel deep-cycle battery, maintenance-free.",
      shortDesc: "12V 200Ah gel battery",
      price: 42000,
      salePrice: 39500,
      costPrice: 32000,
      stock: 25,
      categorySlug: "batteries",
      brandSlug: "hoppecke",
      tags: ["battery", "gel", "12v"],
      isFeatured: false,
    },
    {
      name: "Luminous 6mm² DC Solar Cable (per meter)",
      slug: "luminous-6mm-dc-solar-cable",
      sku: "LUM-CBL-6MM",
      description: "UV-resistant 6mm² DC solar cable, TUV certified, sold per meter.",
      shortDesc: "6mm² DC solar cable (per meter)",
      price: 220,
      salePrice: null,
      costPrice: 150,
      stock: 500,
      categorySlug: "wiring-cables",
      brandSlug: "luminous",
      tags: ["cable", "dc", "solar"],
      isFeatured: false,
    },
  ];

  const products: Awaited<ReturnType<typeof db.product.upsert>>[] = [];
  for (const p of productSpecs) {
    const category = categories.find((c) => c.slug === p.categorySlug);
    const brand = brands.find((b) => b.slug === p.brandSlug);
    if (!category || !brand) throw new Error(`Missing category/brand for ${p.slug}`);

    const product = await db.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        id: uuidv4(),
        name: p.name,
        slug: p.slug,
        description: p.description,
        shortDesc: p.shortDesc,
        sku: p.sku,
        price: p.price,
        salePrice: p.salePrice ?? null,
        costPrice: p.costPrice,
        stock: p.stock,
        minStock: 5,
        images: j([
          `https://placehold.co/600x400/0EA5E9/FFFFFF.png?text=${encodeURIComponent(p.name)}`,
        ]),
        specs: j({ warranty: "25 years", color: "Black" }),
        tags: j(p.tags),
        isFeatured: p.isFeatured,
        isActive: true,
        brandId: brand.id,
        categoryId: category.id,
        taxId: tax.id,
        rating: 4.5,
        reviewCount: 0,
      },
    });
    products.push(product);
    console.log(`  ✓ Product: ${product.name} (id=${product.id})`);
  }

  // ------------------------------------------------------------------
  // 6. Service categories (2) + services (3)
  // ------------------------------------------------------------------
  const serviceCategorySpecs = [
    { name: "Installation", nameBn: "ইনস্টলেশন", slug: "installation", sortOrder: 1 },
    { name: "Maintenance", nameBn: "রক্ষণাবেক্ষণ", slug: "maintenance", sortOrder: 2 },
  ];
  const serviceCategories: Awaited<ReturnType<typeof db.serviceCategory.upsert>>[] = [];
  for (const c of serviceCategorySpecs) {
    const sc = await db.serviceCategory.upsert({
      where: { slug: c.slug },
      update: {},
      create: {
        id: uuidv4(),
        name: c.name,
        nameBn: c.nameBn,
        slug: c.slug,
        sortOrder: c.sortOrder,
        isActive: true,
      },
    });
    serviceCategories.push(sc);
    console.log(`  ✓ ServiceCategory: ${sc.name} (id=${sc.id})`);
  }

  const serviceSpecs = [
    {
      name: "Solar Panel Installation",
      slug: "solar-panel-installation",
      description: "Full installation service for rooftop solar panel systems up to 5kW.",
      shortDesc: "Rooftop solar installation",
      basePrice: 8000,
      priceUnit: "fixed",
      categorySlug: "installation",
      features: ["Site survey", "Mounting structure", "Wiring & grounding", "1-year service warranty"],
      isFeatured: true,
    },
    {
      name: "Wiring Repair",
      slug: "wiring-repair",
      description: "Diagnostic and repair service for faulty solar wiring, junctions and connections.",
      shortDesc: "Wiring diagnostics & repair",
      basePrice: 1500,
      priceUnit: "per_call",
      categorySlug: "maintenance",
      features: ["Diagnostic", "Repair", "Safety check"],
      isFeatured: false,
    },
    {
      name: "Annual Maintenance Contract",
      slug: "annual-maintenance-contract",
      description: "Annual maintenance contract covering 4 scheduled visits, cleaning and performance check.",
      shortDesc: "Yearly maintenance plan",
      basePrice: 6000,
      priceUnit: "fixed",
      categorySlug: "maintenance",
      features: ["4 scheduled visits", "Panel cleaning", "Performance report", "Priority support"],
      isFeatured: true,
    },
  ];
  const services: Awaited<ReturnType<typeof db.service.upsert>>[] = [];
  for (const s of serviceSpecs) {
    const sc = serviceCategories.find((c) => c.slug === s.categorySlug);
    if (!sc) throw new Error(`Missing service category for ${s.slug}`);
    const service = await db.service.upsert({
      where: { slug: s.slug },
      update: {},
      create: {
        id: uuidv4(),
        name: s.name,
        slug: s.slug,
        description: s.description,
        shortDesc: s.shortDesc,
        basePrice: s.basePrice,
        priceUnit: s.priceUnit,
        images: j([
          `https://placehold.co/600x400/0284C7/FFFFFF.png?text=${encodeURIComponent(s.name)}`,
        ]),
        features: j(s.features),
        isFeatured: s.isFeatured,
        isActive: true,
        categoryId: sc.id,
        rating: 4.7,
        reviewCount: 0,
      },
    });
    services.push(service);
    console.log(`  ✓ Service: ${service.name} (id=${service.id})`);
  }

  // ------------------------------------------------------------------
  // 7. Coupons (3)
  // ------------------------------------------------------------------
  const couponSpecs = [
    {
      code: "WELCOME10",
      name: "Welcome 10% Off",
      description: "10% off for new customers",
      type: "PERCENTAGE",
      value: 10,
      minOrder: 1000,
      maxDiscount: 2000,
      usageLimit: 100,
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
    {
      code: "FLAT500",
      name: "Flat 500 Taka Off",
      description: "Flat 500 Taka off on orders above 5000",
      type: "FIXED",
      value: 500,
      minOrder: 5000,
      maxDiscount: null,
      usageLimit: 50,
      startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    },
    {
      code: "SOLAR20",
      name: "Solar 20% Off",
      description: "20% off on solar panels",
      type: "PERCENTAGE",
      value: 20,
      minOrder: 5000,
      maxDiscount: 10000,
      usageLimit: 200,
      startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  ];
  const coupons: Awaited<ReturnType<typeof db.coupon.upsert>>[] = [];
  for (const c of couponSpecs) {
    const coupon = await db.coupon.upsert({
      where: { code: c.code },
      update: {},
      create: {
        id: uuidv4(),
        code: c.code,
        name: c.name,
        description: c.description,
        type: c.type,
        value: c.value,
        minOrder: c.minOrder,
        maxDiscount: c.maxDiscount,
        usageLimit: c.usageLimit,
        usedCount: 0,
        startDate: c.startDate,
        endDate: c.endDate,
        isActive: true,
      },
    });
    coupons.push(coupon);
    console.log(`  ✓ Coupon: ${coupon.code} (id=${coupon.id})`);
  }

  // ------------------------------------------------------------------
  // 8. Banners (3)
  // ------------------------------------------------------------------
  const bannerSpecs = [
    {
      title: "Solar Sale — Up to 30% Off",
      subtitle: "Premium solar panels at unbeatable prices",
      type: "hero",
      position: 0,
      image: "https://placehold.co/1600x500/0EA5E9/FFFFFF.png?text=Solar+Sale",
      link: "/shop?category=solar-panels",
    },
    {
      title: "Professional Installation Service",
      subtitle: "Certified engineers, 1-year warranty",
      type: "services",
      position: 1,
      image: "https://placehold.co/1600x300/0284C7/FFFFFF.png?text=Installation+Service",
      link: "/services/solar-panel-installation",
    },
    {
      title: "Battery Exchange Offer",
      subtitle: "Trade your old battery and get a discount",
      type: "promo",
      position: 2,
      image: "https://placehold.co/1600x300/4D7300/FFFFFF.png?text=Battery+Exchange",
      link: "/shop?category=batteries",
    },
  ];
  for (const b of bannerSpecs) {
    // Banners are not soft-deleted and have no natural unique key besides id;
    // match by title + type.
    const existing = await db.banner.findFirst({
      where: { title: b.title, type: b.type },
    });
    if (existing) {
      console.log(`  ↻ Banner already exists: ${b.title} (id=${existing.id})`);
      continue;
    }
    const banner = await db.banner.create({
      data: {
        id: uuidv4(),
        title: b.title,
        subtitle: b.subtitle,
        type: b.type,
        position: b.position,
        image: b.image,
        link: b.link,
        isActive: true,
      },
    });
    console.log(`  ✓ Banner: ${banner.title} (id=${banner.id})`);
  }

  // ------------------------------------------------------------------
  // 9. Orders (3) with items, different statuses
  // ------------------------------------------------------------------
  const orderSpecs = [
    {
      seq: 1,
      customerIdx: 0,
      status: "PENDING" as const,
      paymentStatus: "PENDING" as const,
      paymentMethod: "COD",
      items: [
        { productIdx: 0, qty: 2 },
        { productIdx: 5, qty: 10 },
      ],
    },
    {
      seq: 2,
      customerIdx: 1,
      status: "CONFIRMED" as const,
      paymentStatus: "PAID" as const,
      paymentMethod: "BKASH",
      items: [{ productIdx: 2, qty: 1 }],
    },
    {
      seq: 3,
      customerIdx: 2,
      status: "DELIVERED" as const,
      paymentStatus: "PAID" as const,
      paymentMethod: "SSLCOMMERZ",
      items: [{ productIdx: 4, qty: 1 }],
    },
  ];

  const DELIVERY_CHARGE = 100;
  for (const o of orderSpecs) {
    const customer = customers[o.customerIdx];
    const num = orderNumber(o.seq);
    const existing = await db.order.findUnique({ where: { orderNumber: num } });
    if (existing) {
      console.log(`  ↻ Order already exists: ${num} (id=${existing.id})`);
      continue;
    }

    // Build items + compute totals.
    let subtotal = 0;
    const itemRows = o.items.map((it) => {
      const product = products[it.productIdx];
      const unitPrice = product.salePrice ?? product.price;
      const total = unitPrice * it.qty;
      subtotal += total;
      return {
        productId: product.id,
        productName: product.name,
        productImage: JSON.parse(product.images)[0] ?? null,
        price: unitPrice,
        quantity: it.qty,
        total,
      };
    });

    const discount = 0;
    const taxAmount = Math.round(subtotal * 0.0); // tax already in price; keep 0 for seed clarity
    const total = subtotal + DELIVERY_CHARGE + taxAmount - discount;

    const order = await db.order.create({
      data: {
        id: uuidv4(),
        orderNumber: num,
        userId: customer.id,
        customerName: customer.name,
        customerPhone: customer.phone,
        customerEmail: customer.email,
        subtotal,
        deliveryCharge: DELIVERY_CHARGE,
        discount,
        taxAmount,
        total,
        status: o.status,
        paymentStatus: o.paymentStatus,
        paymentMethod: o.paymentMethod,
        notes: "Seed order",
        deliveredAt: o.status === "DELIVERED" ? new Date() : null,
        items: {
          create: itemRows.map((r) => ({
            id: uuidv4(),
            productId: r.productId,
            productName: r.productName,
            productImage: r.productImage,
            price: r.price,
            quantity: r.quantity,
            total: r.total,
            itemType: "PRODUCT",
          })),
        },
      },
      include: { items: true },
    });
    console.log(
      `  ✓ Order ${order.orderNumber} status=${order.status} items=${order.items.length} total=${order.total}`,
    );

    // Seed an order-history row to match the status.
    await db.orderHistory.create({
      data: {
        id: uuidv4(),
        orderId: order.id,
        userId: customer.id,
        status: o.status,
        note: "Order created by seed script",
      },
    });
  }

  // ------------------------------------------------------------------
  // 10. Reviews (3)
  // ------------------------------------------------------------------
  const reviewSpecs = [
    {
      customerIdx: 0,
      productIdx: 0,
      rating: 5,
      title: "Excellent panel, great value",
      comment: "Installation was easy and output exceeds expectations.",
      status: "APPROVED",
    },
    {
      customerIdx: 1,
      productIdx: 2,
      rating: 4,
      title: "Solid inverter",
      comment: "Runs my whole house without issues. Slightly noisy on heavy load.",
      status: "APPROVED",
    },
    {
      customerIdx: 2,
      productIdx: 4,
      rating: 5,
      title: "Battery lasts forever",
      comment: "Easily powers my fridge and lights for 12+ hours.",
      status: "PENDING",
    },
  ];
  for (const r of reviewSpecs) {
    const customer = customers[r.customerIdx];
    const product = products[r.productIdx];
    const existing = await db.review.findFirst({
      where: { userId: customer.id, productId: product.id },
    });
    if (existing) {
      console.log(`  ↻ Review already exists for ${product.name} by ${customer.email}`);
      continue;
    }
    const review = await db.review.create({
      data: {
        id: uuidv4(),
        userId: customer.id,
        productId: product.id,
        rating: r.rating,
        title: r.title,
        comment: r.comment,
        status: r.status,
      },
    });
    console.log(`  ✓ Review (${r.rating}★) on ${product.name} by ${customer.email}`);
  }

  // ------------------------------------------------------------------
  // 11. Newsletter subscribers (3)
  // ------------------------------------------------------------------
  const newsletterSpecs = [
    { email: "sub1@example.com", userId: customers[0].id },
    { email: "sub2@example.com", userId: customers[1].id },
    { email: "sub3@example.com", userId: null },
  ];
  for (const n of newsletterSpecs) {
    const existing = await db.newsletter.findUnique({ where: { email: n.email } });
    if (existing) {
      console.log(`  ↻ Newsletter already exists: ${n.email}`);
      continue;
    }
    await db.newsletter.create({
      data: {
        id: uuidv4(),
        email: n.email,
        userId: n.userId,
        status: "ACTIVE",
      },
    });
    console.log(`  ✓ Newsletter: ${n.email}`);
  }

  // ------------------------------------------------------------------
  // 12. Contact messages (3)
  // ------------------------------------------------------------------
  const contactSpecs = [
    {
      name: "Imran Hossain",
      email: "imran@example.com",
      phone: "+8801800000001",
      subject: "Bulk pricing for 50 solar panels",
      message: "We are a contractor looking for bulk pricing on 50x 400W panels. Please quote.",
      status: "NEW",
    },
    {
      name: "Nadia Islam",
      email: "nadia@example.com",
      phone: "+8801800000002",
      subject: "Warranty claim for inverter",
      message: "My inverter stopped working after 3 months. Need warranty service.",
      status: "IN_PROGRESS",
    },
    {
      name: "Sabbir Rahman",
      email: "sabbir@example.com",
      phone: "+8801800000003",
      subject: "Installation query",
      message: "Do you offer installation in Chattogram?",
      status: "RESOLVED",
    },
  ];
  for (const c of contactSpecs) {
    const existing = await db.contact.findFirst({ where: { email: c.email, subject: c.subject } });
    if (existing) {
      console.log(`  ↻ Contact already exists: ${c.subject}`);
      continue;
    }
    await db.contact.create({
      data: {
        id: uuidv4(),
        name: c.name,
        email: c.email,
        phone: c.phone,
        subject: c.subject,
        message: c.message,
        status: c.status,
      },
    });
    console.log(`  ✓ Contact: ${c.subject}`);
  }

  // ------------------------------------------------------------------
  // 13. Quote requests (3)
  // ------------------------------------------------------------------
  const quoteSpecs = [
    {
      name: "Tahmid Khan",
      phone: "+8801900000001",
      email: "tahmid@example.com",
      serviceType: "solar-panel-installation",
      description: "Need a 5kW rooftop solar installation for a 3-storey house.",
      address: "House 12, Road 5, Banani, Dhaka",
      budget: "200000-300000",
      status: "PENDING",
    },
    {
      name: "Arif Hasan",
      phone: "+8801900000002",
      email: "arif@example.com",
      serviceType: "wiring-repair",
      description: "Loose connection on rooftop junction box causing voltage drops.",
      address: "Flat 4B, Gulshan 2, Dhaka",
      budget: "1000-2000",
      status: "IN_PROGRESS",
    },
    {
      name: "Mim Akter",
      phone: "+8801900000003",
      email: "mim@example.com",
      serviceType: "annual-maintenance-contract",
      description: "Looking for an annual maintenance contract for our office solar system (10kW).",
      address: "Level 6, Pragati Sarani, Dhaka",
      budget: "5000-10000",
      status: "RESOLVED",
    },
  ];
  for (const q of quoteSpecs) {
    const existing = await db.quoteRequest.findFirst({
      where: { phone: q.phone, serviceType: q.serviceType },
    });
    if (existing) {
      console.log(`  ↻ QuoteRequest already exists: ${q.serviceType} from ${q.name}`);
      continue;
    }
    await db.quoteRequest.create({
      data: {
        id: uuidv4(),
        name: q.name,
        phone: q.phone,
        email: q.email,
        serviceType: q.serviceType,
        description: q.description,
        address: q.address,
        budget: q.budget,
        status: q.status,
      },
    });
    console.log(`  ✓ QuoteRequest: ${q.serviceType} from ${q.name}`);
  }

  // ------------------------------------------------------------------
  // 14. Blog posts (3)
  // ------------------------------------------------------------------
  const blogSpecs = [
    {
      title: "How to Choose the Right Solar Panel for Your Home",
      slug: "how-to-choose-the-right-solar-panel",
      excerpt: "A practical guide on sizing, efficiency and budget when buying solar panels.",
      author: "ePowerFix Team",
      tags: ["solar", "guide"],
      content:
        "Choosing a solar panel starts with understanding your energy needs. " +
        "In this post we walk through wattage, efficiency, warranty and budget considerations…",
      isPublished: true,
    },
    {
      title: "Top 5 Maintenance Tips to Extend Battery Life",
      slug: "top-5-maintenance-tips-to-extend-battery-life",
      excerpt: "Simple maintenance practices that can double the life of your solar battery bank.",
      author: "ePowerFix Team",
      tags: ["battery", "maintenance"],
      content:
        "Batteries are the most expensive consumable in a solar system. " +
        "Here are five maintenance habits that pay for themselves…",
      isPublished: true,
    },
    {
      title: "Understanding Inverter Sizing",
      slug: "understanding-inverter-sizing",
      excerpt: "Why sizing your inverter correctly is critical for system performance.",
      author: "ePowerFix Team",
      tags: ["inverter", "guide"],
      content:
        "An undersized inverter will trip constantly, while an oversized one wastes money. " +
        "We explain how to size your inverter properly…",
      isPublished: false,
    },
  ];
  for (const b of blogSpecs) {
    const post = await db.blogPost.upsert({
      where: { slug: b.slug },
      update: {},
      create: {
        id: uuidv4(),
        title: b.title,
        slug: b.slug,
        excerpt: b.excerpt,
        author: b.author,
        tags: j(b.tags),
        content: b.content,
        coverImage: `https://placehold.co/1200x600/0EA5E9/FFFFFF.png?text=${encodeURIComponent(b.title)}`,
        isPublished: b.isPublished,
      },
    });
    console.log(`  ✓ BlogPost: ${post.title} (id=${post.id})`);
  }

  // ------------------------------------------------------------------
  // 15. Site settings (single row)
  // ------------------------------------------------------------------
  await db.siteSettings.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
  });
  console.log("  ✓ SiteSettings (default)");

  // ------------------------------------------------------------------
  // 16. A flash sale + AI provider (for completeness)
  // ------------------------------------------------------------------
  const flashSale = await db.flashSale.upsert({
    where: { id: "seed-flash-sale" },
    update: {},
    create: {
      id: "seed-flash-sale",
      title: "Winter Solar Sale",
      description: "Up to 20% off on selected solar panels",
      startDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      discount: 20,
      isActive: true,
    },
  });
  console.log(`  ✓ FlashSale: ${flashSale.title} (id=${flashSale.id})`);

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
      config: j({ notes: "seed entry — set apiKey to enable" }),
    },
  });
  console.log("  ✓ AiProvider: OpenAI (seed, disabled)");

  // ------------------------------------------------------------------
  // Done
  // ------------------------------------------------------------------
  console.log("✓ Seed complete.");

  // Quick counts for sanity.
  const counts = {
    users: await db.user.count(),
    categories: await db.productCategory.count(),
    brands: await db.brand.count(),
    products: await db.product.count(),
    services: await db.service.count(),
    coupons: await db.coupon.count(),
    banners: await db.banner.count(),
    orders: await db.order.count(),
    orderItems: await db.orderItem.count(),
    reviews: await db.review.count(),
    newsletters: await db.newsletter.count(),
    contacts: await db.contact.count(),
    quoteRequests: await db.quoteRequest.count(),
    blogPosts: await db.blogPost.count(),
    taxes: await db.tax.count(),
    flashSales: await db.flashSale.count(),
    aiProviders: await db.aiProvider.count(),
    siteSettings: await db.siteSettings.count(),
  };
  console.log("Counts:", JSON.stringify(counts, null, 2));
}

seed()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
