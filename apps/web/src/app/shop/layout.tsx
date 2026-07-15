import type { QueryClientProviderProps } from "@tanstack/react-query"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Shop Electrical Products",
  description: "Browse and buy quality electrical products — cables, breakers, LED lights, solar equipment, tools and more. Best prices in Bangladesh.",
}

export default function ShopLayout({
  children,
}: {
  children: QueryClientProviderProps["children"]
}) {
  return children
}