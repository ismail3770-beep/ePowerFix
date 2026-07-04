export const DELIVERY_ZONES = [
  { area: 'Inside Dhaka', charge: 60, freeAbove: 2000 },
  { area: 'Outside Dhaka', charge: 120, freeAbove: 5000 },
] as const

export function getDeliveryCharge(area: string, orderTotal: number): number {
  const zone = area.toLowerCase().includes('dhaka')
    ? DELIVERY_ZONES[0]
    : DELIVERY_ZONES[1]
  return orderTotal >= zone.freeAbove ? 0 : zone.charge
}
