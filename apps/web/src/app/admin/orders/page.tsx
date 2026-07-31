"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { Home, Search, ArrowUpDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface OrderData {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  status: string;
  total: number;
  createdAt: string;
}

export default function OrdersPage() {
  const router = useRouter();
  const [ordersList, setOrdersList] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  const [perPage, setPerPage] = useState("20");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const load = async () => {
    try {
      const res = await apiFetch<any>("/api/admin/orders");
      setOrdersList(res.data?.data || []);
    } catch { 
      toast.error("Failed to load orders"); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = ordersList.filter((o) => {
    const term = search.toLowerCase();
    const cName = o.customerName || "";
    const cEmail = o.customerEmail || "";
    const oNumber = o.orderNumber || "";
    return cName.toLowerCase().includes(term) || cEmail.toLowerCase().includes(term) || oNumber.toLowerCase().includes(term);
  });

  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(filtered.map(o => o.id)));
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

  const getStatusColor = (status: string) => {
    const s = (status || "").toUpperCase();
    if (s === "PENDING") return "bg-[#e0f2fe] text-[#0369a1]";
    if (s === "PENDING PAYMENT") return "bg-[#fef3c7] text-[#b45309]";
    if (s === "COMPLETED" || s === "DELIVERED") return "bg-[#dcfce7] text-[#166534]";
    if (s === "CANCELLED") return "bg-[#fee2e2] text-[#991b1b]";
    return "bg-slate-100 text-slate-600";
  };

  const formatStatus = (status: string) => {
    return (status || "").toLowerCase().replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  };

  return (
    <div className="font-poppins bg-[#f3f4f6] min-h-screen -m-6 p-6 text-slate-700">
      
      {/* Header section */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-[22px] font-normal text-slate-800">Orders</h1>
        </div>
        <div className="flex items-center gap-2 text-[13px] text-slate-500">
          <Home className="w-3.5 h-3.5 cursor-pointer hover:text-blue-600" onClick={() => router.push("/admin/dashboard")} />
          <span className="text-slate-300">&gt;</span>
          <span>Orders</span>
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
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#f9fafb] text-[13px] text-slate-600 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 w-10 font-medium">
                  <input 
                    type="checkbox" 
                    className="rounded-sm border-slate-300"
                    checked={filtered.length > 0 && selectedIds.size === filtered.length}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="px-4 py-3 font-medium w-24">
                  <div className="flex items-center gap-1 cursor-pointer group">
                    ID <ArrowUpDown className="w-3 h-3 text-slate-300 group-hover:text-slate-500" />
                  </div>
                </th>
                <th className="px-4 py-3 font-medium">Customer Name</th>
                <th className="px-4 py-3 font-medium">Customer Email</th>
                <th className="px-4 py-3 font-medium w-36">
                  <div className="flex items-center gap-1 cursor-pointer group">
                    Status <ArrowUpDown className="w-3 h-3 text-slate-300 group-hover:text-slate-500" />
                  </div>
                </th>
                <th className="px-4 py-3 font-medium w-32">
                  <div className="flex items-center gap-1 cursor-pointer group">
                    Total <ArrowUpDown className="w-3 h-3 text-slate-300 group-hover:text-slate-500" />
                  </div>
                </th>
                <th className="px-4 py-3 font-medium w-40 text-right">
                  <div className="flex items-center justify-end gap-1 cursor-pointer group">
                    Created <ArrowUpDown className="w-3 h-3 text-slate-300 group-hover:text-slate-500" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8 text-slate-500 text-[13px]">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-slate-500 text-[13px]">No orders found.</td></tr>
              ) : (
                filtered.map((o) => (
                  <tr 
                    key={o.id} 
                    className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors text-[13px] text-slate-700"
                    onClick={() => router.push(`/admin/orders/${o.id}`)}
                  >
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        className="rounded-sm border-slate-300"
                        checked={selectedIds.has(o.id)}
                        onChange={() => toggleSelect(o.id)}
                      />
                    </td>
                    <td className="px-4 py-3 text-slate-500">{o.orderNumber || o.id.slice(0, 8)}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{o.customerName || "Unknown"}</td>
                    <td className="px-4 py-3 text-slate-600">{o.customerEmail || ""}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-sm text-[11px] font-medium ${getStatusColor(o.status)}`}>
                        {formatStatus(o.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium">${Number(o.total || 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-slate-500">
                      {o.createdAt ? formatDistanceToNow(new Date(o.createdAt), { addSuffix: true }) : 'Unknown'}
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
