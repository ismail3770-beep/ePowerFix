"use client";

import { useEffect, useState, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { Search, CreditCard, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import Pagination from "@/components/admin/Pagination";

interface Transaction {
  id: string;
  orderNumber?: string;
  orderId?: string;
  amount: number;
  type: string;
  status: string;
  method?: string;
  reference?: string;
  createdAt: string;
  user?: { name?: string | null; email?: string } | null;
  order?: { orderNumber?: string } | null;
}

const statusColor: Record<string, string> = {
  PAID:     "bg-emerald-50 text-emerald-700 border-emerald-200",
  SUCCESS:  "bg-emerald-50 text-emerald-700 border-emerald-200",
  PENDING:  "bg-amber-50 text-amber-700 border-amber-200",
  FAILED:   "bg-red-50 text-red-700 border-red-200",
  REFUNDED: "bg-orange-50 text-orange-700 border-orange-200",
};

const typeColor: Record<string, string> = {
  PAYMENT:  "bg-sky-50 text-sky-700",
  REFUND:   "bg-orange-50 text-orange-700",
  PAYOUT:   "bg-purple-50 text-purple-700",
};

function fmt(n: number) { return "৳" + Number(n || 0).toLocaleString(); }

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const perPage = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ data: Transaction[] | { data: Transaction[] } }>("/api/admin/transactions");
      const list: Transaction[] = (res.data as any)?.data ?? (Array.isArray(res.data) ? res.data : []);
      setTransactions(list);
    } catch {
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = transactions.filter((t) => {
    const q = search.toLowerCase();
    const matchQ = !q
      || (t.orderNumber || t.order?.orderNumber || "").toLowerCase().includes(q)
      || (t.reference || "").toLowerCase().includes(q)
      || (t.user?.name || "").toLowerCase().includes(q)
      || (t.user?.email || "").toLowerCase().includes(q);
    const matchStatus = statusFilter === "ALL" || t.status === statusFilter;
    return matchQ && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const visible = filtered.slice((page - 1) * perPage, page * perPage);

  const totalRevenue = transactions.filter(t => ["PAID","SUCCESS"].includes(t.status)).reduce((a, t) => a + Number(t.amount), 0);
  const totalRefunds  = transactions.filter(t => t.status === "REFUNDED").reduce((a, t) => a + Number(t.amount), 0);
  const pendingCount  = transactions.filter(t => t.status === "PENDING").length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-xl border-slate-200 shadow-sm py-0">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-[22px] font-bold text-slate-900">{fmt(totalRevenue)}</p>
              <p className="text-[12px] text-slate-500 uppercase tracking-wide">Total Collected</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-slate-200 shadow-sm py-0">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-[22px] font-bold text-slate-900">{fmt(totalRefunds)}</p>
              <p className="text-[12px] text-slate-500 uppercase tracking-wide">Total Refunded</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-slate-200 shadow-sm py-0">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-[22px] font-bold text-slate-900">{pendingCount}</p>
              <p className="text-[12px] text-slate-500 uppercase tracking-wide">Pending</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input placeholder="Search by order #, reference, customer..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 h-9 text-sm border-slate-200" />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[160px] h-9 text-sm border-slate-200">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            {["ALL","PAID","PENDING","FAILED","REFUNDED"].map(s => (
              <SelectItem key={s} value={s}>{s === "ALL" ? "All Statuses" : s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="rounded-xl border-slate-200 shadow-sm py-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 border-b border-slate-100 hover:bg-slate-50">
              {["Order #","Customer","Amount","Type","Method","Status","Date"].map(h => (
                <TableHead key={h} className="text-[11px] font-semibold uppercase text-slate-500 px-4 py-3">{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? Array.from({length:8}).map((_,i) => (
              <TableRow key={i}><TableCell colSpan={7} className="px-4 py-3"><Skeleton className="h-5 w-full" /></TableCell></TableRow>
            )) : visible.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-16 text-slate-400">
                <CreditCard className="mx-auto h-8 w-8 mb-2 opacity-30" />
                No transactions found
              </TableCell></TableRow>
            ) : visible.map((t) => (
              <TableRow key={t.id} className="border-b border-slate-100 hover:bg-slate-50">
                <TableCell className="px-4 py-3 text-[13px] font-semibold text-epf-600">
                  #{t.orderNumber || t.order?.orderNumber || t.orderId?.slice(0,8) || "—"}
                </TableCell>
                <TableCell className="px-4 py-3 text-[13px] text-slate-700">
                  <div>{t.user?.name || "Guest"}</div>
                  {t.user?.email && <div className="text-[11px] text-slate-400">{t.user.email}</div>}
                </TableCell>
                <TableCell className="px-4 py-3 text-[13px] font-semibold text-slate-900">{fmt(Number(t.amount))}</TableCell>
                <TableCell className="px-4 py-3">
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${typeColor[t.type] || "bg-slate-100 text-slate-600"}`}>
                    {t.type || "PAYMENT"}
                  </span>
                </TableCell>
                <TableCell className="px-4 py-3 text-[13px] text-slate-600">{t.method || "—"}</TableCell>
                <TableCell className="px-4 py-3">
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${statusColor[t.status] || "bg-slate-100 text-slate-600 border-slate-200"}`}>
                    {t.status}
                  </span>
                </TableCell>
                <TableCell className="px-4 py-3 text-[12px] text-slate-500">
                  {new Date(t.createdAt).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {!loading && filtered.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-100">
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} total={filtered.length} />
          </div>
        )}
      </Card>
    </div>
  );
}
