"use client";

import { useEffect, useState, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Pencil, Trash2, Search, DollarSign } from "lucide-react";
import { useAdminHeaderStore } from "@/store/admin-header-store";

interface Currency {
  id: string;
  name: string;
  code: string;
  symbol: string;
  exchangeRate: number;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
}

const defaultForm = { name: "", code: "", symbol: "", exchangeRate: 1, isDefault: false, isActive: true };

export default function CurrenciesPage() {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<Currency | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Currency | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ data: Currency[] | { data: Currency[] } }>("/api/admin/currencies");
      const list: Currency[] = (res.data as any)?.data ?? (Array.isArray(res.data) ? res.data : []);
      setCurrencies(list);
    } catch { toast.error("Failed to load currencies"); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = useCallback(() => { setEditing(null); setForm(defaultForm); setDialog(true); }, []);
  const openEdit = (c: Currency) => {
    setEditing(c);
    setForm({ name: c.name, code: c.code, symbol: c.symbol, exchangeRate: c.exchangeRate, isDefault: c.isDefault, isActive: c.isActive });
    setDialog(true);
  };

  const setAddNew = useAdminHeaderStore((s) => s.setAddNew);
  useEffect(() => { setAddNew("Add Currency", openAdd); return () => setAddNew("", null); }, [setAddNew, openAdd]);

  const set = (k: keyof typeof defaultForm, v: string | number | boolean) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.name.trim() || !form.code.trim() || !form.symbol.trim()) { toast.error("Name, code and symbol are required"); return; }
    setSaving(true);
    try {
      if (editing) {
        await apiFetch(`/api/admin/currencies/${editing.id}`, { method: "PUT", body: JSON.stringify(form) });
        toast.success("Currency updated");
      } else {
        await apiFetch("/api/admin/currencies", { method: "POST", body: JSON.stringify(form) });
        toast.success("Currency created");
      }
      setDialog(false); load();
    } catch (e: any) { toast.error(e?.message || "Save failed"); } finally { setSaving(false); }
  };

  const doDelete = async () => {
    if (!deleteTarget) return;
    try {
      await apiFetch(`/api/admin/currencies/${deleteTarget.id}`, { method: "DELETE" });
      toast.success("Currency deleted"); setDeleteTarget(null); load();
    } catch { toast.error("Delete failed"); }
  };

  const filtered = currencies.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-5">
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input placeholder="Search currencies..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-sm border-slate-200" />
      </div>

      <Card className="rounded-xl border-slate-200 shadow-sm py-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 border-b border-slate-100 hover:bg-slate-50">
              {["Currency","Code","Symbol","Rate (vs BDT)","Status","Default",""].map(h => (
                <TableHead key={h} className="text-[11px] font-semibold uppercase text-slate-500 px-4 py-3">{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? Array.from({length:4}).map((_,i) => (
              <TableRow key={i}><TableCell colSpan={7} className="px-4 py-3"><Skeleton className="h-5 w-full" /></TableCell></TableRow>
            )) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-16 text-slate-400">
                <DollarSign className="mx-auto h-8 w-8 mb-2 opacity-30" />
                No currencies yet. Bangladeshi Taka (BDT) is the base currency.
              </TableCell></TableRow>
            ) : filtered.map((c) => (
              <TableRow key={c.id} className="border-b border-slate-100 hover:bg-slate-50">
                <TableCell className="px-4 py-3 font-semibold text-[13px] text-slate-900">{c.name}</TableCell>
                <TableCell className="px-4 py-3"><code className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">{c.code}</code></TableCell>
                <TableCell className="px-4 py-3 text-[14px] font-bold text-slate-700">{c.symbol}</TableCell>
                <TableCell className="px-4 py-3 text-[13px] text-slate-600">{Number(c.exchangeRate).toFixed(4)}</TableCell>
                <TableCell className="px-4 py-3">
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${c.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"}`}>
                    {c.isActive ? "Active" : "Inactive"}
                  </span>
                </TableCell>
                <TableCell className="px-4 py-3">
                  {c.isDefault && <span className="text-[11px] font-bold px-2 py-0.5 rounded-full border bg-sky-50 text-sky-700 border-sky-200">Default</span>}
                </TableCell>
                <TableCell className="px-4 py-3">
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEdit(c)}><Pencil className="h-3.5 w-3.5" /></Button>
                    {!c.isDefault && <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500 hover:bg-red-50" onClick={() => setDeleteTarget(c)}><Trash2 className="h-3.5 w-3.5" /></Button>}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Edit Currency" : "Add Currency"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 col-span-2"><Label>Name <span className="text-red-500">*</span></Label>
                <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="US Dollar" /></div>
              <div className="space-y-1.5"><Label>Code <span className="text-red-500">*</span></Label>
                <Input value={form.code} onChange={(e) => set("code", e.target.value.toUpperCase())} placeholder="USD" maxLength={3} /></div>
              <div className="space-y-1.5"><Label>Symbol <span className="text-red-500">*</span></Label>
                <Input value={form.symbol} onChange={(e) => set("symbol", e.target.value)} placeholder="$" /></div>
              <div className="space-y-1.5 col-span-2"><Label>Exchange Rate <span className="text-[11px] text-slate-400">(1 unit = ? BDT)</span></Label>
                <Input type="number" min="0" step="0.0001" value={form.exchangeRate} onChange={(e) => set("exchangeRate", parseFloat(e.target.value) || 1)} /></div>
            </div>
            <div className="flex gap-6">
              <div className="flex items-center gap-2"><Switch checked={form.isActive} onCheckedChange={(v) => set("isActive", v)} /><Label>Active</Label></div>
              <div className="flex items-center gap-2"><Switch checked={form.isDefault} onCheckedChange={(v) => set("isDefault", v)} /><Label>Set as Default</Label></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving} className="bg-epf-500 hover:bg-epf-600 text-white">{saving ? "Saving…" : editing ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Currency</AlertDialogTitle>
            <AlertDialogDescription>Delete <strong>{deleteTarget?.name} ({deleteTarget?.code})</strong>?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={doDelete} className="bg-red-500 hover:bg-red-600 text-white">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
