import { db } from '../src/lib/db'

async function main() {
  // Brand
  const brand = await db.brand.upsert({
    where: { slug: 'test-brand' },
    update: {},
    create: { name: 'VoltEdge', slug: 'test-brand', country: 'Bangladesh' },
  })
  // Category
  const cat = await db.productCategory.upsert({
    where: { slug: 'wiring' },
    update: {},
    create: { name: 'Wiring & Cables', nameBn: 'ওয়্যারিং', slug: 'wiring' },
  })

  const products = [
    { name: 'Premium Copper Wire 2.5mm (100m Roll)', slug: 'copper-wire-25mm', price: 1850, salePrice: 1450, isFeatured: true, isBestDeal: true, img: 'https://images.unsplash.com/photo-1620283085439-39620a1e21c4?w=600' },
    { name: 'Industrial PVC Conduit Pipe 20mm (3m)', slug: 'pvc-conduit-20mm', price: 320, salePrice: null, isFeatured: true, isBestDeal: false, img: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=600' },
    { name: 'Smart WiFi Light Switch 16A', slug: 'wifi-light-switch', price: 1290, salePrice: 990, isFeatured: false, isBestDeal: true, img: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=600' },
    { name: 'LED Panel Light 18W Cool White', slug: 'led-panel-18w', price: 650, salePrice: 480, isFeatured: true, isBestDeal: true, img: 'https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?w=600' },
    { name: 'MCB 32A Double Pole C-Curve', slug: 'mcb-32a-dp', price: 420, salePrice: null, isFeatured: false, isBestDeal: false, img: 'https://images.unsplash.com/photo-1518306727298-4c17e1bf6942?w=600' },
    { name: 'Digital Multimeter Auto-Ranging', slug: 'digital-multimeter', price: 2100, salePrice: 1690, isFeatured: true, isBestDeal: false, img: 'https://images.unsplash.com/photo-1517077304055-6e89abbf09b?w=600' },
  ]
  for (const p of products) {
    await db.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        name: p.name, slug: p.slug, description: 'High quality electrical product for professional and home use.',
        price: p.price, salePrice: p.salePrice, stock: 50, images: JSON.stringify([p.img]),
        isFeatured: p.isFeatured, isBestDeal: p.isBestDeal, isActive: true,
        brandId: brand.id, categoryId: cat.id,
      },
    })
  }

  // Project kits
  const kits = [
    { title: 'Home Automation Kit with ESP32', slug: 'home-automation-esp32', price: 3200, salePrice: 2690, category: 'IoT', difficulty: 'Intermediate', cover: 'https://images.unsplash.com/photo-1553406830-ef2513450d76?w=600' },
    { title: 'Solar Power Monitoring System', slug: 'solar-monitor-system', price: 4500, salePrice: null, category: 'Power', difficulty: 'Advanced', cover: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600' },
    { title: 'Smart Door Lock with RFID', slug: 'smart-door-lock-rfid', price: 2800, salePrice: 2200, category: 'Security', difficulty: 'Beginner', cover: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=600' },
  ]
  for (const k of kits) {
    await db.projectKit.upsert({
      where: { slug: k.slug },
      update: {},
      create: {
        title: k.title, slug: k.slug, description: 'Complete project kit with components, code, and step-by-step guide.',
        price: k.price, salePrice: k.salePrice, stock: 15, coverImage: k.cover, images: JSON.stringify([k.cover]),
        category: k.category, difficulty: k.difficulty, isActive: true,
      },
    })
  }

  // Service category
  const svcCat = await db.serviceCategory.upsert({
    where: { slug: 'installation' },
    update: {},
    create: { name: 'Installation', nameBn: 'ইনস্টলেশন', slug: 'installation' },
  })

  const services = [
    { name: 'Home Wiring & Rewiring', slug: 'home-wiring', price: 1500, unit: 'per_point', desc: 'Complete residential wiring installation and repair by certified electricians.', img: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600', featured: true },
    { name: 'Solar Panel Installation', slug: 'solar-install', price: 45000, unit: 'fixed', desc: 'Professional solar panel system design and installation for homes and businesses.', img: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600', featured: true },
    { name: 'Industrial Automation Setup', slug: 'industrial-automation', price: 25000, unit: 'fixed', desc: 'PLC programming, motor control panels, and factory automation solutions.', img: 'https://images.unsplash.com/photo-1565043666747-69f6646db940?w=600', featured: false },
    { name: 'Electrical Safety Inspection', slug: 'safety-inspection', price: 2000, unit: 'per_visit', desc: 'Comprehensive safety audit with detailed report and recommendations.', img: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=600', featured: false },
    { name: 'Generator & UPS Setup', slug: 'generator-ups', price: 8000, unit: 'fixed', desc: 'Backup power system installation, sizing, and maintenance services.', img: 'https://images.unsplash.com/photo-1605557202138-077e9b4f3b62?w=600', featured: true },
    { name: 'Smart Home Automation', slug: 'smart-home', price: 18000, unit: 'fixed', desc: 'IoT-based lighting, security, and appliance control with mobile app integration.', img: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=600', featured: false },
  ]
  for (const s of services) {
    await db.service.upsert({
      where: { slug: s.slug },
      update: {},
      create: {
        name: s.name, slug: s.slug, description: s.desc,
        basePrice: s.price, priceUnit: s.unit, images: JSON.stringify([s.img]),
        isFeatured: s.featured, isActive: true, categoryId: svcCat.id,
      },
    })
  }

  // Engineering Projects (portfolio)
  const projects = [
    { title: '5kW Solar Rooftop — Dhanmondi Residence', slug: 'solar-rooftop-dhanmondi', desc: 'Grid-tied solar installation with net metering for a private residence.', cover: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600', status: 'COMPLETED', category: 'solar' },
    { title: 'Factory Automation — Gazipur Plant', slug: 'factory-automation-gazipur', desc: 'PLC-based production line automation with SCADA monitoring.', cover: 'https://images.unsplash.com/photo-1565043666747-69f6646db940?w=600', status: 'COMPLETED', category: 'automation' },
    { title: 'Smart Office IoT Dashboard', slug: 'smart-office-iot', desc: 'Real-time energy monitoring and appliance control across 3 office floors.', cover: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=600', status: 'COMPLETED', category: 'iot' },
    { title: 'Hospital Backup Power System', slug: 'hospital-backup-power', desc: 'Redundant UPS + generator failover for critical medical equipment.', cover: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=600', status: 'COMPLETED', category: 'electrical' },
  ]
  for (const p of projects) {
    await db.project.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        title: p.title, slug: p.slug, description: p.desc, coverImage: p.cover,
        images: JSON.stringify([p.cover]), status: p.status, isSellable: false,
      },
    })
  }

  console.log('Seeded:', products.length, 'products,', kits.length, 'kits,', services.length, 'services,', projects.length, 'projects')
}

main().catch(console.error).finally(() => process.exit(0))
