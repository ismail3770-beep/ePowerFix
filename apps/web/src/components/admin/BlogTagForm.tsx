"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Home } from "lucide-react";

export function BlogTagForm({ initialData = null }: { initialData?: any }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  
  const [form, setForm] = useState({
    name: initialData?.name || "",
    slug: initialData?.slug || "",
  });

  const save = async () => {
    if (!form.name) {
      toast.error("Name is required");
      return;
    }

    setSaving(true);
    try {
      // Mocking API call for Blog Tags
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (initialData) {
        toast.success("Blog tag updated");
      } else {
        toast.success("Blog tag created");
      }
      router.push("/admin/blog-tags");
    } catch {
      toast.error("Failed to save blog tag");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="font-poppins bg-[#f3f4f6] min-h-screen -m-6 p-6 text-slate-700">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-[22px] font-normal text-slate-800">{initialData ? "Edit Blog Tag" : "Create Blog Tag"}</h1>
        </div>
        <div className="flex items-center gap-2 text-[13px] text-slate-500">
          <Home className="w-3.5 h-3.5 cursor-pointer hover:text-blue-600" onClick={() => router.push("/admin/dashboard")} />
          <span className="text-slate-300">&gt;</span>
          <span className="cursor-pointer hover:text-blue-600" onClick={() => router.push("/admin/blog-tags")}>Blog Tags</span>
          <span className="text-slate-300">&gt;</span>
          <span>{initialData ? "Edit Blog Tag" : "Create Blog Tag"}</span>
        </div>
      </div>

      <div className="bg-white border border-slate-200 shadow-sm rounded-sm">
        <div className="p-6 max-w-[800px]">
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
            
            {initialData && (
              <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                <label className="text-[13px] font-medium text-slate-700">URL <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  value={form.slug}
                  onChange={e => setForm({ ...form, slug: e.target.value })}
                  className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500" 
                />
              </div>
            )}

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
  );
}
