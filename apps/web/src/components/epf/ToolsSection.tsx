"use client";
import { useState } from "react";
import { ChevronRight, Cable, Zap, Lightbulb, Battery, Gauge, Cog, Sun, Ruler, Calculator, X, CheckCircle } from "lucide-react";

const tools = [
  { slug: "cable-size", name: "Cable Size", icon: Cable, uses: "2.1k" },
  { slug: "voltage-drop", name: "Voltage Drop", icon: Zap, uses: "1.8k" },
  { slug: "led-savings", name: "LED Savings", icon: Lightbulb, uses: "750" },
  { slug: "battery-backup", name: "Battery Backup", icon: Battery, uses: "620" },
  { slug: "power-factor", name: "Power Factor", icon: Gauge, uses: "540" },
  { slug: "motor-hp", name: "Motor HP", icon: Cog, uses: "480" },
  { slug: "solar-sizing", name: "Solar Sizing", icon: Sun, uses: "890" },
  { slug: "wire-gauge", name: "Wire Gauge", icon: Ruler, uses: "310" },
];

interface FormValues { [key: string]: string; }

export default function ToolsSection() {
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [calcResult, setCalcResult] = useState<string | null>(null);
  const [calcDetails, setCalcDetails] = useState<string | null>(null);
  const [calcWarnings, setCalcWarnings] = useState<string[]>([]);
  const [formValues, setFormValues] = useState<FormValues>({});

  const selectTool = (slug: string) => {
    setSelectedTool(slug); setCalcResult(null); setCalcDetails(null);
    setCalcWarnings([]); setFormValues({});
  };
  const setField = (key: string, value: string) => { setFormValues((prev) => ({ ...prev, [key]: value })); };

  const calculate = () => {
    if (!selectedTool) return;
    const p = formValues;
    setCalcResult(null); setCalcDetails(null); setCalcWarnings([]);

    if (selectedTool === "cable-size") {
      const power = Number(p.power || 0), voltage = Number(p.voltage || 0);
      const pf = Number(p.pf || 0.85), derating = Number(p.derating || 0.8);
      if (!power || !voltage) return;
      const current = power / (voltage * pf);
      const derated = current / derating;
      const sizes = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95];
      const rec = sizes.find((s) => s >= derated * 0.5) || sizes[sizes.length - 1];
      setCalcResult(rec + " mm²");
      setCalcDetails(`Load: ${current.toFixed(1)}A | Derated: ${derated.toFixed(1)}A`);
    } else if (selectedTool === "voltage-drop") {
      const current = Number(p.current || 0), length = Number(p.length || 0);
      const resistance = Number(p.resistance || 7.41), voltage = Number(p.voltage || 220);
      if (!current || !length) return;
      const vd = (2 * current * length * resistance) / 1000;
      const pct = (vd / voltage) * 100;
      setCalcResult(`${vd.toFixed(2)}V (${pct.toFixed(2)}%)`);
      setCalcDetails(`Voltage drop for ${length}m run at ${current}A`);
      if (pct > 3) setCalcWarnings(["Exceeds 3% limit — use larger cable"]);
    } else if (selectedTool === "led-savings") {
      const oldW = Number(p.oldW || 0), newW = Number(p.newW || 0);
      const qty = Number(p.qty || 1), hrs = Number(p.hrs || 8), rate = Number(p.rate || 10);
      const monthlyKwh = (oldW - newW) * qty * hrs * 30 / 1000;
      const savings = monthlyKwh * rate;
      setCalcResult(`৳${savings.toFixed(0)}/month`);
      setCalcDetails(`Saves ${monthlyKwh.toFixed(1)} kWh/month | ৳${(savings * 12).toFixed(0)}/year`);
    } else if (selectedTool === "battery-backup") {
      const voltage = Number(p.voltage || 12), ah = Number(p.ah || 100);
      const load = Number(p.load || 100), dod = Number(p.dod || 0.8), eff = Number(p.eff || 0.85);
      const backup = (voltage * ah * dod * eff) / load;
      setCalcResult(`${backup.toFixed(1)} hours`);
      setCalcDetails(`${load}W load on ${voltage}V ${ah}Ah battery`);
    }
  };

  const activeToolData = tools.find((t) => t.slug === selectedTool);
  const hasCalculator = selectedTool && ["cable-size", "voltage-drop", "led-savings", "battery-backup"].includes(selectedTool);
  const inputCls = "mt-1 h-9 w-full px-3 text-[14px] border border-[#E2E8F0] focus:outline-none focus:border-[#0EA5E9] rounded";
  const labelCls = "text-[14px] text-[#6B7280] font-medium";

  return (
    <section id="tools" className="bg-[#F8FAFC] pb-6">
      <div className="mx-auto max-w-[1920px] px-4 sm:px-12 pt-6">
        <div className="mf-section-header">
          <h3>Free Electrical Tools</h3>
          <a href="/tools" className="hidden sm:flex items-center gap-1 text-[14px] font-medium text-[#6B7280] hover:text-[#111827]">
            View All <ChevronRight className="h-3.5 w-3.5" />
          </a>
        </div>
        <div className="bg-white border border-[#E2E8F0] border-t-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-0">
            {tools.map((tool) => {
              const Icon = tool.icon;
              const isActive = selectedTool === tool.slug;
              return (
                <button key={tool.slug} onClick={() => selectTool(tool.slug)}
                  className={`p-4 text-center border-r border-b border-[#E2E8F0] transition-colors hover:bg-[#F8FAFC] ${isActive ? "bg-[#F0F9FF]" : "bg-white"}`}>
                  <div className={`flex h-10 w-10 mx-auto items-center justify-center rounded-full mb-2 transition-colors ${isActive ? "bg-[#0EA5E9] text-white" : "bg-[#F1F5F9] text-[#6B7280]"}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="text-[14px] font-medium text-[#111827] mb-0.5">{tool.name}</p>
                  <p className="text-[13px] text-[#6B7280]">{tool.uses} uses</p>
                </button>
              );
            })}
          </div>
        </div>
        {selectedTool && (
          <div className="bg-white border border-[#E2E8F0] border-t-0 p-5">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0EA5E9] text-white">
                  <Calculator className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[15px] font-semibold text-[#111827]">{activeToolData?.name}</p>
                  <p className="text-[14px] text-[#6B7280]">Free Calculator — No sign up required</p>
                </div>
              </div>
              <button onClick={() => { setSelectedTool(null); setCalcResult(null); }}
                className="h-7 w-7 flex items-center justify-center hover:bg-[#F1F5F9] rounded-full transition-colors">
                <X className="h-4 w-4 text-[#6B7280]" />
              </button>
            </div>
            <div className="max-w-lg">
              {selectedTool === "cable-size" && (
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={labelCls}>Power (W)</label><input type="number" className={inputCls} placeholder="e.g. 5000" value={formValues.power || ""} onChange={(e) => setField("power", e.target.value)} /></div>
                  <div><label className={labelCls}>Voltage (V)</label><input type="number" className={inputCls} placeholder="e.g. 220" value={formValues.voltage || ""} onChange={(e) => setField("voltage", e.target.value)} /></div>
                  <div><label className={labelCls}>Power Factor</label><input type="number" step="0.01" className={inputCls} placeholder="0.85" value={formValues.pf || ""} onChange={(e) => setField("pf", e.target.value)} /></div>
                  <div><label className={labelCls}>Derating Factor</label><input type="number" step="0.01" className={inputCls} placeholder="0.8" value={formValues.derating || ""} onChange={(e) => setField("derating", e.target.value)} /></div>
                </div>
              )}
              {selectedTool === "voltage-drop" && (
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={labelCls}>Current (A)</label><input type="number" className={inputCls} placeholder="e.g. 32" value={formValues.current || ""} onChange={(e) => setField("current", e.target.value)} /></div>
                  <div><label className={labelCls}>Cable Length (m)</label><input type="number" className={inputCls} placeholder="e.g. 50" value={formValues.length || ""} onChange={(e) => setField("length", e.target.value)} /></div>
                  <div><label className={labelCls}>Resistance (Ω/km)</label><input type="number" step="0.01" className={inputCls} placeholder="7.41" value={formValues.resistance || ""} onChange={(e) => setField("resistance", e.target.value)} /></div>
                  <div><label className={labelCls}>Source Voltage (V)</label><input type="number" className={inputCls} placeholder="220" value={formValues.voltage || ""} onChange={(e) => setField("voltage", e.target.value)} /></div>
                </div>
              )}
              {selectedTool === "led-savings" && (
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={labelCls}>Old Wattage (W)</label><input type="number" className={inputCls} placeholder="e.g. 60" value={formValues.oldW || ""} onChange={(e) => setField("oldW", e.target.value)} /></div>
                  <div><label className={labelCls}>New LED Wattage (W)</label><input type="number" className={inputCls} placeholder="e.g. 12" value={formValues.newW || ""} onChange={(e) => setField("newW", e.target.value)} /></div>
                  <div><label className={labelCls}>Quantity</label><input type="number" className={inputCls} placeholder="e.g. 10" value={formValues.qty || ""} onChange={(e) => setField("qty", e.target.value)} /></div>
                  <div><label className={labelCls}>Hours/Day</label><input type="number" className={inputCls} placeholder="8" value={formValues.hrs || ""} onChange={(e) => setField("hrs", e.target.value)} /></div>
                  <div><label className={labelCls}>Rate (৳/kWh)</label><input type="number" step="0.01" className={inputCls} placeholder="10" value={formValues.rate || ""} onChange={(e) => setField("rate", e.target.value)} /></div>
                </div>
              )}
              {selectedTool === "battery-backup" && (
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={labelCls}>Battery Voltage (V)</label><input type="number" className={inputCls} placeholder="12" value={formValues.voltage || ""} onChange={(e) => setField("voltage", e.target.value)} /></div>
                  <div><label className={labelCls}>Battery Capacity (Ah)</label><input type="number" className={inputCls} placeholder="100" value={formValues.ah || ""} onChange={(e) => setField("ah", e.target.value)} /></div>
                  <div><label className={labelCls}>Total Load (W)</label><input type="number" className={inputCls} placeholder="100" value={formValues.load || ""} onChange={(e) => setField("load", e.target.value)} /></div>
                  <div><label className={labelCls}>Depth of Discharge</label><input type="number" step="0.01" className={inputCls} placeholder="0.8" value={formValues.dod || ""} onChange={(e) => setField("dod", e.target.value)} /></div>
                </div>
              )}
              {!hasCalculator && <div className="py-8 text-center"><p className="text-[15px] text-[#6B7280]">Coming soon</p></div>}
              {hasCalculator && (
                <button onClick={calculate}
                  className="w-full bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-semibold h-[40px] text-[15px] mt-3 transition-colors rounded">
                  Calculate
                </button>
              )}
            </div>
            {calcResult && (
              <div className="mt-4 p-4 bg-[#F0FFF4] border border-[#4D7300]/20 rounded max-w-lg">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="h-4 w-4 text-[#4D7300]" />
                  <span className="text-[13px] font-bold uppercase tracking-wider text-[#4D7300]">Result</span>
                </div>
                <p className="text-xl font-bold text-[#111827]">{calcResult}</p>
                <p className="text-[14px] text-[#6B7280] mt-1">{calcDetails}</p>
                {calcWarnings.map((w, i) => (
                  <p key={i} className="text-[14px] text-[#EF4444] mt-1 font-medium">⚠ {w}</p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}