"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Search, Plus, Pencil, Trash2, Package, X, Home, ChevronRight, ArrowUpDown
} from "lucide-react";
import { ImageUploader } from "@/components/ImageUploader";
import Pagination from "@/components/admin/Pagination";
import { formatDistanceToNow } from "date-fns";

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
  return "$" + (Number(n) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(initialFilters);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [entriesPerPage, setEntriesPerPage] = useState("20");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.search) {params.set("search", filters.search);}
      if (filters.categoryId && filters.categoryId !== "__all__") {params.set("categoryId", filters.categoryId);}
      if (filters.brandId && filters.brandId !== "__all__") {params.set("brandId", filters.brandId);}
      if (filters.isActive && filters.isActive !== "__all__") {params.set("isActive", filters.isActive);}
      params.set("page", String(page));
      params.set("limit", entriesPerPage);
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
  }, [filters, page, entriesPerPage]);

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
  useEffect(() => { setAddNew('', null); }, [setAddNew]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => { fetchCategories(); fetchBrands(); }, [fetchCategories, fetchBrands]);

  // Reset to page 1 whenever filters change
  useEffect(() => { setPage(1); }, [filters, entriesPerPage]);

  const router = useRouter();

  function openAdd() {
    router.push("/admin/products/create");
  }

  function openEdit(product: Product) {
    router.push(`/admin/products/${product.id}/edit`);
  }



  async function handleDelete() {
    if (!deleteTarget) {return;}
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

  const toggleSelectAll = () => {
    if (selectedIds.size === products.length && products.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(products.map(p => p.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  // Helper for displaying a simple ID from a long UUID
  const formatId = (id: string) => id.split('-')[0].replace(/\D/g, '').substring(0, 3) || Math.floor(Math.random()*100).toString();

  return (
    <div className="space-y-6 max-w-full">
      {/* ---------- HEADER + BREADCRUMBS ---------- */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-[22px] sm:text-[24px] font-medium text-slate-800">Products</h1>
        </div>
        <div className="flex flex-col items-end gap-2.5">
          <div className="flex items-center text-[12px] text-slate-500">
            <Home className="h-3 w-3 mr-1" />
            <ChevronRight className="h-3 w-3 mx-1 text-slate-400" />
            <span>Products</span>
          </div>
          <Button
            onClick={openAdd}
            className="bg-[#1a73e8] hover:bg-blue-600 text-white rounded h-[34px] px-5 font-semibold text-[13px] shadow-sm"
          >
            Create Product
          </Button>
        </div>
      </div>

      {/* ---------- TABLE CONTAINER ---------- */}
      <Card className="rounded border-slate-200 shadow-sm overflow-hidden bg-white">
        
        {/* TABLE CONTROLS */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white">
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-2 text-[13px] text-slate-600">
               <span>Show</span>
               <Select value={entriesPerPage} onValueChange={setEntriesPerPage}>
                 <SelectTrigger className="w-[65px] h-[34px] rounded border-slate-200 shadow-sm focus:ring-0">
                   <SelectValue />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="10">10</SelectItem>
                   <SelectItem value="20">20</SelectItem>
                   <SelectItem value="50">50</SelectItem>
                 </SelectContent>
               </Select>
               <span>entries</span>
             </div>
             <Button variant="outline" className="h-[34px] px-3.5 rounded border-slate-200 shadow-sm text-slate-700 text-[13px] hover:bg-slate-50">
               <Trash2 className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
               Delete
             </Button>
          </div>
          
          <div className="relative w-full sm:w-[260px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search here..."
              className="pl-9 h-[36px] rounded-full border-slate-200 text-[13px] shadow-sm bg-white focus-visible:ring-1 focus-visible:ring-slate-300"
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            />
          </div>
        </div>

        {/* TABLE CONTENT */}
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-14 w-full rounded" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-[15px] font-semibold text-slate-800 mb-1">No products found</h3>
              <p className="text-[13px] text-slate-500 max-w-sm mx-auto mb-5">
                Try adjusting your search or add your first product.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="border-collapse w-full min-w-[800px]">
                <TableHeader>
                  <TableRow className="bg-white hover:bg-white border-b-2 border-slate-100">
                    <TableHead className="w-[50px] px-4 py-4"><Checkbox checked={selectedIds.size === products.length && products.length > 0} onCheckedChange={toggleSelectAll} className="border-slate-300 bg-slate-50 rounded-[4px]" /></TableHead>
                    <TableHead className="px-4 py-4 text-[13px] font-semibold text-slate-700 w-[80px]">
                      <div className="flex items-center gap-1.5 cursor-pointer select-none">
                        ID <ArrowUpDown className="h-3 w-3 text-slate-300" />
                      </div>
                    </TableHead>
                    <TableHead className="px-4 py-4 text-[13px] font-semibold text-slate-700 w-[100px]">Thumbnail</TableHead>
                    <TableHead className="px-4 py-4 text-[13px] font-semibold text-slate-700 min-w-[200px]">
                      <div className="flex items-center gap-1.5 cursor-pointer select-none">
                        Name <ArrowUpDown className="h-3 w-3 text-slate-300" />
                      </div>
                    </TableHead>
                    <TableHead className="px-4 py-4 text-[13px] font-semibold text-slate-700 min-w-[120px]">
                      <div className="flex items-center gap-1.5 cursor-pointer select-none">
                        Price <ArrowUpDown className="h-3 w-3 text-slate-300" />
                      </div>
                    </TableHead>
                    <TableHead className="px-4 py-4 text-[13px] font-semibold text-slate-700 min-w-[100px]">
                      <div className="flex items-center gap-1.5 cursor-pointer select-none">
                        Stock <ArrowUpDown className="h-3 w-3 text-slate-300" />
                      </div>
                    </TableHead>
                    <TableHead className="px-4 py-4 text-[13px] font-semibold text-slate-700 min-w-[100px]">
                      <div className="flex items-center gap-1.5 cursor-pointer select-none">
                        Status <ArrowUpDown className="h-3 w-3 text-slate-300" />
                      </div>
                    </TableHead>
                    <TableHead className="px-4 py-4 text-[13px] font-semibold text-slate-700 min-w-[120px]">
                      <div className="flex items-center gap-1.5 cursor-pointer select-none">
                        Updated <ArrowUpDown className="h-3 w-3 text-slate-300" />
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors bg-white">
                      <TableCell className="px-4 py-4 align-middle">
                        <Checkbox 
                          checked={selectedIds.has(product.id)}
                          onCheckedChange={() => toggleSelect(product.id)}
                          className="border-slate-300 bg-slate-50 rounded-[4px]" 
                        />
                      </TableCell>
                      <TableCell className="px-4 py-4 align-middle text-[13.5px] text-slate-700">{formatId(product.id)}</TableCell>
                      <TableCell className="px-4 py-4 align-middle">
                        <div className="w-[42px] h-[42px] rounded overflow-hidden flex-shrink-0 border border-slate-200/60 bg-white p-0.5">
                          {product.images?.[0] ? (
                            <img
                              src={product.images[0]}
                              alt=""
                              className="w-full h-full object-contain rounded-sm"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-50 rounded-sm">
                              <Package className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-4 align-middle group cursor-pointer" onClick={() => openEdit(product)}>
                        <p className="text-[13.5px] font-medium text-slate-700 leading-snug group-hover:text-[#1a73e8] transition-colors">{product.name}</p>
                      </TableCell>
                      <TableCell className="px-4 py-4 align-middle">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[13.5px] text-slate-700">
                            {formatCurrency(Number(product.price))}
                          </span>
                          {product.comparePrice && Number(product.comparePrice) > Number(product.price) && (
                            <span className="text-[11px] text-slate-400 line-through">
                              {formatCurrency(Number(product.comparePrice))}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-4 align-middle">
                        {product.stock > 0 ? (
                          <span className="text-[12.5px] text-[#2b76ff]">In Stock</span>
                        ) : (
                          <span className="text-[11.5px] font-medium text-red-500 bg-red-50 px-1.5 py-0.5 rounded">Out of Stock</span>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-4 align-middle">
                        {product.isActive ? (
                          <span className="text-[12.5px] text-emerald-500">Active</span>
                        ) : (
                          <span className="text-[12.5px] text-slate-400">Inactive</span>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-4 align-middle text-[12.5px] text-slate-700">
                        {product.createdAt ? formatDistanceToNow(new Date(product.createdAt), { addSuffix: true }) : "recently"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {!loading && products.length > 0 && (
            <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-end">
              <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
            </div>
          )}
        </CardContent>
      </Card>



      {/* ---------- DELETE CONFIRMATION ---------- */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) {setDeleteTarget(null);} }}>
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
