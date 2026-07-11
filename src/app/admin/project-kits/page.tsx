"use client";
import { useState, useEffect, useCallback } from "react";
import { useFormDraft, loadFormDraft, clearFormDraft } from "@/hooks/use-form-draft";
import { apiFetch } from "@/lib/api";
import { useAdminHeaderStore } from "@/store/admin-header-store";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import {
  Dialog, DialogHeader, DialogContent, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { Package, RefreshCw, Trash2, Plus, Pencil, ArrowLeft } from "lucide-react";

interface ProjectKit {
  id: string;
  title: string;
  slug: string;
  description: string;
  coverImage?: string | null;
  category?: string | null;
  difficulty?: string | null;
  price: number;
  salePrice?: number | null;
  stock: number;
  isActive: boolean;
  itemCount?: number;
  createdAt: string;
}

interface KitItem {
  id: string;
  kitId: string;
  productId: string;
  quantity: number;
  isRequired: boolean;
  notes?: string | null;
  product: {
    id: string;
    name: string;
    price: number;
    salePrice?: number | null;
    stock: number;
    sku?: string | null;
  };
}

interface Product {
  id: string;
  name: string;
  price: number;
  sku?: string | null;
}

const defaultKitForm = {
  title: "", description: "", coverImage: "", category: "", difficulty: "",
  price: "", salePrice: "", stock: 0, isActive: true,
};

const difficulties = ["Beginner", "Intermediate", "Advanced"];

export default function AdminProjectKitsPage() {
  const [kits, setKits] = useState<ProjectKit[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState<{ open: boolean; edit?: ProjectKit }>({ open: false });
  const [form, setForm] = useState(() => loadFormDraft("admin-kit-add", defaultKitForm));
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ProjectKit | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Selected kit + its items
  const [selectedKit, setSelectedKit] = useState<ProjectKit | null>(null);
  const [items, setItems] = useState<KitItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [addDialog, setAddDialog] = useState(false);
  const [addForm, setAddForm] = useState({ productId: "__none__", quantity: 1, isRequired: true, notes: "" });
  const [editItem, setEditItem] = useState<KitItem | null>(null);

  const fetchKits = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ data: { data: ProjectKit[] } | ProjectKit[] }>("/api/admin/project-kits");
      const list = (res.data as any)?.data ?? (Array.isArray(res.data) ? res.data : []);
      setKits(list);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load project kits");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchItems = async (kitId: string) => {
    setItemsLoading(true);
    try {
      const res = await apiFetch<{ data: KitItem[] }>(`/api/admin/project-kits/${kitId}/items`);
      setItems(res.data ?? []);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load kit items");
    } finally {
      setItemsLoading(false);
    }
  };

  const fetchProducts = async () => {
    setProductsLoading(true);
    try {
      const res = await apiFetch<{ data: { data: Product[] } | Product[] }>("/api/admin/products?limit=100");
      const list = (res.data as any)?.data ?? (Array.isArray(res.data) ? res.data : []);
      setProducts(list);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load products");
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => { fetchKits(); fetchProducts(); }, [fetchKits]);
  useEffect(() => { if (selectedKit) {fetchItems(selectedKit.id);} }, [selectedKit]);

  useFormDraft("admin-kit-add", dialog.open && !dialog.edit ? form : defaultKitForm);

  const setAddNew = useAdminHeaderStore((s) => s.setAddNew);
  useEffect(() => {
    if (selectedKit) {
      setAddNew("Add Item to Kit", () => { setAddForm({ productId: "__none__", quantity: 1, isRequired: true, notes: "" }); setAddDialog(true); });
    } else {
      setAddNew("Add Kit", () => { setForm(loadFormDraft("admin-kit-add", defaultKitForm)); setDialog({ open: true }); });
    }
    return () => setAddNew("", null);
  }, [setAddNew, selectedKit]);

  function openEdit(kit: ProjectKit) {
    setForm({
      title: kit.title,
      description: kit.description,
      coverImage: kit.coverImage || "",
      category: kit.category || "",
      difficulty: kit.difficulty || "",
      price: kit.price.toString(),
      salePrice: kit.salePrice?.toString() || "",
      stock: kit.stock,
      isActive: kit.isActive,
    });
    setDialog({ open: true, edit: kit });
  }

  async function handleSaveKit() {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    if (!form.description.trim()) { toast.error("Description is required"); return; }
    if (!form.price) { toast.error("Price is required"); return; }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description,
        coverImage: form.coverImage || null,
        category: form.category || null,
        difficulty: form.difficulty || null,
        price: parseFloat(form.price),
        salePrice: form.salePrice ? parseFloat(form.salePrice) : null,
        stock: Number(form.stock) || 0,
        isActive: form.isActive,
      };
      if (dialog.edit) {
        await apiFetch(`/api/admin/project-kits/${dialog.edit.id}`, { method: "PUT", body: JSON.stringify(payload) });
        toast.success("Kit updated");
      } else {
        await apiFetch("/api/admin/project-kits", { method: "POST", body: JSON.stringify(payload) });
        toast.success("Kit created");
      }
      setDialog({ open: false });
      if (!dialog.edit) {clearFormDraft("admin-kit-add");}
      fetchKits();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save kit");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteKit() {
    if (!deleteTarget) {return;}
    setDeleting(true);
    try {
      await apiFetch(`/api/admin/project-kits/${deleteTarget.id}`, { method: "DELETE" });
      toast.success("Kit deleted");
      setDeleteTarget(null);
      fetchKits();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete kit");
    } finally {
      setDeleting(false);
    }
  }

  async function handleAddItem() {
    if (addForm.productId === "__none__") { toast.error("Select a product"); return; }
    setSaving(true);
    try {
      await apiFetch(`/api/admin/project-kits/${selectedKit!.id}/items`, {
        method: "POST",
        body: JSON.stringify(addForm),
      });
      toast.success("Item added to kit");
      setAddDialog(false);
      fetchItems(selectedKit!.id);
    } catch (err: any) {
      toast.error(err?.message || "Failed to add item");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateItem() {
    if (!editItem) {return;}
    setSaving(true);
    try {
      await apiFetch(`/api/admin/project-kits/${selectedKit!.id}/items/${editItem.id}`, {
        method: "PUT",
        body: JSON.stringify({ quantity: editItem.quantity, isRequired: editItem.isRequired, notes: editItem.notes }),
      });
      toast.success("Item updated");
      setEditItem(null);
      fetchItems(selectedKit!.id);
    } catch (err: any) {
      toast.error(err?.message || "Failed to update item");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveItem(item: KitItem) {
    if (!confirm(`Remove "${item.product.name}" from this kit?`)) {return;}
    try {
      await apiFetch(`/api/admin/project-kits/${selectedKit!.id}/items/${item.id}`, { method: "DELETE" });
      toast.success("Item removed");
      setItems((prev) => prev.filter((x) => x.id !== item.id));
    } catch (err: any) {
      toast.error(err?.message || "Failed to remove item");
    }
  }

  const fmtPrice = (n: number) => `৳${Number(n || 0).toLocaleString()}`;

  if (loading) {
    return <div className="p-6 space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {selectedKit && (
            <Button variant="ghost" size="icon" onClick={() => { setSelectedKit(null); setItems([]); }} title="Back to kits">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-[#111827]">{selectedKit ? selectedKit.title : "Project Kits"}</h1>
            <p className="text-sm text-[#6B7280] mt-1">
              {selectedKit ? "Manage product components in this kit" : "Sellable product bundles — separate from portfolio Projects"}
            </p>
          </div>
        </div>
        {!selectedKit && (
          <Button variant="outline" size="sm" onClick={fetchKits} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        )}
      </div>

      {!selectedKit ? (
        /* Kits list */
        <Card>
          <CardHeader><CardTitle className="text-base">All Project Kits</CardTitle></CardHeader>
          <CardContent className="p-0">
            {kits.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <Package className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No project kits yet.</p>
                <p className="text-xs mt-1">Click "Add Kit" in the header to create your first kit.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {kits.map((kit) => (
                      <TableRow key={kit.id} className="cursor-pointer" onClick={() => setSelectedKit(kit)}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-[#0EA5E9]" />
                            {kit.title}
                          </div>
                        </TableCell>
                        <TableCell>{kit.category || "—"}</TableCell>
                        <TableCell>{fmtPrice(kit.salePrice ?? kit.price)}</TableCell>
                        <TableCell>{kit.stock}</TableCell>
                        <TableCell><Badge variant="secondary">{kit.itemCount ?? 0}</Badge></TableCell>
                        <TableCell>{kit.isActive ? <Badge className="bg-green-100 text-green-800">Active</Badge> : <Badge variant="secondary">Hidden</Badge>}</TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEdit(kit)} title="Edit"><Pencil className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="text-red-600 hover:bg-red-50" onClick={() => setDeleteTarget(kit)} title="Delete"><Trash2 className="h-4 w-4" /></Button>
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
      ) : (
        /* Kit items management */
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4 text-[#0EA5E9]" /> Kit Items ({items.length})
            </CardTitle>
            <Button size="sm" onClick={() => { setAddForm({ productId: "__none__", quantity: 1, isRequired: true, notes: "" }); setAddDialog(true); }}>
              <Plus className="h-4 w-4 mr-1.5" /> Add Item
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {itemsLoading ? (
              <div className="p-6 space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : items.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <p className="text-sm mb-2">No items in this kit yet.</p>
                <Button size="sm" onClick={() => { setAddForm({ productId: "__none__", quantity: 1, isRequired: true, notes: "" }); setAddDialog(true); }}>
                  <Plus className="h-4 w-4 mr-1.5" /> Add First Item
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Required</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.product.name}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{item.product.sku || "—"}</TableCell>
                        <TableCell className="text-xs">{fmtPrice(item.product.salePrice ?? item.product.price)}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{item.isRequired ? <Badge className="bg-red-100 text-red-800">Required</Badge> : <Badge variant="secondary">Optional</Badge>}</TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{item.notes || "—"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => setEditItem(item)} title="Edit"><Pencil className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="text-red-600 hover:bg-red-50" onClick={() => handleRemoveItem(item)} title="Remove"><Trash2 className="h-4 w-4" /></Button>
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
      )}

      {/* Kit Add/Edit Dialog */}
      <Dialog open={dialog.open} onOpenChange={(o) => { if (!o) {setDialog({ open: false });} }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{dialog.edit ? "Edit Kit" : "Add Kit"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Arduino IoT Weather Station Kit" />
            </div>
            <div className="space-y-1.5">
              <Label>Description *</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} placeholder="What does this kit include? What can you build with it?" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Arduino / IoT / PLC / Solar" />
              </div>
              <div className="space-y-1.5">
                <Label>Difficulty</Label>
                <Select value={form.difficulty || "__none__"} onValueChange={(v) => setForm({ ...form, difficulty: v === "__none__" ? "" : v })}>
                  <SelectTrigger><SelectValue placeholder="Select difficulty" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {difficulties.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Cover Image URL</Label>
              <Input value={form.coverImage} onChange={(e) => setForm({ ...form, coverImage: e.target.value })} placeholder="https://..." />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Price (৳) *</Label>
                <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Sale Price (৳)</Label>
                <Input type="number" value={form.salePrice} onChange={(e) => setForm({ ...form, salePrice: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Stock</Label>
                <Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={form.isActive} onCheckedChange={(c) => setForm({ ...form, isActive: c === true })} id="kit-active" />
              <Label htmlFor="kit-active" className="text-sm cursor-pointer">Active (visible on storefront)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog({ open: false })}>Cancel</Button>
            <Button onClick={handleSaveKit} disabled={saving}>{saving ? "Saving..." : "Save Kit"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Item Dialog */}
      <Dialog open={addDialog} onOpenChange={(o) => setAddDialog(o)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Product to Kit</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Product *</Label>
              {productsLoading ? (
                <div className="h-9 flex items-center px-3 border rounded-md text-sm text-muted-foreground">Loading products…</div>
              ) : products.length === 0 ? (
                <div className="border border-amber-300 bg-amber-50 rounded-md p-3 text-sm text-amber-800">
                  <p className="font-medium mb-1">No products available.</p>
                  <p className="text-xs">Create products first on the <a href="/admin/products" className="text-[#0EA5E9] underline">Products page</a>.</p>
                </div>
              ) : (
                <Select value={addForm.productId} onValueChange={(v) => setAddForm({ ...addForm, productId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select a product" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Select a product</SelectItem>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}{p.sku ? ` (${p.sku})` : ""}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Quantity</Label>
                <Input type="number" min={1} value={addForm.quantity} onChange={(e) => setAddForm({ ...addForm, quantity: Number(e.target.value) })} />
              </div>
              <div className="space-y-1.5 flex items-end pb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={addForm.isRequired} onCheckedChange={(c) => setAddForm({ ...addForm, isRequired: c === true })} />
                  <span className="text-sm">Required</span>
                </label>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notes (optional)</Label>
              <Input value={addForm.notes} onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })} placeholder="e.g. Main controller board" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialog(false)}>Cancel</Button>
            <Button onClick={handleAddItem} disabled={saving || products.length === 0}>{saving ? "Adding..." : "Add Item"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={!!editItem} onOpenChange={(o) => { if (!o) {setEditItem(null);} }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Edit Kit Item</DialogTitle></DialogHeader>
          {editItem && (
            <div className="space-y-4">
              <div className="bg-[#F8FAFC] rounded-lg p-3">
                <p className="font-medium text-[#111827]">{editItem.product.name}</p>
                <p className="text-xs text-muted-foreground">{fmtPrice(editItem.product.salePrice ?? editItem.product.price)}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Quantity</Label>
                  <Input type="number" min={1} value={editItem.quantity} onChange={(e) => setEditItem({ ...editItem, quantity: Number(e.target.value) })} />
                </div>
                <div className="space-y-1.5 flex items-end pb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox checked={editItem.isRequired} onCheckedChange={(c) => setEditItem({ ...editItem, isRequired: c === true })} />
                    <span className="text-sm">Required</span>
                  </label>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Input value={editItem.notes || ""} onChange={(e) => setEditItem({ ...editItem, notes: e.target.value })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)}>Cancel</Button>
            <Button onClick={handleUpdateItem} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Kit Confirm */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) {setDeleteTarget(null);} }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete Kit?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Are you sure you want to delete "{deleteTarget?.title}"? This will also remove all items in this kit. This cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteKit} disabled={deleting}>{deleting ? "Deleting..." : "Delete"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
