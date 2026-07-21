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
import { Plus, Pencil, Trash2, Search, Settings2 } from "lucide-react";
import { useAdminHeaderStore } from "@/store/admin-header-store";

interface Attribute {
  id: string;
  name: string;
  slug: string;
  values: string[];
  createdAt: string;
}

function toSlug(s: string) { return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }

export default function AttributesPage() {
  const [attrs, setAttrs] = useState<Attribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<Attribute | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", values: "" });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Attribute | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ data: Attribute[] | { data: Attribute[] } }>("/api/admin/attributes");
      const list: Attribute[] = (res.data as any)?.data ?? (Array.isArray(res.data) ? res.data : []);
      setAttrs(list);
    } catch { toast.error("Failed to load attributes"); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = useCallback(() => { setEditing(null); setForm({ name: "", slug: "", values: "" }); setDialog(true); }, []);
  const openEdit = (a: Attribute) => { setEditing(a); setForm({ name: a.name, slug: a.slug, values: (a.values || []).join(", ") }); setDialog(true); };

  const setAddNew = useAdminHeaderStore((s) => s.setAddNew);
  useEffect(() => { setAddNew("Add Attribute", openAdd); return () => setAddNew("", null); }, [setAddNew, openAdd]);

  const save = async () => {
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    const payload = { name: form.name, slug: form.slug || toSlug(form.name), values: form.values.split(",").map(v => v.trim()).filter(Boolean) };
    try {
      if (editing) {
        await apiFetch(`/api/admin/attributes/${editing.id}`, { method: "PUT", body: JSON.stringify(payload) });
        toast.success("Attribute updated");
      } else {
        await apiFetch("/api/admin/attributes", { method: "POST", body: JSON.stringify(payload) });
        toast.success("Attribute created");
      }
      setDialog(false); load();
    } catch (e: any) { toast.error(e?.message || "Save failed"); } finally { setSaving(false); }
  };

  const doDelete = async () => {
    if (!deleteTarget) return;
    try {
      await apiFetch(`/api/admin/attributes/${deleteTarget.id}`, { method: "DELETE" });
      toast.success("Attribute deleted"); setDeleteTarget(null); load();
    } catch { toast.error("Delete failed"); }
  };

  const filtered = attrs.filter(a => !search || a.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-5">
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input placeholder="Search attributes..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-sm border-slate-200" />
      </div>

      <Card className="rounded-xl border-slate-200 shadow-sm py-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 border-b border-slate-100 hover:bg-slate-50">
              {["Name","Slug","Values","Created",""].map(h => (
                <TableHead key={h} className="text-[11px] font-semibold uppercase text-slate-500 px-4 py-3">{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? Array.from({length:5}).map((_,i) => (
              <TableRow key={i}><TableCell colSpan={5} className="px-4 py-3"><Skeleton className="h-5 w-full" /></TableCell></TableRow>
            )) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-16 text-slate-400">
                <Settings2 className="mx-auto h-8 w-8 mb-2 opacity-30" />
                No attributes yet. Attributes define filterable product specs.
              </TableCell></TableRow>
            ) : filtered.map((a) => (
              <TableRow key={a.id} className="border-b border-slate-100 hover:bg-slate-50">
                <TableCell className="px-4 py-3 font-semibold text-[13px] text-slate-900">{a.name}</TableCell>
                <TableCell className="px-4 py-3"><code className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{a.slug}</code></TableCell>
                <TableCell className="px-4 py-3 text-[12px] text-slate-600 max-w-xs truncate">{(a.values || []).join(" · ") || "—"}</TableCell>
                <TableCell className="px-4 py-3 text-[12px] text-slate-500">{new Date(a.createdAt).toLocaleDateString()}</TableCell>
                <TableCell className="px-4 py-3">
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEdit(a)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500 hover:bg-red-50" onClick={() => setDeleteTarget(a)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Edit Attribute" : "Add Attribute"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5"><Label>Name <span className="text-red-500">*</span></Label>
              <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value, slug: f.slug || toSlug(e.target.value) }))} placeholder="e.g. Material, Wattage" /></div>
            <div className="space-y-1.5"><Label>Slug</Label>
              <Input value={form.slug} onChange={(e) => setForm(f => ({...f, slug: toSlug(e.target.value)}))} /></div>
            <div className="space-y-1.5"><Label>Values <span className="text-[11px] text-slate-400">(comma separated)</span></Label>
              <Input value={form.values} onChange={(e) => setForm(f => ({...f, values: e.target.value}))} placeholder="Copper, Aluminum, Steel" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving} className="bg-epf-500 hover:bg-epf-600 text-white">{saving ? "Saving…" : editing ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Attribute</AlertDialogTitle>
            <AlertDialogDescription>Delete <strong>"{deleteTarget?.name}"</strong>?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={doDelete} className="bg-red-500 hover:bg-red-600 text-white">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
