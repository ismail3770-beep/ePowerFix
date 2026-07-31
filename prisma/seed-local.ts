import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const password = bcrypt.hashSync('admin123', 10)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@epowerfix.com' },
    update: {},
    create: {
      id: 'seed-admin-001',
      name: 'Admin',
      nameBn: 'অ্যাডমিন',
      email: 'admin@epowerfix.com',
      password,
      role: 'ADMIN',
      phone: '01700000000',
      isActive: true,
    },
  })
  console.log('✅ Admin user created:', admin.email)

  // Seed a service category
  const cat = await prisma.serviceCategory.upsert({
    where: { slug: 'electrical-repair' },
    update: {},
    create: {
      id: 'seed-scat-001',
      name: 'Electrical Repair',
      nameBn: 'ইলেকট্রিক্যাল মেরামত',
      slug: 'electrical-repair',
      isActive: true,
    },
  }).catch(() => null)
  if (cat) console.log('✅ Service category created:', cat.name)

  // Seed a brand
  const brand = await prisma.brand.upsert({
    where: { slug: 'schneider-electric' },
    update: {},
    create: {
      id: 'seed-brand-001',
      name: 'Schneider Electric',
      nameBn: 'শ্নাইডার ইলেকট্রিক',
      slug: 'schneider-electric',
      country: 'France',
      isActive: true,
    },
  }).catch(() => null)
  if (brand) console.log('✅ Brand created:', brand.name)

  // Seed a product category
  const pcat = await prisma.productCategory.upsert({
    where: { slug: 'switches-sockets' },
    update: {},
    create: {
      id: 'seed-pcat-001',
      name: 'Switches & Sockets',
      nameBn: 'সুইচ ও সকেট',
      slug: 'switches-sockets',
      isActive: true,
    },
  }).catch(() => null)
  if (pcat) console.log('✅ Product category created:', pcat.name)

  // Seed some products
  const products = [
    { id: 'seed-prod-001', name: 'Schneider 16A Switch', slug: 'schneider-16a-switch', price: 250, sku: 'SCH-SW-16A' },
    { id: 'seed-prod-002', name: 'Havells Ceiling Fan', slug: 'havells-ceiling-fan', price: 4500, sku: 'HAV-FAN-01' },
    { id: 'seed-prod-003', name: 'Osram LED Bulb 12W', slug: 'osram-led-bulb-12w', price: 180, sku: 'OSR-LED-12' },
    { id: 'seed-prod-004', name: 'Philips Emergency Light', slug: 'philips-emergency-light', price: 1200, sku: 'PHL-EMG-01' },
    { id: 'seed-prod-005', name: 'BTRC Wire 100m Roll', slug: 'btrc-wire-100m-roll', price: 3200, sku: 'BTR-WR-100' },
    { id: 'seed-prod-006', name: 'Schneider MCB 32A', slug: 'schneider-mcb-32a', price: 850, sku: 'SCH-MCB-32' },
  ]

  for (const p of products) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        ...p,
        description: `High quality ${p.name} for home and office use.`,
        brandId: 'seed-brand-001',
        categoryId: 'seed-pcat-001',
        isActive: true,
        stock: 50,
      },
    }).catch(() => null)
  }
  console.log('✅ Products seeded:', products.length)

  // Seed services
  const services = [
    { id: 'seed-srv-001', name: 'Home Wiring Installation', slug: 'home-wiring-installation', basePrice: 5000, priceUnit: 'per project' },
    { id: 'seed-srv-002', name: 'Fan Installation & Repair', slug: 'fan-installation-repair', basePrice: 500, priceUnit: 'per unit' },
    { id: 'seed-srv-003', name: 'MCB & Fuse Replacement', slug: 'mcb-fuse-replacement', basePrice: 300, priceUnit: 'per unit' },
    { id: 'seed-srv-004', name: 'Emergency Power Backup Setup', slug: 'emergency-power-backup-setup', basePrice: 8000, priceUnit: 'per project' },
    { id: 'seed-srv-005', name: 'Light & Switch Repair', slug: 'light-switch-repair', basePrice: 200, priceUnit: 'per visit' },
    { id: 'seed-srv-006', name: 'AC Electrical Connection', slug: 'ac-electrical-connection', basePrice: 1500, priceUnit: 'per unit' },
  ]

  for (const s of services) {
    await prisma.service.upsert({
      where: { slug: s.slug },
      update: {},
      create: {
        ...s,
        description: `Professional ${s.name.toLowerCase()} service by certified electricians. Guaranteed workmanship with warranty.`,
        categoryId: 'seed-scat-001',
        isActive: true,
        isFeatured: true,
      },
    }).catch(() => null)
  }
  console.log('✅ Services seeded:', services.length)

  console.log('\n🎉 Done! Login with:')
  console.log('   Email: admin@epowerfix.com')
  console.log('   Password: admin123')
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e.message); process.exit(1) })
  .finally(() => prisma.$disconnect())
