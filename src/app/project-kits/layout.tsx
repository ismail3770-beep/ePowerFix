import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Project Kits — Build Your Own Electrical Projects",
  description:
    "Browse and buy ready-to-build project kits — Arduino, ESP32, IoT, PLC, solar, and more. Each kit includes components, code, and step-by-step guides.",
};

export default function ProjectKitsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
