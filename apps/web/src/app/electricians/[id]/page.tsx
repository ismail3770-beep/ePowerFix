import type { Metadata } from 'next'
import ElectricianPublicProfile from '@/components/marketplace/ElectricianPublicProfile'

export const metadata: Metadata = {
  title: 'Verified Electrician Profile',
  description: 'View verified skills, service areas, availability, experience, and customer reviews for an ePowerFix electrician.',
}

export default async function ElectricianProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ElectricianPublicProfile providerId={id} />
}
