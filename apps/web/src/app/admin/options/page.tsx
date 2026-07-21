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
import { Textarea } from "@/components/ui/textarea";
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
import { Pencil, Trash2, Search, ToggleLeft } from "lucide-react";
import { useAdminHeaderStore } from "@/store/admin-header-store";

interface OptionItem {
  id: string;
  name: string;
  type: string;   // "SELECT" | "RADIO" | "CHECKBOX" | "TEXT"
  required: boolean;
  choices: string[];
  createdAt: string;
}

const TYPES = ["SELECT","RADIO","CHECKBOX","TEXT"];
const defaultForm = { name: "", type: "SELECT", required: false, choices: "" };

export default function OptionsPage() {
  const [options, setOptions] = useState<OptionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<OptionItem | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<OptionItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ data: OptionItem[] | { data: OptionItem[] } }>("/api/admin/options");
      const list: OptionItem[] = (res.data as any)?.data ?? (Array.isArray(res.data) ? res.data : []);
      setOptions(list);
    } catch { toast.error("Failed to load options"); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = useCallback(() => { setEditing(null); setForm(defaultForm); setDialog(true); }, []);
  const openEdit = (o: OptionItem) => {
    setEditing(o);
    setForm({ name: o.name, type: o.type, required: o.required, choices: (o.choices || []).join(", ") });
    setDialog(true);
  };

  const setAddNew = useAdminHeaderStore((s) => s.setAddNew);
  useEffect(() => { setAddNew("Add Option", openAdd); return () => setAddNew("", null); }, [setAddNew, openAdd]);

  const save = async () => {
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    const payload = { name: form.name, type: form.type, required: form.required, choices: form.choices.split(",").map(c => c.trim()).filter(Boolean) };
    try {
      if (editing) {
        await apiFetch(`/api/admin/options/${editing.id}`, { method: "PUT", body: JSON.stringify(payload) });
        toast.success("Option updated");
      } else {
        await apiFetch("/api/admin/options", { method: "POST", body: JSON.stringify(payload) });
        toast.success("Option created");
      }
      setDialog(false); load();
    } catch (e: any) { toast.error(e?.message || "Save failed"); } finally { setSaving(false); }
  };

  const doDelete = async () => {
    if (!deleteTarget) return;
    try {
      await apiFetch(`/api/admin/options/${deleteTarget.id}`, { method: "DELETE" });
      toast.success("Option deleted"); setDeleteTarget(null); load();
    } catch { toast.error("Delete failed"); }
  };

  const filtered = options.filter(o => !search || o.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-5">
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input placeholder="Search options..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-sm border-slate-200" />
      </div>

      <Card className="rounded-xl border-slate-200 shadow-sm py-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 border-b border-slate-100 hover:bg-slate-50">
              {["Name","Type","Required","Choices","Created",""].map(h => (
                <TableHead key={h} className="text-[11px] font-semibold uppercase text-slate-500 px-4 py-3">{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? Array.from({length:5}).map((_,i) => (
              <TableRow key={i}><TableCell colSpan={6} className="px-4 py-3"><Skeleton className="h-5 w-full" /></TableCell></TableRow>
            )) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-16 text-slate-400">
                <ToggleLeft className="mx-auto h-8 w-8 mb-2 opacity-30" />
                No options yet. Options are product add-ons like warranty, installation.
              </TableCell></TableRow>
            ) : filtered.map((o) => (
              <TableRow key={o.id} className="border-b border-slate-100 hover:bg-slate-50">
                <TableCell className="px-4 py-3 font-semibold text-[13px] text-slate-900">{o.name}</TableCell>
                <TableCell className="px-4 py-3"><span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">{o.type}</span></TableCell>
                <TableCell className="px-4 py-3">
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${o.required ? "bg-red-50 text-red-700 border-red-200" : "bg-slate-100 text-slate-500 border-slate-200"}`}>
                    {o.required ? "Required" : "Optional"}
                  </span>
                </TableCell>
                <TableCell className="px-4 py-3 text-[12px] text-slate-600 max-w-[240px] truncate">{(o.choices || []).join(" · ") || "—"}</TableCell>
                <TableCell className="px-4 py-3 text-[12px] text-slate-500">{new Date(o.createdAt).toLocaleDateString()}</TableCell>
                <TableCell className="px-4 py-3">
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEdit(o)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500 hover:bg-red-50" onClick={() => setDeleteTarget(o)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Edit Option" : "Add Option"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5"><Label>Name <span className="text-red-500">*</span></Label>
              <Input value={form.name} onChange={(e) => setForm(f => ({...f, name: e.target.value}))} placeholder="e.g. Warranty, Installation" /></div>
            <div className="space-y-1.5"><Label>Input Type</Label>
              <select value={form.type} onChange={(e) => setForm(f => ({...f, type: e.target.value}))} className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm">
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-1.5"><Label>Choices <span className="text-[11px] text-slate-400">(comma separated, for SELECT/RADIO)</span></Label>
              <Input value={form.choices} onChange={(e) => setForm(f => ({...f, choices: e.target.value}))} placeholder="1 Year, 2 Years, Lifetime" /></div>
            <div className="flex items-center gap-3">
              <Switch checked={form.required} onCheckedChange={(v) => setForm(f => ({...f, required: v}))} />
              <Label>Required field</Label>
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
          <AlertDialogHeader><AlertDialogTitle>Delete Option</AlertDialogTitle>
            <AlertDialogDescription>Delete <strong>"{deleteTarget?.name}"</strong>?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={doDelete} className="bg-red-500 hover:bg-red-600 text-white">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
