import { db } from '../src/index'
import { hash } from 'bcryptjs'

async function main() {
  console.log('🌱 Seeding ePowerFix database (PostgreSQL)...\n')

  // ============================================================
  // USERS
  // ============================================================
  console.log('👤 Creating users...')

  // IMPORTANT: Change these passwords in production!
  // Admin credentials: admin@epowerfix.com / pRwJHlpru9crRiFG
  // Customer credentials: customer@test.com / customer123
  const adminPassword = await hash('pRwJHlpru9crRiFG', 12)
  const customerPassword = await hash('customer123', 12)

  const admin = await db.user.upsert({
    where: { email: 'admin@epowerfix.com' },
    update: {
      name: 'Admin',
      nameBn: 'অ্যাডমিন',
      phone: '01700000001',
      password: adminPassword,
      role: 'ADMIN',
      isActive: true,
    },
    create: {
      name: 'Admin',
      nameBn: 'অ্যাডমিন',
      email: 'admin@epowerfix.com',
      phone: '01700000001',
      password: adminPassword,
      role: 'ADMIN',
      isActive: true,
    },
  })

  const customer = await db.user.upsert({
    where: { email: 'customer@test.com' },
    update: {
      name: 'Test Customer',
      nameBn: 'টেস্ট কাস্টমার',
      phone: '01800000001',
      password: customerPassword,
      role: 'CUSTOMER',
      isActive: true,
    },
    create: {
      name: 'Test Customer',
      nameBn: 'টেস্ট কাস্টমার',
      email: 'customer@test.com',
      phone: '01800000001',
      password: customerPassword,
      role: 'CUSTOMER',
      isActive: true,
    },
  })

  console.log(`  ✅ Created 2 users`)

  // ============================================================
  // USER ADDRESSES
  // ============================================================
  console.log('📍 Creating user addresses...')

  // Clean up dependent records first (orders reference addresses)
  const addressIds = (
    await db.userAddress.findMany({
      where: { userId: { in: [admin.id, customer.id] } },
      select: { id: true },
    })
  ).map(a => a.id)

  if (addressIds.length > 0) {
    const ordersToClean = await db.order.findMany({
      where: { addressId: { in: addressIds } },
      select: { id: true, orderNumber: true },
    })
    for (const o of ordersToClean) {
      await db.orderItem.deleteMany({ where: { orderId: o.id } })
      await db.payment.deleteMany({ where: { orderId: o.id } })
      await db.orderHistory.deleteMany({ where: { orderId: o.id } })
      await db.order.deleteMany({ where: { id: o.id } })
    }
  }

  await db.userAddress.deleteMany({ where: { userId: { in: [admin.id, customer.id] } } })

  const adminAddress = await db.userAddress.create({
    data: {
      userId: admin.id,
      label: 'Office',
      fullName: 'Admin',
      phone: '01700000001',
      address: 'House 12, Road 5, Gulshan 1',
      city: 'Dhaka',
      area: 'Gulshan',
      postalCode: '1212',
      isDefault: true,
    },
  })

  const customerAddress = await db.userAddress.create({
    data: {
      userId: customer.id,
      label: 'Home',
      fullName: 'Test Customer',
      phone: '01800000001',
      address: 'Flat A2, House 45, Road 11, Block C',
      city: 'Dhaka',
      area: 'Mirpur',
      postalCode: '1216',
      isDefault: true,
    },
  })

  console.log(`  ✅ Created 2 user addresses`)

  // ============================================================
  // BRANDS
  // ============================================================
  console.log('🏷️ Creating brands...')

  const brandData = [
    { name: 'Schneider Electric', nameBn: 'শ্নাইডার ইলেকট্রিক', slug: 'schneider-electric', country: 'France', website: 'https://www.se.com' },
    { name: 'Siemens', nameBn: 'সিমেন্স', slug: 'siemens', country: 'Germany', website: 'https://www.siemens.com' },
    { name: 'Legrand', nameBn: 'লেগ্র্যান্ড', slug: 'legrand', country: 'France', website: 'https://www.legrand.com' },
  ]

  const [schneider, siemens, legrand] = await Promise.all(
    brandData.map(b => db.brand.upsert({
      where: { slug: b.slug },
      update: { name: b.name, nameBn: b.nameBn, country: b.country, website: b.website, isActive: true },
      create: { ...b, isActive: true },
    }))
  )

  console.log(`  ✅ Created 3 brands`)

  // ============================================================
  // PRODUCT CATEGORIES
  // ============================================================
  console.log('📦 Creating product categories...')

  const prodCatData = [
    { name: 'Wires & Cables', nameBn: 'তার ও ক্যাবল', slug: 'wires-cables', sortOrder: 1 },
    { name: 'Switches & Sockets', nameBn: 'সুইচ ও সকেট', slug: 'switches-sockets', sortOrder: 2 },
    { name: 'Circuit Breakers', nameBn: 'সার্কিট ব্রেকার', slug: 'circuit-breakers', sortOrder: 3 },
    { name: 'LED Lights', nameBn: 'LED লাইট', slug: 'led-lights', sortOrder: 4 },
    { name: 'Solar Equipment', nameBn: 'সোলার সরঞ্জাম', slug: 'solar-equipment', sortOrder: 5 },
  ]

  const [catWires, catSwitches, catBreakers, catLED, catSolar] = await Promise.all(
    prodCatData.map(c => db.productCategory.upsert({
      where: { slug: c.slug },
      update: { name: c.name, nameBn: c.nameBn, sortOrder: c.sortOrder, isActive: true },
      create: { ...c, isActive: true },
    }))
  )

  console.log(`  ✅ Created 5 product categories`)

  // ============================================================
  // SERVICE CATEGORIES
  // ============================================================
  console.log('📦 Creating service categories...')

  const svcCatData = [
    { name: 'Home Wiring', nameBn: 'হোম ওয়্যারিং', slug: 'home-wiring', icon: 'Home', sortOrder: 1 },
    { name: 'Solar System', nameBn: 'সোলার সিস্টেম', slug: 'solar-system', icon: 'Sun', sortOrder: 2 },
    { name: 'Industrial', nameBn: 'ইন্ডাস্ট্রিয়াল', slug: 'industrial', icon: 'Factory', sortOrder: 3 },
    { name: 'Safety & Protection', nameBn: 'সেফটি ও প্রটেকশন', slug: 'safety-protection', icon: 'Shield', sortOrder: 4 },
    { name: 'Home Automation', nameBn: 'হোম অটোমেশন', slug: 'home-automation', icon: 'Wifi', sortOrder: 5 },
  ]

  const [catHomeWiring, catSolarSvc, catIndustrial, catSafety, catAutomation] = await Promise.all(
    svcCatData.map(c => db.serviceCategory.upsert({
      where: { slug: c.slug },
      update: { name: c.name, nameBn: c.nameBn, icon: c.icon, sortOrder: c.sortOrder, isActive: true },
      create: { ...c, isActive: true },
    }))
  )

  console.log(`  ✅ Created 5 service categories`)

  // ============================================================
  // PRODUCTS (10 realistic BD electrical products)
  // ============================================================
  console.log('🛒 Creating products...')

  const beximcoWire = await db.product.upsert({
    where: { sku: 'EPF-WR-001' },
    update: {
      name: 'Beximco 3/22 Copper Wire (90m Coil)',
      nameBn: 'বেক্সিমকো ৩/২২ কপার তার (৯০মি কয়েল)',
      description: 'Premium quality Beximco 3/22 copper wire for house wiring. 90 meters per coil. BSTI certified with excellent conductivity and heat resistance.',
      shortDesc: 'BSTI certified 3/22 copper wire, 90m coil',
      price: 3200,
      salePrice: 2900,
      costPrice: 2500,
      stock: 150,
      minStock: 20,
      images: [],
      specs: { brand: 'Beximco', type: 'Copper', size: '3/22', length: '90m', certification: 'BSTI', voltage: '1100V' },
      isFeatured: true,
      isActive: true,
      brandId: schneider.id,
      categoryId: catWires.id,
      tags: ['wire', 'copper', 'house-wiring'],
      rating: 4.5,
      reviewCount: 89,
    },
    create: {
      name: 'Beximco 3/22 Copper Wire (90m Coil)',
      nameBn: 'বেক্সিমকো ৩/২২ কপার তার (৯০মি কয়েল)',
      slug: 'beximco-3-22-copper-wire',
      description: 'Premium quality Beximco 3/22 copper wire for house wiring. 90 meters per coil. BSTI certified with excellent conductivity and heat resistance.',
      shortDesc: 'BSTI certified 3/22 copper wire, 90m coil',
      sku: 'EPF-WR-001',
      price: 3200,
      salePrice: 2900,
      costPrice: 2500,
      stock: 150,
      minStock: 20,
      images: [],
      specs: { brand: 'Beximco', type: 'Copper', size: '3/22', length: '90m', certification: 'BSTI', voltage: '1100V' },
      isFeatured: true,
      isActive: true,
      brandId: schneider.id,
      categoryId: catWires.id,
      tags: ['wire', 'copper', 'house-wiring'],
      rating: 4.5,
      reviewCount: 89,
    },
  })

  await db.product.upsert({
    where: { sku: 'EPF-WR-002' },
    update: {
      name: 'BRB 7/20 Copper Wire (90m Coil)',
      nameBn: 'বিআরবি ৭/২০ কপার তার (৯০মি কয়েল)',
      description: 'BRB 7/20 heavy-duty copper wire for main line wiring. 90 meters per coil. Ideal for high-load circuits in Bangladesh homes.',
      shortDesc: 'Heavy-duty 7/20 copper wire for main lines',
      price: 7800,
      salePrice: 7200,
      costPrice: 6500,
      stock: 80,
      minStock: 10,
      images: [],
      specs: { brand: 'BRB', type: 'Copper', size: '7/20', length: '90m', certification: 'BSTI', voltage: '1100V' },
      isFeatured: false,
      isActive: true,
      brandId: siemens.id,
      categoryId: catWires.id,
      tags: ['wire', 'copper', 'heavy-duty'],
      rating: 4.7,
      reviewCount: 56,
    },
    create: {
      name: 'BRB 7/20 Copper Wire (90m Coil)',
      nameBn: 'বিআরবি ৭/২০ কপার তার (৯০মি কয়েল)',
      slug: 'brb-7-20-copper-wire',
      description: 'BRB 7/20 heavy-duty copper wire for main line wiring. 90 meters per coil. Ideal for high-load circuits in Bangladesh homes.',
      shortDesc: 'Heavy-duty 7/20 copper wire for main lines',
      sku: 'EPF-WR-002',
      price: 7800,
      salePrice: 7200,
      costPrice: 6500,
      stock: 80,
      minStock: 10,
      images: [],
      specs: { brand: 'BRB', type: 'Copper', size: '7/20', length: '90m', certification: 'BSTI', voltage: '1100V' },
      isFeatured: false,
      isActive: true,
      brandId: siemens.id,
      categoryId: catWires.id,
      tags: ['wire', 'copper', 'heavy-duty'],
      rating: 4.7,
      reviewCount: 56,
    },
  })

  await db.product.upsert({
    where: { sku: 'EPF-SW-001' },
    update: {
      name: 'Legrand 16A Socket with Child Safety',
      nameBn: 'লেগ্র্যান্ড ১৬A সকেট (চাইল্ড সেফটি সহ)',
      description: 'Premium Legrand 16 Ampere socket with child safety shutter. Compatible with all standard plugs in Bangladesh. Polycarbonate body.',
      shortDesc: '16A modular socket with child lock',
      price: 380,
      salePrice: 340,
      costPrice: 250,
      stock: 300,
      minStock: 50,
      images: [],
      specs: { brand: 'Legrand', type: '16A Socket', material: 'Polycarbonate', rating: '16A', safety: 'Child lock shutter' },
      isFeatured: true,
      isActive: true,
      brandId: legrand.id,
      categoryId: catSwitches.id,
      tags: ['socket', 'modular', 'legrand'],
      rating: 4.6,
      reviewCount: 134,
    },
    create: {
      name: 'Legrand 16A Socket with Child Safety',
      nameBn: 'লেগ্র্যান্ড ১৬A সকেট (চাইল্ড সেফটি সহ)',
      slug: 'legrand-16a-socket',
      description: 'Premium Legrand 16 Ampere socket with child safety shutter. Compatible with all standard plugs in Bangladesh. Polycarbonate body.',
      shortDesc: '16A modular socket with child lock',
      sku: 'EPF-SW-001',
      price: 380,
      salePrice: 340,
      costPrice: 250,
      stock: 300,
      minStock: 50,
      images: [],
      specs: { brand: 'Legrand', type: '16A Socket', material: 'Polycarbonate', rating: '16A', safety: 'Child lock shutter' },
      isFeatured: true,
      isActive: true,
      brandId: legrand.id,
      categoryId: catSwitches.id,
      tags: ['socket', 'modular', 'legrand'],
      rating: 4.6,
      reviewCount: 134,
    },
  })

  const schneiderMCB = await db.product.upsert({
    where: { sku: 'EPF-CB-001' },
    update: {
      name: 'Schneider 32A MCB (Single Pole C-Curve)',
      nameBn: 'শ্নাইডার ৩২A MCB (সিঙ্গেল পোল সি-কার্ভ)',
      description: 'Schneider Electric 32A Miniature Circuit Breaker for protection against overcurrent and short circuit. C-Curve for motor and inductive loads.',
      shortDesc: '32A MCB single pole, C-curve 10kA',
      price: 520,
      salePrice: null,
      costPrice: 380,
      stock: 200,
      minStock: 30,
      images: [],
      specs: { brand: 'Schneider', type: 'MCB', rating: '32A', poles: 'SP', breakingCapacity: '10kA', curve: 'C-Curve' },
      isFeatured: true,
      isActive: true,
      brandId: schneider.id,
      categoryId: catBreakers.id,
      tags: ['mcb', 'circuit-breaker', 'schneider'],
      rating: 4.8,
      reviewCount: 78,
    },
    create: {
      name: 'Schneider 32A MCB (Single Pole C-Curve)',
      nameBn: 'শ্নাইডার ৩২A MCB (সিঙ্গেল পোল সি-কার্ভ)',
      slug: 'schneider-32a-mcb',
      description: 'Schneider Electric 32A Miniature Circuit Breaker for protection against overcurrent and short circuit. C-Curve for motor and inductive loads.',
      shortDesc: '32A MCB single pole, C-curve 10kA',
      sku: 'EPF-CB-001',
      price: 520,
      salePrice: null,
      costPrice: 380,
      stock: 200,
      minStock: 30,
      images: [],
      specs: { brand: 'Schneider', type: 'MCB', rating: '32A', poles: 'SP', breakingCapacity: '10kA', curve: 'C-Curve' },
      isFeatured: true,
      isActive: true,
      brandId: schneider.id,
      categoryId: catBreakers.id,
      tags: ['mcb', 'circuit-breaker', 'schneider'],
      rating: 4.8,
      reviewCount: 78,
    },
  })

  await db.product.upsert({
    where: { sku: 'EPF-CB-002' },
    update: {
      name: 'Siemens 63A MCCB (3-Phase)',
      nameBn: 'সিমেন্স ৬৩A MCCB (৩-ফেজ)',
      description: 'Siemens 63A Molded Case Circuit Breaker for 3-phase industrial power distribution panels. 50kA breaking capacity. Adjustable thermal trip.',
      shortDesc: 'Industrial 63A MCCB 3-phase 50kA',
      price: 4500,
      salePrice: 4100,
      costPrice: 3500,
      stock: 25,
      minStock: 5,
      images: [],
      specs: { brand: 'Siemens', type: 'MCCB', rating: '63A', poles: '3-Phase', breakingCapacity: '50kA' },
      isFeatured: false,
      isActive: true,
      brandId: siemens.id,
      categoryId: catBreakers.id,
      tags: ['mccb', 'industrial', '3-phase'],
      rating: 4.9,
      reviewCount: 12,
    },
    create: {
      name: 'Siemens 63A MCCB (3-Phase)',
      nameBn: 'সিমেন্স ৬৩A MCCB (৩-ফেজ)',
      slug: 'siemens-63a-mccb',
      description: 'Siemens 63A Molded Case Circuit Breaker for 3-phase industrial power distribution panels. 50kA breaking capacity. Adjustable thermal trip.',
      shortDesc: 'Industrial 63A MCCB 3-phase 50kA',
      sku: 'EPF-CB-002',
      price: 4500,
      salePrice: 4100,
      costPrice: 3500,
      stock: 25,
      minStock: 5,
      images: [],
      specs: { brand: 'Siemens', type: 'MCCB', rating: '63A', poles: '3-Phase', breakingCapacity: '50kA' },
      isFeatured: false,
      isActive: true,
      brandId: siemens.id,
      categoryId: catBreakers.id,
      tags: ['mccb', 'industrial', '3-phase'],
      rating: 4.9,
      reviewCount: 12,
    },
  })

  const philipsLED = await db.product.upsert({
    where: { sku: 'EPF-LED-001' },
    update: {
      name: 'Philips 12W LED Bulb (B22 Cool Day)',
      nameBn: 'ফিলিপস ১২W LED বাল্ব (B22 কুল ডে)',
      description: 'Philips 12W LED bulb with cool daylight (6500K). B22 base. Replaces 60W incandescent bulb. 1200 lumens. 5-year warranty.',
      shortDesc: '12W LED bulb, B22 base, cool daylight',
      price: 160,
      salePrice: 130,
      costPrice: 90,
      stock: 800,
      minStock: 100,
      images: [],
      specs: { brand: 'Philips', type: 'LED Bulb', wattage: '12W', base: 'B22', color: 'Cool Day 6500K', lumens: '1200lm' },
      isFeatured: true,
      isActive: true,
      brandId: siemens.id,
      categoryId: catLED.id,
      tags: ['led', 'bulb', 'philips', 'energy-saving'],
      rating: 4.5,
      reviewCount: 520,
    },
    create: {
      name: 'Philips 12W LED Bulb (B22 Cool Day)',
      nameBn: 'ফিলিপস ১২W LED বাল্ব (B22 কুল ডে)',
      slug: 'philips-12w-led-bulb',
      description: 'Philips 12W LED bulb with cool daylight (6500K). B22 base. Replaces 60W incandescent bulb. 1200 lumens. 5-year warranty.',
      shortDesc: '12W LED bulb, B22 base, cool daylight',
      sku: 'EPF-LED-001',
      price: 160,
      salePrice: 130,
      costPrice: 90,
      stock: 800,
      minStock: 100,
      images: [],
      specs: { brand: 'Philips', type: 'LED Bulb', wattage: '12W', base: 'B22', color: 'Cool Day 6500K', lumens: '1200lm' },
      isFeatured: true,
      isActive: true,
      brandId: siemens.id,
      categoryId: catLED.id,
      tags: ['led', 'bulb', 'philips', 'energy-saving'],
      rating: 4.5,
      reviewCount: 520,
    },
  })

  await db.product.upsert({
    where: { sku: 'EPF-LED-002' },
    update: {
      name: 'NVC 36W LED Panel Light (600x600mm)',
      nameBn: 'NVC ৩৬W LED প্যানেল লাইট (৬০০x৬০০mm)',
      description: 'NVC 36W square LED panel light for false ceiling installation. Slim design with uniform light distribution. 3600 lumens, 6500K cool white.',
      shortDesc: '36W square LED panel for false ceiling',
      price: 850,
      salePrice: 750,
      costPrice: 550,
      stock: 120,
      minStock: 20,
      images: [],
      specs: { brand: 'NVC', type: 'Panel Light', wattage: '36W', size: '600x600mm', color: 'Cool White 6500K', lumens: '3600lm' },
      isFeatured: false,
      isActive: true,
      brandId: legrand.id,
      categoryId: catLED.id,
      tags: ['led', 'panel-light', 'ceiling'],
      rating: 4.6,
      reviewCount: 65,
    },
    create: {
      name: 'NVC 36W LED Panel Light (600x600mm)',
      nameBn: 'NVC ৩৬W LED প্যানেল লাইট (৬০০x৬০০mm)',
      slug: 'nvc-36w-led-panel-light',
      description: 'NVC 36W square LED panel light for false ceiling installation. Slim design with uniform light distribution. 3600 lumens, 6500K cool white.',
      shortDesc: '36W square LED panel for false ceiling',
      sku: 'EPF-LED-002',
      price: 850,
      salePrice: 750,
      costPrice: 550,
      stock: 120,
      minStock: 20,
      images: [],
      specs: { brand: 'NVC', type: 'Panel Light', wattage: '36W', size: '600x600mm', color: 'Cool White 6500K', lumens: '3600lm' },
      isFeatured: false,
      isActive: true,
      brandId: legrand.id,
      categoryId: catLED.id,
      tags: ['led', 'panel-light', 'ceiling'],
      rating: 4.6,
      reviewCount: 65,
    },
  })

  await db.product.upsert({
    where: { sku: 'EPF-SOL-001' },
    update: {
      name: 'Jinko 550W Mono-Crystalline Solar Panel',
      nameBn: 'জিংকো ৫৫০W মোনো-ক্রিস্টালাইন সোলার প্যানেল',
      description: 'Jinko Solar 550W mono-crystalline solar panel with 21.3% cell efficiency. 25-year linear power warranty. Ideal for Bangladesh climate conditions.',
      shortDesc: '550W mono panel, 21.3% efficiency',
      price: 38000,
      salePrice: 35000,
      costPrice: 30000,
      stock: 30,
      minStock: 5,
      images: [],
      specs: { brand: 'Jinko Solar', type: 'Mono-crystalline', wattage: '550W', efficiency: '21.3%', warranty: '25 years linear', cells: '72 cells' },
      isFeatured: true,
      isActive: true,
      brandId: schneider.id,
      categoryId: catSolar.id,
      tags: ['solar', 'panel', 'mono-crystalline', 'jinko'],
      rating: 4.9,
      reviewCount: 18,
    },
    create: {
      name: 'Jinko 550W Mono-Crystalline Solar Panel',
      nameBn: 'জিংকো ৫৫০W মোনো-ক্রিস্টালাইন সোলার প্যানেল',
      slug: 'jinko-550w-mono-solar-panel',
      description: 'Jinko Solar 550W mono-crystalline solar panel with 21.3% cell efficiency. 25-year linear power warranty. Ideal for Bangladesh climate conditions.',
      shortDesc: '550W mono panel, 21.3% efficiency',
      sku: 'EPF-SOL-001',
      price: 38000,
      salePrice: 35000,
      costPrice: 30000,
      stock: 30,
      minStock: 5,
      images: [],
      specs: { brand: 'Jinko Solar', type: 'Mono-crystalline', wattage: '550W', efficiency: '21.3%', warranty: '25 years linear', cells: '72 cells' },
      isFeatured: true,
      isActive: true,
      brandId: schneider.id,
      categoryId: catSolar.id,
      tags: ['solar', 'panel', 'mono-crystalline', 'jinko'],
      rating: 4.9,
      reviewCount: 18,
    },
  })

  await db.product.upsert({
    where: { sku: 'EPF-CB-003' },
    update: {
      name: 'Legrand 40A RCCB (Double Pole 30mA)',
      nameBn: 'লেগ্র্যান্ড ৪০A RCCB (ডাবল পোল ৩০mA)',
      description: 'Legrand 40A Residual Current Circuit Breaker for earth leakage protection. 30mA sensitivity. Double pole. Essential for bathroom and kitchen circuits.',
      shortDesc: '40A RCCB double pole, earth leakage protection',
      price: 1850,
      salePrice: 1650,
      costPrice: 1300,
      stock: 60,
      minStock: 10,
      images: [],
      specs: { brand: 'Legrand', type: 'RCCB', rating: '40A', poles: 'DP', sensitivity: '30mA', voltage: '240V AC' },
      isFeatured: false,
      isActive: true,
      brandId: legrand.id,
      categoryId: catBreakers.id,
      tags: ['rccb', 'safety', 'earth-leakage', 'legrand'],
      rating: 4.7,
      reviewCount: 42,
    },
    create: {
      name: 'Legrand 40A RCCB (Double Pole 30mA)',
      nameBn: 'লেগ্র্যান্ড ৪০A RCCB (ডাবল পোল ৩০mA)',
      slug: 'legrand-40a-rccb',
      description: 'Legrand 40A Residual Current Circuit Breaker for earth leakage protection. 30mA sensitivity. Double pole. Essential for bathroom and kitchen circuits.',
      shortDesc: '40A RCCB double pole, earth leakage protection',
      sku: 'EPF-CB-003',
      price: 1850,
      salePrice: 1650,
      costPrice: 1300,
      stock: 60,
      minStock: 10,
      images: [],
      specs: { brand: 'Legrand', type: 'RCCB', rating: '40A', poles: 'DP', sensitivity: '30mA', voltage: '240V AC' },
      isFeatured: false,
      isActive: true,
      brandId: legrand.id,
      categoryId: catBreakers.id,
      tags: ['rccb', 'safety', 'earth-leakage', 'legrand'],
      rating: 4.7,
      reviewCount: 42,
    },
  })

  await db.product.upsert({
    where: { sku: 'EPF-LED-003' },
    update: {
      name: 'Epic 18W LED Tube Light (4ft Cool White)',
      nameBn: 'এপিক ১৮W LED টিউব লাইট (৪ফুট কুল হোয়াইট)',
      description: 'Energy-efficient Epic 18W LED tube light. Replaces 36W fluorescent tube. 1200mm length, cool white 6500K. 1800 lumens. BIS certified.',
      shortDesc: '18W LED tube replaces 36W fluorescent',
      price: 280,
      salePrice: 240,
      costPrice: 170,
      stock: 500,
      minStock: 80,
      images: [],
      specs: { brand: 'Epic', type: 'LED Tube', wattage: '18W', length: '1200mm (4ft)', color: 'Cool White 6500K', lumens: '1800lm' },
      isFeatured: true,
      isActive: true,
      brandId: schneider.id,
      categoryId: catLED.id,
      tags: ['led', 'tube-light', 'energy-saving'],
      rating: 4.3,
      reviewCount: 356,
    },
    create: {
      name: 'Epic 18W LED Tube Light (4ft Cool White)',
      nameBn: 'এপিক ১৮W LED টিউব লাইট (৪ফুট কুল হোয়াইট)',
      slug: 'epic-18w-led-tube-light',
      description: 'Energy-efficient Epic 18W LED tube light. Replaces 36W fluorescent tube. 1200mm length, cool white 6500K. 1800 lumens. BIS certified.',
      shortDesc: '18W LED tube replaces 36W fluorescent',
      sku: 'EPF-LED-003',
      price: 280,
      salePrice: 240,
      costPrice: 170,
      stock: 500,
      minStock: 80,
      images: [],
      specs: { brand: 'Epic', type: 'LED Tube', wattage: '18W', length: '1200mm (4ft)', color: 'Cool White 6500K', lumens: '1800lm' },
      isFeatured: true,
      isActive: true,
      brandId: schneider.id,
      categoryId: catLED.id,
      tags: ['led', 'tube-light', 'energy-saving'],
      rating: 4.3,
      reviewCount: 356,
    },
  })

  console.log(`  ✅ Created 10 products`)

  // ============================================================
  // PRODUCT VARIANTS
  // ============================================================
  console.log('🏷️ Creating product variants...')

  // Beximco Wire variants (single core different sizes)
  await db.product.update({ where: { id: beximcoWire.id }, data: { hasVariant: true } })
  await db.productVariant.createMany({
    data: [
      { productId: beximcoWire.id, name: '1.5mm Single Core', sku: 'EPF-WR-001-1.5', price: 2200, salePrice: 1950, stock: 200, attributes: { size: '1.5mm', type: 'single_core' } },
      { productId: beximcoWire.id, name: '2.5mm Single Core', sku: 'EPF-WR-001-2.5', price: 2900, salePrice: 2650, stock: 180, attributes: { size: '2.5mm', type: 'single_core' } },
      { productId: beximcoWire.id, name: '4mm Single Core', sku: 'EPF-WR-001-4', price: 4500, salePrice: 4100, stock: 120, attributes: { size: '4mm', type: 'single_core' } },
    ],
    skipDuplicates: true,
  })

  // Schneider MCB variants (different amp ratings)
  await db.product.update({ where: { id: schneiderMCB.id }, data: { hasVariant: true } })
  await db.productVariant.createMany({
    data: [
      { productId: schneiderMCB.id, name: '10A Single Pole', sku: 'EPF-CB-001-10A', price: 320, salePrice: 280, stock: 250, attributes: { rating: '10A', poles: 'SP', curve: 'C-Curve' } },
      { productId: schneiderMCB.id, name: '16A Single Pole', sku: 'EPF-CB-001-16A', price: 380, salePrice: 340, stock: 200, attributes: { rating: '16A', poles: 'SP', curve: 'C-Curve' } },
      { productId: schneiderMCB.id, name: '32A Single Pole', sku: 'EPF-CB-001-32A', price: 520, salePrice: 470, stock: 200, attributes: { rating: '32A', poles: 'SP', curve: 'C-Curve' } },
      { productId: schneiderMCB.id, name: '63A Single Pole', sku: 'EPF-CB-001-63A', price: 780, salePrice: 700, stock: 100, attributes: { rating: '63A', poles: 'SP', curve: 'C-Curve' } },
    ],
    skipDuplicates: true,
  })

  // Philips LED Bulb variants (different wattages)
  await db.product.update({ where: { id: philipsLED.id }, data: { hasVariant: true } })
  await db.productVariant.createMany({
    data: [
      { productId: philipsLED.id, name: '9W LED Bulb', sku: 'EPF-LED-001-9W', price: 120, salePrice: 90, stock: 500, attributes: { wattage: '9W', lumens: '900lm' } },
      { productId: philipsLED.id, name: '12W LED Bulb', sku: 'EPF-LED-001-12W', price: 160, salePrice: 130, stock: 800, attributes: { wattage: '12W', lumens: '1200lm' } },
      { productId: philipsLED.id, name: '18W LED Bulb', sku: 'EPF-LED-001-18W', price: 220, salePrice: 180, stock: 400, attributes: { wattage: '18W', lumens: '1800lm' } },
    ],
    skipDuplicates: true,
  })

  console.log(`  ✅ Created 10 product variants`)

  // ============================================================
  // SERVICES
  // ============================================================
  console.log('🔧 Creating services...')

  const homeWiringServices = [
    {
      name: 'Complete Home Wiring',
      nameBn: 'বাসা পুরো ওয়্যারিং',
      slug: 'complete-home-wiring',
      description: 'Full home electrical wiring service including main panel, distribution boards, and all room wiring. Our certified electricians ensure safety and compliance with Bangladesh Electrical Code.',
      basePrice: 15000,
      priceUnit: 'fixed',
      isFeatured: true,
      features: { items: ['ISI certified wires', 'Main DB box included', 'MCB protection on all circuits', 'Earth wire included', '1 year service warranty'] },
    },
    {
      name: 'Switch Board Installation',
      nameBn: 'সুইচ বোর্ড ইন্সটলেশন',
      slug: 'switch-board-installation',
      description: 'Professional switch board installation for homes and offices. Modular and conventional switch board fitting.',
      basePrice: 500,
      priceUnit: 'per_point',
      features: { items: ['Modular & conventional boards', 'All major brands available', 'Neat concealed wiring'] },
    },
    {
      name: 'Fan & Light Installation',
      nameBn: 'ফ্যান ও লাইট ইন্সটলেশন',
      slug: 'fan-light-installation',
      description: 'Installation of ceiling fans, exhaust fans, LED lights, chandeliers, and all types of lighting fixtures.',
      basePrice: 300,
      priceUnit: 'per_point',
      features: { items: ['Ceiling fan fitting', 'LED light installation', 'Chandelier mounting', 'Dimmer switch setup'] },
    },
  ]

  const solarServices = [
    {
      name: 'Solar Panel Installation',
      nameBn: 'সোলার প্যানেল ইন্সটলেশন',
      slug: 'solar-panel-installation',
      description: 'Complete solar panel system installation for homes and businesses. Mono-crystalline panels from top brands. Net metering support.',
      basePrice: 85,
      priceUnit: 'per_watt',
      isFeatured: true,
      features: { items: ['Mono-crystalline panels', 'Net metering support', '5-25 year warranty', 'Site survey included'] },
    },
    {
      name: 'Solar Inverter Setup',
      nameBn: 'সোলার ইনভার্টার সেটআপ',
      slug: 'solar-inverter-setup',
      description: 'Professional solar inverter installation and configuration. On-grid, off-grid, and hybrid systems supported.',
      basePrice: 25000,
      priceUnit: 'fixed',
      features: { items: ['On-grid / Off-grid / Hybrid', 'MPPT technology', 'Remote monitoring'] },
    },
  ]

  const industrialServices = [
    {
      name: 'Industrial Wiring',
      nameBn: 'ইন্ডাস্ট্রিয়াল ওয়্যারিং',
      slug: 'industrial-wiring',
      description: 'Complete industrial electrical wiring for factories, warehouses, and commercial buildings.',
      basePrice: 50000,
      priceUnit: 'fixed',
      isFeatured: true,
      features: { items: ['Power distribution design', 'Heavy-duty cabling', 'Control panel wiring', 'Safety compliance'] },
    },
    {
      name: 'Generator Installation',
      nameBn: 'জেনারেটর ইন্সটলেশন',
      slug: 'generator-installation',
      description: 'Professional generator installation with automatic transfer switch (ATS) for uninterrupted power.',
      basePrice: 15000,
      priceUnit: 'fixed',
      features: { items: ['ATS installation', 'Fuel system setup', 'Load testing'] },
    },
  ]

  const safetyServices = [
    {
      name: 'ELCB/RCCB Installation',
      nameBn: 'ELCB/RCCB ইন্সটলেশন',
      slug: 'elcb-rccb-installation',
      description: 'Earth Leakage Circuit Breaker installation for protection against electric shock. 30mA sensitivity.',
      basePrice: 2500,
      priceUnit: 'fixed',
      isFeatured: true,
      features: { items: ['30mA sensitivity', 'Dual pole protection', 'Test button included'] },
    },
    {
      name: 'Earthing System Installation',
      nameBn: 'আর্থিং সিস্টেম ইন্সটলেশন',
      slug: 'earthing-system',
      description: 'Complete earthing/grounding system for residential and commercial buildings. Copper electrode with earth pit.',
      basePrice: 5000,
      priceUnit: 'fixed',
      features: { items: ['Copper electrode', 'Earth pit construction', 'Resistance testing'] },
    },
  ]

  const automationServices = [
    {
      name: 'Smart Home Setup',
      nameBn: 'স্মার্ট হোম সেটআপ',
      slug: 'smart-home-setup',
      description: 'IoT-based smart home automation for lighting, fans, AC, and security. Voice control support via Google Assistant and Alexa.',
      basePrice: 20000,
      priceUnit: 'fixed',
      isFeatured: true,
      features: { items: ['Voice control', 'Mobile app control', 'Energy monitoring', 'Scheduled automation'] },
    },
  ]

  const allServices = [
    ...homeWiringServices.map(s => ({ ...s, categoryId: catHomeWiring.id, isActive: true })),
    ...solarServices.map(s => ({ ...s, categoryId: catSolarSvc.id, isActive: true })),
    ...industrialServices.map(s => ({ ...s, categoryId: catIndustrial.id, isActive: true })),
    ...safetyServices.map(s => ({ ...s, categoryId: catSafety.id, isActive: true })),
    ...automationServices.map(s => ({ ...s, categoryId: catAutomation.id, isActive: true })),
  ]

  for (const service of allServices) {
    await db.service.upsert({
      where: { slug: service.slug },
      update: {
        name: service.name,
        nameBn: service.nameBn,
        description: service.description,
        basePrice: service.basePrice,
        priceUnit: service.priceUnit,
        isFeatured: service.isFeatured,
        features: service.features,
        categoryId: service.categoryId,
        isActive: true,
      },
      create: service,
    })
  }

  console.log(`  ✅ Created ${allServices.length} services`)

  // ============================================================
  // COUPON
  // ============================================================
  console.log('🎟️ Creating coupons...')

  const now = new Date()
  const oneYearFromNow = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)

  await db.coupon.upsert({
    where: { code: 'WELCOME10' },
    update: {
      name: 'Welcome Discount',
      nameBn: 'ওয়েলকাম ডিসকাউন্ট',
      description: '10% off on first order for new customers',
      type: 'PERCENTAGE',
      value: 10,
      minOrder: 500,
      maxDiscount: 200,
      usageLimit: 1000,
      startDate: now,
      endDate: oneYearFromNow,
      isActive: true,
    },
    create: {
      code: 'WELCOME10',
      name: 'Welcome Discount',
      nameBn: 'ওয়েলকাম ডিসকাউন্ট',
      description: '10% off on first order for new customers',
      type: 'PERCENTAGE',
      value: 10,
      minOrder: 500,
      maxDiscount: 200,
      usageLimit: 1000,
      startDate: now,
      endDate: oneYearFromNow,
      isActive: true,
    },
  })

  console.log(`  ✅ Created 1 coupon`)

  // ============================================================
  // BLOG POST
  // ============================================================
  console.log('📝 Creating blog posts...')

  await db.blogPost.upsert({
    where: { slug: 'complete-guide-home-wiring-bangladesh' },
    update: {
      title: 'Complete Guide to Home Wiring in Bangladesh',
      titleBn: 'বাংলাদেশে হোম ওয়্যারিংয়ের সম্পূর্ণ গাইড',
      excerpt: 'Learn everything about home wiring — from planning and materials to safety standards.',
      content: '# Complete Guide to Home Wiring in Bangladesh\n\nHome wiring is one of the most critical aspects of building or renovating a house. This guide covers planning, materials, safety standards, and common mistakes to avoid.\n\n## Planning Your Wiring\n\n- Load calculation\n- Circuit design\n- Point placement\n- DB box location\n\n## Materials\n\n- 3.5mm² copper wire for main circuits\n- PVC conduit pipes\n- MCBs and switch boards\n\n## Safety Standards\n\nAlways follow BSTI guidelines.',
      author: 'ePowerFix Team',
      tags: ['home wiring', 'bangladesh', 'guide'],
      isPublished: true,
    },
    create: {
      title: 'Complete Guide to Home Wiring in Bangladesh',
      titleBn: 'বাংলাদেশে হোম ওয়্যারিংয়ের সম্পূর্ণ গাইড',
      slug: 'complete-guide-home-wiring-bangladesh',
      excerpt: 'Learn everything about home wiring — from planning and materials to safety standards.',
      content: '# Complete Guide to Home Wiring in Bangladesh\n\nHome wiring is one of the most critical aspects of building or renovating a house. This guide covers planning, materials, safety standards, and common mistakes to avoid.\n\n## Planning Your Wiring\n\n- Load calculation\n- Circuit design\n- Point placement\n- DB box location\n\n## Materials\n\n- 3.5mm² copper wire for main circuits\n- PVC conduit pipes\n- MCBs and switch boards\n\n## Safety Standards\n\nAlways follow BSTI guidelines.',
      author: 'ePowerFix Team',
      tags: ['home wiring', 'bangladesh', 'guide'],
      isPublished: true,
    },
  })

  console.log(`  ✅ Created 1 blog post`)

  // ============================================================
  // NEWSLETTER
  // ============================================================
  console.log('📧 Creating newsletter subscribers...')

  await db.newsletter.createMany({
    data: [
      { email: 'test1@example.com' },
      { email: 'test2@example.com' },
    ],
    skipDuplicates: true,
  })

  console.log(`  ✅ Created 2 newsletter subscribers`)

  // ============================================================
  // PROJECT
  // ============================================================
  console.log('🚀 Creating projects...')

  await db.project.upsert({
    where: { slug: 'smart-home-automation-system' },
    update: {
      title: 'Smart Home Automation System',
      titleBn: 'স্মার্ট হোম অটোমেশন সিস্টেম',
      description: 'IoT-based smart home automation controlling lighting, fans, AC, and security from mobile app. Voice control via Google Assistant and Alexa.',
      client: 'Dhaka Residential Complex',
      location: 'Dhaka, Bangladesh',
      status: 'COMPLETED',
    },
    create: {
      title: 'Smart Home Automation System',
      titleBn: 'স্মার্ট হোম অটোমেশন সিস্টেম',
      slug: 'smart-home-automation-system',
      description: 'IoT-based smart home automation controlling lighting, fans, AC, and security from mobile app. Voice control via Google Assistant and Alexa.',
      images: [],
      client: 'Dhaka Residential Complex',
      location: 'Dhaka, Bangladesh',
      status: 'COMPLETED',
    },
  })

  console.log(`  ✅ Created 1 project`)

  // ============================================================
  // ORDER (sample order using customer address)
  // ============================================================
  console.log('📦 Creating sample order...')

  const orderProduct = await db.product.findFirst({ where: { sku: 'EPF-LED-001' } })
  if (orderProduct) {
    // Clean up existing seeded order + related records before re-creating
    await db.payment.deleteMany({ where: { order: { orderNumber: 'EPF-SEED-0001' } } })
    await db.orderHistory.deleteMany({ where: { order: { orderNumber: 'EPF-SEED-0001' } } })
    await db.orderItem.deleteMany({ where: { order: { orderNumber: 'EPF-SEED-0001' } } })
    await db.order.deleteMany({ where: { orderNumber: 'EPF-SEED-0001' } })

    const orderTotal = Number(orderProduct.salePrice || orderProduct.price) * 2 + 60
    await db.order.create({
      data: {
        orderNumber: 'EPF-SEED-0001',
        userId: customer.id,
        addressId: customerAddress.id,
        status: 'PENDING',
        subtotal: Number(orderProduct.salePrice || orderProduct.price) * 2,
        deliveryCharge: 60,
        discount: 0,
        total: orderTotal,
        paymentMethod: 'COD',
        paymentStatus: 'PENDING',
        items: {
          create: [
            {
              productId: orderProduct.id,
              productName: orderProduct.name,
              productImage: orderProduct.images?.[0] || null,
              price: Number(orderProduct.salePrice || orderProduct.price),
              quantity: 2,
              total: Number(orderProduct.salePrice || orderProduct.price) * 2,
            },
          ],
        },
        payments: {
          create: [{
            amount: orderTotal,
            method: 'COD',
            status: 'PENDING',
            paymentData: { source: 'seed', method: 'COD' } as any,
          }],
        },
        histories: {
          create: [{
            userId: customer.id,
            status: 'PENDING',
            note: 'Order placed',
          }],
        },
      },
    })
    console.log(`  ✅ Created 1 sample order (with payment + history)`)
  }

  console.log('\n✨ Seed completed successfully!')
}

// ============================================================
// SITE SETTINGS (auto-created on first GET, but seed ensures defaults)
// ============================================================

main()
  .then(async () => {
    // Ensure site settings exist
    await db.siteSettings.upsert({
      where: { id: 'default' },
      update: {},
      create: { id: 'default' },
    })
    console.log('✅ Seed complete!')
    await db.$disconnect()
  })
  .catch(async (e) => {
    console.error('Seed failed:', e)
    await db.$disconnect()
    process.exit(1)
  })
