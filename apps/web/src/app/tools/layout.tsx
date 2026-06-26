import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Electrical Calculators & Tools",
  description: "Free electrical calculators — cable size, voltage drop, LED savings, battery backup and more. Professional tools for engineers.",
}

export default function ToolsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}