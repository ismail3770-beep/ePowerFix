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
        name: p.name,
        slug: p.slug,
        description: 'High quality electrical product for professional and home use.',
        price: p.price,
        salePrice: p.salePrice,
        stock: 50,
        images: JSON.stringify([p.img]),
        isFeatured: p.isFeatured,
        isBestDeal: p.isBestDeal,
        isActive: true,
        brandId: brand.id,
        categoryId: cat.id,
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
        title: k.title,
        slug: k.slug,
        description: 'Complete project kit with components, code, and step-by-step guide.',
        price: k.price,
        salePrice: k.salePrice,
        stock: 15,
        coverImage: k.cover,
        images: JSON.stringify([k.cover]),
        category: k.category,
        difficulty: k.difficulty,
        isActive: true,
      },
    })
  }

  console.log('Seeded:', products.length, 'products,', kits.length, 'kits')
}

main().catch(console.error).finally(() => process.exit(0))
