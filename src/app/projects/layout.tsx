import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Electrical Projects",
  description: "Explore electrical, solar, automation and IoT projects. Source code, live demos and documentation.",
}

export default function ProjectsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}