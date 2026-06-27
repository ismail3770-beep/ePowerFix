"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogHeader, DialogContent, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { SingleImageUploader } from "@/components/ImageUploader";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Search } from "lucide-react";

interface Category { id: string; name: string; slug: string; icon: string | null; description: string | null; parentId: string | null; parent?: { name: string } | null; image: string | null; }

export default function CategoriesPage() {
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", icon: "", description: "", parentId: "", image: "" });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try { const res = await apiFetch<{ data: Category[] }>("/api/admin/product-categories"); setCats(res.data); }
    catch { toast.error("Failed to load categories"); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm({ name: "", slug: "", icon: "", description: "", parentId: "", image: "" }); setDialog(true); };
  const openEdit = (c: Category) => { setEditing(c); setForm({ name: c.name, slug: c.slug, icon: c.icon||"", description: c.description||"", parentId: c.parentId||"", image: c.image||"" }); setDialog(true); };

  const generateSlug = (name: string) => name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  const save = async () => {
    if (!form.name) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      const payload = { ...form, slug: form.slug || generateSlug(form.name), parentId: form.parentId || null, icon: form.icon || null, image: form.image || null, description: form.description || null };
      if (editing) { await apiFetch(`/api/admin/product-categories/${editing.id}`, { method: "PUT", body: JSON.stringify(payload) }); toast.success("Category updated"); }
      else { await apiFetch("/api/admin/product-categories", { method: "POST", body: JSON.stringify(payload) }); toast.success("Category created"); }
      setDialog(false); load();
    } catch { toast.error("Failed to save"); } finally { setSaving(false); }
  };

  const filtered = cats.filter(c=>c.name.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="space-y-4"><Skeleton className="h-8 w-48" />{[1,2,3].map(i=><Skeleton key={i} className="h-16 w-full" />)}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold">Categories</h1><p className="text-gray-500 text-sm">Manage product categories</p></div>
        <Button onClick={openAdd}><Plus className="h-4 w-4 mr-2" />Add Category</Button>
      </div>
      <div className="relative w-72"><Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" /><Input placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)} className="pl-9" /></div>

      <Card><CardContent className="p-0"><div className="overflow-x-auto">
        <Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Slug</TableHead><TableHead>Parent</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader><TableBody>
          {filtered.length===0?<TableRow><TableCell colSpan={4} className="text-center py-8 text-gray-500">No categories found</TableCell></TableRow>:
          filtered.map(c=><TableRow key={c.id}>
            <TableCell className="font-medium">{c.icon&&<span className="mr-2">{c.icon}</span>}{c.name}</TableCell>
            <TableCell className="text-gray-500">{c.slug}</TableCell>
            <TableCell>{c.parent?.name||"-"}</TableCell>
            <TableCell><Button variant="outline" size="icon" onClick={()=>openEdit(c)}><Pencil className="h-4 w-4" /></Button></TableCell>
          </TableRow>)}
        </TableBody></Table>
      </div></CardContent></Card>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent><DialogHeader><DialogTitle>{editing?"Edit Category":"Add Category"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div><Label>Name</Label><Input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} /></div>
            <div><Label>Slug</Label><Input value={form.slug} onChange={e=>setForm({...form,slug:e.target.value})} /></div>
            <div><Label>Icon (emoji or icon name)</Label><Input value={form.icon} onChange={e=>setForm({...form,icon:e.target.value})} /></div>
            <div><Label>Parent Category</Label>
              <Select value={form.parentId} onValueChange={v=>setForm({...form,parentId:v})}>
                <SelectTrigger><SelectValue placeholder="None (top level)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None (top level)</SelectItem>
                  {cats.filter(c=>c.id!==editing?.id).map(c=><SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <SingleImageUploader
                value={form.image}
                onChange={(url) => setForm({ ...form, image: url })}
                label="Category Image"
              />
            </div>
            <div><Label>Description</Label><textarea className="w-full min-h-[80px] rounded-md border border-input bg-transparent px-3 py-2 text-sm" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={()=>setDialog(false)}>Cancel</Button><Button onClick={save} disabled={saving}>{saving?"Saving...":"Save"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
