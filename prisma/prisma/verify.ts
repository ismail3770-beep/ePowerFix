// Verify seed data: counts, admin login, and customer credentials.
import { db } from "../src/lib/db";
import bcrypt from "bcryptjs";

async function main() {
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
    serviceCategories: await db.serviceCategory.count(),
    shipments: await db.shipment.count(),
    payments: await db.payment.count(),
  };
  console.log("=== DB row counts ===");
  for (const [k, v] of Object.entries(counts)) {
    console.log(`  ${k.padEnd(20)} ${v}`);
  }
  console.log(`  ${"TOTAL MODELS".padEnd(20)} ${Object.keys(counts).length}`);

  // Admin login check.
  const admin = await db.user.findUnique({
    where: { email: "admin@epowerfix.com" },
  });
  if (!admin) {
    console.error("FAIL: admin user not found");
    process.exitCode = 1;
    return;
  }
  const passwordOk = bcrypt.compareSync("admin123", admin.password);
  console.log("\n=== Admin login check ===");
  console.log(`  email:    ${admin.email}`);
  console.log(`  role:     ${admin.role}`);
  console.log(`  active:   ${admin.isActive}`);
  console.log(`  password: admin123 -> ${passwordOk ? "VALID ✓" : "INVALID ✗"}`);

  // Customer check.
  const cust = await db.user.findUnique({ where: { email: "rahim@example.com" } });
  if (cust) {
    const ok = bcrypt.compareSync("customer123", cust.password);
    console.log(`\n=== Sample customer check ===`);
    console.log(`  ${cust.email} / customer123 -> ${ok ? "VALID ✓" : "INVALID ✗"}`);
  }

  // Order + items spot check.
  const order = await db.order.findFirst({
    where: { status: "DELIVERED" },
    include: { items: true },
  });
  if (order) {
    console.log(`\n=== Delivered order spot-check ===`);
    console.log(`  ${order.orderNumber} (${order.status}, ${order.paymentStatus}, ${order.paymentMethod})`);
    console.log(`  items: ${order.items.length}, total: ${order.total}`);
  }
}

main()
  .catch((e) => {
    console.error("Verify failed:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
