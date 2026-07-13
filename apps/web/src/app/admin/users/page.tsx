"use client";

import { useEffect, useState, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search, Shield, ShieldOff, Trash2, Pencil, Users as UsersIcon, X,
} from "lucide-react";
import Pagination from "@/components/admin/Pagination";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  isActive: boolean;
  phone: string | null;
  createdAt: string;
  _count?: { orders: number };
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}

// Generate initials for avatar fallback
function getInitials(name: string | null, email: string): string {
  const base = (name || email || "?").trim();
  const parts = base.split(/\s+/).filter(Boolean);
  if (parts.length === 0) {return "?";}
  if (parts.length === 1) {return parts[0].charAt(0).toUpperCase();}
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

// Deterministic gradient based on user id so each user gets a stable color
const avatarGradients = [
  "from-epf-500 to-epf-600",
  "from-violet-500 to-purple-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-sky-500 to-cyan-600",
];

function getAvatarGradient(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {hash = id.charCodeAt(i) + ((hash << 5) - hash);}
  return avatarGradients[Math.abs(hash) % avatarGradients.length];
}

const roleStyles: Record<string, string> = {
  ADMIN: "bg-epf-50 text-epf-700 border-epf-200",
  SUPER_ADMIN: "bg-violet-50 text-violet-700 border-violet-200",
  CUSTOMER: "bg-slate-100 text-slate-600 border-slate-200",
  STAFF: "bg-amber-50 text-amber-700 border-amber-200",
};

const initialFilters = { search: "", role: "__all__", isActive: "__all__" };

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  // edit target for role/status inline editing
  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<{ role: string; isActive: boolean }>({ role: "CUSTOMER", isActive: true });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);
  const PAGE_LIMIT = 20;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (filters.search) {qs.set("search", filters.search);}
      if (filters.role && filters.role !== "__all__") {qs.set("role", filters.role);}
      if (filters.isActive && filters.isActive !== "__all__") {qs.set("isActive", filters.isActive);}
      qs.set("page", String(page));
      qs.set("limit", String(PAGE_LIMIT));
      const params = qs.toString() ? `?${qs.toString()}` : "";
      const res: any = await apiFetch(`/api/admin/users${params}`);
      setUsers(res.data?.data ?? []);
      setTotal(res.data?.total ?? 0);
      setTotalPages(res.data?.totalPages ?? 1);
    } catch (err: any) {
      toast.error(err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [filters]);

  // Client-side fallback filters when the API doesn't support role/isActive
  const visibleUsers = users.filter((u) => {
    if (filters.role !== "__all__" && u.role !== filters.role) {return false;}
    if (filters.isActive !== "__all__") {
      const wantActive = filters.isActive === "true";
      if (u.isActive !== wantActive) {return false;}
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const match =
        (u.name || "").toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.phone || "").toLowerCase().includes(q);
      if (!match) {return false;}
    }
    return true;
  });

  async function handleQuickRoleChange(userId: string, role: string) {
    try {
      await apiFetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        body: JSON.stringify({ role }),
      });
      toast.success("Role updated");
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
    } catch (err: any) {
      toast.error(err.message || "Failed to update role");
    }
  }

  async function handleQuickToggleActive(user: User) {
    const newActive = !user.isActive;
    try {
      await apiFetch(`/api/admin/users/${user.id}`, {
        method: "PUT",
        body: JSON.stringify({ isActive: newActive }),
      });
      toast.success(newActive ? "User unblocked" : "User blocked");
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, isActive: newActive } : u)));
    } catch (err: any) {
      toast.error(err.message || "Failed to update user");
    }
  }

  function openEdit(user: User) {
    setEditTarget(user);
    setEditForm({ role: user.role, isActive: user.isActive });
  }

  async function handleEditSave() {
    if (!editTarget) {return;}
    setSaving(true);
    try {
      await apiFetch(`/api/admin/users/${editTarget.id}`, {
        method: "PUT",
        body: JSON.stringify(editForm),
      });
      toast.success("User updated");
      setUsers((prev) => prev.map((u) => (u.id === editTarget.id ? { ...u, ...editForm } : u)));
      setEditTarget(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to update user");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteUser() {
    if (!deleteTarget) {return;}
    setDeleting(true);
    try {
      await apiFetch(`/api/admin/users/${deleteTarget.id}`, { method: "DELETE" });
      toast.success("User deleted");
      setDeleteTarget(null);
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
    } catch (err: any) {
      toast.error(err.message || "Failed to delete user");
    } finally {
      setDeleting(false);
    }
  }

  const hasActiveFilters =
    filters.search !== "" ||
    filters.role !== "__all__" ||
    filters.isActive !== "__all__";

  return (
    <div className="space-y-6">
      {/* ---------- HEADER ---------- */}
      <div>
        <h1 className="text-[24px] font-bold text-slate-900">Users</h1>
        <p className="text-[13px] text-slate-500 mt-0.5">
          {total} user{total === 1 ? "" : "s"} total
        </p>
      </div>

      {/* ---------- SEARCH + FILTERS ---------- */}
      <Card className="rounded-xl border-slate-200 shadow-sm py-0">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by name, email or phone..."
                className="pl-9 h-10 rounded-lg border-slate-200 bg-slate-50 focus:bg-white"
                value={filters.search}
                onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              />
              {filters.search && (
                <button
                  onClick={() => setFilters((f) => ({ ...f, search: "" }))}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={filters.role}
                onValueChange={(v) => setFilters((f) => ({ ...f, role: v }))}
              >
                <SelectTrigger className="w-[150px] h-10 rounded-lg border-slate-200">
                  <SelectValue placeholder="All roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All roles</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="CUSTOMER">Customer</SelectItem>
                  <SelectItem value="STAFF">Staff</SelectItem>
                  <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filters.isActive}
                onValueChange={(v) => setFilters((f) => ({ ...f, isActive: v }))}
              >
                <SelectTrigger className="w-[140px] h-10 rounded-lg border-slate-200">
                  <SelectValue placeholder="All status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All status</SelectItem>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  onClick={() => setFilters(initialFilters)}
                  className="h-10 rounded-lg border-slate-200 text-slate-600 hover:text-epf-600"
                >
                  <X className="mr-1.5 h-3.5 w-3.5" /> Clear
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ---------- TABLE ---------- */}
      <Card className="rounded-xl border-slate-200 shadow-sm py-0 overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : visibleUsers.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-epf-50 flex items-center justify-center mx-auto mb-4">
                <UsersIcon className="w-8 h-8 text-epf-500" />
              </div>
              <h3 className="text-[16px] font-semibold text-slate-900 mb-1">No users found</h3>
              <p className="text-[13px] text-slate-500 max-w-sm mx-auto">
                {hasActiveFilters
                  ? "Try adjusting your search or filters to find what you're looking for."
                  : "Users will appear here once they register on your store."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 border-b border-slate-100 hover:bg-slate-50">
                    <TableHead className="text-[11px] font-semibold uppercase text-slate-500 px-5 py-3">User</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase text-slate-500 px-5 py-3">Phone</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase text-slate-500 px-5 py-3">Role</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase text-slate-500 px-5 py-3">Status</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase text-slate-500 px-5 py-3 text-center">Orders</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase text-slate-500 px-5 py-3">Joined</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase text-slate-500 px-5 py-3 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleUsers.map((user) => (
                    <TableRow key={user.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <TableCell className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${getAvatarGradient(user.id)} flex items-center justify-center text-white text-[12px] font-bold flex-shrink-0`}>
                            {getInitials(user.name, user.email)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[14px] font-medium text-slate-900 truncate">
                              {user.name || <span className="text-slate-400 italic">No name</span>}
                            </p>
                            <p className="text-[12px] text-slate-500 truncate">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-5 py-3 text-[13px] text-slate-600">
                        {user.phone || <span className="text-slate-400">—</span>}
                      </TableCell>
                      <TableCell className="px-5 py-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 text-[11px] font-bold rounded-full border ${
                            roleStyles[user.role] || "bg-slate-100 text-slate-600 border-slate-200"
                          }`}
                        >
                          {user.role.replace("_", " ")}
                        </span>
                      </TableCell>
                      <TableCell className="px-5 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-bold rounded-full border ${
                            user.isActive
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-red-50 text-red-700 border-red-200"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? "bg-emerald-500" : "bg-red-500"}`} />
                          {user.isActive ? "Active" : "Inactive"}
                        </span>
                      </TableCell>
                      <TableCell className="px-5 py-3 text-center">
                        <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-2 text-[12px] font-semibold text-slate-700 bg-slate-100 rounded-full">
                          {user._count?.orders ?? 0}
                        </span>
                      </TableCell>
                      <TableCell className="px-5 py-3 text-[13px] text-slate-500">
                        {formatDate(user.createdAt)}
                      </TableCell>
                      <TableCell className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Select
                            value={user.role}
                            onValueChange={(v) => handleQuickRoleChange(user.id, v)}
                          >
                            <SelectTrigger className="h-8 w-[110px] rounded-lg border-slate-200 text-[12px]" title="Change role">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="CUSTOMER">CUSTOMER</SelectItem>
                              <SelectItem value="STAFF">STAFF</SelectItem>
                              <SelectItem value="ADMIN">ADMIN</SelectItem>
                              <SelectItem value="SUPER_ADMIN">SUPER_ADMIN</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openEdit(user)}
                            className="h-8 w-8 rounded-lg text-slate-400 hover:text-epf-600 hover:bg-epf-50"
                            title="Edit user"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleQuickToggleActive(user)}
                            className={`h-8 w-8 rounded-lg ${
                              user.isActive
                                ? "text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                                : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                            }`}
                            title={user.isActive ? "Block user" : "Unblock user"}
                          >
                            {user.isActive ? <ShieldOff className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setDeleteTarget(user)}
                            className="h-8 w-8 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                            title="Delete user"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {!loading && visibleUsers.length > 0 && (
            <div className="px-5 py-4 border-t border-slate-100">
              <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* ---------- EDIT DIALOG ---------- */}
      {editTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setEditTarget(null)}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="text-[16px] font-semibold text-slate-900">Edit User</h3>
              <button
                onClick={() => setEditTarget(null)}
                className="h-8 w-8 rounded-md flex items-center justify-center hover:bg-slate-100 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getAvatarGradient(editTarget.id)} flex items-center justify-center text-white text-[16px] font-bold`}>
                  {getInitials(editTarget.name, editTarget.email)}
                </div>
                <div className="min-w-0">
                  <p className="text-[15px] font-semibold text-slate-900 truncate">
                    {editTarget.name || "No name"}
                  </p>
                  <p className="text-[13px] text-slate-500 truncate">{editTarget.email}</p>
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-medium text-slate-600 mb-1.5">Role</label>
                <Select
                  value={editForm.role}
                  onValueChange={(v) => setEditForm((f) => ({ ...f, role: v }))}
                >
                  <SelectTrigger className="h-10 rounded-lg border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CUSTOMER">CUSTOMER</SelectItem>
                    <SelectItem value="STAFF">STAFF</SelectItem>
                    <SelectItem value="ADMIN">ADMIN</SelectItem>
                    <SelectItem value="SUPER_ADMIN">SUPER_ADMIN</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-[12px] font-medium text-slate-600 mb-1.5">Account Status</label>
                <Select
                  value={String(editForm.isActive)}
                  onValueChange={(v) => setEditForm((f) => ({ ...f, isActive: v === "true" }))}
                >
                  <SelectTrigger className="h-10 rounded-lg border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive (Blocked)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-slate-100">
              <Button
                variant="outline"
                onClick={() => setEditTarget(null)}
                className="rounded-lg"
              >
                Cancel
              </Button>
              <Button
                onClick={handleEditSave}
                disabled={saving}
                className="bg-epf-500 hover:bg-epf-600 text-white rounded-lg"
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- DELETE DIALOG ---------- */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="text-[16px] font-semibold text-slate-900">Delete User</h3>
            </div>
            <div className="p-5">
              <p className="text-[14px] text-slate-600">
                Are you sure you want to delete{" "}
                <strong className="text-slate-900">{deleteTarget.name || deleteTarget.email}</strong>?
                This action can be undone from the trashed users list.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-slate-100">
              <Button
                variant="outline"
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteUser}
                disabled={deleting}
                className="rounded-lg"
              >
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
