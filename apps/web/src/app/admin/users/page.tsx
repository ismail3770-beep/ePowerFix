"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Home, Trash2, Search, ArrowUpDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";

interface UserData {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  // We'll mock last login for now as it's not in the simple list response typically
  lastLogin?: string; 
}

export default function UsersListPage() {
  const router = useRouter();
  const [usersList, setUsersList] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  const [perPage, setPerPage] = useState("20");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const load = async () => {
    try {
      const res = await apiFetch<any>("/api/admin/users");
      setUsersList(Array.isArray(res.data) ? res.data : res.data?.data || []);
    } catch { 
      toast.error("Failed to load users"); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { load(); }, []);

  const remove = async (id: string) => {
    try { 
      await apiFetch(`/api/admin/users/${id}`, { method: "DELETE" });
      toast.success("User deleted"); 
      load();
    } catch { 
      toast.error("Failed to delete"); 
    }
  };

  const filtered = usersList.filter((u) => {
    const term = search.toLowerCase();
    const name = u.name || "";
    const email = u.email || "";
    return name.toLowerCase().includes(term) || email.toLowerCase().includes(term);
  });

  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(filtered.map(u => u.id)));
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
          <h1 className="text-[22px] font-normal text-slate-800">Users</h1>
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="flex items-center gap-2 text-[13px] text-slate-500">
            <Home className="w-3.5 h-3.5 cursor-pointer hover:text-blue-600" onClick={() => router.push("/admin/dashboard")} />
            <span className="text-slate-300">&gt;</span>
            <span>Users</span>
          </div>
          <Link 
            href="/admin/users/create"
            className="bg-[#0052cc] hover:bg-[#0047b3] text-white px-4 py-1.5 rounded-sm text-[13px] font-medium transition-colors"
          >
            Create User
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
                <th className="px-6 py-3 font-medium w-20">
                  <div className="flex items-center gap-1 cursor-pointer group">
                    ID <ArrowUpDown className="w-3 h-3 text-slate-300 group-hover:text-slate-500" />
                  </div>
                </th>
                <th className="px-6 py-3 font-medium">First Name</th>
                <th className="px-6 py-3 font-medium">Last Name</th>
                <th className="px-6 py-3 font-medium">Email</th>
                <th className="px-6 py-3 font-medium w-32">
                  <div className="flex items-center gap-1 cursor-pointer group">
                    Last Login <ArrowUpDown className="w-3 h-3 text-slate-300 group-hover:text-slate-500" />
                  </div>
                </th>
                <th className="px-6 py-3 font-medium w-32">
                  <div className="flex items-center gap-1 cursor-pointer group">
                    Created <ArrowUpDown className="w-3 h-3 text-slate-300 group-hover:text-slate-500" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8 text-slate-500 text-[13px]">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-slate-500 text-[13px]">No users found.</td></tr>
              ) : (
                filtered.map((u, i) => {
                  const firstName = u.name ? u.name.split(" ")[0] : "";
                  const lastName = u.name ? u.name.split(" ").slice(1).join(" ") : "";
                  
                  return (
                    <tr 
                      key={u.id} 
                      className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors text-[13px] text-slate-700"
                      onClick={() => router.push(`/admin/users/${u.id}/edit`)}
                    >
                      <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                        <input 
                          type="checkbox" 
                          className="rounded-sm border-slate-300"
                          checked={selectedIds.has(u.id)}
                          onChange={() => toggleSelect(u.id)}
                        />
                      </td>
                      <td className="px-6 py-4 text-slate-500">{filtered.length - i}</td>
                      <td className="px-6 py-4 font-medium">{firstName || "-"}</td>
                      <td className="px-6 py-4">{lastName || "-"}</td>
                      <td className="px-6 py-4 text-slate-500">{u.email}</td>
                      <td className="px-6 py-4 text-slate-500">1 day ago</td>
                      <td className="px-6 py-4 text-slate-500">
                        {u.createdAt ? formatDistanceToNow(new Date(u.createdAt), { addSuffix: true }) : 'Unknown'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer / Pagination */}
        <div className="flex justify-between items-center p-4 border-t border-slate-100 text-[13px] text-slate-500">
          <div>
            Showing 1 to {filtered.length} of {filtered.length} entries
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
