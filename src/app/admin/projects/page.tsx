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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { Pencil, Trash2, RefreshCw } from "lucide-react";

interface Project {
  id: string;
  title: string;
  slug: string;
  description: string;
  coverImage?: string | null;
  images?: string | string[];
  client?: string | null;
  location?: string | null;
  status: string;
  createdAt: string;
}

const defaultForm = {
  title: "", description: "", coverImage: "", images: "",
  client: "", location: "", status: "COMPLETED",
};

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState<{ open: boolean; edit?: Project }>({ open: false });
  const [form, setForm] = useState(() => loadFormDraft("admin-project-add", defaultForm));
  const [saving, setSaving] = useState(false);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ data: { data: Project[] } | Project[] }>("/api/admin/projects");
      const list = (res.data as any)?.data ?? (Array.isArray(res.data) ? res.data : []);
      setProjects(list);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, []);

  // Persist the add-form draft so a refresh / navigation doesn't lose progress.
  useFormDraft("admin-project-add", dialog.open && !dialog.edit ? form : defaultForm);

  const setAddNew = useAdminHeaderStore((s) => s.setAddNew);
  useEffect(() => {
    setAddNew("Add Project", () => { setForm(loadFormDraft("admin-project-add", defaultForm)); setDialog({ open: true }); });
    return () => setAddNew("", null);
  }, [setAddNew]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  function parseImages(p: Project): string {
    if (Array.isArray(p.images)) return p.images.join(", ");
    if (typeof p.images === "string" && p.images) {
      try { return JSON.parse(p.images).join(", "); } catch { return ""; }
    }
    return "";
  }

  function openEdit(p: Project) {
    setForm({
      title: p.title,
      description: p.description,
      coverImage: p.coverImage || "",
      images: parseImages(p),
      client: p.client || "",
      location: p.location || "",
      status: p.status,
    });
    setDialog({ open: true, edit: p });
  }

  async function save() {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    if (!form.description.trim()) { toast.error("Description is required"); return; }
    setSaving(true);
    try {
      const images = form.images.split(",").map((s) => s.trim()).filter(Boolean);
      const payload: any = {
        title: form.title.trim(),
        description: form.description,
        coverImage: form.coverImage || null,
        images,
        client: form.client || null,
        location: form.location || null,
        status: form.status,
      };
      if (dialog.edit) {
        await apiFetch(`/api/admin/projects/${dialog.edit.id}`, { method: "PUT", body: JSON.stringify(payload) });
        toast.success("Project updated");
      } else {
        await apiFetch("/api/admin/projects", { method: "POST", body: JSON.stringify(payload) });
        toast.success("Project created");
      }
      setDialog({ open: false });
      if (!dialog.edit) clearFormDraft("admin-project-add");
      fetchProjects();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function remove(p: Project) {
    if (!confirm(`Delete "${p.title}"?`)) return;
    try {
      await apiFetch(`/api/admin/projects/${p.id}`, { method: "DELETE" });
      toast.success("Project deleted");
      setProjects((prev) => prev.filter((x) => x.id !== p.id));
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Projects</h1>
          <p className="text-sm text-[#6B7280] mt-1">Manage portfolio & sellable projects</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchProjects} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">All Projects</CardTitle></CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : projects.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">No projects found. Click "Add Project" to create one.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.title}</TableCell>
                      <TableCell>{p.client || "—"}</TableCell>
                      <TableCell>{p.location || "—"}</TableCell>
                      <TableCell><Badge variant="outline">{p.status}</Badge></TableCell>
                      <TableCell className="text-xs">{new Date(p.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(p)} title="Edit"><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="text-red-600 hover:bg-red-50" onClick={() => remove(p)} title="Delete"><Trash2 className="h-4 w-4" /></Button>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{dialog.edit ? "Edit Project" : "Add Project"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Project title" />
            </div>
            <div className="space-y-1.5">
              <Label>Description *</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Client</Label>
                <Input value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Location</Label>
                <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Cover Image URL</Label>
              <Input value={form.coverImage} onChange={(e) => setForm({ ...form, coverImage: e.target.value })} placeholder="https://..." />
            </div>
            <div className="space-y-1.5">
              <Label>Images (comma-separated URLs)</Label>
              <Input value={form.images} onChange={(e) => setForm({ ...form, images: e.target.value })} placeholder="url1, url2, url3" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="PLANNED">Planned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
