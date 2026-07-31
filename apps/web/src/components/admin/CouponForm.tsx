"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { Home } from "lucide-react";

export function CouponForm({ initialData = null }: { initialData?: any }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  
  const [form, setForm] = useState({
    name: initialData?.name || "",
    code: initialData?.code || "",
    type: initialData?.type || "PERCENTAGE", // fixed or percentage
    value: initialData?.value || "",
    isFreeShipping: initialData?.isFreeShipping || false,
    validFrom: initialData?.validFrom ? new Date(initialData.validFrom).toISOString().split('T')[0] : "",
    validTo: initialData?.validTo ? new Date(initialData.validTo).toISOString().split('T')[0] : "",
    isActive: initialData?.isActive ?? true,
    minOrder: initialData?.minOrder || "",
    maxUses: initialData?.maxUses || "",
  });

  const save = async () => {
    if (!form.name || !form.code || !form.value) {
      toast.error("Name, Code and Value are required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name,
        code: form.code,
        type: form.type,
        value: Number(form.value),
        isFreeShipping: form.isFreeShipping,
        validFrom: form.validFrom ? new Date(form.validFrom).toISOString() : null,
        validTo: form.validTo ? new Date(form.validTo).toISOString() : null,
        isActive: form.isActive,
        minOrder: form.minOrder ? Number(form.minOrder) : null,
        maxUses: form.maxUses ? Number(form.maxUses) : null,
      };

      if (initialData) {
        await apiFetch(`/api/admin/coupons/${initialData.id}`, { method: "PUT", body: JSON.stringify(payload) });
        toast.success("Coupon updated");
      } else {
        await apiFetch(`/api/admin/coupons`, { method: "POST", body: JSON.stringify(payload) });
        toast.success("Coupon created");
      }
      router.push("/admin/coupons");
    } catch {
      toast.error("Failed to save coupon");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="font-poppins bg-[#f3f4f6] min-h-screen -m-6 p-6 text-slate-700">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-[22px] font-normal text-slate-800">{initialData ? "Edit Coupon" : "Create Coupon"}</h1>
        </div>
        <div className="flex items-center gap-2 text-[13px] text-slate-500">
          <Home className="w-3.5 h-3.5 cursor-pointer hover:text-blue-600" onClick={() => router.push("/admin/dashboard")} />
          <span className="text-slate-300">&gt;</span>
          <span className="cursor-pointer hover:text-blue-600" onClick={() => router.push("/admin/coupons")}>Coupons</span>
          <span className="text-slate-300">&gt;</span>
          <span>{initialData ? "Edit Coupon" : "Create Coupon"}</span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Sidebar Tabs */}
        <div className="w-full lg:w-[280px] shrink-0">
          <div className="bg-white border border-slate-200 shadow-sm rounded-sm overflow-hidden">
            <div className="bg-[#f9fafb] px-4 py-3 border-b border-slate-200 text-[14px] font-medium text-slate-700">
              Coupon Information
            </div>
            <div className="flex flex-col gap-1 p-2">
              <button 
                onClick={() => setActiveTab("general")}
                className={`text-left px-4 py-2.5 text-[13px] rounded-sm transition-colors font-medium ${activeTab === 'general' ? 'bg-slate-100 text-slate-800 border-l-[3px] border-l-[#0052cc]' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                General
              </button>
              <button 
                onClick={() => setActiveTab("restrictions")}
                className={`text-left px-4 py-2.5 text-[13px] rounded-sm transition-colors font-medium ${activeTab === 'restrictions' ? 'bg-slate-100 text-slate-800 border-l-[3px] border-l-[#0052cc]' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                Usage Restrictions
              </button>
              <button 
                onClick={() => setActiveTab("limits")}
                className={`text-left px-4 py-2.5 text-[13px] rounded-sm transition-colors font-medium ${activeTab === 'limits' ? 'bg-slate-100 text-slate-800 border-l-[3px] border-l-[#0052cc]' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                Usage Limits
              </button>
            </div>
          </div>
        </div>

        {/* Right Content */}
        <div className="flex-1 bg-white border border-slate-200 shadow-sm rounded-sm min-h-[400px] flex flex-col">
          {/* Tab Header */}
          <div className="px-6 py-4 border-b border-slate-100 text-[16px] font-medium text-slate-700">
            {activeTab === 'general' && "General"}
            {activeTab === 'restrictions' && "Usage Restrictions"}
            {activeTab === 'limits' && "Usage Limits"}
          </div>
          
          <div className="p-6 flex-1">
            {activeTab === 'general' && (
              <div className="space-y-6 max-w-[600px]">
                <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                  <label className="text-[13px] font-medium text-slate-700">Name <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500" 
                  />
                </div>
                
                <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                  <label className="text-[13px] font-medium text-slate-700">Code <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={form.code}
                    onChange={e => setForm({ ...form, code: e.target.value })}
                    className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500" 
                  />
                </div>
                
                <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                  <label className="text-[13px] font-medium text-slate-700">Discount Type</label>
                  <select 
                    value={form.type}
                    onChange={e => setForm({ ...form, type: e.target.value })}
                    className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500 bg-white"
                  >
                    <option value="PERCENTAGE">Percent</option>
                    <option value="FIXED">Fixed</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                  <label className="text-[13px] font-medium text-slate-700">Value <span className="text-red-500">*</span></label>
                  <input 
                    type="number" 
                    value={form.value}
                    onChange={e => setForm({ ...form, value: e.target.value })}
                    className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500" 
                  />
                </div>
                
                <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                  <label className="text-[13px] font-medium text-slate-700">Free Shipping</label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={form.isFreeShipping}
                      onChange={e => setForm({ ...form, isFreeShipping: e.target.checked })}
                      className="rounded-sm border-slate-300 text-blue-600 focus:ring-0 w-4 h-4" 
                    />
                    <span className="text-[13px] text-slate-600">Allow free shipping</span>
                  </label>
                </div>
                
                <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                  <label className="text-[13px] font-medium text-slate-700">Start date</label>
                  <input 
                    type="date" 
                    value={form.validFrom}
                    onChange={e => setForm({ ...form, validFrom: e.target.value })}
                    className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500 text-slate-600" 
                  />
                </div>
                
                <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                  <label className="text-[13px] font-medium text-slate-700">End date</label>
                  <input 
                    type="date" 
                    value={form.validTo}
                    onChange={e => setForm({ ...form, validTo: e.target.value })}
                    className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500 text-slate-600" 
                  />
                </div>

                <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                  <label className="text-[13px] font-medium text-slate-700">Status</label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={form.isActive}
                      onChange={e => setForm({ ...form, isActive: e.target.checked })}
                      className="rounded-sm border-slate-300 text-blue-600 focus:ring-0 w-4 h-4" 
                    />
                    <span className="text-[13px] text-slate-600">Enable the coupon</span>
                  </label>
                </div>
              </div>
            )}

            {activeTab === 'restrictions' && (
              <div className="space-y-6 max-w-[600px]">
                <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                  <label className="text-[13px] font-medium text-slate-700">Minimum Spend</label>
                  <input 
                    type="number" 
                    value={form.minOrder}
                    onChange={e => setForm({ ...form, minOrder: e.target.value })}
                    className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500" 
                  />
                </div>
              </div>
            )}
            
            {activeTab === 'limits' && (
              <div className="space-y-6 max-w-[600px]">
                <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                  <label className="text-[13px] font-medium text-slate-700">Usage limit per coupon</label>
                  <input 
                    type="number" 
                    value={form.maxUses}
                    onChange={e => setForm({ ...form, maxUses: e.target.value })}
                    className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500" 
                  />
                </div>
              </div>
            )}

            <div className="mt-8 grid grid-cols-[140px_1fr] gap-4">
              <div></div>
              <button 
                onClick={save}
                disabled={saving}
                className="bg-[#0052cc] hover:bg-[#0047b3] text-white px-6 py-2 rounded-sm text-[13px] font-medium transition-colors w-fit"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
