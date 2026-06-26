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

interface Coupon { id: string; code: string; discount: number; discountType: string; minOrder: number | null; maxUses: number | null; usedCount: number; validFrom: string; validTo: string; isActive: boolean; }

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [form, setForm] = useState({ code: "", discount: 0, discountType: "PERCENTAGE", minOrder: 0, maxUses: 0, validFrom: "", validTo: "", isActive: true });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try { const res = await apiFetch<{ data: Coupon[] }>("/api/admin/coupons"); setCoupons(res.data); }
    catch { toast.error("Failed to load coupons"); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm({ code: "", discount: 0, discountType: "PERCENTAGE", minOrder: 0, maxUses: 0, validFrom: "", validTo: "", isActive: true }); setDialog(true); };
  const openEdit = (c: Coupon) => { setEditing(c); setForm({ code: c.code, discount: c.discount, discountType: c.discountType, minOrder: c.minOrder||0, maxUses: c.maxUses||0, validFrom: c.validFrom?.split("T")[0]||"", validTo: c.validTo?.split("T")[0]||"", isActive: c.isActive }); setDialog(true); };

  const save = async () => {
    if (!form.code) { toast.error("Code is required"); return; }
    setSaving(true);
    try {
      const payload = { ...form, minOrder: form.minOrder||null, maxUses: form.maxUses||null };
      if (editing) { await apiFetch(`/api/admin/coupons/${editing.id}`, { method: "PUT", body: JSON.stringify(payload) }); toast.success("Coupon updated"); }
      else { await apiFetch("/api/admin/coupons", { method: "POST", body: JSON.stringify(payload) }); toast.success("Coupon created"); }
      setDialog(false); load();
    } catch { toast.error("Failed to save"); } finally { setSaving(false); }
  };

  const toggleActive = async (c: Coupon) => {
    try { await apiFetch(`/api/admin/coupons/${c.id}`, { method: "PUT", body: JSON.stringify({ isActive: !c.isActive }) }); toast.success("Coupon updated"); load(); }
    catch { toast.error("Failed to update"); }
  };

  const filtered = coupons.filter(c=>c.code.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="space-y-4"><Skeleton className="h-8 w-48" />{[1,2,3].map(i=><Skeleton key={i} className="h-16 w-full" />)}</div>;

  const today = new Date();
  const isValidDate = (d: string) => d && new Date(d) > today;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold">Coupons</h1><p className="text-gray-500 text-sm">Manage discount coupons</p></div>
        <Button onClick={openAdd}><Plus className="h-4 w-4 mr-2" />Add Coupon</Button>
      </div>
      <div className="relative w-72"><Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" /><Input placeholder="Search coupons..." value={search} onChange={e=>setSearch(e.target.value)} className="pl-9" /></div>

      <Card><CardContent className="p-0"><div className="overflow-x-auto">
        <Table><TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Discount</TableHead><TableHead>Min Order</TableHead><TableHead>Uses</TableHead><TableHead>Valid</TableHead><TableHead>Active</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader><TableBody>
          {filtered.length===0?<TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-500">No coupons found</TableCell></TableRow>:
          filtered.map(c=><TableRow key={c.id}>
            <TableCell className="font-mono font-bold">{c.code}</TableCell>
            <TableCell>{c.discountType==="PERCENTAGE"?`${c.discount}%`:`৳${c.discount}`}</TableCell>
            <TableCell>{c.minOrder?`৳${c.minOrder}`:"-"}</TableCell>
            <TableCell>{c.usedCount??0}/{c.maxUses||"∞"}</TableCell>
            <TableCell><Badge variant={isValidDate(c.validTo)?"default":"secondary"}>{isValidDate(c.validTo)?"Active":"Expired"}</Badge></TableCell>
            <TableCell><Switch checked={c.isActive} onCheckedChange={()=>toggleActive(c)} /></TableCell>
            <TableCell><Button variant="outline" size="icon" onClick={()=>openEdit(c)}><Pencil className="h-4 w-4" /></Button></TableCell>
          </TableRow>)}
        </TableBody></Table>
      </div></CardContent></Card>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent><DialogHeader><DialogTitle>{editing?"Edit Coupon":"Add Coupon"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div><Label>Code</Label><Input value={form.code} onChange={e=>setForm({...form,code:e.target.value.toUpperCase()})} placeholder="SUMMER25" /></div>
            <div><Label>Discount Value</Label><Input type="number" value={form.discount} onChange={e=>setForm({...form,discount:Number(e.target.value)})} /></div>
            <div><Label>Discount Type</Label>
              <Select value={form.discountType} onValueChange={v=>setForm({...form,discountType:v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="PERCENTAGE">Percentage (%)</SelectItem><SelectItem value="FIXED">Fixed (৳)</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label>Min Order (৳)</Label><Input type="number" value={form.minOrder} onChange={e=>setForm({...form,minOrder:Number(e.target.value)})} /></div>
            <div><Label>Max Uses</Label><Input type="number" value={form.maxUses} onChange={e=>setForm({...form,maxUses:Number(e.target.value)})} placeholder="0 = unlimited" /></div>
            <div><Label>Valid From</Label><Input type="date" value={form.validFrom} onChange={e=>setForm({...form,validFrom:e.target.value})} /></div>
            <div><Label>Valid To</Label><Input type="date" value={form.validTo} onChange={e=>setForm({...form,validTo:e.target.value})} /></div>
            <div className="flex items-center gap-2"><Switch checked={form.isActive} onCheckedChange={v=>setForm({...form,isActive:v})} /><Label>Active</Label></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={()=>setDialog(false)}>Cancel</Button><Button onClick={save} disabled={saving}>{saving?"Saving...":"Save"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
