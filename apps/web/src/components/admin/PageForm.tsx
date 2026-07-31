"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { Home } from "lucide-react";

export function PageForm({ initialData = null }: { initialData?: any }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  
  const [form, setForm] = useState({
    title: initialData?.title || "",
    slug: initialData?.slug || "",
    content: initialData?.content || "",
    isActive: initialData?.isActive ?? true,
    metaTitle: initialData?.metaTitle || "",
    metaDescription: initialData?.metaDescription || "",
  });

  const save = async () => {
    if (!form.title) {
      toast.error("Name is required");
      return;
    }

    setSaving(true);
    try {
      if (initialData) {
        await apiFetch(`/api/admin/pages/${initialData.id}`, { method: "PUT", body: JSON.stringify(form) });
        toast.success("Page updated");
      } else {
        await apiFetch(`/api/admin/pages`, { method: "POST", body: JSON.stringify(form) });
        toast.success("Page created");
      }
      router.push("/admin/pages");
    } catch {
      toast.error("Failed to save page");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="font-poppins bg-[#f3f4f6] min-h-screen -m-6 p-6 text-slate-700">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-[22px] font-normal text-slate-800">{initialData ? "Edit Page" : "Create Page"}</h1>
        </div>
        <div className="flex items-center gap-2 text-[13px] text-slate-500">
          <Home className="w-3.5 h-3.5 cursor-pointer hover:text-blue-600" onClick={() => router.push("/admin/dashboard")} />
          <span className="text-slate-300">&gt;</span>
          <span className="cursor-pointer hover:text-blue-600" onClick={() => router.push("/admin/pages")}>Pages</span>
          <span className="text-slate-300">&gt;</span>
          <span>{initialData ? "Edit Page" : "Create Page"}</span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Sidebar Tabs */}
        <div className="w-full lg:w-[280px] shrink-0">
          <div className="bg-white border border-slate-200 shadow-sm rounded-sm overflow-hidden">
            <div className="bg-[#f9fafb] px-4 py-3 border-b border-slate-200 text-[14px] font-medium text-slate-700">
              Page Information
            </div>
            <div className="flex flex-col gap-1 p-2">
              <button 
                onClick={() => setActiveTab("general")}
                className={`text-left px-4 py-2.5 text-[13px] rounded-sm transition-colors font-medium ${activeTab === 'general' ? 'bg-slate-100 text-slate-800 border-l-[3px] border-l-[#0052cc]' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                General
              </button>
              <button 
                onClick={() => setActiveTab("seo")}
                className={`text-left px-4 py-2.5 text-[13px] rounded-sm transition-colors font-medium ${activeTab === 'seo' ? 'bg-slate-100 text-slate-800 border-l-[3px] border-l-[#0052cc]' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                SEO
              </button>
            </div>
          </div>
        </div>

        {/* Right Content */}
        <div className="flex-1 bg-white border border-slate-200 shadow-sm rounded-sm min-h-[400px] flex flex-col w-full">
          {/* Tab Header */}
          <div className="px-6 py-4 border-b border-slate-100 text-[16px] font-medium text-slate-700">
            {activeTab === 'general' && "General"}
            {activeTab === 'seo' && "SEO"}
          </div>
          
          <div className="p-6 flex-1">
            {activeTab === 'general' && (
              <div className="space-y-6 max-w-[800px]">
                <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] items-start gap-4">
                  <label className="text-[13px] font-medium text-slate-700 mt-2">Name <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500" 
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] items-start gap-4">
                  <label className="text-[13px] font-medium text-slate-700 mt-2">Body <span className="text-red-500">*</span></label>
                  <div className="border border-slate-300 rounded-sm overflow-hidden flex flex-col">
                    {/* Mock Editor Toolbar */}
                    <div className="bg-[#f9fafb] border-b border-slate-300 px-2 py-1.5 flex items-center gap-1 flex-wrap text-slate-600">
                      <select className="text-[13px] bg-transparent border-none outline-none mr-2">
                        <option>Heading 1</option>
                        <option>Heading 2</option>
                        <option>Normal</option>
                      </select>
                      <div className="w-[1px] h-4 bg-slate-300 mx-1"></div>
                      <button className="p-1 hover:bg-slate-200 rounded font-serif font-bold w-7 h-7 flex items-center justify-center">B</button>
                      <button className="p-1 hover:bg-slate-200 rounded font-serif italic w-7 h-7 flex items-center justify-center">I</button>
                      <button className="p-1 hover:bg-slate-200 rounded underline w-7 h-7 flex items-center justify-center">U</button>
                      <button className="p-1 hover:bg-slate-200 rounded line-through w-7 h-7 flex items-center justify-center">S</button>
                    </div>
                    <textarea 
                      value={form.content}
                      onChange={e => setForm({ ...form, content: e.target.value })}
                      className="w-full min-h-[300px] text-[14px] p-4 outline-none resize-y" 
                      placeholder="Write your page content here..."
                    />
                    <div className="bg-[#f9fafb] border-t border-slate-300 px-3 py-1 flex justify-end text-[11px] text-slate-500">
                      {form.content.split(/\s+/).filter(Boolean).length} WORDS
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] items-center gap-4">
                  <label className="text-[13px] font-medium text-slate-700">Status</label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={form.isActive}
                      onChange={e => setForm({ ...form, isActive: e.target.checked })}
                      className="rounded-sm border-slate-300 text-blue-600 focus:ring-0 w-4 h-4" 
                    />
                    <span className="text-[13px] text-slate-600">Enable the page</span>
                  </label>
                </div>
              </div>
            )}

            {activeTab === 'seo' && (
              <div className="space-y-6 max-w-[800px]">
                <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] items-start gap-4">
                  <label className="text-[13px] font-medium text-slate-700 mt-2">URL <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={form.slug}
                    onChange={e => setForm({ ...form, slug: e.target.value })}
                    className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500" 
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] items-start gap-4">
                  <label className="text-[13px] font-medium text-slate-700 mt-2">Meta Title</label>
                  <input 
                    type="text" 
                    value={form.metaTitle}
                    onChange={e => setForm({ ...form, metaTitle: e.target.value })}
                    className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500" 
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] items-start gap-4">
                  <label className="text-[13px] font-medium text-slate-700 mt-2">Meta Description</label>
                  <textarea 
                    value={form.metaDescription}
                    onChange={e => setForm({ ...form, metaDescription: e.target.value })}
                    className="min-h-[120px] w-full text-[13px] rounded-sm border border-slate-300 p-3 outline-none focus:border-blue-500 resize-y" 
                  />
                </div>
              </div>
            )}

            <div className="mt-8 grid grid-cols-1 md:grid-cols-[140px_1fr] gap-4">
              <div className="hidden md:block"></div>
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
