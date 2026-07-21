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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Search, FileText, ExternalLink } from "lucide-react";
import { useAdminHeaderStore } from "@/store/admin-header-store";

interface Page {
  id: string;
  title: string;
  slug: string;
  content: string;
  isActive: boolean;
  metaTitle?: string | null;
  metaDescription?: string | null;
  createdAt: string;
  updatedAt: string;
}

const defaultForm = { title: "", slug: "", content: "", isActive: true, metaTitle: "", metaDescription: "" };

function toSlug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default function PagesAdminPage() {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<Page | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Page | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ data: Page[] | { data: Page[] } }>("/api/admin/pages");
      const list: Page[] = (res.data as any)?.data ?? (Array.isArray(res.data) ? res.data : []);
      setPages(list);
    } catch { toast.error("Failed to load pages"); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = useCallback(() => { setEditing(null); setForm(defaultForm); setDialog(true); }, []);
  const openEdit = (p: Page) => {
    setEditing(p);
    setForm({ title: p.title, slug: p.slug, content: p.content, isActive: p.isActive, metaTitle: p.metaTitle || "", metaDescription: p.metaDescription || "" });
    setDialog(true);
  };

  const setAddNew = useAdminHeaderStore((s) => s.setAddNew);
  useEffect(() => { setAddNew("Add Page", openAdd); return () => setAddNew("", null); }, [setAddNew, openAdd]);

  const set = (k: keyof typeof defaultForm, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    if (!form.slug.trim()) { toast.error("Slug is required"); return; }
    setSaving(true);
    try {
      if (editing) {
        await apiFetch(`/api/admin/pages/${editing.id}`, { method: "PUT", body: JSON.stringify(form) });
        toast.success("Page updated");
      } else {
        await apiFetch("/api/admin/pages", { method: "POST", body: JSON.stringify(form) });
        toast.success("Page created");
      }
      setDialog(false);
      load();
    } catch (e: any) { toast.error(e?.message || "Save failed"); }
    finally { setSaving(false); }
  };

  const doDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/admin/pages/${deleteTarget.id}`, { method: "DELETE" });
      toast.success("Page deleted");
      setDeleteTarget(null);
      load();
    } catch { toast.error("Delete failed"); } finally { setDeleting(false); }
  };

  const filtered = pages.filter((p) => {
    const q = search.toLowerCase();
    return !q || p.title.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-5">
      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input placeholder="Search pages..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-9 text-sm border-slate-200" />
      </div>

      {/* Table */}
      <Card className="rounded-xl border-slate-200 shadow-sm py-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 border-b border-slate-100 hover:bg-slate-50">
              {["Title","Slug","Status","Last Updated","Actions"].map(h => (
                <TableHead key={h} className="text-[11px] font-semibold uppercase text-slate-500 px-4 py-3">{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? Array.from({length:5}).map((_,i) => (
              <TableRow key={i}><TableCell colSpan={5} className="px-4 py-3"><Skeleton className="h-5 w-full" /></TableCell></TableRow>
            )) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-16 text-slate-400">
                <FileText className="mx-auto h-8 w-8 mb-2 opacity-30" />
                No pages yet. Click "Add Page" to create one.
              </TableCell></TableRow>
            ) : filtered.map((p) => (
              <TableRow key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                <TableCell className="px-4 py-3 font-medium text-[13px] text-slate-900">{p.title}</TableCell>
                <TableCell className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <code className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">/{p.slug}</code>
                    <a href={`/${p.slug}`} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-epf-500">
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </TableCell>
                <TableCell className="px-4 py-3">
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${p.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"}`}>
                    {p.isActive ? "Active" : "Inactive"}
                  </span>
                </TableCell>
                <TableCell className="px-4 py-3 text-[12px] text-slate-500">{new Date(p.updatedAt).toLocaleDateString()}</TableCell>
                <TableCell className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEdit(p)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => setDeleteTarget(p)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Page" : "Add Page"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label>Title <span className="text-red-500">*</span></Label>
                <Input value={form.title} onChange={(e) => {
                  set("title", e.target.value);
                  if (!editing) set("slug", toSlug(e.target.value));
                }} placeholder="About Us" />
              </div>
              <div className="space-y-1.5">
                <Label>Slug <span className="text-red-500">*</span></Label>
                <Input value={form.slug} onChange={(e) => set("slug", toSlug(e.target.value))} placeholder="about-us" />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <Switch checked={form.isActive} onCheckedChange={(v) => set("isActive", v)} />
                <Label>Active</Label>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Content</Label>
              <Textarea value={form.content} onChange={(e) => set("content", e.target.value)}
                rows={8} placeholder="Page content (HTML supported)..." className="resize-y font-mono text-sm" />
            </div>
            <div className="border-t border-slate-100 pt-4 space-y-3">
              <p className="text-[12px] font-semibold text-slate-500 uppercase tracking-wide">SEO (optional)</p>
              <div className="space-y-1.5">
                <Label>Meta Title</Label>
                <Input value={form.metaTitle} onChange={(e) => set("metaTitle", e.target.value)} placeholder="Leave blank to use page title" />
              </div>
              <div className="space-y-1.5">
                <Label>Meta Description</Label>
                <Textarea value={form.metaDescription} onChange={(e) => set("metaDescription", e.target.value)} rows={2} placeholder="Short description for search engines" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(false)} disabled={saving}>Cancel</Button>
            <Button onClick={save} disabled={saving} className="bg-epf-500 hover:bg-epf-600 text-white">
              {saving ? "Saving…" : editing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Page</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>"{deleteTarget?.title}"</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={doDelete} disabled={deleting} className="bg-red-500 hover:bg-red-600 text-white">
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
