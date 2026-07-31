"use client";

import React, { useState, useEffect } from "react";

function FieldRow({ label, children, required }: { label: string, children: React.ReactNode, required?: boolean }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[250px_1fr] items-start gap-4">
      <label className="text-[13px] font-medium text-slate-700 pt-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="w-full">
        {children}
      </div>
    </div>
  );
}

function SaveButton({ onClick, saving }: { onClick?: () => void, saving?: boolean }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[250px_1fr] items-center gap-4 pt-6">
      <div></div>
      <button 
        onClick={onClick}
        disabled={saving}
        className="bg-[#0052cc] hover:bg-[#0047b3] disabled:opacity-50 text-white px-6 py-2 rounded text-[13px] font-medium transition-colors w-fit"
      >
        {saving ? "Saving..." : "Save"}
      </button>
    </div>
  );
}

export function FreeShippingTab({ initialData = {}, save, saving }: any) {
  const [data, setData] = useState({
    freeShippingThreshold: initialData.freeShippingThreshold || 0,
  });

  useEffect(() => {
    setData({
      freeShippingThreshold: initialData.freeShippingThreshold || 0,
    });
  }, [initialData]);

  return (
    <div className="max-w-[800px]">
      <div className="border-b border-slate-200 pb-3 mb-6 flex justify-between items-center">
        <h2 className="text-[16px] font-medium text-slate-800">Free Shipping</h2>
      </div>
      <div className="space-y-5">
        <FieldRow label="Minimum Amount for Free Shipping">
          <input 
            type="number" 
            step="0.01" 
            value={data.freeShippingThreshold} 
            onChange={(e) => setData({ ...data, freeShippingThreshold: parseFloat(e.target.value) || 0 })} 
            className="w-full h-10 text-[13px] rounded border border-slate-300 px-3 outline-none focus:border-[#0052cc]" 
          />
        </FieldRow>
        <SaveButton onClick={() => save(data)} saving={saving} />
      </div>
    </div>
  );
}

export function LocalPickupTab({ initialData = {}, save, saving }: any) {
  return (
    <div className="max-w-[800px]">
      <div className="border-b border-slate-200 pb-3 mb-6 flex justify-between items-center">
        <h2 className="text-[16px] font-medium text-slate-800">Local Pickup</h2>
      </div>
      <div className="space-y-5">
        <FieldRow label="Status">
          <label className="relative inline-flex items-center cursor-pointer mt-1.5">
            <input type="checkbox" className="sr-only peer" />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0052cc]"></div>
          </label>
        </FieldRow>
        <FieldRow label="Label" required>
          <input type="text" className="w-full h-10 text-[13px] rounded border border-slate-300 px-3 outline-none focus:border-[#0052cc]" defaultValue="Local Pickup" />
        </FieldRow>
        <FieldRow label="Cost" required>
          <input type="number" className="w-full h-10 text-[13px] rounded border border-slate-300 px-3 outline-none focus:border-[#0052cc]" defaultValue="0" />
        </FieldRow>
        <SaveButton onClick={() => {}} saving={saving} />
      </div>
    </div>
  );
}

export function FlatRateTab({ initialData = {}, save, saving }: any) {
  const [data, setData] = useState({
    shippingInsideDhakaLabel: initialData.shippingInsideDhakaLabel || "Inside Dhaka",
    shippingInsideDhaka: initialData.shippingInsideDhaka || 0,
    shippingOutsideDhakaLabel: initialData.shippingOutsideDhakaLabel || "Outside Dhaka",
    shippingOutsideDhaka: initialData.shippingOutsideDhaka || 0,
  });

  useEffect(() => {
    setData({
      shippingInsideDhakaLabel: initialData.shippingInsideDhakaLabel || "Inside Dhaka",
      shippingInsideDhaka: initialData.shippingInsideDhaka || 0,
      shippingOutsideDhakaLabel: initialData.shippingOutsideDhakaLabel || "Outside Dhaka",
      shippingOutsideDhaka: initialData.shippingOutsideDhaka || 0,
    });
  }, [initialData]);

  return (
    <div className="max-w-[800px]">
      <div className="border-b border-slate-200 pb-3 mb-6 flex justify-between items-center">
        <h2 className="text-[16px] font-medium text-slate-800">Flat Rate Zones</h2>
      </div>
      <div className="space-y-5">
        
        <div className="border border-slate-200 rounded-lg p-5">
          <h3 className="text-[14px] font-semibold mb-4 text-slate-800">Zone 1 (Inside Dhaka)</h3>
          <FieldRow label="Label" required>
            <input type="text" value={data.shippingInsideDhakaLabel} onChange={(e) => setData({ ...data, shippingInsideDhakaLabel: e.target.value })} className="w-full h-10 text-[13px] rounded border border-slate-300 px-3 outline-none focus:border-[#0052cc]" />
          </FieldRow>
          <div className="mt-4">
            <FieldRow label="Cost" required>
              <input type="number" step="0.01" value={data.shippingInsideDhaka} onChange={(e) => setData({ ...data, shippingInsideDhaka: parseFloat(e.target.value) || 0 })} className="w-full h-10 text-[13px] rounded border border-slate-300 px-3 outline-none focus:border-[#0052cc]" />
            </FieldRow>
          </div>
        </div>

        <div className="border border-slate-200 rounded-lg p-5">
          <h3 className="text-[14px] font-semibold mb-4 text-slate-800">Zone 2 (Outside Dhaka)</h3>
          <FieldRow label="Label" required>
            <input type="text" value={data.shippingOutsideDhakaLabel} onChange={(e) => setData({ ...data, shippingOutsideDhakaLabel: e.target.value })} className="w-full h-10 text-[13px] rounded border border-slate-300 px-3 outline-none focus:border-[#0052cc]" />
          </FieldRow>
          <div className="mt-4">
            <FieldRow label="Cost" required>
              <input type="number" step="0.01" value={data.shippingOutsideDhaka} onChange={(e) => setData({ ...data, shippingOutsideDhaka: parseFloat(e.target.value) || 0 })} className="w-full h-10 text-[13px] rounded border border-slate-300 px-3 outline-none focus:border-[#0052cc]" />
            </FieldRow>
          </div>
        </div>
        
        <SaveButton onClick={() => save(data)} saving={saving} />
      </div>
    </div>
  );
}
