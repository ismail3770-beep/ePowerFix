"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Home, Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/api";

export function TaxForm({ initialData = null }: { initialData?: any }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "rates">("general");

  const [form, setForm] = useState({
    taxClass: initialData?.name || "",
    basedOn: "shipping", // Mock field to match UI
  });

  // Since backend only accepts name, rate, type we will just grab the first rate for submission.
  const [rates, setRates] = useState([
    { id: 1, name: "", country: "", state: "", city: "", zip: "", rate: "" }
  ]);

  const save = async () => {
    if (!form.taxClass) {
      toast.error("Tax Class is required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.taxClass,
        type: "PERCENTAGE",
        rate: parseFloat(rates[0]?.rate) || 0,
        isActive: true,
      };

      if (initialData) {
        await apiFetch(`/api/admin/taxes/${initialData.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        toast.success("Tax updated successfully");
      } else {
        await apiFetch(`/api/admin/taxes`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.success("Tax created successfully");
      }
      router.push("/admin/taxes");
    } catch {
      toast.error("Failed to save tax");
    } finally {
      setSaving(false);
    }
  };

  const addRate = () => {
    setRates([...rates, { id: Date.now(), name: "", country: "", state: "", city: "", zip: "", rate: "" }]);
  };

  const removeRate = (id: number) => {
    setRates(rates.filter(r => r.id !== id));
  };

  const updateRate = (id: number, field: string, value: string) => {
    setRates(rates.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  return (
    <div className="font-poppins bg-[#f3f4f6] min-h-screen -m-6 p-6 text-slate-700">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-[22px] font-normal text-slate-800">{initialData ? "Edit Tax" : "Create Tax"}</h1>
        </div>
        <div className="flex items-center gap-2 text-[13px] text-slate-500">
          <Home className="w-3.5 h-3.5 cursor-pointer hover:text-blue-600" onClick={() => router.push("/admin/dashboard")} />
          <span className="text-slate-300">&gt;</span>
          <span className="cursor-pointer hover:text-blue-600" onClick={() => router.push("/admin/taxes")}>Taxes</span>
          <span className="text-slate-300">&gt;</span>
          <span>{initialData ? "Edit Tax" : "Create Tax"}</span>
        </div>
      </div>

      <div className="bg-white border border-slate-200 shadow-sm rounded-sm p-6 flex flex-col md:flex-row gap-8 items-start">
        
        {/* Left Sidebar Menu */}
        <div className="w-full md:w-[250px] shrink-0 space-y-1">
          <div className="text-[14px] font-medium text-slate-700 bg-slate-50 px-4 py-3 rounded-sm">
            Tax Information
          </div>
          <div className="bg-slate-100 rounded-sm">
            <div 
              onClick={() => setActiveTab("general")}
              className={`px-4 py-2.5 text-[13px] border-l-2 cursor-pointer font-medium transition-colors ${
                activeTab === "general" 
                  ? "border-[#0052cc] bg-white text-slate-700 shadow-sm" 
                  : "border-transparent text-slate-600 hover:bg-slate-200"
              }`}
            >
              General
            </div>
            <div 
              onClick={() => setActiveTab("rates")}
              className={`px-4 py-2.5 text-[13px] border-l-2 cursor-pointer font-medium transition-colors ${
                activeTab === "rates" 
                  ? "border-[#0052cc] bg-white text-slate-700 shadow-sm" 
                  : "border-transparent text-slate-600 hover:bg-slate-200"
              }`}
            >
              Rates
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 w-full overflow-x-auto">
          
          {activeTab === "general" && (
            <div className="max-w-[800px]">
              <div className="border-b border-slate-200 pb-3 mb-6">
                <h2 className="text-[16px] font-medium text-slate-800">General</h2>
              </div>

              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] items-center gap-4">
                  <label className="text-[13px] font-medium text-slate-700">Tax Class <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={form.taxClass}
                    onChange={e => setForm({ ...form, taxClass: e.target.value })}
                    className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500" 
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] items-center gap-4">
                  <label className="text-[13px] font-medium text-slate-700">Based On <span className="text-red-500">*</span></label>
                  <select 
                    value={form.basedOn}
                    onChange={e => setForm({ ...form, basedOn: e.target.value })}
                    className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500 bg-white" 
                  >
                    <option value="shipping">Shipping Address</option>
                    <option value="billing">Billing Address</option>
                    <option value="store">Store Address</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] items-center gap-4 pt-2">
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
          )}

          {activeTab === "rates" && (
            <div>
              <div className="border-b border-slate-200 pb-3 mb-6">
                <h2 className="text-[16px] font-medium text-slate-800">Rates</h2>
              </div>
              
              <div className="min-w-[800px]">
                <table className="w-full text-left border-collapse whitespace-nowrap mb-4">
                  <thead className="text-[13px] text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2 w-10"></th>
                      <th className="px-3 py-2 font-medium">Tax Name</th>
                      <th className="px-3 py-2 font-medium">Country</th>
                      <th className="px-3 py-2 font-medium">State</th>
                      <th className="px-3 py-2 font-medium">City</th>
                      <th className="px-3 py-2 font-medium">Zip</th>
                      <th className="px-3 py-2 font-medium">Rate %</th>
                      <th className="px-3 py-2 w-12 text-center"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rates.map((r, i) => (
                      <tr key={r.id} className="border-b border-slate-100">
                        <td className="px-3 py-3 text-slate-400">
                          <div className="cursor-move p-1 hover:bg-slate-100 rounded">
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/></svg>
                          </div>
                        </td>
                        <td className="px-2 py-3">
                          <input 
                            type="text" 
                            value={r.name}
                            onChange={e => updateRate(r.id, "name", e.target.value)}
                            className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500" 
                          />
                        </td>
                        <td className="px-2 py-3">
                          <select 
                            value={r.country}
                            onChange={e => updateRate(r.id, "country", e.target.value)}
                            className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500 bg-white" 
                          >
                            <option value="">Please Select</option>
                            <option value="BD">Bangladesh</option>
                            <option value="US">United States</option>
                          </select>
                        </td>
                        <td className="px-2 py-3">
                          <input 
                            type="text" 
                            placeholder="*"
                            value={r.state}
                            onChange={e => updateRate(r.id, "state", e.target.value)}
                            className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500" 
                          />
                        </td>
                        <td className="px-2 py-3">
                          <input 
                            type="text" 
                            placeholder="*"
                            value={r.city}
                            onChange={e => updateRate(r.id, "city", e.target.value)}
                            className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500" 
                          />
                        </td>
                        <td className="px-2 py-3">
                          <input 
                            type="text" 
                            placeholder="*"
                            value={r.zip}
                            onChange={e => updateRate(r.id, "zip", e.target.value)}
                            className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500" 
                          />
                        </td>
                        <td className="px-2 py-3">
                          <input 
                            type="text" 
                            value={r.rate}
                            onChange={e => updateRate(r.id, "rate", e.target.value)}
                            className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500" 
                          />
                        </td>
                        <td className="px-2 py-3 text-center">
                          <button 
                            onClick={() => removeRate(r.id)}
                            className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-sm hover:bg-slate-50 transition-colors text-slate-500 hover:text-red-500 mx-auto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="mb-6">
                  <button 
                    onClick={addRate}
                    className="bg-[#f8f9fa] hover:bg-slate-200 border border-slate-300 text-slate-700 px-4 py-1.5 rounded-sm text-[13px] font-medium transition-colors"
                  >
                    Add New Rate
                  </button>
                </div>
              </div>

              <div className="mt-2">
                <button 
                  onClick={save}
                  disabled={saving}
                  className="bg-[#0052cc] hover:bg-[#0047b3] text-white px-6 py-2 rounded-sm text-[13px] font-medium transition-colors w-fit"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
