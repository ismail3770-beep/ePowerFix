/**
 * ePowerFix seed script — minimal config only.
 *
 * Creates:
 *   - 1 admin user (login credentials below)
 *   - 1 default tax rate (VAT 15%)
 *   - 1 default site-settings row
 *   - 1 disabled AI provider entry (set apiKey to enable)
 *
 * NO demo products / services / projects / orders / customers / blog posts
 * are seeded — the storefront starts empty and the admin adds real content
 * via the admin panel.
 *
 * Idempotent: re-running the script upserts the admin user and skips
 * entities that already exist.
 *
 * Usage:
 *   bun prisma/seed.ts
 */
import { db } from "../src/lib/db";
import bcrypt from "bcryptjs";

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

async function seed() {
  console.log("→ Seeding ePowerFix database (config only — no demo data)…");

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
  // Done
  // ------------------------------------------------------------------
  console.log("✓ Seed complete.");

  const counts = {
    users: await db.user.count(),
    taxes: await db.tax.count(),
    siteSettings: await db.siteSettings.count(),
    aiProviders: await db.aiProvider.count(),
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
