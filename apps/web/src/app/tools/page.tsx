"use client";

import { useState, useRef, useEffect } from "react";
import {
  ChevronRight,
  Home,
  Cable,
  Zap,
  Lightbulb,
  Battery,
  Gauge,
  Cog,
  Sun,
  Ruler,
  Calculator,
  X,
  CheckCircle,
  ArrowRight,
  Clock,
  TrendingUp,
  Info,
} from "lucide-react";
import { useUIStore } from "@/store";
import Header from "@/components/epf/Header";
import Footer from "@/components/epf/Footer";
import CartDrawer from "@/components/epf/CartDrawer";
import CheckoutDialog from "@/components/epf/CheckoutDialog";
import ProductDetailDialog from "@/components/epf/ProductDetailDialog";
import ServiceBookingDialog from "@/components/epf/ServiceBookingDialog";
import ProjectDetailDialog from "@/components/epf/ProjectDetailDialog";
import ChatWidget from "@/components/epf/ChatWidget";
import BackToTopButton from "@/components/epf/BackToTopButton";

/* ------------------------------------------------------------------ */
/*  Tool data                                                          */
/* ------------------------------------------------------------------ */
interface Tool {
  slug: string;
  name: string;
  icon: React.ElementType;
  uses: string;
  description: string;
  available: boolean;
}

const tools: Tool[] = [
  {
    slug: "cable-size",
    name: "Cable Size Calculator",
    icon: Cable,
    uses: "2,100",
    description:
      "Calculate the required cable cross-section based on power load, voltage, power factor, and derating factor.",
    available: true,
  },
  {
    slug: "voltage-drop",
    name: "Voltage Drop Calculator",
    icon: Zap,
    uses: "1,800",
    description:
      "Determine voltage drop across a cable run using current, length, resistance, and source voltage.",
    available: true,
  },
  {
    slug: "led-savings",
    name: "LED Savings Calculator",
    icon: Lightbulb,
    uses: "750",
    description:
      "Estimate monthly and yearly savings when switching from old bulbs to energy-efficient LED lighting.",
    available: true,
  },
  {
    slug: "battery-backup",
    name: "Battery Backup Calculator",
    icon: Battery,
    uses: "620",
    description:
      "Calculate expected backup runtime for a battery system based on voltage, capacity, load, and discharge depth.",
    available: true,
  },
  {
    slug: "power-factor",
    name: "Power Factor Calculator",
    icon: Gauge,
    uses: "540",
    description:
      "Analyze power factor correction and calculate reactive power compensation for industrial and commercial loads.",
    available: false,
  },
  {
    slug: "motor-hp",
    name: "Motor HP Calculator",
    icon: Cog,
    uses: "480",
    description:
      "Determine required motor horsepower based on torque, speed, and efficiency requirements.",
    available: false,
  },
  {
    slug: "solar-sizing",
    name: "Solar Sizing Calculator",
    icon: Sun,
    uses: "890",
    description:
      "Size your solar panel system based on daily energy consumption, peak sun hours, and system efficiency.",
    available: false,
  },
  {
    slug: "wire-gauge",
    name: "Wire Gauge Calculator",
    icon: Ruler,
    uses: "310",
    description:
      "Convert between AWG and metric wire gauges, and find the right gauge for your current rating.",
    available: false,
  },
];

/* ------------------------------------------------------------------ */
/*  Tool descriptions for the calculator header                        */
/* ------------------------------------------------------------------ */
const toolMeta: Record<
  string,
  { tagline: string; tip?: string }
> = {
  "cable-size": {
    tagline: "Find the right cable size for your electrical installation",
    tip: "Based on IEC standards with derating factor applied for ambient temperature and installation conditions.",
  },
  "voltage-drop": {
    tagline: "Ensure your cable run meets voltage drop regulations",
    tip: "NEC recommends voltage drop should not exceed 3% for branch circuits.",
  },
  "led-savings": {
    tagline: "See how much you can save by switching to LED",
    tip: "LED bulbs use up to 75% less energy and last 25 times longer than incandescent lighting.",
  },
  "battery-backup": {
    tagline: "Plan your backup power system accurately",
    tip: "Consider a DoD of 80% for lead-acid batteries and 90% for lithium-ion batteries.",
  },
};

/* ------------------------------------------------------------------ */
/*  Calculator form field definitions                                  */
/* ------------------------------------------------------------------ */
interface FormField {
  key: string;
  label: string;
  placeholder: string;
  step?: string;
  defaultValue?: string;
}

const toolFields: Record<string, FormField[]> = {
  "cable-size": [
    { key: "power", label: "Power (W)", placeholder: "e.g. 5000" },
    { key: "voltage", label: "Voltage (V)", placeholder: "e.g. 220" },
    { key: "pf", label: "Power Factor", placeholder: "0.85", step: "0.01", defaultValue: "0.85" },
    { key: "derating", label: "Derating Factor", placeholder: "0.8", step: "0.01", defaultValue: "0.8" },
  ],
  "voltage-drop": [
    { key: "current", label: "Current (A)", placeholder: "e.g. 32" },
    { key: "length", label: "Cable Length (m)", placeholder: "e.g. 50" },
    { key: "resistance", label: "Resistance (Ω/km)", placeholder: "7.41", step: "0.01", defaultValue: "7.41" },
    { key: "voltage", label: "Source Voltage (V)", placeholder: "220", defaultValue: "220" },
  ],
  "led-savings": [
    { key: "oldW", label: "Old Wattage (W)", placeholder: "e.g. 60" },
    { key: "newW", label: "New LED Wattage (W)", placeholder: "e.g. 12" },
    { key: "qty", label: "Quantity", placeholder: "e.g. 10", defaultValue: "1" },
    { key: "hrs", label: "Hours/Day", placeholder: "8", defaultValue: "8" },
    { key: "rate", label: "Rate (৳/kWh)", placeholder: "10", step: "0.01", defaultValue: "10" },
  ],
  "battery-backup": [
    { key: "voltage", label: "Battery Voltage (V)", placeholder: "12", defaultValue: "12" },
    { key: "ah", label: "Battery Capacity (Ah)", placeholder: "100", defaultValue: "100" },
    { key: "load", label: "Total Load (W)", placeholder: "100" },
    { key: "dod", label: "Depth of Discharge", placeholder: "0.8", step: "0.01", defaultValue: "0.8" },
    { key: "eff", label: "System Efficiency", placeholder: "0.85", step: "0.01", defaultValue: "0.85" },
  ],
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
interface FormValues {
  [key: string]: string;
}

export default function ToolsPage() {
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [calcResult, setCalcResult] = useState<string | null>(null);
  const [calcDetails, setCalcDetails] = useState<string[]>([]);
  const [calcWarnings, setCalcWarnings] = useState<string[]>([]);
  const [formValues, setFormValues] = useState<FormValues>({});

  const calcRef = useRef<HTMLDivElement>(null);

  /* global store bindings */
  const cartOpen = useUIStore((s) => s.cartOpen);
  const checkoutOpen = useUIStore((s) => s.checkoutOpen);
  const productDetailOpen = useUIStore((s) => s.productDetailOpen);
  const serviceBookingOpen = useUIStore((s) => s.serviceBookingOpen);
  const projectDetailOpen = useUIStore((s) => s.projectDetailOpen);

  /* scroll to calculator when a tool is selected */
  useEffect(() => {
    if (selectedTool && calcRef.current) {
      setTimeout(() => {
        calcRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, [selectedTool]);

  /* -------------------------------------------------------------- */
  /*  Helpers                                                        */
  /* -------------------------------------------------------------- */
  const selectTool = (slug: string) => {
    setSelectedTool(slug);
    setCalcResult(null);
    setCalcDetails([]);
    setCalcWarnings([]);
    setFormValues({});
  };

  const setField = (key: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  /* -------------------------------------------------------------- */
  /*  Calculation logic (mirrors ToolsSection.tsx)                  */
  /* -------------------------------------------------------------- */
  const calculate = () => {
    if (!selectedTool) return;
    const p = formValues;
    setCalcResult(null);
    setCalcDetails([]);
    setCalcWarnings([]);

    if (selectedTool === "cable-size") {
      const power = Number(p.power || 0);
      const voltage = Number(p.voltage || 0);
      const pf = Number(p.pf || 0.85);
      const derating = Number(p.derating || 0.8);
      if (!power || !voltage) return;
      const current = power / (voltage * pf);
      const derated = current / derating;
      const sizes = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95];
      const rec = sizes.find((s) => s >= derated * 0.5) || sizes[sizes.length - 1];
      setCalcResult(rec + " mm²");
      setCalcDetails([
        `Full Load Current: ${current.toFixed(1)} A`,
        `Derated Current: ${derated.toFixed(1)} A`,
        `Recommended Cable: ${rec} mm²`,
      ]);
    } else if (selectedTool === "voltage-drop") {
      const current = Number(p.current || 0);
      const length = Number(p.length || 0);
      const resistance = Number(p.resistance || 7.41);
      const voltage = Number(p.voltage || 220);
      if (!current || !length) return;
      const vd = (2 * current * length * resistance) / 1000;
      const pct = (vd / voltage) * 100;
      setCalcResult(`${vd.toFixed(2)} V (${pct.toFixed(2)}%)`);
      setCalcDetails([
        `Cable Run: ${length} m at ${current} A`,
        `Total Voltage Drop: ${vd.toFixed(2)} V`,
        `Percentage of Source: ${pct.toFixed(2)}%`,
      ]);
      if (pct > 3) {
        setCalcWarnings([
          "Voltage drop exceeds the recommended 3% limit. Use a larger cable size to reduce the drop.",
        ]);
      }
    } else if (selectedTool === "led-savings") {
      const oldW = Number(p.oldW || 0);
      const newW = Number(p.newW || 0);
      const qty = Number(p.qty || 1);
      const hrs = Number(p.hrs || 8);
      const rate = Number(p.rate || 10);
      const monthlyKwh = (oldW - newW) * qty * hrs * 30 / 1000;
      const savings = monthlyKwh * rate;
      const yearlySavings = savings * 12;
      const powerReduction = ((oldW - newW) / oldW * 100);
      setCalcResult(`৳${savings.toFixed(0)}/month`);
      setCalcDetails([
        `Energy Saved: ${monthlyKwh.toFixed(1)} kWh/month`,
        `Annual Savings: ৳${yearlySavings.toFixed(0)}/year`,
        `Power Reduction: ${powerReduction.toFixed(0)}% per bulb`,
        `Total Monthly Consumption: ${((oldW * qty * hrs * 30) / 1000).toFixed(1)} kWh (old) → ${((newW * qty * hrs * 30) / 1000).toFixed(1)} kWh (LED)`,
      ]);
    } else if (selectedTool === "battery-backup") {
      const voltage = Number(p.voltage || 12);
      const ah = Number(p.ah || 100);
      const load = Number(p.load || 100);
      const dod = Number(p.dod || 0.8);
      const eff = Number(p.eff || 0.85);
      if (!load) return;
      const totalWh = voltage * ah;
      const usableWh = totalWh * dod * eff;
      const backup = usableWh / load;
      setCalcResult(`${backup.toFixed(1)} hours`);
      setCalcDetails([
        `Total Battery Capacity: ${totalWh.toFixed(0)} Wh`,
        `Usable Capacity (with ${Number((dod * 100).toFixed(0))}% DoD, ${Number((eff * 100).toFixed(0))}% eff): ${usableWh.toFixed(0)} Wh`,
        `Runtime at ${load}W load: ${backup.toFixed(1)} hours (${Math.floor(backup * 60)} min)`,
      ]);
    }
  };

  /* -------------------------------------------------------------- */
  /*  Derived state                                                  */
  /* -------------------------------------------------------------- */
  const activeTool = tools.find((t) => t.slug === selectedTool);
  const hasCalculator =
    selectedTool &&
    (selectedTool === "cable-size" ||
      selectedTool === "voltage-drop" ||
      selectedTool === "led-savings" ||
      selectedTool === "battery-backup");

  const inputCls =
    "mt-1 h-11 w-full px-3 text-[14px] border border-[#E2E8F0] focus:outline-none focus:border-[#0EA5E9] rounded bg-white";
  const labelCls = "text-[14px] text-[#374151] font-medium";

  /* -------------------------------------------------------------- */
  /*  Render                                                         */
  /* -------------------------------------------------------------- */
  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Header />

      <main className="flex-1">
        <div className="mx-auto max-w-[1920px] px-4 sm:px-12 pt-5 pb-10">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-[14px] text-[#6B7280] mb-6">
            <a
              href="/"
              className="flex items-center gap-1 hover:text-[#111827] transition-colors"
            >
              <Home className="h-4 w-4" />
              Home
            </a>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-[#111827] font-medium">Tools</span>
          </nav>

          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-[20px] font-semibold text-[#111827]">
              Free Electrical Tools
            </h1>
            <p className="text-[14px] text-[#6B7280] mt-1.5 max-w-2xl">
              Professional-grade electrical calculators for engineers,
              electricians, and DIY enthusiasts. All tools are free to use
              — no sign up required.
            </p>
          </div>

          {/* Tool Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
            {tools.map((tool) => {
              const Icon = tool.icon;
              const isActive = selectedTool === tool.slug;
              return (
                <button
                  key={tool.slug}
                  onClick={() => selectTool(tool.slug)}
                  className={`relative flex flex-col items-center text-center p-5 sm:p-6 border rounded-lg transition-all duration-200 group cursor-pointer ${
                    isActive
                      ? "border-[#0EA5E9] bg-[#F0F9FF] ring-1 ring-[#0EA5E9]/30"
                      : "border-[#E2E8F0] bg-white hover:border-[#0EA5E9]/50 hover:shadow-sm"
                  }`}
                >
                  {/* Icon */}
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-full mb-3 transition-colors ${
                      isActive
                        ? "bg-[#0EA5E9] text-white"
                        : "bg-[#F1F5F9] text-[#6B7280] group-hover:bg-[#E0F2FE] group-hover:text-[#111827]"
                    }`}
                  >
                    <Icon className="h-7 w-7" />
                  </div>

                  {/* Name */}
                  <p className="text-[14px] font-semibold text-[#111827] mb-1 leading-tight">
                    {tool.name}
                  </p>

                  {/* Uses count */}
                  <div className="flex items-center gap-1 text-[12px] text-[#6B7280]">
                    <TrendingUp className="h-3 w-3" />
                    {tool.uses} uses
                  </div>

                  {/* Coming Soon badge */}
                  {!tool.available && (
                    <span className="absolute top-2.5 right-2.5 bg-[#F1F5F9] text-[#6B7280] text-[11px] font-medium px-2 py-0.5 rounded">
                      Coming Soon
                    </span>
                  )}

                  {/* Active indicator */}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0EA5E9] rounded-b-lg" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Calculator Area */}
          {selectedTool && (
            <div ref={calcRef} className="scroll-mt-4">
              <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden">
                {/* Calculator Header */}
                <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
                  <div className="flex items-center gap-3">
                    {activeTool && (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0EA5E9] text-white shrink-0">
                        <Calculator className="h-5 w-5" />
                      </div>
                    )}
                    <div>
                      <p className="text-[16px] font-semibold text-[#111827]">
                        {activeTool?.name}
                      </p>
                      <p className="text-[14px] text-[#6B7280]">
                        {toolMeta[selectedTool]?.tagline ||
                          "Free Calculator — No sign up required"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedTool(null);
                      setCalcResult(null);
                      setCalcDetails([]);
                      setCalcWarnings([]);
                      setFormValues({});
                    }}
                    className="h-8 w-8 flex items-center justify-center hover:bg-[#E2E8F0] rounded-full transition-colors shrink-0"
                    aria-label="Close calculator"
                  >
                    <X className="h-4 w-4 text-[#6B7280]" />
                  </button>
                </div>

                {/* Calculator Body */}
                <div className="p-5 sm:p-6">
                  {!hasCalculator ? (
                    /* Coming Soon state */
                    <div className="py-12 text-center">
                      <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-[#F1F5F9] text-[#6B7280] mb-4">
                        <Clock className="h-8 w-8" />
                      </div>
                      <p className="text-[16px] font-semibold text-[#111827] mb-1">
                        Coming Soon
                      </p>
                      <p className="text-[14px] text-[#6B7280] max-w-md mx-auto">
                        {activeTool?.description}
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Info tip */}
                      {toolMeta[selectedTool]?.tip && (
                        <div className="flex items-start gap-2 mb-5 p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded text-[13px] text-[#6B7280]">
                          <Info className="h-4 w-4 shrink-0 mt-0.5 text-[#6B7280]" />
                          <span>{toolMeta[selectedTool].tip}</span>
                        </div>
                      )}

                      {/* Form Fields */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-3xl">
                        {(toolFields[selectedTool] || []).map((field) => (
                          <div key={field.key}>
                            <label className={labelCls}>{field.label}</label>
                            <input
                              type="number"
                              step={field.step || "1"}
                              className={inputCls}
                              placeholder={field.placeholder}
                              value={formValues[field.key] || ""}
                              onChange={(e) =>
                                setField(field.key, e.target.value)
                              }
                            />
                          </div>
                        ))}
                      </div>

                      {/* Calculate Button */}
                      <div className="max-w-3xl mt-5">
                        <button
                          onClick={calculate}
                          className="w-full sm:w-auto h-11 px-8 text-[15px] font-semibold bg-[#0EA5E9] hover:bg-[#0284C7] text-white transition-colors rounded flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Calculator className="h-4 w-4" />
                          Calculate
                        </button>
                      </div>

                      {/* Result */}
                      {calcResult && (
                        <div className="mt-6 p-5 sm:p-6 bg-[#F0FFF4] border border-[#4D7300]/20 rounded-lg max-w-3xl">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="h-5 w-5 text-[#4D7300]" />
                            <span className="text-[13px] font-bold uppercase tracking-wider text-[#4D7300]">
                              Result
                            </span>
                          </div>
                          <p className="text-[24px] font-bold text-[#111827]">
                            {calcResult}
                          </p>
                          {calcDetails.length > 0 && (
                            <ul className="mt-3 space-y-1.5">
                              {calcDetails.map((d, i) => (
                                <li
                                  key={i}
                                  className="text-[14px] text-[#374151] flex items-start gap-2"
                                >
                                  <span className="text-[#4D7300] mt-0.5 shrink-0">
                                    •
                                  </span>
                                  {d}
                                </li>
                              ))}
                            </ul>
                          )}
                          {calcWarnings.map((w, i) => (
                            <div
                              key={i}
                              className="mt-3 flex items-start gap-2 p-3 bg-[#FEF2F2] border border-[#EF4444]/20 rounded"
                            >
                              <span className="text-[#EF4444] shrink-0 text-[14px]">
                                ⚠
                              </span>
                              <p className="text-[14px] text-[#EF4444] font-medium">
                                {w}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* CTA Banner */}
          <div className="mt-8 bg-[#111827] p-5 flex flex-col sm:flex-row items-center justify-between gap-3 rounded">
            <div>
              <p className="text-white font-semibold text-[16px]">
                Need a professional electrical consultation?
              </p>
              <p className="text-white/40 text-[14px] mt-0.5">
                Our licensed engineers can help with complex calculations,
                system design, and installations.
              </p>
            </div>
            <a
              href="/services"
              className="bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-semibold text-[15px] h-[40px] px-6 shrink-0 flex items-center gap-1.5 transition-colors rounded"
            >
              Browse Services <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </main>

      {/* Global overlays */}
      <CartDrawer />
      {cartOpen && <div className="fixed inset-0 z-40 bg-black/30" />}
      {checkoutOpen && <CheckoutDialog />}
      {productDetailOpen && <ProductDetailDialog />}
      {serviceBookingOpen && <ServiceBookingDialog />}
      {projectDetailOpen && <ProjectDetailDialog />}

      <ChatWidget />
      <BackToTopButton />
      <Footer />
    </div>
  );
}
