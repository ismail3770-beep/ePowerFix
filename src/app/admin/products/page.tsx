"use client";

import { useEffect, useState, useCallback } from "react";
import { useFormDraft, loadFormDraft, clearFormDraft } from "@/hooks/use-form-draft";
import { apiFetch } from "@/lib/api";
import { useAdminHeaderStore } from "@/store/admin-header-store";
import { toast } from "sonner";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogHeader, DialogContent, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search, Plus, Pencil, Trash2, Package, X,
} from "lucide-react";
import { ImageUploader } from "@/components/ImageUploader";
import Pagination from "@/components/admin/Pagination";

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
  isBestDeal: boolean;
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
  stock: 0, categoryId: "__none__", brandId: "__none__", imageUrls: [] as string[], isFeatured: false, isBestDeal: false, isActive: true,
};

type ProductForm = typeof defaultProduct;

const initialFilters = { search: "", categoryId: "__all__", brandId: "__all__", isActive: "__all__" };

function formatCurrency(n: number) {
  return "৳" + (Number(n) || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(initialFilters);
  const [dialog, setDialog] = useState<{ open: boolean; edit?: Product }>({ open: false });
  const [form, setForm] = useState<ProductForm>(() => loadFormDraft<ProductForm>("admin-product-add", defaultProduct));
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const PAGE_LIMIT = 20;

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.set("search", filters.search);
      if (filters.categoryId && filters.categoryId !== "__all__") params.set("categoryId", filters.categoryId);
      if (filters.brandId && filters.brandId !== "__all__") params.set("brandId", filters.brandId);
      if (filters.isActive && filters.isActive !== "__all__") params.set("isActive", filters.isActive);
      params.set("page", String(page));
      params.set("limit", String(PAGE_LIMIT));
      const qs = params.toString();
      const res: any = await apiFetch(`/api/admin/products${qs ? `?${qs}` : ""}`);
      setProducts(res.data?.data ?? []);
      setTotal(res.data?.total ?? 0);
      setTotalPages(res.data?.totalPages ?? 1);
    } catch (err: any) {
      toast.error(err.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  const fetchCategories = useCallback(async () => {
    try {
      const res: any = await apiFetch("/api/admin/product-categories");
      setCategories(Array.isArray(res.data) ? res.data : res.data?.data || []);
    } catch {
      // non-critical
    }
  }, []);

  const fetchBrands = useCallback(async () => {
    try {
      const res: any = await apiFetch("/api/admin/brands");
      setBrands(Array.isArray(res.data) ? res.data : res.data?.data || []);
    } catch {
      // non-critical
    }
  }, []);

  const setAddNew = useAdminHeaderStore((s) => s.setAddNew);
  useEffect(() => { setAddNew('Add Product', openAdd); return () => setAddNew('', null); }, [setAddNew]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => { fetchCategories(); fetchBrands(); }, [fetchCategories, fetchBrands]);

  // Persist the add-form draft to localStorage so a refresh / navigation
  // doesn't lose progress. Only auto-save while in "add" mode (no edit target).
  useFormDraft("admin-product-add", dialog.open && !dialog.edit ? form : defaultProduct);

  // Reset to page 1 whenever filters change
  useEffect(() => { setPage(1); }, [filters]);

  function openAdd() {
    // Restore any previously-saved draft (or fall back to a blank form).
    setForm(loadFormDraft<ProductForm>("admin-product-add", defaultProduct));
    setDialog({ open: true });
  }

  function openEdit(product: Product) {
    setForm({
      name: product.name,
      description: product.description,
      price: product.price,
      comparePrice: product.comparePrice ?? 0,
      sku: product.sku ?? "",
      stock: product.stock,
      categoryId: product.category?.id ?? "__none__",
      brandId: product.brand?.id ?? "__none__",
      imageUrls: product.images ?? [],
      isFeatured: product.isFeatured,
      isBestDeal: product.isBestDeal,
      isActive: product.isActive,
    });
    setDialog({ open: true, edit: product });
  }

  async function handleSave() {
    setSaving(true);
    try {
      const body = {
        ...form,
        categoryId: form.categoryId === "__none__" ? null : form.categoryId,
        brandId: form.brandId === "__none__" ? null : form.brandId,
        images: form.imageUrls,
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
      // Clear the add-form draft now that the product was saved.
      if (!dialog.edit) clearFormDraft("admin-product-add");
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

  const hasActiveFilters =
    filters.search !== "" ||
    filters.categoryId !== "__all__" ||
    filters.brandId !== "__all__" ||
    filters.isActive !== "__all__";

  return (
    <div className="space-y-6">
      {/* ---------- HEADER + ADD BUTTON ---------- */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-bold text-slate-900">Products</h1>
          <p className="text-[13px] text-slate-500 mt-0.5">
            {total} product{total === 1 ? "" : "s"} total · {products.length} shown
          </p>
        </div>
        <Button
          onClick={openAdd}
          className="bg-epf-500 hover:bg-epf-600 text-white rounded-lg h-10 px-5 font-semibold"
        >
          <Plus className="mr-2 h-4 w-4" /> Add Product
        </Button>
      </div>

      {/* ---------- SEARCH + FILTERS ---------- */}
      <Card className="rounded-xl border-slate-200 shadow-sm py-0">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search products by name, SKU..."
                className="pl-9 h-10 rounded-lg border-slate-200 bg-slate-50 focus:bg-white"
                value={filters.search}
                onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              />
            </div>
            {/* Filter dropdowns */}
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={filters.categoryId}
                onValueChange={(v) => setFilters((f) => ({ ...f, categoryId: v }))}
              >
                <SelectTrigger className="w-[160px] h-10 rounded-lg border-slate-200">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All categories</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={filters.brandId}
                onValueChange={(v) => setFilters((f) => ({ ...f, brandId: v }))}
              >
                <SelectTrigger className="w-[150px] h-10 rounded-lg border-slate-200">
                  <SelectValue placeholder="All brands" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All brands</SelectItem>
                  {brands.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
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
          ) : products.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-epf-50 flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-epf-500" />
              </div>
              <h3 className="text-[16px] font-semibold text-slate-900 mb-1">No products found</h3>
              <p className="text-[13px] text-slate-500 max-w-sm mx-auto mb-5">
                {hasActiveFilters
                  ? "Try adjusting your search or filters to find what you're looking for."
                  : "Get started by adding your first product to the catalog."}
              </p>
              <Button
                onClick={openAdd}
                className="bg-epf-500 hover:bg-epf-600 text-white rounded-lg h-10 px-5 font-semibold"
              >
                <Plus className="mr-2 h-4 w-4" /> Add Product
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 border-b border-slate-100 hover:bg-slate-50">
                    <TableHead className="text-[11px] font-semibold uppercase text-slate-500 px-5 py-3">Product</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase text-slate-500 px-5 py-3">Category</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase text-slate-500 px-5 py-3">Brand</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase text-slate-500 px-5 py-3 text-right">Price</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase text-slate-500 px-5 py-3">Stock</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase text-slate-500 px-5 py-3">Status</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase text-slate-500 px-5 py-3 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <TableCell className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
                            {product.images?.[0] ? (
                              <img
                                src={product.images[0]}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-400">
                                <Package className="w-4 h-4" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[14px] font-medium text-slate-900 truncate max-w-[220px]">{product.name}</p>
                            {product.sku && (
                              <p className="text-[11px] text-slate-400 font-mono">{product.sku}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-5 py-3 text-[13px] text-slate-600">
                        {product.category?.name ?? <span className="text-slate-400">—</span>}
                      </TableCell>
                      <TableCell className="px-5 py-3 text-[13px] text-slate-600">
                        {product.brand?.name ?? <span className="text-slate-400">—</span>}
                      </TableCell>
                      <TableCell className="px-5 py-3 text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-[14px] font-semibold text-slate-900">
                            {formatCurrency(Number(product.price))}
                          </span>
                          {product.comparePrice && Number(product.comparePrice) > Number(product.price) && (
                            <span className="text-[11px] text-slate-400 line-through">
                              {formatCurrency(Number(product.comparePrice))}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-5 py-3">
                        {product.stock > 0 ? (
                          <span className={`text-[13px] font-medium ${product.stock < 5 ? "text-amber-600" : "text-slate-700"}`}>
                            {product.stock}
                            {product.stock < 5 && <span className="ml-1 text-[10px]">low</span>}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-bold rounded-full bg-red-50 text-red-700 border border-red-200">
                            Out of Stock
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="px-5 py-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 text-[11px] font-bold rounded-full border ${
                            product.isActive
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                          }`}
                        >
                          {product.isActive ? "Active" : "Inactive"}
                        </span>
                      </TableCell>
                      <TableCell className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openEdit(product)}
                            className="h-8 w-8 rounded-lg text-slate-400 hover:text-epf-600 hover:bg-epf-50"
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setDeleteTarget(product)}
                            className="h-8 w-8 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                            title="Delete"
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
          {!loading && products.length > 0 && (
            <div className="px-5 py-4 border-t border-slate-100">
              <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* ---------- ADD / EDIT DIALOG ---------- */}
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
                  <SelectItem value="__none__">None</SelectItem>
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
                  <SelectItem value="__none__">None</SelectItem>
                  {brands.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <ImageUploader
                value={form.imageUrls}
                onChange={(urls) => setForm((f) => ({ ...f, imageUrls: urls }))}
                max={8}
                label="Product Images"
              />
            </div>
            <div className="flex items-center gap-8 flex-wrap">
              <div className="flex items-center gap-2">
                <Switch id="isFeatured" checked={form.isFeatured} onCheckedChange={(v) => setForm((f) => ({ ...f, isFeatured: v }))} />
                <Label htmlFor="isFeatured">Featured</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="isBestDeal" checked={form.isBestDeal} onCheckedChange={(v) => setForm((f) => ({ ...f, isBestDeal: v }))} />
                <Label htmlFor="isBestDeal">Best Deal</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="isActive" checked={form.isActive} onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))} />
                <Label htmlFor="isActive">Active</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog({ open: false })}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-epf-500 hover:bg-epf-600 text-white">
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---------- DELETE CONFIRMATION ---------- */}
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
