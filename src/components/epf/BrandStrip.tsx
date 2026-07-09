"use client";

const brands = [
  "Siemens", "Schneider", "ABB", "Legrand", "Havells",
  "Philips", "Osram", "Bosch", "Fluke", "Eaton",
];

export default function BrandStrip() {
  return (
    <section className="bg-slate-50 border-y border-slate-200 py-7 overflow-hidden">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-12 mb-4">
        <p className="text-center text-[13px] font-semibold uppercase tracking-widest text-slate-400">
          Trusted by leading brands & professionals across Bangladesh
        </p>
      </div>
      <div className="flex whitespace-nowrap brand-scroll">
        <div className="flex items-center gap-16 px-6">
          {brands.map((b) => (
            <span key={b} className="text-[16px] font-bold text-slate-300 hover:text-slate-500 transition-colors cursor-default tracking-tight select-none">{b}</span>
          ))}
        </div>
        <div className="flex items-center gap-16 px-6">
          {brands.map((b) => (
            <span key={`dup-${b}`} className="text-[16px] font-bold text-slate-300 hover:text-slate-500 transition-colors cursor-default tracking-tight select-none">{b}</span>
          ))}
        </div>
      </div>
    </section>
  );
}