"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Home, Trash2, Search, ArrowUpDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import Link from "next/link";

export default function RolesListPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [perPage, setPerPage] = useState("20");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Mock Data since no roles API exists yet
  const mockRoles = [
    { id: "4", name: "Super Admin", createdAt: "1 year ago" },
    { id: "1", name: "Admin", createdAt: "6 years ago" },
    { id: "2", name: "Customer", createdAt: "6 years ago" },
  ];

  const filtered = mockRoles.filter((r) => {
    const term = search.toLowerCase();
    return r.name.toLowerCase().includes(term);
  });

  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(filtered.map(r => r.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  return (
    <div className="font-poppins bg-[#f3f4f6] min-h-screen -m-6 p-6 text-slate-700">
      
      {/* Header section */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-[22px] font-normal text-slate-800">Roles</h1>
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="flex items-center gap-2 text-[13px] text-slate-500">
            <Home className="w-3.5 h-3.5 cursor-pointer hover:text-blue-600" onClick={() => router.push("/admin/dashboard")} />
            <span className="text-slate-300">&gt;</span>
            <span>Roles</span>
          </div>
          <Link 
            href="/admin/roles/create"
            className="bg-[#0052cc] hover:bg-[#0047b3] text-white px-4 py-1.5 rounded-sm text-[13px] font-medium transition-colors"
          >
            Create Role
          </Link>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-sm">
        
        {/* Toolbar */}
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
              <option value="100">100</option>
            </select>
            entries
            <button 
              className={`flex items-center gap-1 border border-slate-300 rounded px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 ml-2 transition-colors ${selectedIds.size === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={selectedIds.size === 0}
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

        {/* Table */}
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
                <th className="px-6 py-3 font-medium w-32">
                  <div className="flex items-center gap-1 cursor-pointer group">
                    ID <ArrowUpDown className="w-3 h-3 text-slate-300 group-hover:text-slate-500" />
                  </div>
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
              {filtered.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-8 text-slate-500 text-[13px]">No roles found.</td></tr>
              ) : (
                filtered.map((r) => (
                  <tr 
                    key={r.id} 
                    className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors text-[13px] text-slate-700"
                    onClick={() => router.push(`/admin/roles/${r.id}/edit`)}
                  >
                    <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        className="rounded-sm border-slate-300"
                        checked={selectedIds.has(r.id)}
                        onChange={() => toggleSelect(r.id)}
                      />
                    </td>
                    <td className="px-6 py-4 text-slate-500">{r.id}</td>
                    <td className="px-6 py-4 font-medium">{r.name}</td>
                    <td className="px-6 py-4 text-slate-500">
                      {r.createdAt}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer / Pagination */}
        <div className="flex justify-between items-center p-4 border-t border-slate-100 text-[13px] text-slate-500">
          <div>
            Showing 1 to {filtered.length} of 3 entries
          </div>
          <div className="flex items-center gap-1">
            <button className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-sm bg-slate-50 text-slate-400 hover:bg-slate-100 cursor-not-allowed">
              <ChevronsLeft className="w-3.5 h-3.5" />
            </button>
            <button className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-sm bg-slate-50 text-slate-400 hover:bg-slate-100 cursor-not-allowed">
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button className="w-8 h-8 flex items-center justify-center border border-[#0052cc] rounded-sm bg-[#0052cc] text-white">
              1
            </button>
            <button className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-sm bg-slate-50 text-slate-400 hover:bg-slate-100 cursor-not-allowed">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-sm bg-slate-50 text-slate-400 hover:bg-slate-100 cursor-not-allowed">
              <ChevronsRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
