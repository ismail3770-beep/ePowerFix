"use client";
import { useState, useMemo } from "react";
import Header from "@/components/epf/Header";
import Footer from "@/components/epf/Footer";
import ChatWidget from "@/components/epf/ChatWidget";
import BackToTopButton from "@/components/epf/BackToTopButton";
import {
  Zap,
  Sun,
  Shield,
  Plug,
  Lightbulb,
  Wrench,
  ChevronRight,
  Home,
  Check,
  ArrowRight,
  ArrowLeft,
  Download,
  User,
  Ruler,
  MapPin,
  Phone,
  Mail,
  Calendar,
  FileText,
  Clock,
  AlertCircle,
  Minus,
  Plus,
  Star,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ServiceType {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  icon: React.ReactNode;
}

type PropertyType = "Residential" | "Commercial" | "Industrial";
type QualityGrade = "standard" | "premium" | "premium_plus";
type Urgency = "standard" | "express" | "emergency";

interface FormData {
  serviceId: string;
  areaSize: number;
  propertyType: PropertyType;
  qualityGrade: QualityGrade;
  urgency: Urgency;
  additionalRequirements: string;
  includeLabor: boolean;
  needMaintenance: boolean;
  needPermit: boolean;
  fullName: string;
  phone: string;
  email: string;
  address: string;
  preferredDate: string;
  notes: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const SERVICES: ServiceType[] = [
  {
    id: "electrical-wiring",
    name: "Electrical Wiring",
    description: "Complete home & office wiring",
    basePrice: 3500,
    icon: <Zap className="h-6 w-6" />,
  },
  {
    id: "solar-installation",
    name: "Solar Installation",
    description: "Panel setup with inverter & battery",
    basePrice: 15000,
    icon: <Sun className="h-6 w-6" />,
  },
  {
    id: "safety-equipment",
    name: "Safety Equipment",
    description: "PPE, helmets & safety gear",
    basePrice: 500,
    icon: <Shield className="h-6 w-6" />,
  },
  {
    id: "generator-ups",
    name: "Generator & UPS",
    description: "Backup power solutions",
    basePrice: 8000,
    icon: <Plug className="h-6 w-6" />,
  },
  {
    id: "smart-home",
    name: "Smart Home",
    description: "IoT automation & smart switches",
    basePrice: 5000,
    icon: <Lightbulb className="h-6 w-6" />,
  },
  {
    id: "appliance-repair",
    name: "Appliance Repair",
    description: "AC, fridge & appliance repair",
    basePrice: 800,
    icon: <Wrench className="h-6 w-6" />,
  },
];

const QUALITY_OPTIONS: {
  id: QualityGrade;
  label: string;
  desc: string;
  multiplier: number;
  recommended?: boolean;
}[] = [
  { id: "standard", label: "Standard", desc: "Basic materials", multiplier: 1 },
  {
    id: "premium",
    label: "Premium",
    desc: "Branded materials",
    multiplier: 1.5,
    recommended: true,
  },
  {
    id: "premium_plus",
    label: "Premium Plus",
    desc: "Imported materials",
    multiplier: 2.2,
  },
];

const URGENCY_OPTIONS: {
  id: Urgency;
  label: string;
  sub: string;
  surcharge: number;
}[] = [
  { id: "standard", label: "Standard", sub: "3-5 days", surcharge: 0 },
  { id: "express", label: "Express", sub: "1-2 days", surcharge: 0.2 },
  { id: "emergency", label: "Emergency", sub: "Same day", surcharge: 0.5 },
];

const STEPS = [
  { label: "Service Type", icon: <Zap className="h-4 w-4" /> },
  { label: "Project Details", icon: <Ruler className="h-4 w-4" /> },
  { label: "Your Information", icon: <User className="h-4 w-4" /> },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatBDT(n: number) {
  return "৳" + Math.round(n).toLocaleString("en-BD");
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function CostEstimatorPage() {
  const [step, setStep] = useState(1);
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);

  const [form, setForm] = useState<FormData>({
    serviceId: "",
    areaSize: 0,
    propertyType: "Residential",
    qualityGrade: "premium",
    urgency: "standard",
    additionalRequirements: "",
    includeLabor: true,
    needMaintenance: false,
    needPermit: false,
    fullName: "",
    phone: "",
    email: "",
    address: "",
    preferredDate: "",
    notes: "",
  });

  const set = <K extends keyof FormData>(key: K, val: FormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  /* ---------- cost calculation ---------- */

  const cost = useMemo(() => {
    const svc = SERVICES.find((s) => s.id === form.serviceId);
    if (!svc)
      return {
        base: 0,
        sizeMul: 1,
        qualityMul: 1,
        urgencySur: 0,
        additionalCost: 0,
        subtotal: 0,
        tax: 0,
        total: 0,
        low: 0,
        high: 0,
        breakdown: [] as { label: string; value: string }[],
      };

    const base = svc.basePrice;

    // size multiplier: per 500 sq ft adds 20%, max 3x
    const sizeMultiplier = form.areaSize > 0 ? 1 + Math.min((form.areaSize / 500) * 0.2, 2) : 1;

    const quality = QUALITY_OPTIONS.find((q) => q.id === form.qualityGrade)!;
    const qualityMul = quality.multiplier;

    const urgencyOpt = URGENCY_OPTIONS.find((u) => u.id === form.urgency)!;
    const urgencySur = urgencyOpt.surcharge;

    let additionalCost = 0;
    if (form.includeLabor) additionalCost += base * 0.3;
    if (form.needMaintenance) additionalCost += base * 0.15;
    if (form.needPermit) additionalCost += 2000;

    const subtotal = base * sizeMultiplier * qualityMul * (1 + urgencySur) + additionalCost;
    const tax = subtotal * 0.05;
    const total = subtotal + tax;

    const low = total * 0.85;
    const high = total * 1.15;

    const breakdown: { label: string; value: string }[] = [
      { label: "Service base price", value: formatBDT(base) },
      { label: `Size multiplier (×${sizeMultiplier.toFixed(2)})`, value: `×${sizeMultiplier.toFixed(2)}` },
      { label: `Quality grade (${quality.label})`, value: `×${qualityMul}` },
      { label: `Urgency surcharge (${urgencyOpt.label})`, value: urgencySur > 0 ? `+${(urgencySur * 100).toFixed(0)}%` : "None" },
      ...(form.includeLabor ? [{ label: "Labor cost", value: formatBDT(base * 0.3) }] : []),
      ...(form.needMaintenance ? [{ label: "Maintenance plan", value: formatBDT(base * 0.15) }] : []),
      ...(form.needPermit ? [{ label: "Permit assistance", value: formatBDT(2000) }] : []),
    ];

    return {
      base,
      sizeMul: sizeMultiplier,
      qualityMul,
      urgencySur,
      additionalCost,
      subtotal,
      tax,
      total,
      low,
      high,
      breakdown,
    };
  }, [form]);

  /* ---------- validation ---------- */

  const step1Valid = form.serviceId !== "";
  const step2Valid = form.areaSize > 0;
  const step3Valid =
    form.fullName.trim() !== "" &&
    form.phone.trim() !== "" &&
    form.email.trim() !== "" &&
    form.address.trim() !== "";

  const canProceed = step === 1 ? step1Valid : step === 2 ? step2Valid : step3Valid;

  const handleNext = () => {
    if (!canProceed) return;
    if (step < 3) setStep(step + 1);
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleStartOver = () => {
    setStep(1);
    setForm({
      serviceId: "",
      areaSize: 0,
      propertyType: "Residential",
      qualityGrade: "premium",
      urgency: "standard",
      additionalRequirements: "",
      includeLabor: true,
      needMaintenance: false,
      needPermit: false,
      fullName: "",
      phone: "",
      email: "",
      address: "",
      preferredDate: "",
      notes: "",
    });
  };

  /* ---------- PDF download ---------- */

  const handleDownloadPDF = () => {
    const svc = SERVICES.find((s) => s.id === form.serviceId);
    const quality = QUALITY_OPTIONS.find((q) => q.id === form.qualityGrade);
    const urgency = URGENCY_OPTIONS.find((u) => u.id === form.urgency);
    const refNumber = `EPF-CE-${Date.now().toString(36).toUpperCase()}`;

    const printContent = `
      <html><head><title>Cost Estimate - ePowerFix</title>
      <style>
        body{font-family:Arial,sans-serif;padding:40px;max-width:700px;margin:0 auto;color:#111827}
        h1{font-size:22px;margin-bottom:4px}
        .brand{font-size:26px;font-weight:800;color:#111827;margin-bottom:2px}
        .brand span{color:#0EA5E9}
        .ref{color:#9CA3AF;font-size:12px;margin-bottom:20px}
        table{width:100%;border-collapse:collapse;margin:16px 0}
        th,td{border:1px solid #E5E7EB;padding:8px 12px;text-align:left;font-size:13px}
        th{background:#F9FAFB;font-weight:600}
        .total-row{font-weight:bold;font-size:15px;color:#0EA5E9}
        .section-title{font-size:16px;font-weight:700;margin:24px 0 8px;color:#374151}
        .disclaimer{margin-top:30px;padding:12px;background:#FFF7ED;border:1px solid #FED7AA;font-size:12px;color:#92400E;border-radius:6px}
      </style></head><body>
      <div class="brand">e<span>Power</span>Fix</div>
      <p style="color:#6B7280;font-size:11px;margin:0 0 12px">ELECTRICAL MARKETPLACE — COST ESTIMATE</p>
      <p class="ref">Reference: ${refNumber}</p>
      <h1>Project Cost Estimate</h1>

      <div class="section-title">Service</div>
      <table><tbody>
        <tr><td>Service Type</td><td>${svc?.name ?? "—"}</td></tr>
        <tr><td>Area Size</td><td>${form.areaSize} sq ft</td></tr>
        <tr><td>Property Type</td><td>${form.propertyType}</td></tr>
        <tr><td>Quality Grade</td><td>${quality?.label ?? "—"}</td></tr>
        <tr><td>Urgency</td><td>${urgency?.label} (${urgency?.sub})</td></tr>
      </tbody></table>

      <div class="section-title">Cost Breakdown</div>
      <table><thead><tr><th>Item</th><th style="text-align:right">Value</th></tr></thead><tbody>
        ${cost.breakdown
          .map((b) => `<tr><td>${b.label}</td><td style="text-align:right">${b.value}</td></tr>`)
          .join("")}
        <tr><td>Subtotal</td><td style="text-align:right">${formatBDT(cost.subtotal)}</td></tr>
        <tr><td>Tax (5%)</td><td style="text-align:right">${formatBDT(cost.tax)}</td></tr>
        <tr class="total-row"><td>Total Estimated Cost</td><td style="text-align:right">${formatBDT(cost.total)}</td></tr>
      </tbody></table>

      ${form.fullName ? `<div class="section-title">Contact Information</div>
      <table><tbody>
        <tr><td>Name</td><td>${form.fullName}</td></tr>
        <tr><td>Phone</td><td>${form.phone}</td></tr>
        <tr><td>Email</td><td>${form.email}</td></tr>
        <tr><td>Address</td><td>${form.address}</td></tr>
      </tbody></table>` : ""}

      <div class="disclaimer">⚠ This is an estimate only. Actual costs may vary based on site inspection. Generated on ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}.</div>
      <p style="margin-top:20px;font-size:11px;color:#9CA3AF;text-align:center">ePowerFix — epowerfix.com</p>
      </body></html>`;

    const w = window.open("", "_blank");
    if (w) {
      w.document.write(printContent);
      w.document.close();
      w.print();
    }
  };

  /* ---------- render ---------- */

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="flex-1">
        {/* Page Header */}
        <div className="bg-white border-b border-slate-200">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-12 py-6 sm:py-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1">
              Cost Estimator
            </h1>
            <p className="text-sm sm:text-base text-slate-500">
              Get an instant estimate for your electrical project in 3 easy steps
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-[1400px] px-4 sm:px-12 py-6 sm:py-8">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            {/* ===================== LEFT: Form Area ===================== */}
            <div className="w-full lg:w-[60%]">
              {/* Step Indicator */}
              <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 sm:p-6 mb-6">
                <div className="flex items-center justify-between">
                  {STEPS.map((s, i) => {
                    const stepNum = i + 1;
                    const isActive = step === stepNum;
                    const isCompleted = step > stepNum;
                    const isFuture = step < stepNum;

                    return (
                      <div key={stepNum} className="flex items-center flex-1 last:flex-none">
                        <div className="flex flex-col items-center">
                          <div
                            className={`
                              h-10 w-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300
                              ${
                                isCompleted
                                  ? "bg-epf-500 text-white"
                                  : isActive
                                  ? "bg-epf-500 text-white"
                                  : "border-2 border-slate-300 text-slate-400 bg-white"
                              }
                            `}
                          >
                            {isCompleted ? (
                              <Check className="h-5 w-5" />
                            ) : (
                              s.icon
                            )}
                          </div>
                          <span
                            className={`mt-2 text-xs font-medium hidden sm:block ${
                              isActive
                                ? "text-epf-500"
                                : isCompleted
                                ? "text-slate-900"
                                : "text-slate-400"
                            }`}
                          >
                            {s.label}
                          </span>
                        </div>

                        {i < STEPS.length - 1 && (
                          <div
                            className={`
                              flex-1 h-0.5 mx-3 sm:mx-4 mt-[-18px] sm:mt-[-24px] transition-colors duration-300
                              ${step > stepNum ? "bg-epf-500" : "bg-slate-200"}
                            `}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Step Content */}
              <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 sm:p-6 min-h-[420px]">
                {/* ---------- STEP 1: Service Type ---------- */}
                {step === 1 && (
                  <div className="animate-in fade-in duration-300">
                    <h2 className="text-lg font-semibold text-slate-900 mb-1">
                      Select a Service Type
                    </h2>
                    <p className="text-sm text-slate-500 mb-5">
                      Choose the service you need for your project
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                      {SERVICES.map((svc) => {
                        const selected = form.serviceId === svc.id;
                        return (
                          <button
                            key={svc.id}
                            type="button"
                            onClick={() => set("serviceId", svc.id)}
                            className={`
                              relative text-left p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer
                              ${
                                selected
                                  ? "border-epf-500 ring-2 ring-epf-500/20 bg-epf-50"
                                  : "border-slate-200 bg-white hover:border-epf-500/40 hover:shadow-sm"
                              }
                            `}
                          >
                            {selected && (
                              <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-epf-500 flex items-center justify-center">
                                <Check className="h-3 w-3 text-white" />
                              </div>
                            )}
                            <div
                              className={`h-10 w-10 rounded-lg flex items-center justify-center mb-3 ${
                                selected ? "bg-epf-500 text-white" : "bg-slate-200 text-slate-500"
                              }`}
                            >
                              {svc.icon}
                            </div>
                            <h3 className="text-sm font-semibold text-slate-900 mb-0.5">
                              {svc.name}
                            </h3>
                            <p className="text-xs text-slate-500 mb-2">{svc.description}</p>
                            <p className="text-sm font-bold text-epf-500">
                              From {formatBDT(svc.basePrice)}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ---------- STEP 2: Project Details ---------- */}
                {step === 2 && (
                  <div className="animate-in fade-in duration-300 space-y-5">
                    <h2 className="text-lg font-semibold text-slate-900 mb-1">
                      Project Details
                    </h2>
                    <p className="text-sm text-slate-500 mb-5">
                      Tell us about your project requirements
                    </p>

                    {/* Area Size */}
                    <div>
                      <label className="block text-sm font-medium text-slate-900 mb-1.5">
                        Service Area Size (sq ft) <span className="text-red-500">*</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => set("areaSize", Math.max(0, form.areaSize - 100))}
                          className="h-10 w-10 flex items-center justify-center border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                          <Minus className="h-4 w-4 text-slate-500" />
                        </button>
                        <input
                          type="number"
                          placeholder="e.g., 1200"
                          value={form.areaSize || ""}
                          onChange={(e) => set("areaSize", Math.max(0, Number(e.target.value)))}
                          className="flex-1 h-10 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-epf-500 focus:ring-1 focus:ring-epf-500/20 transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => set("areaSize", form.areaSize + 100)}
                          className="h-10 w-10 flex items-center justify-center border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                          <Plus className="h-4 w-4 text-slate-500" />
                        </button>
                      </div>
                    </div>

                    {/* Property Type */}
                    <div>
                      <label className="block text-sm font-medium text-slate-900 mb-1.5">
                        Property Type
                      </label>
                      <div className="relative">
                        <select
                          value={form.propertyType}
                          onChange={(e) => set("propertyType", e.target.value as PropertyType)}
                          className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg appearance-none bg-white focus:outline-none focus:border-epf-500 focus:ring-1 focus:ring-epf-500/20 transition-colors cursor-pointer"
                        >
                          <option value="Residential">Residential</option>
                          <option value="Commercial">Commercial</option>
                          <option value="Industrial">Industrial</option>
                        </select>
                        <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none rotate-90" />
                      </div>
                    </div>

                    {/* Quality / Material Grade */}
                    <div>
                      <label className="block text-sm font-medium text-slate-900 mb-2">
                        Quality / Material Grade
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {QUALITY_OPTIONS.map((opt) => {
                          const selected = form.qualityGrade === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => set("qualityGrade", opt.id)}
                              className={`
                                relative text-left p-3 rounded-lg border-2 transition-all duration-200 cursor-pointer
                                ${
                                  selected
                                    ? "border-epf-500 ring-2 ring-epf-500/20 bg-epf-50"
                                    : "border-slate-200 bg-white hover:border-epf-500/40"
                                }
                              `}
                            >
                              {opt.recommended && (
                                <span className="absolute -top-2 left-3 bg-epf-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                                  <Star className="h-2.5 w-2.5" /> Recommended
                                </span>
                              )}
                              <p
                                className={`text-sm font-semibold mb-0.5 ${
                                  selected ? "text-epf-500" : "text-slate-900"
                                }`}
                              >
                                {opt.label}
                              </p>
                              <p className="text-xs text-slate-500">{opt.desc}</p>
                              <p className="text-xs font-medium text-slate-400 mt-1">
                                ×{opt.multiplier} base price
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Urgency */}
                    <div>
                      <label className="block text-sm font-medium text-slate-900 mb-1.5">
                        <Clock className="inline h-4 w-4 mr-1 text-slate-500" />
                        Urgency
                      </label>
                      <div className="relative">
                        <select
                          value={form.urgency}
                          onChange={(e) => set("urgency", e.target.value as Urgency)}
                          className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg appearance-none bg-white focus:outline-none focus:border-epf-500 focus:ring-1 focus:ring-epf-500/20 transition-colors cursor-pointer"
                        >
                          {URGENCY_OPTIONS.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.label} ({u.sub})
                            </option>
                          ))}
                        </select>
                        <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none rotate-90" />
                      </div>
                    </div>

                    {/* Additional Requirements */}
                    <div>
                      <label className="block text-sm font-medium text-slate-900 mb-1.5">
                        Additional Requirements
                        <span className="text-slate-400 font-normal ml-1">(optional)</span>
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Describe any special requirements..."
                        value={form.additionalRequirements}
                        onChange={(e) => set("additionalRequirements", e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-epf-500 focus:ring-1 focus:ring-epf-500/20 transition-colors resize-none"
                      />
                    </div>

                    {/* Checkboxes */}
                    <div className="space-y-3">
                      <label className="flex items-start gap-2.5 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={form.includeLabor}
                          onChange={(e) => set("includeLabor", e.target.checked)}
                          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-epf-500 focus:ring-epf-500/20 cursor-pointer accent-epf-500"
                        />
                        <span className="text-sm text-slate-700 group-hover:text-slate-900 transition-colors">
                          Include labor cost
                        </span>
                      </label>
                      <label className="flex items-start gap-2.5 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={form.needMaintenance}
                          onChange={(e) => set("needMaintenance", e.target.checked)}
                          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-epf-500 focus:ring-epf-500/20 cursor-pointer accent-epf-500"
                        />
                        <span className="text-sm text-slate-700 group-hover:text-slate-900 transition-colors">
                          Need maintenance plan
                        </span>
                      </label>
                      <label className="flex items-start gap-2.5 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={form.needPermit}
                          onChange={(e) => set("needPermit", e.target.checked)}
                          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-epf-500 focus:ring-epf-500/20 cursor-pointer accent-epf-500"
                        />
                        <span className="text-sm text-slate-700 group-hover:text-slate-900 transition-colors">
                          Government permit assistance
                        </span>
                      </label>
                    </div>
                  </div>
                )}

                {/* ---------- STEP 3: Your Information ---------- */}
                {step === 3 && (
                  <div className="animate-in fade-in duration-300 space-y-4">
                    <h2 className="text-lg font-semibold text-slate-900 mb-1">
                      Your Information
                    </h2>
                    <p className="text-sm text-slate-500 mb-5">
                      How can we reach you with the quote?
                    </p>

                    {/* Full Name */}
                    <div>
                      <label className="block text-sm font-medium text-slate-900 mb-1.5">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Enter your full name"
                          value={form.fullName}
                          onChange={(e) => set("fullName", e.target.value)}
                          className="w-full h-10 pl-10 pr-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-epf-500 focus:ring-1 focus:ring-epf-500/20 transition-colors"
                        />
                      </div>
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-medium text-slate-900 mb-1.5">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          type="tel"
                          placeholder="01XXXXXXXXX"
                          value={form.phone}
                          onChange={(e) => set("phone", e.target.value)}
                          className="w-full h-10 pl-10 pr-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-epf-500 focus:ring-1 focus:ring-epf-500/20 transition-colors"
                        />
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Bangladeshi mobile format: 01XXXXXXXXX
                      </p>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-slate-900 mb-1.5">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          type="email"
                          placeholder="you@example.com"
                          value={form.email}
                          onChange={(e) => set("email", e.target.value)}
                          className="w-full h-10 pl-10 pr-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-epf-500 focus:ring-1 focus:ring-epf-500/20 transition-colors"
                        />
                      </div>
                    </div>

                    {/* Address */}
                    <div>
                      <label className="block text-sm font-medium text-slate-900 mb-1.5">
                        Project Address <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <textarea
                          rows={2}
                          placeholder="Enter your project address"
                          value={form.address}
                          onChange={(e) => set("address", e.target.value)}
                          className="w-full pl-10 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-epf-500 focus:ring-1 focus:ring-epf-500/20 transition-colors resize-none"
                        />
                      </div>
                    </div>

                    {/* Preferred Date */}
                    <div>
                      <label className="block text-sm font-medium text-slate-900 mb-1.5">
                        Preferred Date
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          type="date"
                          value={form.preferredDate}
                          onChange={(e) => set("preferredDate", e.target.value)}
                          className="w-full h-10 pl-10 pr-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-epf-500 focus:ring-1 focus:ring-epf-500/20 transition-colors"
                        />
                      </div>
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block text-sm font-medium text-slate-900 mb-1.5">
                        <FileText className="inline h-4 w-4 mr-1 text-slate-500" />
                        Additional Notes
                        <span className="text-slate-400 font-normal ml-1">(optional)</span>
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Any other information you'd like to share..."
                        value={form.notes}
                        onChange={(e) => set("notes", e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-epf-500 focus:ring-1 focus:ring-epf-500/20 transition-colors resize-none"
                      />
                    </div>
                  </div>
                )}

                {/* ---------- Navigation Buttons ---------- */}
                <div className="flex items-center justify-between mt-6 pt-5 border-t border-slate-200">
                  {step > 1 ? (
                    <button
                      type="button"
                      onClick={handlePrev}
                      className="inline-flex items-center gap-1.5 h-10 px-5 text-sm font-medium border border-slate-300 text-slate-500 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Previous
                    </button>
                  ) : (
                    <div />
                  )}

                  {step < 3 ? (
                    <button
                      type="button"
                      onClick={handleNext}
                      disabled={!canProceed}
                      className="inline-flex items-center gap-1.5 h-10 px-6 text-sm font-semibold bg-epf-500 hover:bg-epf-600 text-white rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Next Step
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        // Navigate to services or trigger quote request
                        window.location.href = "/services";
                      }}
                      disabled={!canProceed}
                      className="inline-flex items-center gap-1.5 h-10 px-6 text-sm font-semibold bg-epf-500 hover:bg-epf-600 text-white rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Get Your Quote
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  )}

                  {!canProceed && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 lg:hidden">
                      {/* mobile validation shown inline */}
                    </div>
                  )}
                </div>

                {/* Inline validation hint */}
                {!canProceed && (
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-amber-600">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>
                      {step === 1
                        ? "Please select a service type to continue"
                        : step === 2
                        ? "Please enter the service area size"
                        : "Please fill in all required fields"}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* ===================== RIGHT: Cost Summary ===================== */}
            {/* Desktop: always visible sticky. Mobile: collapsible floating bar */}
            <div className="w-full lg:w-[40%]">
              {/* Mobile floating toggle */}
              <div className="lg:hidden mb-4">
                <button
                  type="button"
                  onClick={() => setMobileSummaryOpen(!mobileSummaryOpen)}
                  className="w-full bg-white border border-slate-200 rounded-lg shadow-sm p-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-epf-500" />
                    <span className="text-sm font-semibold text-slate-900">
                      Estimated Cost
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-base font-bold text-epf-500">
                      {cost.total > 0 ? formatBDT(cost.total) : "—"}
                    </span>
                    <ChevronRight
                      className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
                        mobileSummaryOpen ? "rotate-90" : ""
                      }`}
                    />
                  </div>
                </button>
              </div>

              {/* Summary Card */}
              <div
                className={`${
                  mobileSummaryOpen ? "block" : "hidden"
                } lg:block`}
              >
                <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 sm:p-6 lg:sticky lg:top-[100px]">
                  <h2 className="text-lg font-bold text-slate-900 mb-4">
                    Estimated Cost Range
                  </h2>

                  {cost.total > 0 ? (
                    <>
                      {/* Range Display */}
                      <div className="text-center py-3 px-4 bg-slate-50 rounded-lg mb-4">
                        <p className="text-xs text-slate-500 mb-1 uppercase tracking-wide font-medium">
                          Total Estimated Cost
                        </p>
                        <p className="text-2xl sm:text-3xl font-bold text-epf-500">
                          {formatBDT(cost.low)} — {formatBDT(cost.high)}
                        </p>
                      </div>

                      {/* Breakdown */}
                      <div className="space-y-2 mb-4">
                        <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                          Breakdown
                        </p>
                        {cost.breakdown.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between text-sm py-1.5 border-b border-slate-200 last:border-0"
                          >
                            <span className="text-slate-500">{item.label}</span>
                            <span className="font-medium text-slate-900">
                              {item.value}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Totals */}
                      <div className="border-t border-slate-200 pt-3 space-y-1.5">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Subtotal</span>
                          <span className="font-medium text-slate-900">
                            {formatBDT(cost.subtotal)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Tax (5%)</span>
                          <span className="font-medium text-slate-900">
                            {formatBDT(cost.tax)}
                          </span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-slate-200">
                          <span className="text-base font-bold text-slate-900">
                            Total Estimated Cost
                          </span>
                          <span className="text-lg font-bold text-epf-500">
                            {formatBDT(cost.total)}
                          </span>
                        </div>
                      </div>

                      {/* Disclaimer */}
                      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                          <p className="text-xs text-amber-700">
                            * This is an estimate. Actual cost may vary based
                            on site inspection.
                          </p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <div className="h-14 w-14 rounded-full bg-slate-200 flex items-center justify-center mx-auto mb-3">
                        <FileText className="h-6 w-6 text-slate-300" />
                      </div>
                      <p className="text-sm text-slate-500">
                        Select a service to see the cost estimate
                      </p>
                    </div>
                  )}

                  {/* CTA Buttons */}
                  <div className="mt-5 space-y-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        window.location.href = "/services";
                      }}
                      className="w-full h-11 bg-epf-500 hover:bg-epf-600 text-white font-semibold text-sm rounded-lg flex items-center justify-center gap-2 transition-colors"
                    >
                      Get Exact Quote
                      <ArrowRight className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadPDF}
                      disabled={cost.total === 0}
                      className="w-full h-10 border border-epf-500 text-epf-500 hover:bg-epf-500 hover:text-white font-medium text-sm rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-epf-500"
                    >
                      <Download className="h-4 w-4" />
                      Download PDF Estimate
                    </button>
                  </div>

                  {/* Start Over */}
                  <button
                    type="button"
                    onClick={handleStartOver}
                    className="w-full mt-3 text-sm text-slate-500 hover:text-epf-500 transition-colors text-center"
                  >
                    Start Over
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <ChatWidget />
      <BackToTopButton />
    </div>
  );
}
