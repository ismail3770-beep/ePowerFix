import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Best Deals & Offers",
  description: "Shop the best deals on electrical products. Flash sales, discounted items, and exclusive offers at ePowerFix.",
}

export default function DealsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}