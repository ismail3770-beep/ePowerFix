"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { Home, Plus, Edit2, X, AlertCircle } from "lucide-react";

interface MenuItem {
  id?: string;
  label: string;
  url: string;
  target?: string;
  isActive?: boolean;
}

export function MenuForm({ initialData = null }: { initialData?: any }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [addingItem, setAddingItem] = useState(false);
  
  const [form, setForm] = useState({
    name: initialData?.name || "",
    isActive: initialData?.isActive ?? true,
  });

  const [items, setItems] = useState<MenuItem[]>(
    initialData?.items || []
  );

  const [newItem, setNewItem] = useState<MenuItem>({
    label: "",
    url: "",
  });

  const save = async () => {
    if (!form.name) {
      toast.error("Name is required");
      return;
    }

    setSaving(true);
    try {
      if (initialData) {
        await apiFetch(`/api/admin/menus/${initialData.id}`, { method: "PUT", body: JSON.stringify(form) });
        toast.success("Menu updated");
      } else {
        await apiFetch(`/api/admin/menus`, { method: "POST", body: JSON.stringify(form) });
        toast.success("Menu created");
      }
      router.push("/admin/menus");
    } catch {
      toast.error("Failed to save menu");
    } finally {
      setSaving(false);
    }
  };

  const handleAddItem = async () => {
    if (!initialData) return; // Only allow adding items if editing an existing menu
    if (!newItem.label || !newItem.url) {
      toast.error("Label and URL are required");
      return;
    }

    try {
      const res = await apiFetch<{ data: any }>(`/api/admin/menus/${initialData.id}/items`, { 
        method: "POST", 
        body: JSON.stringify(newItem) 
      });
      setItems([...items, res.data]);
      setAddingItem(false);
      setNewItem({ label: "", url: "" });
      toast.success("Item added");
    } catch {
      toast.error("Failed to add item");
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!initialData) return;
    try {
      await apiFetch(`/api/admin/menus/${initialData.id}/items/${itemId}`, { 
        method: "DELETE"
      });
      setItems(items.filter(i => i.id !== itemId));
      toast.success("Item deleted");
    } catch {
      toast.error("Failed to delete item");
    }
  };

  return (
    <div className="font-poppins bg-[#f3f4f6] min-h-screen -m-6 p-6 text-slate-700">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-[22px] font-normal text-slate-800">{initialData ? "Edit Menu" : "Create Menu"}</h1>
        </div>
        <div className="flex items-center gap-2 text-[13px] text-slate-500">
          <Home className="w-3.5 h-3.5 cursor-pointer hover:text-blue-600" onClick={() => router.push("/admin/dashboard")} />
          <span className="text-slate-300">&gt;</span>
          <span className="cursor-pointer hover:text-blue-600" onClick={() => router.push("/admin/menus")}>Menus</span>
          <span className="text-slate-300">&gt;</span>
          <span>{initialData ? "Edit Menu" : "Create Menu"}</span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Section - Menu Items */}
        <div className="w-full lg:flex-1 shrink-0">
          {initialData ? (
            <div className="bg-[#f9fafb] border border-slate-200 rounded-sm overflow-hidden shadow-sm">
              <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-white">
                <span className="text-[14px] font-medium text-slate-700">Root</span>
                <div className="flex items-center">
                  <button 
                    onClick={() => setAddingItem(!addingItem)}
                    className="flex items-center justify-center w-8 h-8 border-r border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button className="flex items-center justify-center w-8 h-8 hover:bg-slate-50 text-slate-600 transition-colors">
                    -
                  </button>
                </div>
              </div>
              
              {addingItem && (
                <div className="p-4 bg-white border-b border-slate-200">
                  <div className="flex flex-col gap-3">
                    <div>
                      <label className="text-[12px] font-medium text-slate-600 block mb-1">Label *</label>
                      <input 
                        type="text" 
                        value={newItem.label}
                        onChange={e => setNewItem({ ...newItem, label: e.target.value })}
                        className="h-8 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500" 
                      />
                    </div>
                    <div>
                      <label className="text-[12px] font-medium text-slate-600 block mb-1">URL *</label>
                      <input 
                        type="text" 
                        value={newItem.url}
                        onChange={e => setNewItem({ ...newItem, url: e.target.value })}
                        className="h-8 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500" 
                      />
                    </div>
                    <div className="flex justify-end gap-2 mt-1">
                      <button 
                        onClick={() => setAddingItem(false)}
                        className="text-[12px] px-3 py-1.5 border border-slate-300 rounded-sm hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleAddItem}
                        className="text-[12px] px-3 py-1.5 bg-blue-600 text-white rounded-sm hover:bg-blue-700"
                      >
                        Save Item
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-4 space-y-2">
                {items.length === 0 ? (
                  <div className="text-[13px] text-slate-500 p-2 text-center bg-white border border-slate-200 rounded-sm border-dashed">
                    No menu items found. Click + to add one.
                  </div>
                ) : (
                  items.map((item, i) => (
                    <div key={item.id || i} className="bg-white border border-slate-200 rounded-sm p-3 flex justify-between items-center shadow-sm">
                      <div className="flex items-center gap-3 text-[13px] text-slate-700 font-medium">
                        <Edit2 className="w-3.5 h-3.5 text-slate-400 cursor-pointer" />
                        {item.label}
                      </div>
                      <div className="flex items-center gap-3">
                        <X 
                          className="w-4 h-4 text-slate-400 hover:text-red-500 cursor-pointer transition-colors" 
                          onClick={() => item.id && handleDeleteItem(item.id)}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="bg-[#eff6ff] text-[#1e3a8a] text-[13px] px-4 py-3 rounded-sm border border-[#bfdbfe] flex items-center gap-3">
              <div className="bg-[#1e40af] text-white w-5 h-5 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0">!</div>
              Please save the menu first to add menu items
            </div>
          )}
        </div>

        {/* Right Section - Menu Form */}
        <div className="w-full lg:w-[600px] shrink-0 bg-white border border-slate-200 shadow-sm rounded-sm">
          <div className="p-6">
            <div className="space-y-6">
              <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                <label className="text-[13px] font-medium text-slate-700">Name <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500" 
                />
              </div>
              
              <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                <label className="text-[13px] font-medium text-slate-700">Status</label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={form.isActive}
                    onChange={e => setForm({ ...form, isActive: e.target.checked })}
                    className="rounded-sm border-slate-300 text-blue-600 focus:ring-0 w-4 h-4" 
                  />
                  <span className="text-[13px] text-slate-600">Enable the menu</span>
                </label>
              </div>

              <div className="grid grid-cols-[100px_1fr] items-center gap-4 mt-2">
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
    </div>
  );
}
