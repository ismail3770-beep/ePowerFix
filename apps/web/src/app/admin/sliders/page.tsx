"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import { Home, Trash2, Search, ArrowUpDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import Link from "next/link";

export default function SlidersPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [perPage, setPerPage] = useState("20");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [sliders, setSliders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await apiFetch<any>("/api/admin/banners");
      if (res?.data) {
        setSliders(res.data);
      }
    } catch {
      toast.error("Failed to load sliders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = sliders.filter((s) => {
    const title = s.title || "";
    return title.toLowerCase().includes(search.toLowerCase());
  });

  const removeBulk = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.size} slider(s)?`)) return;
    try {
      setLoading(true);
      await Promise.all(
        Array.from(selectedIds).map(id => apiFetch(`/api/admin/banners/${id}`, { method: "DELETE" }))
      );
      toast.success(`${selectedIds.size} slider(s) deleted successfully`);
      setSelectedIds(new Set());
      load();
    } catch (e) {
      toast.error("Failed to delete some sliders");
      load();
    }
  };

  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) setSelectedIds(new Set(filtered.map(s => s.id)));
    else setSelectedIds(new Set());
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  return (
    <div className="font-poppins bg-[#f3f4f6] min-h-screen -m-6 p-6 text-slate-700">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-[22px] font-normal text-slate-800">Sliders</h1>
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="flex items-center gap-2 text-[13px] text-slate-500">
            <Home className="w-3.5 h-3.5 cursor-pointer hover:text-blue-600" onClick={() => router.push("/admin/dashboard")} />
            <span className="text-slate-300">&gt;</span>
            <span>Sliders</span>
          </div>
          <Link 
            href="/admin/sliders/create"
            className="bg-[#0052cc] hover:bg-[#0047b3] text-white px-4 py-1.5 rounded-sm text-[13px] font-medium transition-colors"
          >
            Create Slider
          </Link>
        </div>
      </div>

      <div className="bg-white border border-slate-200 shadow-sm rounded-sm">
        <div className="flex flex-col sm:flex-row justify-between items-center p-4 border-b border-slate-100 gap-4">
          <div className="flex items-center gap-2 text-[13px] text-slate-600">
            Show
            <select 
              value={perPage} 
              onChange={e => setPerPage(e.target.value)}
              className="border border-slate-300 rounded px-2 py-1.5 bg-white outline-none focus:border-blue-400"
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
            entries
            <button 
              className={`flex items-center gap-1 border border-slate-300 rounded px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 ml-2 transition-colors ${selectedIds.size === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={selectedIds.size === 0}
              onClick={removeBulk}
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search here..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="border border-slate-300 rounded-full pl-9 pr-4 py-1.5 text-[13px] w-[260px] outline-none focus:border-blue-400 transition-colors" 
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead className="bg-[#f9fafb] text-[13px] text-slate-600 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 w-10 font-medium">
                  <input 
                    type="checkbox" 
                    className="rounded-sm border-slate-300"
                    checked={filtered.length > 0 && selectedIds.size === filtered.length}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium w-48">
                  <div className="flex items-center gap-1 cursor-pointer group">
                    Created <ArrowUpDown className="w-3 h-3 text-slate-300 group-hover:text-slate-500" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3} className="text-center py-6 text-slate-500 text-[13px]">Loading...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center py-6 text-slate-500 text-[13px]">No sliders found</td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr 
                    key={s.id} 
                    className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors text-[13px] text-slate-700"
                    onClick={() => router.push(`/admin/sliders/${s.id}/edit`)}
                  >
                    <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        className="rounded-sm border-slate-300"
                        checked={selectedIds.has(s.id)}
                        onChange={() => toggleSelect(s.id)}
                      />
                    </td>
                    <td className="px-6 py-4 text-[#0052cc]">{s.title}</td>
                    <td className="px-6 py-4 text-slate-500">
                      {s.createdAt ? formatDistanceToNow(new Date(s.createdAt), { addSuffix: true }) : ''}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between items-center p-4 border-t border-slate-100 text-[13px] text-slate-500">
          <div>Showing 1 to {filtered.length} of 1 entries</div>
          <div className="flex items-center gap-1">
            <button className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-sm bg-slate-50 text-slate-400"><ChevronsLeft className="w-3.5 h-3.5" /></button>
            <button className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-sm bg-slate-50 text-slate-400"><ChevronLeft className="w-3.5 h-3.5" /></button>
            <button className="w-8 h-8 flex items-center justify-center border border-[#0052cc] rounded-sm bg-[#0052cc] text-white">1</button>
            <button className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-sm bg-slate-50 text-slate-400"><ChevronRight className="w-3.5 h-3.5" /></button>
            <button className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-sm bg-slate-50 text-slate-400"><ChevronsRight className="w-3.5 h-3.5" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
