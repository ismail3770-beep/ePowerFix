"use client";

import { useEffect, useState } from "react";
import { useFormDraft, loadFormDraft, clearFormDraft } from "@/hooks/use-form-draft";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogHeader, DialogContent, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { SingleImageUploader } from "@/components/ImageUploader";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useAdminHeaderStore } from "@/store/admin-header-store";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Service { id: string; name: string; description: string | null; price: number; duration: string | null; categoryId: string | null; category?: { name: string } | null; image: string | null; isActive: boolean; }
interface SvcCat { id: string; name: string; }

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [svcCats, setSvcCats] = useState<SvcCat[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const defaultServiceForm = { name: "", description: "", price: 0, duration: "", categoryId: "", image: "", isActive: true };
  const [form, setForm] = useState(() => loadFormDraft("admin-service-add", defaultServiceForm));
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    try {
      const [svcRes, catRes] = await Promise.all([
        apiFetch<{ data: Service[] }>("/api/admin/services"),
        apiFetch<{ data: SvcCat[] }>("/api/admin/service-categories").catch(() => ({ data: [] })),
      ]);
      setServices(Array.isArray(svcRes.data) ? svcRes.data : (svcRes.data as any)?.data || []);
      setSvcCats(Array.isArray(catRes.data) ? catRes.data : (catRes as any)?.data || []);
    } catch { toast.error("Failed to load services"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  // Persist the add-form draft so a refresh / navigation doesn't lose progress.
  useFormDraft("admin-service-add", !editing ? form : defaultServiceForm);

  const openAdd = () => { setEditing(null); setForm(loadFormDraft("admin-service-add", defaultServiceForm)); setDialog(true); };
  const openEdit = (s: Service) => { setEditing(s); setForm({ name: s.name, description: s.description||"", price: s.price, duration: s.duration||"", categoryId: s.categoryId||"", image: s.image||"", isActive: s.isActive }); setDialog(true); };

  const setAddNew = useAdminHeaderStore((s) => s.setAddNew);
  useEffect(() => { setAddNew('Add Service', openAdd); return () => setAddNew('', null); }, [setAddNew]);

  const save = async () => {
    if (!form.name) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      const payload = { ...form, categoryId: form.categoryId||null, image: form.image||null, description: form.description||null };
      if (editing) { await apiFetch(`/api/admin/services/${editing.id}`, { method: "PUT", body: JSON.stringify(payload) }); toast.success("Service updated"); }
      else { await apiFetch("/api/admin/services", { method: "POST", body: JSON.stringify(payload) }); toast.success("Service created"); }
      setDialog(false); if (!editing) {clearFormDraft("admin-service-add");} load();
    } catch { toast.error("Failed to save"); } finally { setSaving(false); }
  };

  const remove = async (s: Service) => {
    setDeleting(true);
    try {
      await apiFetch(`/api/admin/services/${s.id}`, { method: "DELETE" });
      toast.success("Service deleted");
      setDeleteTarget(null);
      load();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete service");
    } finally {
      setDeleting(false);
    }
  };

  const filtered = services.filter(s=>s.name.toLowerCase().includes(search.toLowerCase()));

  if (loading) {return <div className="space-y-4"><Skeleton className="h-8 w-48" />{[1,2,3].map(i=><Skeleton key={i} className="h-16 w-full" />)}</div>;}

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold">Services</h1><p className="text-gray-500 text-sm">Manage service offerings</p></div>
        <Button onClick={openAdd}><Plus className="h-4 w-4 mr-2" />Add Service</Button>
      </div>
      <div className="relative w-72"><Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" /><Input placeholder="Search services..." value={search} onChange={e=>setSearch(e.target.value)} className="pl-9" /></div>

      <Card><CardContent className="p-0"><div className="overflow-x-auto">
        <Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Price</TableHead><TableHead>Duration</TableHead><TableHead>Category</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader><TableBody>
          {filtered.length===0?<TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-500">No services found</TableCell></TableRow>:
          filtered.map(s=><TableRow key={s.id}>
            <TableCell className="font-medium">{s.name}</TableCell>
            <TableCell>৳{s.price}</TableCell>
            <TableCell className="text-gray-500">{s.duration||"-"}</TableCell>
            <TableCell>{s.category?.name||"-"}</TableCell>
            <TableCell><Badge variant={s.isActive?"default":"secondary"}>{s.isActive?"Active":"Inactive"}</Badge></TableCell>
            <TableCell>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={()=>openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                <Button variant="destructive" size="icon" onClick={()=>setDeleteTarget(s)} title="Delete"><Trash2 className="h-4 w-4" /></Button>
              </div>
            </TableCell>
          </TableRow>)}
        </TableBody></Table>
      </div></CardContent></Card>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent><DialogHeader><DialogTitle>{editing?"Edit Service":"Add Service"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div><Label>Name</Label><Input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} /></div>
            <div><Label>Description</Label><textarea className="w-full min-h-[80px] rounded-md border border-input bg-transparent px-3 py-2 text-sm" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} /></div>
            <div><Label>Price (৳)</Label><Input type="number" value={form.price} onChange={e=>setForm({...form,price:Number(e.target.value)})} /></div>
            <div><Label>Duration</Label><Input value={form.duration} onChange={e=>setForm({...form,duration:e.target.value})} placeholder="e.g. 2 hours" /></div>
            <div><Label>Category</Label>
              <Select value={form.categoryId || "__none__"} onValueChange={v=>setForm({...form,categoryId: v === "__none__" ? "" : v})}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent><SelectItem value="__none__">No category</SelectItem>
                  {svcCats.map(c=><SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <SingleImageUploader
                value={form.image}
                onChange={(url) => setForm({ ...form, image: url })}
                label="Service Image"
              />
            </div>
            <div className="flex items-center gap-2"><Switch checked={form.isActive} onCheckedChange={v=>setForm({...form,isActive:v})} /><Label>Active</Label></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={()=>setDialog(false)}>Cancel</Button><Button onClick={save} disabled={saving}>{saving?"Saving...":"Save"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) {setDeleteTarget(null);} }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete service?</AlertDialogTitle>
            <AlertDialogDescription>
              This will move <strong>{deleteTarget?.name}</strong> to trash.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteTarget && remove(deleteTarget)} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
