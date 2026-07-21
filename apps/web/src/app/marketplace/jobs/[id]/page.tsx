import type { Metadata } from 'next'
import MarketplaceJobDetails from '@/components/marketplace/MarketplaceJobDetails'

type PageProps = { params: Promise<{ id: string }> }

export const metadata: Metadata = {
  title: 'Electrician Job Tracking',
  description: 'Track your assigned electrician, review quotes, manage arrival OTP and confirm completion securely.',
}

export default async function MarketplaceJobPage({ params }: PageProps) {
  const { id } = await params
  return <MarketplaceJobDetails jobId={id} />
}
