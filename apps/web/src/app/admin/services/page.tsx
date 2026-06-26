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
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Search } from "lucide-react";

interface Service { id: string; name: string; description: string | null; price: number; duration: string | null; categoryId: string | null; category?: { name: string } | null; image: string | null; isActive: boolean; }
interface SvcCat { id: string; name: string; }

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [svcCats, setSvcCats] = useState<SvcCat[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [form, setForm] = useState({ name: "", description: "", price: 0, duration: "", categoryId: "", image: "", isActive: true });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const [svcRes, catRes] = await Promise.all([
        apiFetch<{ data: Service[] }>("/api/admin/services"),
        apiFetch<{ data: SvcCat[] }>("/api/admin/service-categories").catch(() => ({ data: [] })),
      ]);
      setServices(svcRes.data);
      setSvcCats((catRes as any)?.data ?? []);
    } catch { toast.error("Failed to load services"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm({ name: "", description: "", price: 0, duration: "", categoryId: "", image: "", isActive: true }); setDialog(true); };
  const openEdit = (s: Service) => { setEditing(s); setForm({ name: s.name, description: s.description||"", price: s.price, duration: s.duration||"", categoryId: s.categoryId||"", image: s.image||"", isActive: s.isActive }); setDialog(true); };

  const save = async () => {
    if (!form.name) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      const payload = { ...form, categoryId: form.categoryId||null, image: form.image||null, description: form.description||null };
      if (editing) { await apiFetch(`/api/admin/services/${editing.id}`, { method: "PUT", body: JSON.stringify(payload) }); toast.success("Service updated"); }
      else { await apiFetch("/api/admin/services", { method: "POST", body: JSON.stringify(payload) }); toast.success("Service created"); }
      setDialog(false); load();
    } catch { toast.error("Failed to save"); } finally { setSaving(false); }
  };

  const filtered = services.filter(s=>s.name.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="space-y-4"><Skeleton className="h-8 w-48" />{[1,2,3].map(i=><Skeleton key={i} className="h-16 w-full" />)}</div>;

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
            <TableCell><Button variant="outline" size="icon" onClick={()=>openEdit(s)}><Pencil className="h-4 w-4" /></Button></TableCell>
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
              <Select value={form.categoryId} onValueChange={v=>setForm({...form,categoryId:v})}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent><SelectItem value="">No category</SelectItem>
                  {svcCats.map(c=><SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Image URL</Label><Input value={form.image} onChange={e=>setForm({...form,image:e.target.value})} /></div>
            <div className="flex items-center gap-2"><Switch checked={form.isActive} onCheckedChange={v=>setForm({...form,isActive:v})} /><Label>Active</Label></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={()=>setDialog(false)}>Cancel</Button><Button onClick={save} disabled={saving}>{saving?"Saving...":"Save"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
