import type { Metadata } from 'next'
import MarketplaceHome from '@/components/marketplace/MarketplaceHome'

export const metadata: Metadata = {
  title: 'Verified Electrician Service in Bangladesh',
  description: 'Request a verified electrician, approve transparent quotes, pay securely, and track every step with ePowerFix.',
}

export default function ElectricianPage() {
  return <MarketplaceHome />
}
