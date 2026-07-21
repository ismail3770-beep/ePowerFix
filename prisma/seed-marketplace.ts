import type { PrismaClient } from '@prisma/client'

const SKILLS = [
  { slug: 'residential-wiring', name: 'Residential Wiring', nameBn: 'বাসাবাড়ির ওয়্যারিং', description: 'New wiring, rewiring, switches, sockets, and distribution boards.' },
  { slug: 'electrical-repair', name: 'Electrical Repair', nameBn: 'ইলেকট্রিক্যাল মেরামত', description: 'Fault finding and repair for everyday electrical problems.' },
  { slug: 'circuit-breaker', name: 'Circuit Breaker & DB', nameBn: 'সার্কিট ব্রেকার ও ডিবি', description: 'MCB, RCCB, breaker, and distribution-board services.' },
  { slug: 'lighting-installation', name: 'Lighting Installation', nameBn: 'লাইটিং ইনস্টলেশন', description: 'Indoor, outdoor, decorative, and emergency lighting.' },
  { slug: 'fan-installation', name: 'Fan Installation & Repair', nameBn: 'ফ্যান ইনস্টলেশন ও মেরামত', description: 'Ceiling, exhaust, and wall fan installation and repair.' },
  { slug: 'ips-ups-inverter', name: 'IPS, UPS & Inverter', nameBn: 'আইপিএস, ইউপিএস ও ইনভার্টার', description: 'Backup-power installation, inspection, and troubleshooting.' },
  { slug: 'industrial-electrical', name: 'Industrial Electrical', nameBn: 'ইন্ডাস্ট্রিয়াল ইলেকট্রিক্যাল', description: 'Commercial and industrial power, panels, motors, and controls.' },
  { slug: 'emergency-electrical', name: 'Emergency Electrical', nameBn: 'জরুরি ইলেকট্রিক্যাল সেবা', description: 'Urgent fault isolation and electrical safety response.' },
] as const

const PILOT_ZONES = [
  { slug: 'dhaka-north', name: 'Dhaka North', nameBn: 'ঢাকা উত্তর' },
  { slug: 'dhaka-south', name: 'Dhaka South', nameBn: 'ঢাকা দক্ষিণ' },
  { slug: 'uttara', name: 'Uttara', nameBn: 'উত্তরা' },
  { slug: 'mirpur', name: 'Mirpur', nameBn: 'মিরপুর' },
  { slug: 'dhanmondi', name: 'Dhanmondi', nameBn: 'ধানমন্ডি' },
] as const

export async function seedMarketplaceCatalog(db: PrismaClient): Promise<void> {
  await Promise.all(SKILLS.map((skill, sortOrder) => db.skill.upsert({
    where: { slug: skill.slug },
    update: { ...skill, sortOrder, isActive: true },
    create: { ...skill, sortOrder, isActive: true },
  })))

  const division = await db.geoDivision.upsert({
    where: { code: 'DHAKA' },
    update: { name: 'Dhaka', nameBn: 'ঢাকা', isActive: true },
    create: { code: 'DHAKA', name: 'Dhaka', nameBn: 'ঢাকা', isActive: true },
  })
  const district = await db.geoDistrict.upsert({
    where: { code: 'DHAKA' },
    update: { divisionId: division.id, name: 'Dhaka', nameBn: 'ঢাকা', isActive: true },
    create: { divisionId: division.id, code: 'DHAKA', name: 'Dhaka', nameBn: 'ঢাকা', isActive: true },
  })
  await Promise.all(PILOT_ZONES.map((zone) => db.serviceZone.upsert({
    where: { slug: zone.slug },
    update: { districtId: district.id, ...zone, isActive: true },
    create: { districtId: district.id, ...zone, isActive: true },
  })))
}
