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
import { Plus, Pencil, Trash2, Search, Tag } from "lucide-react";
import { useAdminHeaderStore } from "@/store/admin-header-store";

interface TagItem {
  id: string;
  name: string;
  slug: string;
  _count?: { products?: number };
  createdAt: string;
}

function toSlug(s: string) { return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }

export default function TagsPage() {
  const [tags, setTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<TagItem | null>(null);
  const [form, setForm] = useState({ name: "", slug: "" });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TagItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ data: TagItem[] | { data: TagItem[] } }>("/api/admin/tags");
      const list: TagItem[] = (res.data as any)?.data ?? (Array.isArray(res.data) ? res.data : []);
      setTags(list);
    } catch { toast.error("Failed to load tags"); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = useCallback(() => { setEditing(null); setForm({ name: "", slug: "" }); setDialog(true); }, []);
  const openEdit = (t: TagItem) => { setEditing(t); setForm({ name: t.name, slug: t.slug }); setDialog(true); };

  const setAddNew = useAdminHeaderStore((s) => s.setAddNew);
  useEffect(() => { setAddNew("Add Tag", openAdd); return () => setAddNew("", null); }, [setAddNew, openAdd]);

  const save = async () => {
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    const payload = { name: form.name, slug: form.slug || toSlug(form.name) };
    try {
      if (editing) {
        await apiFetch(`/api/admin/tags/${editing.id}`, { method: "PUT", body: JSON.stringify(payload) });
        toast.success("Tag updated");
      } else {
        await apiFetch("/api/admin/tags", { method: "POST", body: JSON.stringify(payload) });
        toast.success("Tag created");
      }
      setDialog(false); load();
    } catch (e: any) { toast.error(e?.message || "Save failed"); } finally { setSaving(false); }
  };

  const doDelete = async () => {
    if (!deleteTarget) return;
    try {
      await apiFetch(`/api/admin/tags/${deleteTarget.id}`, { method: "DELETE" });
      toast.success("Tag deleted"); setDeleteTarget(null); load();
    } catch { toast.error("Delete failed"); }
  };

  const filtered = tags.filter(t => !search || t.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-5">
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input placeholder="Search tags..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-sm border-slate-200" />
      </div>

      <Card className="rounded-xl border-slate-200 shadow-sm py-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 border-b border-slate-100 hover:bg-slate-50">
              {["Name","Slug","Products","Created",""].map(h => (
                <TableHead key={h} className="text-[11px] font-semibold uppercase text-slate-500 px-4 py-3">{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? Array.from({length:6}).map((_,i) => (
              <TableRow key={i}><TableCell colSpan={5} className="px-4 py-3"><Skeleton className="h-5 w-full" /></TableCell></TableRow>
            )) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-16 text-slate-400">
                <Tag className="mx-auto h-8 w-8 mb-2 opacity-30" />
                No tags yet.
              </TableCell></TableRow>
            ) : filtered.map((t) => (
              <TableRow key={t.id} className="border-b border-slate-100 hover:bg-slate-50">
                <TableCell className="px-4 py-3 font-semibold text-[13px] text-slate-900">{t.name}</TableCell>
                <TableCell className="px-4 py-3"><code className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{t.slug}</code></TableCell>
                <TableCell className="px-4 py-3 text-[13px] text-slate-600">{t._count?.products ?? 0}</TableCell>
                <TableCell className="px-4 py-3 text-[12px] text-slate-500">{new Date(t.createdAt).toLocaleDateString()}</TableCell>
                <TableCell className="px-4 py-3">
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEdit(t)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500 hover:bg-red-50" onClick={() => setDeleteTarget(t)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{editing ? "Edit Tag" : "Add Tag"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5"><Label>Name <span className="text-red-500">*</span></Label>
              <Input value={form.name} onChange={(e) => { setForm(f => ({ ...f, name: e.target.value, slug: f.slug || toSlug(e.target.value) })); }} placeholder="e.g. solar, wiring" /></div>
            <div className="space-y-1.5"><Label>Slug</Label>
              <Input value={form.slug} onChange={(e) => setForm(f => ({...f, slug: toSlug(e.target.value)}))} placeholder="auto-generated" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving} className="bg-epf-500 hover:bg-epf-600 text-white">{saving ? "Saving…" : editing ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Tag</AlertDialogTitle>
            <AlertDialogDescription>Delete tag <strong>"{deleteTarget?.name}"</strong>?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={doDelete} className="bg-red-500 hover:bg-red-600 text-white">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
