"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { Home, X } from "lucide-react";

interface ProductRow {
  id: string;
  name: string;
  endDate: string;
  price: string;
  quantity: string;
}

export function FlashSaleForm({ initialData = null }: { initialData?: any }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("products");
  
  const [campaignName, setCampaignName] = useState(initialData?.title || "");
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);

  const [products, setProducts] = useState<ProductRow[]>(
    initialData?.products?.map((p: any) => ({
      id: Math.random().toString(36).substring(7),
      name: p.name || "",
      endDate: p.endDate || "",
      price: p.price || "",
      quantity: p.quantity || ""
    })) || [
      { id: "1", name: "", endDate: "", price: "", quantity: "" }
    ]
  );

  const addProduct = () => {
    setProducts([...products, { id: Math.random().toString(36).substring(7), name: "", endDate: "", price: "", quantity: "" }]);
  };

  const removeProduct = (id: string) => {
    setProducts(products.filter(p => p.id !== id));
  };

  const updateProduct = (id: string, field: keyof ProductRow, value: string) => {
    setProducts(products.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        title: campaignName || "Flash Sale",
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 86400000).toISOString(),
        discount: 0,
        isActive,
        // we can pass products if API supports it later
      };

      if (initialData) {
        await apiFetch(`/api/admin/flash-sales/${initialData.id}`, { method: "PUT", body: JSON.stringify(payload) });
        toast.success("Flash sale updated");
      } else {
        await apiFetch(`/api/admin/flash-sales`, { method: "POST", body: JSON.stringify(payload) });
        toast.success("Flash sale created");
      }
      router.push("/admin/flash-sales");
    } catch {
      toast.error("Failed to save flash sale");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="font-poppins bg-[#f3f4f6] min-h-screen -m-6 p-6 text-slate-700">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-[22px] font-normal text-slate-800">{initialData ? "Edit Flash Sale" : "Create Flash Sale"}</h1>
        </div>
        <div className="flex items-center gap-2 text-[13px] text-slate-500">
          <Home className="w-3.5 h-3.5 cursor-pointer hover:text-blue-600" onClick={() => router.push("/admin/dashboard")} />
          <span className="text-slate-300">&gt;</span>
          <span className="cursor-pointer hover:text-blue-600" onClick={() => router.push("/admin/flash-sales")}>Flash Sales</span>
          <span className="text-slate-300">&gt;</span>
          <span>{initialData ? "Edit Flash Sale" : "Create Flash Sale"}</span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Sidebar Tabs */}
        <div className="w-full lg:w-[280px] shrink-0">
          <div className="bg-white border border-slate-200 shadow-sm rounded-sm overflow-hidden">
            <div className="flex flex-col gap-1 p-2">
              <button 
                onClick={() => setActiveTab("info")}
                className={`text-left px-4 py-2.5 text-[13px] rounded-sm transition-colors font-medium ${activeTab === 'info' ? 'bg-slate-100 text-slate-800 border-l-[3px] border-l-[#0052cc]' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                Flash Sale Information
              </button>
              <button 
                onClick={() => setActiveTab("products")}
                className={`text-left px-4 py-2.5 text-[13px] rounded-sm transition-colors font-medium ${activeTab === 'products' ? 'bg-slate-100 text-slate-800 border-l-[3px] border-l-[#0052cc]' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                Products
              </button>
              <button 
                onClick={() => setActiveTab("settings")}
                className={`text-left px-4 py-2.5 text-[13px] rounded-sm transition-colors font-medium ${activeTab === 'settings' ? 'bg-slate-100 text-slate-800 border-l-[3px] border-l-[#0052cc]' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                Settings
              </button>
            </div>
          </div>
        </div>

        {/* Right Content */}
        <div className="flex-1 bg-white border border-slate-200 shadow-sm rounded-sm min-h-[400px] flex flex-col">
          {/* Tab Header */}
          <div className="px-6 py-4 border-b border-slate-100 text-[16px] font-medium text-slate-700">
            {activeTab === 'info' && "Flash Sale Information"}
            {activeTab === 'products' && "Products"}
            {activeTab === 'settings' && "Settings"}
          </div>
          
          <div className="p-6 flex-1">
            {activeTab === 'info' && (
              <div className="space-y-6 max-w-[600px]">
                <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                  <label className="text-[13px] font-medium text-slate-700">Status</label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={isActive}
                      onChange={e => setIsActive(e.target.checked)}
                      className="rounded-sm border-slate-300 text-blue-600 focus:ring-0 w-4 h-4" 
                    />
                    <span className="text-[13px] text-slate-600">Active</span>
                  </label>
                </div>
              </div>
            )}

            {activeTab === 'products' && (
              <div className="space-y-6 max-w-[800px]">
                {products.map((p, index) => (
                  <div key={p.id} className="border border-slate-200 rounded-sm overflow-hidden mb-4 relative">
                    <div className="bg-[#f9fafb] px-4 py-2 text-[13px] font-medium text-slate-700 border-b border-slate-200 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">#</span> Flash Sale Product
                      </div>
                      <button 
                        onClick={() => removeProduct(p.id)}
                        className="text-slate-400 hover:text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="p-4 space-y-4">
                      <div>
                        <label className="text-[13px] font-medium text-slate-700 block mb-1.5">Product <span className="text-red-500">*</span></label>
                        <input 
                          type="text" 
                          value={p.name}
                          onChange={(e) => updateProduct(p.id, "name", e.target.value)}
                          placeholder="Select product..."
                          className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500" 
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="text-[13px] font-medium text-slate-700 block mb-1.5">End Date <span className="text-red-500">*</span></label>
                          <input 
                            type="text" 
                            value={p.endDate}
                            onChange={(e) => updateProduct(p.id, "endDate", e.target.value)}
                            placeholder="May 1, 2024 6:00 AM"
                            className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500" 
                          />
                        </div>
                        <div>
                          <label className="text-[13px] font-medium text-slate-700 block mb-1.5">Price <span className="text-red-500">*</span></label>
                          <input 
                            type="number" 
                            value={p.price}
                            onChange={(e) => updateProduct(p.id, "price", e.target.value)}
                            className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500" 
                          />
                        </div>
                        <div>
                          <label className="text-[13px] font-medium text-slate-700 block mb-1.5">Quantity <span className="text-red-500">*</span></label>
                          <input 
                            type="number" 
                            value={p.quantity}
                            onChange={(e) => updateProduct(p.id, "quantity", e.target.value)}
                            className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500" 
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                <div>
                  <button 
                    onClick={addProduct}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-sm text-[13px] font-medium transition-colors"
                  >
                    Add Product
                  </button>
                </div>
              </div>
            )}
            
            {activeTab === 'settings' && (
              <div className="space-y-6 max-w-[600px]">
                <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                  <label className="text-[13px] font-medium text-slate-700">Campaign Name <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={campaignName}
                    onChange={e => setCampaignName(e.target.value)}
                    className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500" 
                  />
                </div>
              </div>
            )}

            <div className="mt-8 pt-4 border-t border-slate-100">
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
