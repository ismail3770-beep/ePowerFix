"use client";

import { useEffect, useState, useCallback } from "react";
import { useFormDraft, loadFormDraft, clearFormDraft } from "@/hooks/use-form-draft";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { useAdminHeaderStore } from "@/store/admin-header-store";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogHeader, DialogContent, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Pencil, Trash2, RefreshCw } from "lucide-react";

interface ServiceCategory {
  id: string;
  name: string;
  nameBn: string;
  slug: string;
  icon?: string | null;
  image?: string | null;
  sortOrder: number;
  isActive: boolean;
  _count?: { services: number };
  createdAt: string;
}

const defaultForm = {
  name: "", nameBn: "", icon: "", image: "", sortOrder: 0, isActive: true,
};

export default function AdminServiceCategoriesPage() {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState<{ open: boolean; edit?: ServiceCategory }>({ open: false });
  const [form, setForm] = useState(() => loadFormDraft("admin-service-category-add", defaultForm));
  const [saving, setSaving] = useState(false);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ data: ServiceCategory[] }>("/api/admin/service-categories");
      const list = Array.isArray(res.data) ? res.data : (res.data as any)?.data || [];
      setCategories(list);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load service categories");
    } finally {
      setLoading(false);
    }
  }, []);

  // Persist the add-form draft so a refresh / navigation doesn't lose progress.
  useFormDraft("admin-service-category-add", dialog.open && !dialog.edit ? form : defaultForm);

  const setAddNew = useAdminHeaderStore((s) => s.setAddNew);
  useEffect(() => {
    setAddNew("Add Service Category", () => { setForm(loadFormDraft("admin-service-category-add", defaultForm)); setDialog({ open: true }); });
    return () => setAddNew("", null);
  }, [setAddNew]);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  function openEdit(c: ServiceCategory) {
    setForm({
      name: c.name,
      nameBn: c.nameBn || "",
      icon: c.icon || "",
      image: c.image || "",
      sortOrder: c.sortOrder || 0,
      isActive: c.isActive,
    });
    setDialog({ open: true, edit: c });
  }

  async function save() {
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      const payload: any = {
        name: form.name.trim(),
        nameBn: form.nameBn.trim() || form.name.trim(),
        icon: form.icon || null,
        image: form.image || null,
        sortOrder: Number(form.sortOrder) || 0,
        isActive: form.isActive,
      };
      if (dialog.edit) {
        await apiFetch(`/api/admin/service-categories/${dialog.edit.id}`, { method: "PUT", body: JSON.stringify(payload) });
        toast.success("Category updated");
      } else {
        await apiFetch("/api/admin/service-categories", { method: "POST", body: JSON.stringify(payload) });
        toast.success("Category created");
      }
      setDialog({ open: false });
      if (!dialog.edit) clearFormDraft("admin-service-category-add");
      fetchCategories();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function remove(c: ServiceCategory) {
    if (!confirm(`Delete "${c.name}"?`)) return;
    try {
      await apiFetch(`/api/admin/service-categories/${c.id}`, { method: "DELETE" });
      toast.success("Category deleted");
      setCategories((prev) => prev.filter((x) => x.id !== c.id));
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Service Categories</h1>
          <p className="text-sm text-[#6B7280] mt-1">Organize services into categories</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchCategories} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">All Service Categories</CardTitle></CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : categories.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">No service categories found.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Icon</TableHead>
                    <TableHead>Services</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">{c.slug}</TableCell>
                      <TableCell>{c.icon || "—"}</TableCell>
                      <TableCell>{c._count?.services ?? 0}</TableCell>
                      <TableCell>{c.sortOrder}</TableCell>
                      <TableCell>
                        {c.isActive ? <Badge className="bg-green-100 text-green-800">Active</Badge> : <Badge variant="secondary">Inactive</Badge>}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(c)} title="Edit"><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="text-red-600 hover:bg-red-50" onClick={() => remove(c)} title="Delete"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialog.open} onOpenChange={(o) => { if (!o) setDialog({ open: false }); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{dialog.edit ? "Edit Category" : "Add Service Category"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Solar Installation" />
            </div>
            <div className="space-y-1.5">
              <Label>Name (Bengali)</Label>
              <Input value={form.nameBn} onChange={(e) => setForm({ ...form, nameBn: e.target.value })} placeholder="বাংলা নাম" />
            </div>
            <div className="space-y-1.5">
              <Label>Icon (emoji or name)</Label>
              <Input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="e.g. 🔋 or solar-panel" />
            </div>
            <div className="space-y-1.5">
              <Label>Image URL</Label>
              <Input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="https://..." />
            </div>
            <div className="space-y-1.5">
              <Label>Sort Order</Label>
              <Input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch checked={form.isActive} onCheckedChange={(c) => setForm({ ...form, isActive: c })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog({ open: false })}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
