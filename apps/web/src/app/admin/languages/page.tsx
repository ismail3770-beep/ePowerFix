"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { Home, Trash2, Edit } from "lucide-react";

export default function LanguagesPage() {
  const router = useRouter();

  const [languages, setLanguages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLanguages = async () => {
    try {
      const res = await apiFetch<any>("/api/admin/languages");
      if (res?.data?.languages) setLanguages(res.data.languages);
    } catch (e) {
      toast.error("Failed to load languages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLanguages();
  }, []);

  const toggleDefault = async (id: string, isDefault: boolean) => {
    if (isDefault) return; // already default
    try {
      await apiFetch(`/api/admin/languages/${id}`, {
        method: "PUT",
        body: JSON.stringify({ isDefault: true })
      });
      toast.success("Default language updated");
      loadLanguages();
    } catch (e) {
      toast.error("Failed to update default language");
    }
  };

  const deleteLanguage = async (id: string) => {
    if (!confirm("Are you sure you want to delete this language?")) return;
    try {
      await apiFetch(`/api/admin/languages/${id}`, { method: "DELETE" });
      toast.success("Language deleted");
      loadLanguages();
    } catch (e) {
      toast.error("Failed to delete language");
    }
  };

  return (
    <div className="font-poppins bg-[#f3f4f6] min-h-screen -m-6 p-6 text-slate-700">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-[22px] font-normal text-slate-800">Languages</h1>
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="flex items-center gap-2 text-[13px] text-slate-500">
            <Home className="w-3.5 h-3.5 cursor-pointer hover:text-blue-600" onClick={() => router.push("/admin/dashboard")} />
            <span className="text-slate-300">&gt;</span>
            <span>Languages</span>
          </div>
          <button className="bg-[#0052cc] hover:bg-[#0047b3] text-white px-4 py-1.5 rounded-sm text-[13px] font-medium transition-colors">
            Add Language
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 shadow-sm rounded-sm p-6">
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead className="text-[13px] text-slate-600 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-medium pb-4">Name</th>
                <th className="px-6 py-3 font-medium pb-4 w-48 text-center">Default</th>
                <th className="px-6 py-3 font-medium pb-4 w-32 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={3} className="text-center py-8 text-slate-500 text-[13px]">Loading...</td></tr>
              ) : languages.length === 0 ? (
                <tr><td colSpan={3} className="text-center py-8 text-slate-500 text-[13px]">No languages found.</td></tr>
              ) : (
                languages.map((l) => (
                  <tr key={l.id} className="border-b border-slate-100 text-[13px] text-slate-700">
                    <td className="px-6 py-4 text-[#0052cc]">{l.name}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <div 
                          onClick={() => toggleDefault(l.id, l.isDefault)}
                          className={`w-9 h-5 rounded-full p-1 cursor-pointer transition-colors ${
                            l.isDefault ? 'bg-[#0052cc]' : 'bg-slate-200'
                          }`}
                        >
                          <div className={`w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${
                            l.isDefault ? 'translate-x-4' : 'translate-x-0'
                          }`} />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-sm hover:bg-slate-50 transition-colors text-slate-500 hover:text-[#0052cc]">
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-sm hover:bg-slate-50 transition-colors text-slate-500 hover:text-red-500"
                          onClick={() => deleteLanguage(l.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
