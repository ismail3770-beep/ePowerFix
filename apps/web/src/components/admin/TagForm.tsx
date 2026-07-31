"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { Home } from "lucide-react";

interface TagData {
  id?: string;
  name: string;
  slug?: string;
}

export function TagForm({ initialData }: { initialData?: TagData }) {
  const router = useRouter();
  const isEdit = !!initialData?.id;
  const [saving, setSaving] = useState(false);
  
  const [form, setForm] = useState<TagData>(
    initialData || { name: "", slug: "" }
  );

  const save = async () => {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (isEdit && form.slug !== undefined && !form.slug.trim()) {
      toast.error("URL is required");
      return;
    }
    
    setSaving(true);
    try {
      const payload: any = { name: form.name };
      if (isEdit && form.slug) {
        payload.slug = form.slug;
      }
      
      if (isEdit) {
        await apiFetch(`/api/admin/tags/${initialData.id}`, { method: "PUT", body: JSON.stringify(payload) });
        toast.success("Tag updated successfully");
      } else {
        await apiFetch("/api/admin/tags", { method: "POST", body: JSON.stringify(payload) });
        toast.success("Tag created successfully");
        router.push("/admin/tags");
      }
    } catch {
      toast.error("Failed to save tag");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="font-poppins bg-[#f3f4f6] min-h-screen -m-6 p-6 text-slate-700">
      <div className="flex justify-between items-start mb-6">
        <h1 className="text-[22px] font-normal text-slate-800">{isEdit ? "Edit Tag" : "Create Tag"}</h1>
        <div className="flex items-center gap-2 text-[13px] text-slate-500">
          <Home className="w-3.5 h-3.5 cursor-pointer hover:text-blue-600" onClick={() => router.push("/admin/dashboard")} />
          <span className="text-slate-300">&gt;</span>
          <span className="cursor-pointer hover:text-blue-600" onClick={() => router.push("/admin/tags")}>Tags</span>
          <span className="text-slate-300">&gt;</span>
          <span>{isEdit ? "Edit Tag" : "Create Tag"}</span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Sidebar */}
        <div className="w-full lg:w-[280px] shrink-0">
          <div className="bg-white border border-slate-200 shadow-sm rounded-sm overflow-hidden">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 text-[14px] font-medium text-slate-700">
              Tag Information
            </div>
            <div className="flex flex-col p-2 gap-1">
              <button className="text-left px-4 py-2 text-[13px] rounded-sm transition-colors bg-slate-100 text-slate-800 font-medium border-l-[3px] border-l-[#0052cc]">
                General
              </button>
            </div>
          </div>
        </div>

        {/* Right Content */}
        <div className="flex-1 bg-white border border-slate-200 shadow-sm rounded-sm min-h-[400px] flex flex-col">
          {/* Tab Header */}
          <div className="px-6 py-4 border-b border-slate-100 text-[16px] font-medium text-slate-700">
            General
          </div>
          
          <div className="p-6 flex-1">
            <div className="space-y-6 max-w-[600px]">
              <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                <label className="text-[13px] font-medium text-slate-700">Name <span className="text-red-500">*</span></label>
                <input 
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500" 
                />
              </div>

              {isEdit && (
                <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                  <label className="text-[13px] font-medium text-slate-700">URL <span className="text-red-500">*</span></label>
                  <input 
                    type="text"
                    value={form.slug || ""}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500" 
                  />
                </div>
              )}
              
              <div className="pt-4 grid grid-cols-[140px_1fr] gap-4">
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
