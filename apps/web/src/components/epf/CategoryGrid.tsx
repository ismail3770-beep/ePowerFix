"use client";
import {
  Cable,
  ShieldCheck,
  Lightbulb,
  Cpu,
  Wrench,
  HardHat,
  Plug,
  Sun,
  BookOpen,
  Smartphone,
} from "lucide-react";

const categories = [
  { icon: Cable, name: "Cables & Wires", color: "#3B82F6", count: "2.4k" },
  { icon: ShieldCheck, name: "Circuit Breakers", color: "#EF4444", count: "1.8k" },
  { icon: Lightbulb, name: "LED & Lighting", color: "#F59E0B", count: "3.1k" },
  { icon: Cpu, name: "Switches & Sockets", color: "#8B5CF6", count: "1.5k" },
  { icon: Wrench, name: "Testing Tools", color: "#10B981", count: "890" },
  { icon: HardHat, name: "Safety Equipment", color: "#F97316", count: "650" },
  { icon: Plug, name: "Motors & Drives", color: "#6366F1", count: "420" },
  { icon: Sun, name: "Solar Equipment", color: "#EAB308", count: "780" },
  { icon: BookOpen, name: "Digital Guides", color: "#06B6D4", count: "340" },
  { icon: Smartphone, name: "Smart Home", color: "#EC4899", count: "560" },
];

export default function CategoryGrid() {
  return (
    <section className="bg-white border-b border-[#E3E3E3]">
      <div className="mx-auto max-w-[1920px] px-4 sm:px-12 py-7">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-10 gap-y-5 gap-x-2">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <a
                key={cat.name}
                href="/shop"
                className="flex flex-col items-center gap-2 group"
              >
                <div
                  className="h-14 w-14 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg"
                  style={{ backgroundColor: cat.color + "12", color: cat.color }}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <span className="text-[14px] font-medium text-[#444444] text-center leading-tight group-hover:text-[#222222] transition-colors">
                  {cat.name}
                </span>
                <span className="text-[13px] text-[#AAAAAA]">{cat.count} products</span>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}