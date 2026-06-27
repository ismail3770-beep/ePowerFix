"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogHeader, DialogContent, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SingleImageUploader } from "@/components/ImageUploader";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface Brand { id: string; name: string; slug: string; logo: string | null; description: string | null; _count: { products: number }; }

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<Brand | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", logo: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const load = async () => {
    try {
      const res = await apiFetch<{ data: Brand[] }>("/api/admin/brands");
      setBrands(res.data);
    } catch { toast.error("Failed to load brands"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: "", slug: "", logo: "", description: "" });
    setDialog(true);
  };

  const openEdit = (b: Brand) => {
    setEditing(b);
    setForm({ name: b.name, slug: b.slug, logo: b.logo || "", description: b.description || "" });
    setDialog(true);
  };

  const generateSlug = (name: string) => name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  const save = async () => {
    if (!form.name) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      const payload = { ...form, slug: form.slug || generateSlug(form.name), logo: form.logo || null, description: form.description || null };
      if (editing) { await apiFetch(`/api/admin/brands/${editing.id}`, { method: "PUT", body: JSON.stringify(payload) }); toast.success("Brand updated"); }
      else { await apiFetch("/api/admin/brands", { method: "POST", body: JSON.stringify(payload) }); toast.success("Brand created"); }
      setDialog(false);
      load();
    } catch { toast.error("Failed to save brand"); }
    finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    try { await apiFetch(`/api/admin/brands/${id}`, { method: "DELETE" }); toast.success("Brand deleted"); load(); }
    catch { toast.error("Failed to delete"); }
    finally { setDeleteTarget(null); }
  };

  const filtered = brands.filter((b) => b.name.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="space-y-4"><Skeleton className="h-8 w-48" />{[1,2,3].map(i=><Skeleton key={i} className="h-16 w-full" />)}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold">Brands</h1><p className="text-gray-500 text-sm">Manage product brands</p></div>
        <Button onClick={openAdd}><Plus className="h-4 w-4 mr-2" />Add Brand</Button>
      </div>

      <div className="relative w-72"><Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" /><Input placeholder="Search brands..." value={search} onChange={e=>setSearch(e.target.value)} className="pl-9" /></div>

      <Card><CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Slug</TableHead><TableHead>Products</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader><TableBody>
            {filtered.length===0?<TableRow><TableCell colSpan={4} className="text-center py-8 text-gray-500">No brands found</TableCell></TableRow>:
            filtered.map(b=><TableRow key={b.id}>
              <TableCell className="font-medium">{b.name}</TableCell>
              <TableCell className="text-gray-500">{b.slug}</TableCell>
              <TableCell>{b._count?.products ?? 0}</TableCell>
              <TableCell><div className="flex gap-2"><Button variant="outline" size="icon" onClick={()=>openEdit(b)}><Pencil className="h-4 w-4" /></Button><Button variant="destructive" size="icon" onClick={()=>setDeleteTarget(b.id)}><Trash2 className="h-4 w-4" /></Button></div></TableCell>
            </TableRow>)}
          </TableBody></Table>
        </div>
      </CardContent></Card>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent><DialogHeader><DialogTitle>{editing?"Edit Brand":"Add Brand"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div><Label>Name</Label><Input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} /></div>
            <div><Label>Slug</Label><Input value={form.slug} onChange={e=>setForm({...form,slug:e.target.value})} placeholder="Auto-generated from name" /></div>
            <div className="space-y-2">
              <SingleImageUploader
                value={form.logo}
                onChange={(url) => setForm({ ...form, logo: url })}
                label="Brand Logo"
              />
            </div>
            <div><Label>Description</Label><textarea className="w-full min-h-[80px] rounded-md border border-input bg-transparent px-3 py-2 text-sm" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={()=>setDialog(false)}>Cancel</Button><Button onClick={save} disabled={saving}>{saving?"Saving...":"Save"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => remove(deleteTarget!)}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
