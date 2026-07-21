"use client";

import { useEffect, useState, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, GripVertical, Link as LinkIcon, Menu } from "lucide-react";
import { useAdminHeaderStore } from "@/store/admin-header-store";

interface MenuItem {
  id: string;
  label: string;
  url: string;
  order: number;
  isActive: boolean;
  target?: string;
}

interface MenuData {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  items: MenuItem[];
  createdAt: string;
}

const defaultMenuForm = { name: "", slug: "", isActive: true };
const defaultItemForm = { label: "", url: "", target: "_self", isActive: true };

function toSlug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default function MenusPage() {
  const [menus, setMenus] = useState<MenuData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMenu, setSelectedMenu] = useState<MenuData | null>(null);
  const [menuDialog, setMenuDialog] = useState(false);
  const [editingMenu, setEditingMenu] = useState<MenuData | null>(null);
  const [menuForm, setMenuForm] = useState(defaultMenuForm);
  const [itemDialog, setItemDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [itemForm, setItemForm] = useState(defaultItemForm);
  const [saving, setSaving] = useState(false);
  const [deleteMenuTarget, setDeleteMenuTarget] = useState<MenuData | null>(null);
  const [deleteItemTarget, setDeleteItemTarget] = useState<MenuItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ data: MenuData[] | { data: MenuData[] } }>("/api/admin/menus");
      const list: MenuData[] = (res.data as any)?.data ?? (Array.isArray(res.data) ? res.data : []);
      setMenus(list);
      if (list.length > 0 && !selectedMenu) setSelectedMenu(list[0]);
    } catch { toast.error("Failed to load menus"); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAddMenu = useCallback(() => { setEditingMenu(null); setMenuForm(defaultMenuForm); setMenuDialog(true); }, []);
  const openEditMenu = (m: MenuData) => { setEditingMenu(m); setMenuForm({ name: m.name, slug: m.slug, isActive: m.isActive }); setMenuDialog(true); };

  const setAddNew = useAdminHeaderStore((s) => s.setAddNew);
  useEffect(() => { setAddNew("Add Menu", openAddMenu); return () => setAddNew("", null); }, [setAddNew, openAddMenu]);

  const saveMenu = async () => {
    if (!menuForm.name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      if (editingMenu) {
        await apiFetch(`/api/admin/menus/${editingMenu.id}`, { method: "PUT", body: JSON.stringify(menuForm) });
        toast.success("Menu updated");
      } else {
        await apiFetch("/api/admin/menus", { method: "POST", body: JSON.stringify({ ...menuForm, slug: menuForm.slug || toSlug(menuForm.name) }) });
        toast.success("Menu created");
      }
      setMenuDialog(false);
      load();
    } catch (e: any) { toast.error(e?.message || "Save failed"); } finally { setSaving(false); }
  };

  const saveItem = async () => {
    if (!selectedMenu) return;
    if (!itemForm.label.trim() || !itemForm.url.trim()) { toast.error("Label and URL are required"); return; }
    setSaving(true);
    try {
      if (editingItem) {
        await apiFetch(`/api/admin/menus/${selectedMenu.id}/items/${editingItem.id}`, { method: "PUT", body: JSON.stringify(itemForm) });
        toast.success("Item updated");
      } else {
        await apiFetch(`/api/admin/menus/${selectedMenu.id}/items`, { method: "POST", body: JSON.stringify(itemForm) });
        toast.success("Item added");
      }
      setItemDialog(false);
      load();
    } catch (e: any) { toast.error(e?.message || "Save failed"); } finally { setSaving(false); }
  };

  const deleteMenu = async () => {
    if (!deleteMenuTarget) return;
    try {
      await apiFetch(`/api/admin/menus/${deleteMenuTarget.id}`, { method: "DELETE" });
      toast.success("Menu deleted");
      setDeleteMenuTarget(null);
      if (selectedMenu?.id === deleteMenuTarget.id) setSelectedMenu(null);
      load();
    } catch { toast.error("Delete failed"); }
  };

  const deleteItem = async () => {
    if (!deleteItemTarget || !selectedMenu) return;
    try {
      await apiFetch(`/api/admin/menus/${selectedMenu.id}/items/${deleteItemTarget.id}`, { method: "DELETE" });
      toast.success("Item deleted");
      setDeleteItemTarget(null);
      load();
    } catch { toast.error("Delete failed"); }
  };

  const activeMenu = menus.find(m => m.id === selectedMenu?.id) || selectedMenu;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* Menu list sidebar */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[14px] font-semibold text-slate-700">All Menus</h3>
            <Button size="sm" onClick={openAddMenu} className="h-8 bg-epf-500 hover:bg-epf-600 text-white text-xs gap-1">
              <Plus className="h-3.5 w-3.5" /> New
            </Button>
          </div>
          {loading ? Array.from({length:4}).map((_,i) => <Skeleton key={i} className="h-12 rounded-lg" />) :
            menus.length === 0 ? (
              <Card className="rounded-xl border-slate-200 py-0">
                <CardContent className="p-8 text-center text-slate-400">
                  <Menu className="mx-auto h-8 w-8 mb-2 opacity-30" />
                  <p className="text-sm">No menus yet</p>
                </CardContent>
              </Card>
            ) : menus.map((m) => (
              <div key={m.id}
                onClick={() => setSelectedMenu(m)}
                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${selectedMenu?.id === m.id ? "border-epf-500 bg-epf-50" : "border-slate-200 bg-white hover:border-slate-300"}`}>
                <div>
                  <p className={`text-[13px] font-semibold ${selectedMenu?.id === m.id ? "text-epf-600" : "text-slate-800"}`}>{m.name}</p>
                  <p className="text-[11px] text-slate-400">{m.items?.length || 0} items · {m.isActive ? "Active" : "Inactive"}</p>
                </div>
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEditMenu(m)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500 hover:text-red-600" onClick={() => setDeleteMenuTarget(m)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            ))}
        </div>

        {/* Menu items */}
        <div>
          {!activeMenu ? (
            <Card className="rounded-xl border-slate-200 py-0">
              <CardContent className="p-16 text-center text-slate-400">
                <Menu className="mx-auto h-10 w-10 mb-3 opacity-20" />
                <p>Select a menu to manage its items</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-xl border-slate-200 shadow-sm py-0 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50">
                <div>
                  <h3 className="text-[14px] font-semibold text-slate-900">{activeMenu.name}</h3>
                  <p className="text-[11px] text-slate-500">/{activeMenu.slug}</p>
                </div>
                <Button size="sm" onClick={() => { setEditingItem(null); setItemForm(defaultItemForm); setItemDialog(true); }}
                  className="h-8 bg-epf-500 hover:bg-epf-600 text-white text-xs gap-1">
                  <Plus className="h-3.5 w-3.5" /> Add Item
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 border-b border-slate-100 hover:bg-slate-50">
                    {["","Label","URL","Target","Status",""].map((h,i) => (
                      <TableHead key={i} className="text-[11px] font-semibold uppercase text-slate-500 px-4 py-3">{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!activeMenu.items || activeMenu.items.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-12 text-slate-400">
                      <LinkIcon className="mx-auto h-6 w-6 mb-2 opacity-30" />
                      No items yet. Add the first menu item.
                    </TableCell></TableRow>
                  ) : activeMenu.items.sort((a,b) => a.order - b.order).map((item) => (
                    <TableRow key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <TableCell className="px-3 py-3 w-8 text-slate-300"><GripVertical className="h-4 w-4" /></TableCell>
                      <TableCell className="px-4 py-3 font-medium text-[13px] text-slate-900">{item.label}</TableCell>
                      <TableCell className="px-4 py-3 text-[12px] text-slate-500 font-mono">{item.url}</TableCell>
                      <TableCell className="px-4 py-3 text-[12px] text-slate-500">{item.target || "_self"}</TableCell>
                      <TableCell className="px-4 py-3">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${item.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"}`}>
                          {item.isActive ? "Active" : "Hidden"}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0"
                            onClick={() => { setEditingItem(item); setItemForm({ label: item.label, url: item.url, target: item.target || "_self", isActive: item.isActive }); setItemDialog(true); }}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500 hover:text-red-600" onClick={() => setDeleteItemTarget(item)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </div>
      </div>

      {/* Menu Dialog */}
      <Dialog open={menuDialog} onOpenChange={setMenuDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingMenu ? "Edit Menu" : "Add Menu"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5"><Label>Name <span className="text-red-500">*</span></Label>
              <Input value={menuForm.name} onChange={(e) => setMenuForm(f => ({ ...f, name: e.target.value, slug: f.slug || toSlug(e.target.value) }))} placeholder="Primary Menu" /></div>
            <div className="space-y-1.5"><Label>Slug</Label>
              <Input value={menuForm.slug} onChange={(e) => setMenuForm(f => ({ ...f, slug: toSlug(e.target.value) }))} placeholder="primary-menu" /></div>
            <div className="flex items-center gap-3"><Switch checked={menuForm.isActive} onCheckedChange={(v) => setMenuForm(f => ({ ...f, isActive: v }))} /><Label>Active</Label></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMenuDialog(false)}>Cancel</Button>
            <Button onClick={saveMenu} disabled={saving} className="bg-epf-500 hover:bg-epf-600 text-white">{saving ? "Saving…" : editingMenu ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Item Dialog */}
      <Dialog open={itemDialog} onOpenChange={setItemDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingItem ? "Edit Item" : "Add Menu Item"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5"><Label>Label <span className="text-red-500">*</span></Label>
              <Input value={itemForm.label} onChange={(e) => setItemForm(f => ({ ...f, label: e.target.value }))} placeholder="Home" /></div>
            <div className="space-y-1.5"><Label>URL <span className="text-red-500">*</span></Label>
              <Input value={itemForm.url} onChange={(e) => setItemForm(f => ({ ...f, url: e.target.value }))} placeholder="/ or https://..." /></div>
            <div className="space-y-1.5"><Label>Open in</Label>
              <select value={itemForm.target} onChange={(e) => setItemForm(f => ({ ...f, target: e.target.value }))} className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm">
                <option value="_self">Same tab</option>
                <option value="_blank">New tab</option>
              </select>
            </div>
            <div className="flex items-center gap-3"><Switch checked={itemForm.isActive} onCheckedChange={(v) => setItemForm(f => ({ ...f, isActive: v }))} /><Label>Active</Label></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setItemDialog(false)}>Cancel</Button>
            <Button onClick={saveItem} disabled={saving} className="bg-epf-500 hover:bg-epf-600 text-white">{saving ? "Saving…" : editingItem ? "Update" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteMenuTarget} onOpenChange={(o) => !o && setDeleteMenuTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Menu</AlertDialogTitle>
            <AlertDialogDescription>Delete <strong>"{deleteMenuTarget?.name}"</strong> and all its items?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteMenu} className="bg-red-500 hover:bg-red-600 text-white">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteItemTarget} onOpenChange={(o) => !o && setDeleteItemTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Remove Item</AlertDialogTitle>
            <AlertDialogDescription>Remove <strong>"{deleteItemTarget?.label}"</strong> from this menu?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteItem} className="bg-red-500 hover:bg-red-600 text-white">Remove</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
