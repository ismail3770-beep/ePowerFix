"use client";

import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { EmptyState, TableSkeleton, formatTaka } from "../shared";
import type { ProductItem } from "../types";

export default function ProductsSection({ products, isLoading, onRetry, openAdd, openEdit, confirmDelete }: {
  products: ProductItem[]; isLoading: boolean; onRetry: () => void;
  openAdd: () => void; openEdit: (p: ProductItem) => void; confirmDelete: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Products</h2>
        <Button className="bg-[#0EA5E9] hover:bg-[#0284C7] text-white text-xs gap-1.5" onClick={openAdd}>
          <Plus className="size-3.5" /> Add Product
        </Button>
      </div>

      {isLoading ? <TableSkeleton rows={5} cols={7} /> : products.length === 0 ? <EmptyState message="No products yet" /> : (
        <Card className="border border-[#E2E8F0] shadow-none bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-[#E2E8F0] bg-gray-50/50">
                  <TableHead className="text-xs">Name</TableHead>
                  <TableHead className="text-xs">Category</TableHead>
                  <TableHead className="text-xs">Brand</TableHead>
                  <TableHead className="text-xs">Price</TableHead>
                  <TableHead className="text-xs">Stock</TableHead>
                  <TableHead className="text-xs">Sold</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => (
                  <TableRow key={p.id} className="border-b border-[#E2E8F0]">
                    <TableCell className="text-xs font-medium max-w-[160px] truncate">
                      <div className="flex items-center gap-2">
                        {p.image && <img src={p.image} alt="" className="h-8 w-8 rounded object-cover shrink-0" />}
                        <span className="truncate">{p.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">{p.category?.name || "—"}</TableCell>
                    <TableCell className="text-xs">{p.brand?.name || "—"}</TableCell>
                    <TableCell className="text-xs font-medium">{formatTaka(p.price)}{p.comparePrice && <span className="text-gray-400 line-through ml-1">{formatTaka(p.comparePrice)}</span>}</TableCell>
                    <TableCell className="text-xs">{p.stock}</TableCell>
                    <TableCell className="text-xs">{p.sold}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs px-1.5 py-0 ${p.active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {p.active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(p)}><Pencil className="size-3.5" /></Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => confirmDelete(p.id)}><Trash2 className="size-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}
