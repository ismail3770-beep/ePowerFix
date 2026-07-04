import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Electrical Services",
  description: "Professional electrical services — home wiring, solar installation, industrial solutions, safety audits and more across Bangladesh.",
}

export default function ServicesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}