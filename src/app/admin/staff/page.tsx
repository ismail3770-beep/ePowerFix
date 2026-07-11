"use client";

import { useEffect, useState, useCallback } from "react";
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
import { RefreshCw, Trash2, ShieldCheck } from "lucide-react";

interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string | null;
  isActive: boolean;
  createdAt: string;
}

const defaultForm = { name: "", email: "", password: "", phone: "" };

export default function AdminStaffPage() {
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState<{ open: boolean }>({ open: false });
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ data: { data: StaffUser[] } | StaffUser[] }>("/api/admin/users?role=ADMIN");
      const list = (res.data as any)?.data ?? (Array.isArray(res.data) ? res.data : []);
      setStaff(list);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load staff");
    } finally {
      setLoading(false);
    }
  }, []);

  const setAddNew = useAdminHeaderStore((s) => s.setAddNew);
  useEffect(() => {
    setAddNew("Add Staff", () => { setForm(defaultForm); setDialog({ open: true }); });
    return () => setAddNew("", null);
  }, [setAddNew]);

  useEffect(() => { fetchStaff(); }, [fetchStaff]);

  async function save() {
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      toast.error("Name, email, and password are required");
      return;
    }
    if (form.password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setSaving(true);
    try {
      await apiFetch("/api/admin/users", {
        method: "POST",
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
          phone: form.phone || null,
          role: "ADMIN",
        }),
      });
      toast.success("Staff member added");
      setDialog({ open: false });
      fetchStaff();
    } catch (err: any) {
      toast.error(err?.message || "Failed to add staff");
    } finally {
      setSaving(false);
    }
  }

  async function remove(s: StaffUser) {
    if (!confirm(`Remove "${s.name}" from staff? They will be deactivated.`)) {return;}
    try {
      await apiFetch(`/api/admin/users/${s.id}`, { method: "DELETE" });
      toast.success("Staff member removed");
      setStaff((prev) => prev.filter((x) => x.id !== s.id));
    } catch (err: any) {
      toast.error(err?.message || "Failed to remove");
    }
  }

  async function toggleActive(s: StaffUser) {
    try {
      await apiFetch(`/api/admin/users/${s.id}`, {
        method: "PUT",
        body: JSON.stringify({ isActive: !s.isActive }),
      });
      setStaff((prev) => prev.map((x) => (x.id === s.id ? { ...x, isActive: !x.isActive } : x)));
      toast.success(`Staff ${s.isActive ? "deactivated" : "activated"}`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to update");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Staff</h1>
          <p className="text-sm text-[#6B7280] mt-1">Manage admin team members</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchStaff} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Admin Team</CardTitle></CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : staff.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">No staff members found.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staff.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center">
                          {s.name.charAt(0).toUpperCase()}
                        </div>
                        {s.name}
                      </TableCell>
                      <TableCell>{s.email}</TableCell>
                      <TableCell>{s.phone || "—"}</TableCell>
                      <TableCell>
                        <Badge className="bg-purple-100 text-purple-800 gap-1"><ShieldCheck className="h-3 w-3" /> {s.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <button onClick={() => toggleActive(s)}>
                          {s.isActive ? <Badge className="bg-green-100 text-green-800">Active</Badge> : <Badge variant="secondary">Inactive</Badge>}
                        </button>
                      </TableCell>
                      <TableCell className="text-xs">{new Date(s.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="text-red-600 hover:bg-red-50" onClick={() => remove(s)} title="Remove">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialog.open} onOpenChange={(o) => { if (!o) {setDialog({ open: false });} }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Staff Member</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Full Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Email *</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Password * (min 6 chars)</Label>
              <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+880..." />
            </div>
            <p className="text-xs text-muted-foreground bg-blue-50 p-2 rounded">
              New staff will be created with ADMIN role and full panel access.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog({ open: false })}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? "Adding..." : "Add Staff"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
