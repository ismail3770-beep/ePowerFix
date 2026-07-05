"use client";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { useAdminHeaderStore } from "@/store/admin-header-store";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import {
  Dialog, DialogHeader, DialogContent, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Package, RefreshCw, Trash2, Plus, Pencil, ArrowLeft } from "lucide-react";

interface Project {
  id: string;
  title: string;
  isSellable: boolean;
  price?: number | null;
  salePrice?: number | null;
}

interface KitItem {
  id: string;
  projectId: string;
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
    images?: string;
    sku?: string | null;
  };
}

interface Product {
  id: string;
  name: string;
  price: number;
  sku?: string | null;
}

export default function AdminProjectKitsPage() {
  const [kits, setKits] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedKit, setSelectedKit] = useState<Project | null>(null);
  const [items, setItems] = useState<KitItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [addDialog, setAddDialog] = useState(false);
  const [quickAddDialog, setQuickAddDialog] = useState(false);
  const [quickAddForm, setQuickAddForm] = useState({ kitId: "__none__", productId: "__none__", quantity: 1, isRequired: true, notes: "" });
  const [editItem, setEditItem] = useState<KitItem | null>(null);
  const [addForm, setAddForm] = useState({ productId: "__none__", quantity: 1, isRequired: true, notes: "" });
  const [saving, setSaving] = useState(false);

  const fetchKits = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ data: Project[] | { data: Project[] } }>("/api/admin/projects");
      const list = (res.data as any)?.data ?? (Array.isArray(res.data) ? res.data : []);
      // Show only sellable projects (kits). Fall back to all if none are sellable.
      const sellable = list.filter((p: Project) => p.isSellable);
      setKits(sellable.length > 0 ? sellable : list);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load project kits");
    } finally {
      setLoading(false);
    }
  };

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

  useEffect(() => { fetchKits(); fetchProducts(); }, []);
  useEffect(() => { if (selectedKit) fetchItems(selectedKit.id); }, [selectedKit]);

  const setAddNew = useAdminHeaderStore((s) => s.setAddNew);
  useEffect(() => {
    if (selectedKit) {
      setAddNew("Add Item to Kit", () => { setAddForm({ productId: "__none__", quantity: 1, isRequired: true, notes: "" }); setAddDialog(true); });
    } else {
      setAddNew("", null);
    }
    return () => setAddNew("", null);
  }, [setAddNew, selectedKit]);

  function openKit(kit: Project) {
    setSelectedKit(kit);
  }

  function backToList() {
    setSelectedKit(null);
    setItems([]);
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

  async function handleQuickAddItem() {
    if (quickAddForm.kitId === "__none__") { toast.error("Select a kit"); return; }
    if (quickAddForm.productId === "__none__") { toast.error("Select a product"); return; }
    setSaving(true);
    try {
      await apiFetch(`/api/admin/project-kits/${quickAddForm.kitId}/items`, {
        method: "POST",
        body: JSON.stringify({
          productId: quickAddForm.productId,
          quantity: quickAddForm.quantity,
          isRequired: quickAddForm.isRequired,
          notes: quickAddForm.notes,
        }),
      });
      toast.success("Item added to kit");
      setQuickAddDialog(false);
      setQuickAddForm({ kitId: "__none__", productId: "__none__", quantity: 1, isRequired: true, notes: "" });
      // If the user is currently viewing that kit's items, refresh them.
      if (selectedKit && selectedKit.id === quickAddForm.kitId) {
        fetchItems(selectedKit.id);
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to add item");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateItem() {
    if (!editItem) return;
    setSaving(true);
    try {
      await apiFetch(`/api/admin/project-kits/${selectedKit!.id}/items/${editItem.id}`, {
        method: "PUT",
        body: JSON.stringify({
          quantity: editItem.quantity,
          isRequired: editItem.isRequired,
          notes: editItem.notes,
        }),
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
    if (!confirm(`Remove "${item.product.name}" from this kit?`)) return;
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
    return (
      <div className="p-6 space-y-3">
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {selectedKit && (
            <Button variant="ghost" size="icon" onClick={backToList} title="Back to kits">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-[#111827]">
              {selectedKit ? selectedKit.title : "Project Kits"}
            </h1>
            <p className="text-sm text-[#6B7280] mt-1">
              {selectedKit ? "Manage product components in this kit" : "Select a kit to manage its product items"}
            </p>
          </div>
        </div>
        {!selectedKit && (
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => { setQuickAddForm({ kitId: "__none__", productId: "__none__", quantity: 1, isRequired: true, notes: "" }); setQuickAddDialog(true); }}>
              <Plus className="h-4 w-4 mr-1.5" /> Add Product to Kit
            </Button>
            <Button variant="outline" size="sm" onClick={fetchKits} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? "animate-spin" : ""}`} /> Refresh
            </Button>
          </div>
        )}
      </div>

      {!selectedKit ? (
        /* Kits list */
        <Card>
          <CardHeader><CardTitle className="text-base">All Sellable Project Kits</CardTitle></CardHeader>
          <CardContent className="p-0">
            {kits.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <Package className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No sellable project kits found.</p>
                <p className="text-xs mt-1">
                  Create a project from the <a href="/admin/projects" className="text-[#0EA5E9] hover:underline">Projects</a> page and check "Sellable as Kit".
                </p>
              </div>
            ) : (
              <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
                {kits.map((kit) => (
                  <button
                    key={kit.id}
                    onClick={() => openKit(kit)}
                    className="text-left border border-[#E2E8F0] rounded-lg p-4 hover:border-[#0EA5E9] hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <Package className="h-6 w-6 text-[#0EA5E9]" />
                      {kit.isSellable && <Badge className="bg-green-100 text-green-800">Sellable</Badge>}
                    </div>
                    <h3 className="font-medium text-[#111827] line-clamp-2">{kit.title}</h3>
                    {kit.salePrice != null ? (
                      <p className="text-sm font-semibold text-[#111827] mt-1">{fmtPrice(kit.salePrice)}</p>
                    ) : kit.price != null ? (
                      <p className="text-sm font-semibold text-[#111827] mt-1">{fmtPrice(kit.price)}</p>
                    ) : null}
                    <p className="text-xs text-[#0EA5E9] mt-2 font-medium">Manage items →</p>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        /* Kit items table */
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4 text-[#0EA5E9]" /> Kit Items
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
                        <TableCell>
                          {item.isRequired ? <Badge className="bg-red-100 text-red-800">Required</Badge> : <Badge variant="secondary">Optional</Badge>}
                        </TableCell>
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
                  <p className="text-xs">You need to create products first before adding them to a kit. Go to the <a href="/admin/products" className="text-[#0EA5E9] underline">Products page</a> to add products.</p>
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
            <Button onClick={handleAddItem} disabled={saving}>{saving ? "Adding..." : "Add Item"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={!!editItem} onOpenChange={(o) => { if (!o) setEditItem(null); }}>
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

      {/* Quick Add Dialog — pick kit + product in one go */}
      <Dialog open={quickAddDialog} onOpenChange={(o) => setQuickAddDialog(o)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Product to Kit</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Project Kit *</Label>
              {kits.length === 0 ? (
                <div className="border border-amber-300 bg-amber-50 rounded-md p-3 text-sm text-amber-800">
                  <p className="font-medium mb-1">No project kits available.</p>
                  <p className="text-xs">Create a project from the <a href="/admin/projects" className="text-[#0EA5E9] underline">Projects page</a> first and check "Sellable as Kit".</p>
                </div>
              ) : (
                <Select value={quickAddForm.kitId} onValueChange={(v) => setQuickAddForm({ ...quickAddForm, kitId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select a kit" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Select a kit</SelectItem>
                    {kits.map((k) => (
                      <SelectItem key={k.id} value={k.id}>{k.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
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
                <Select value={quickAddForm.productId} onValueChange={(v) => setQuickAddForm({ ...quickAddForm, productId: v })}>
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
                <Input type="number" min={1} value={quickAddForm.quantity} onChange={(e) => setQuickAddForm({ ...quickAddForm, quantity: Number(e.target.value) })} />
              </div>
              <div className="space-y-1.5 flex items-end pb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={quickAddForm.isRequired} onCheckedChange={(c) => setQuickAddForm({ ...quickAddForm, isRequired: c === true })} />
                  <span className="text-sm">Required</span>
                </label>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notes (optional)</Label>
              <Input value={quickAddForm.notes} onChange={(e) => setQuickAddForm({ ...quickAddForm, notes: e.target.value })} placeholder="e.g. Main controller board" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuickAddDialog(false)}>Cancel</Button>
            <Button onClick={handleQuickAddItem} disabled={saving || kits.length === 0 || products.length === 0}>{saving ? "Adding..." : "Add Item"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
