"use client";

import { useEffect, useState, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogHeader, DialogContent, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search, Plus, Eye, Pencil, Trash2,
} from "lucide-react";

interface ProductCategory {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  comparePrice: number | null;
  sku: string;
  stock: number;
  images: string[];
  isFeatured: boolean;
  isActive: boolean;
  category: ProductCategory | null;
  brand: { id: string; name: string } | null;
  createdAt: string;
}

interface Category {
  id: string;
  name: string;
}

interface Brand {
  id: string;
  name: string;
}

const defaultProduct = {
  name: "", description: "", price: 0, comparePrice: 0, sku: "",
  stock: 0, categoryId: "", brandId: "", images: "", isFeatured: false, isActive: true,
};

type ProductForm = typeof defaultProduct;

const initialFilters = { search: "", categoryId: "", brandId: "", isActive: "" };

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(initialFilters);
  const [dialog, setDialog] = useState<{ open: boolean; edit?: Product }>({ open: false });
  const [form, setForm] = useState<ProductForm>(defaultProduct);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.set("search", filters.search);
      if (filters.categoryId) params.set("categoryId", filters.categoryId);
      if (filters.brandId) params.set("brandId", filters.brandId);
      if (filters.isActive) params.set("isActive", filters.isActive);
      const qs = params.toString();
      const res: any = await apiFetch(`/api/admin/products${qs ? `?${qs}` : ""}`);
      setProducts(res.data ?? []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchCategories = useCallback(async () => {
    try {
      const res: any = await apiFetch("/api/admin/product-categories");
      setCategories(res.data ?? []);
    } catch {
      // non-critical
    }
  }, []);

  const fetchBrands = useCallback(async () => {
    try {
      const res: any = await apiFetch("/api/admin/brands");
      setBrands(res.data ?? []);
    } catch {
      // non-critical
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => { fetchCategories(); fetchBrands(); }, [fetchCategories, fetchBrands]);

  function openAdd() {
    setForm(defaultProduct);
    setDialog({ open: true });
  }

  function openEdit(product: Product) {
    setForm({
      name: product.name,
      description: product.description,
      price: product.price,
      comparePrice: product.comparePrice ?? 0,
      sku: product.sku,
      stock: product.stock,
      categoryId: product.category?.id ?? "",
      brandId: product.brand?.id ?? "",
      images: (product.images ?? []).join(", "),
      isFeatured: product.isFeatured,
      isActive: product.isActive,
    });
    setDialog({ open: true, edit: product });
  }

  async function handleSave() {
    setSaving(true);
    try {
      const body = {
        ...form,
        images: form.images
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      };
      if (dialog.edit) {
        await apiFetch(`/api/admin/products/${dialog.edit.id}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });
        toast.success("Product updated");
      } else {
        await apiFetch("/api/admin/products", {
          method: "POST",
          body: JSON.stringify(body),
        });
        toast.success("Product created");
      }
      setDialog({ open: false });
      fetchProducts();
    } catch (err: any) {
      toast.error(err.message || "Failed to save product");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/admin/products/${deleteTarget.id}`, { method: "DELETE" });
      toast.success("Product deleted");
      setDeleteTarget(null);
      fetchProducts();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete product");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Products</h1>
        <Button onClick={openAdd}>
          <Plus className="mr-2 h-4 w-4" /> Add Product
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                className="pl-9"
                value={filters.search}
                onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              />
            </div>
            <Select
              value={filters.categoryId}
              onValueChange={(v) => setFilters((f) => ({ ...f, categoryId: v }))}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.brandId}
              onValueChange={(v) => setFilters((f) => ({ ...f, brandId: v }))}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All brands" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All brands</SelectItem>
                {brands.map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.isActive}
              onValueChange={(v) => setFilters((f) => ({ ...f, isActive: v }))}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All status</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => { setFilters(initialFilters); }}>
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              No products found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Image</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-24 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        {product.images?.[0] ? (
                          <img
                            src={product.images[0]}
                            alt=""
                            className="w-10 h-10 rounded object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded bg-muted" />
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>৳{product.price.toFixed(2)}</TableCell>
                      <TableCell>{product.stock}</TableCell>
                      <TableCell>{product.category?.name ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant={product.isActive ? "default" : "secondary"}>
                          {product.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" onClick={() => openEdit(product)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => setDeleteTarget(product)}>
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
        </CardContent>
      </Card>

      <Dialog open={dialog.open} onOpenChange={(o) => setDialog((d) => ({ ...d, open: o }))}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{dialog.edit ? "Edit Product" : "Add Product"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <Label htmlFor="desc">Description</Label>
              <Textarea id="desc" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="price">Price</Label>
              <Input id="price" type="number" step="0.01" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: parseFloat(e.target.value) || 0 }))} />
            </div>
            <div>
              <Label htmlFor="comparePrice">Compare Price</Label>
              <Input id="comparePrice" type="number" step="0.01" value={form.comparePrice} onChange={(e) => setForm((f) => ({ ...f, comparePrice: parseFloat(e.target.value) || 0 }))} />
            </div>
            <div>
              <Label htmlFor="sku">SKU</Label>
              <Input id="sku" value={form.sku} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="stock">Stock</Label>
              <Input id="stock" type="number" value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: parseInt(e.target.value) || 0 }))} />
            </div>
            <div>
              <Label htmlFor="categoryId">Category</Label>
              <Select value={form.categoryId} onValueChange={(v) => setForm((f) => ({ ...f, categoryId: v }))}>
                <SelectTrigger id="categoryId">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="brandId">Brand</Label>
              <Select value={form.brandId} onValueChange={(v) => setForm((f) => ({ ...f, brandId: v }))}>
                <SelectTrigger id="brandId">
                  <SelectValue placeholder="Select brand" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {brands.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label htmlFor="images">Images (comma-separated URLs)</Label>
              <Input id="images" value={form.images} onChange={(e) => setForm((f) => ({ ...f, images: e.target.value }))} />
            </div>
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <Switch id="isFeatured" checked={form.isFeatured} onCheckedChange={(v) => setForm((f) => ({ ...f, isFeatured: v }))} />
                <Label htmlFor="isFeatured">Featured</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="isActive" checked={form.isActive} onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))} />
                <Label htmlFor="isActive">Active</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog({ open: false })}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
