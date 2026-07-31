"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { Home, Search, ArrowUpDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

interface TransactionData {
  id: string;
  orderId: string;
  orderNumber?: string;
  amount: number;
  type: string;
  status: string;
  method: string;
  reference: string;
  createdAt: string;
}

export default function TransactionsPage() {
  const router = useRouter();
  const [transactionsList, setTransactionsList] = useState<TransactionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  const [perPage, setPerPage] = useState("20");

  const load = async () => {
    try {
      const res = await apiFetch<any>("/api/admin/transactions");
      setTransactionsList(res.data || []);
    } catch { 
      toast.error("Failed to load transactions"); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = transactionsList.filter((t) => {
    const term = search.toLowerCase();
    const orderRef = t.orderNumber || t.orderId || "";
    const txId = t.reference || "";
    const method = t.method || "";
    return orderRef.toLowerCase().includes(term) || txId.toLowerCase().includes(term) || method.toLowerCase().includes(term);
  });

  return (
    <div className="font-poppins bg-[#f3f4f6] min-h-screen -m-6 p-6 text-slate-700">
      
      {/* Header section */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-[22px] font-normal text-slate-800">Transactions</h1>
        </div>
        <div className="flex items-center gap-2 text-[13px] text-slate-500">
          <Home className="w-3.5 h-3.5 cursor-pointer hover:text-blue-600" onClick={() => router.push("/admin/dashboard")} />
          <span className="text-slate-300">&gt;</span>
          <span>Transactions</span>
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
                <th className="px-6 py-3 font-medium w-40">
                  <div className="flex items-center gap-1 cursor-pointer group">
                    Order ID <ArrowUpDown className="w-3 h-3 text-slate-300 group-hover:text-slate-500" />
                  </div>
                </th>
                <th className="px-6 py-3 font-medium">
                  Transaction ID
                </th>
                <th className="px-6 py-3 font-medium w-64">
                  <div className="flex items-center gap-1 cursor-pointer group">
                    Payment Method <ArrowUpDown className="w-3 h-3 text-slate-300 group-hover:text-slate-500" />
                  </div>
                </th>
                <th className="px-6 py-3 font-medium w-48 text-right">
                  <div className="flex items-center justify-end gap-1 cursor-pointer group">
                    Created <ArrowUpDown className="w-3 h-3 text-slate-300 group-hover:text-slate-500" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="text-center py-8 text-slate-500 text-[13px]">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-8 text-slate-500 text-[13px]">No transactions found.</td></tr>
              ) : (
                filtered.map((t) => (
                  <tr 
                    key={t.id} 
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors text-[13px] text-slate-700"
                  >
                    <td className="px-6 py-4">
                      {t.orderId ? (
                        <Link href={`/admin/orders/${t.orderId}`} className="text-[#0052cc] hover:underline font-medium">
                          {t.orderNumber || t.orderId.slice(0, 8)}
                        </Link>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">{t.reference || "Unknown"}</td>
                    <td className="px-6 py-4 text-slate-600">{t.method || "-"}</td>
                    <td className="px-6 py-4 text-right text-slate-500">
                      {t.createdAt ? formatDistanceToNow(new Date(t.createdAt), { addSuffix: true }) : 'Unknown'}
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
