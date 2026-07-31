"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { Home, Folder } from "lucide-react";

interface Brand {
  id?: string;
  name: string;
  slug: string;
  logo: string | null;
  banner?: string | null;
  isActive: boolean;
  metaTitle?: string;
  metaDescription?: string;
}

function FleetImageUploader({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (url: string) => void;
  label: string;
}) {
  const [uploading, setUploading] = useState(false);
  
  return (
    <div className="space-y-3">
      <h3 className="text-[14px] font-medium text-slate-700">{label}</h3>
      <div>
        <label className="inline-flex items-center justify-center gap-2 px-3 py-1.5 bg-[#f1f1f1] hover:bg-[#e2e2e2] text-slate-700 rounded-md cursor-pointer transition-colors text-[13px] font-medium">
          <Folder className="w-4 h-4 text-slate-500" />
          {uploading ? "Uploading..." : "Browse"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploading}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              if (file.size > 5 * 1024 * 1024) {
                toast.error("File too large (max 5MB)");
                return;
              }
              setUploading(true);
              const formData = new FormData();
              formData.append("file", file);
              try {
                const res = await fetch("/api/admin/upload", {
                  method: "POST",
                  body: formData,
                });
                const json = await res.json();
                if (json.data?.url) {
                  onChange(json.data.url);
                } else {
                  throw new Error("Upload failed");
                }
              } catch (err: any) {
                toast.error("Failed to upload image");
              } finally {
                setUploading(false);
                if (e.target) e.target.value = "";
              }
            }}
          />
        </label>
      </div>

      <div className="w-[120px] h-[120px] bg-slate-50 border border-slate-200 rounded-md flex items-center justify-center overflow-hidden relative group">
        {value ? (
          <>
            <img src={value} alt={label} className="w-full h-full object-contain p-1" />
            <div 
              className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              onClick={() => onChange("")}
            >
              <span className="text-white text-xs font-medium bg-red-600 px-2 py-1 rounded">Remove</span>
            </div>
          </>
        ) : (
          <div className="w-16 h-16 bg-slate-200/50 rounded-md flex flex-col items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300">
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
              <circle cx="9" cy="9" r="2"/>
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}

export function BrandForm({ initialData }: { initialData?: Brand }) {
  const router = useRouter();
  const isEdit = !!initialData?.id;

  const [activeTab, setActiveTab] = useState<"general" | "images" | "seo">("general");
  const [saving, setSaving] = useState(false);
  
  const [form, setForm] = useState<Brand>(
    initialData || {
      name: "",
      slug: "",
      logo: null,
      banner: null,
      isActive: true,
      metaTitle: "",
      metaDescription: "",
    }
  );

  const generateSlug = (name: string) => name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  const save = async () => {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    try {
      const payload = { 
        name: form.name, 
        slug: form.slug || generateSlug(form.name), 
        logo: form.logo || null, 
        isActive: form.isActive 
      };
      
      if (isEdit) {
        await apiFetch(`/api/admin/brands/${initialData.id}`, { method: "PUT", body: JSON.stringify(payload) });
        toast.success("Brand updated successfully");
      } else {
        await apiFetch("/api/admin/brands", { method: "POST", body: JSON.stringify(payload) });
        toast.success("Brand created successfully");
        router.push("/admin/brands");
      }
    } catch {
      toast.error("Failed to save brand");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="font-poppins bg-[#f3f4f6] min-h-screen -m-6 p-6 text-slate-700">
      <div className="flex justify-between items-start mb-6">
        <h1 className="text-[22px] font-normal text-slate-800">{isEdit ? "Edit Brand" : "Create Brand"}</h1>
        <div className="flex items-center gap-2 text-[13px] text-slate-500">
          <Home className="w-3.5 h-3.5 cursor-pointer hover:text-blue-600" onClick={() => router.push("/admin/dashboard")} />
          <span className="text-slate-300">&gt;</span>
          <span className="cursor-pointer hover:text-blue-600" onClick={() => router.push("/admin/brands")}>Brands</span>
          <span className="text-slate-300">&gt;</span>
          <span>{isEdit ? "Edit Brand" : "Create Brand"}</span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Sidebar */}
        <div className="w-full lg:w-[280px] shrink-0">
          <div className="bg-white border border-slate-200 shadow-sm rounded-sm overflow-hidden">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 text-[14px] font-medium text-slate-700">
              Brand Information
            </div>
            <div className="flex flex-col p-2 gap-1">
              <button 
                className={`text-left px-4 py-2 text-[13px] rounded-sm transition-colors ${activeTab === 'general' ? 'bg-slate-100 text-slate-800 font-medium border-l-[3px] border-l-[#0052cc]' : 'text-slate-600 hover:bg-slate-50 border-l-[3px] border-l-transparent'}`}
                onClick={() => setActiveTab('general')}
              >
                General
              </button>
              <button 
                className={`text-left px-4 py-2 text-[13px] rounded-sm transition-colors ${activeTab === 'images' ? 'bg-slate-100 text-slate-800 font-medium border-l-[3px] border-l-[#0052cc]' : 'text-slate-600 hover:bg-slate-50 border-l-[3px] border-l-transparent'}`}
                onClick={() => setActiveTab('images')}
              >
                Images
              </button>
              <button 
                className={`text-left px-4 py-2 text-[13px] rounded-sm transition-colors ${activeTab === 'seo' ? 'bg-slate-100 text-slate-800 font-medium border-l-[3px] border-l-[#0052cc]' : 'text-slate-600 hover:bg-slate-50 border-l-[3px] border-l-transparent'}`}
                onClick={() => setActiveTab('seo')}
              >
                SEO
              </button>
            </div>
          </div>
        </div>

        {/* Right Content */}
        <div className="flex-1 bg-white border border-slate-200 shadow-sm rounded-sm min-h-[400px] flex flex-col">
          {/* Tab Header */}
          <div className="px-6 py-4 border-b border-slate-100 text-[16px] font-medium text-slate-700">
            {activeTab === 'general' && "General"}
            {activeTab === 'images' && "Images"}
            {activeTab === 'seo' && "SEO"}
          </div>
          
          <div className="p-6 flex-1">
            {activeTab === 'general' && (
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
                <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                  <label className="text-[13px] font-medium text-slate-700">Status</label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                      className="rounded-sm border-slate-300 text-blue-600 focus:ring-0" 
                    />
                    <span className="text-[13px] text-slate-600">Enable the brand</span>
                  </label>
                </div>
                
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
            )}

            {activeTab === 'images' && (
              <div className="space-y-8 max-w-[600px]">
                <FleetImageUploader
                  value={form.logo || ""}
                  onChange={(url) => setForm({ ...form, logo: url })}
                  label="Logo"
                />
                
                <div className="border-t border-slate-100 pt-6">
                  <FleetImageUploader
                    value={form.banner || ""}
                    onChange={(url) => setForm({ ...form, banner: url })}
                    label="Banner"
                  />
                </div>
                
                <div className="pt-2">
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

            {activeTab === 'seo' && (
              <div className="space-y-6 max-w-[800px]">
                <div className="grid grid-cols-[140px_1fr] items-start gap-4">
                  <label className="text-[13px] font-medium text-slate-700 pt-2">URL <span className="text-red-500">*</span></label>
                  <input 
                    type="text"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500" 
                  />
                </div>
                <div className="grid grid-cols-[140px_1fr] items-start gap-4">
                  <label className="text-[13px] font-medium text-slate-700 pt-2">Meta Title</label>
                  <input 
                    type="text"
                    value={form.metaTitle}
                    onChange={(e) => setForm({ ...form, metaTitle: e.target.value })}
                    className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500" 
                  />
                </div>
                <div className="grid grid-cols-[140px_1fr] items-start gap-4">
                  <label className="text-[13px] font-medium text-slate-700 pt-2">Meta Description</label>
                  <textarea 
                    value={form.metaDescription}
                    onChange={(e) => setForm({ ...form, metaDescription: e.target.value })}
                    className="w-full text-[13px] rounded-sm border border-slate-300 px-3 py-2 outline-none focus:border-blue-500 min-h-[120px] resize-y" 
                  />
                </div>
                
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
