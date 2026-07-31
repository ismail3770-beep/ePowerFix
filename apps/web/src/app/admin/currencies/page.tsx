"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import { Home, Search, ArrowUpDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Trash2 } from "lucide-react";

export default function CurrencyRatesPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [perPage, setPerPage] = useState("20");

  const [currencies, setCurrencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCurrencies = async () => {
    try {
      const res = await apiFetch<any>("/api/admin/currencies");
      if (res?.data) {
        setCurrencies(Array.isArray(res.data) ? res.data : []);
      }
    } catch (e) {
      toast.error("Failed to load currencies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCurrencies();
  }, []);

  const deleteCurrency = async (id: string) => {
    if (!confirm("Are you sure you want to delete this currency?")) return;
    try {
      await apiFetch(`/api/admin/currencies/${id}`, { method: "DELETE" });
      toast.success("Currency deleted");
      loadCurrencies();
    } catch (e) {
      toast.error("Failed to delete currency");
    }
  };

  const filtered = currencies.filter((c) => {
    return (c.name || "").toLowerCase().includes(search.toLowerCase()) || 
           (c.code || "").toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="font-poppins bg-[#f3f4f6] min-h-screen -m-6 p-6 text-slate-700">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-[22px] font-normal text-slate-800">Currency Rates</h1>
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="flex items-center gap-2 text-[13px] text-slate-500">
            <Home className="w-3.5 h-3.5 cursor-pointer hover:text-blue-600" onClick={() => router.push("/admin/dashboard")} />
            <span className="text-slate-300">&gt;</span>
            <span>Currency Rates</span>
          </div>
          <button onClick={loadCurrencies} disabled={loading} className="bg-[#0052cc] hover:bg-[#0047b3] text-white px-4 py-1.5 rounded-sm text-[13px] font-medium transition-colors">
            Refresh Rates
          </button>
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
                <th className="px-6 py-3 font-medium">Currency</th>
                <th className="px-6 py-3 font-medium w-32">
                  <div className="flex items-center gap-1 cursor-pointer group">
                    Code <ArrowUpDown className="w-3 h-3 text-slate-300 group-hover:text-slate-500" />
                  </div>
                </th>
                <th className="px-6 py-3 font-medium w-48">
                  <div className="flex items-center gap-1 cursor-pointer group">
                    Rate <ArrowUpDown className="w-3 h-3 text-slate-300 group-hover:text-slate-500" />
                  </div>
                </th>
                <th className="px-6 py-3 font-medium w-48">
                  <div className="flex items-center gap-1 cursor-pointer group">
                    Last Updated <ArrowUpDown className="w-3 h-3 text-slate-300 group-hover:text-slate-500" />
                  </div>
                </th>
                <th className="px-6 py-3 font-medium w-24 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-8 text-slate-500 text-[13px]">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-slate-500 text-[13px]">No currencies found.</td></tr>
              ) : (
                filtered.map((c, i) => (
                  <tr key={c.id || i} className="border-b border-slate-100 hover:bg-slate-50 transition-colors text-[13px] text-slate-700">
                    <td className="px-6 py-4">
                      {c.name} {c.isDefault && <span className="ml-2 bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded-full">Default</span>}
                    </td>
                    <td className="px-6 py-4">{c.code}</td>
                    <td className="px-6 py-4">{c.exchangeRate}</td>
                    <td className="px-6 py-4 text-slate-500">{c.updatedAt ? formatDistanceToNow(new Date(c.updatedAt), { addSuffix: true }) : ''}</td>
                    <td className="px-6 py-4">
                      {!c.isDefault && (
                        <div className="flex items-center justify-center">
                          <button 
                            className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-sm hover:bg-slate-50 transition-colors text-slate-500 hover:text-red-500"
                            onClick={() => deleteCurrency(c.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between items-center p-4 border-t border-slate-100 text-[13px] text-slate-500">
          <div>Showing 1 to {filtered.length} of {filtered.length} entries</div>
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
