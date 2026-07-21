import type { Metadata } from 'next'
import ElectricianDashboard from '@/components/marketplace/ElectricianDashboard'

export const metadata: Metadata = {
  title: 'Electrician Profile & Work Dashboard',
  description: 'Create and manage your verified ePowerFix electrician profile, service coverage, availability, jobs, documents, and earnings.',
  robots: { index: false, follow: false },
}

export default function ElectricianDashboardPage() {
  return <ElectricianDashboard />
}
