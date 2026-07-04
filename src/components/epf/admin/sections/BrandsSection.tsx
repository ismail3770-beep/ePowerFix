"use client";

import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { EmptyState, TableSkeleton } from "../shared";
import type { BrandItem } from "../types";

export default function BrandsSection({ brands, isLoading, onRetry, openAdd, openEdit, confirmDelete }: {
  brands: BrandItem[]; isLoading: boolean; onRetry: () => void;
  openAdd: () => void; openEdit: (b: BrandItem) => void; confirmDelete: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Brands</h2>
        <Button className="bg-[#0EA5E9] hover:bg-[#0284C7] text-white text-xs gap-1.5" onClick={openAdd}>
          <Plus className="size-3.5" /> Add Brand
        </Button>
      </div>

      {isLoading ? <TableSkeleton rows={5} cols={6} /> : brands.length === 0 ? <EmptyState message="No brands yet" /> : (
        <Card className="border border-[#E2E8F0] shadow-none bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-[#E2E8F0] bg-gray-50/50">
                  <TableHead className="text-xs">Name</TableHead>
                  <TableHead className="text-xs">Slug</TableHead>
                  <TableHead className="text-xs">Country</TableHead>
                  <TableHead className="text-xs">Sort</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {brands.map((b) => (
                  <TableRow key={b.id} className="border-b border-[#E2E8F0]">
                    <TableCell className="text-xs font-medium">
                      <div className="flex items-center gap-2">
                        {b.logo && <img src={b.logo} alt="" className="h-6 w-6 rounded object-contain shrink-0 bg-gray-50 p-0.5" />}
                        <span>{b.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-gray-400 font-mono">{b.slug}</TableCell>
                    <TableCell className="text-xs">{b.country || "—"}</TableCell>
                    <TableCell className="text-xs">{b.sortOrder}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs px-1.5 py-0 ${b.active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {b.active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(b)}><Pencil className="size-3.5" /></Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => confirmDelete(b.id)}><Trash2 className="size-3.5" /></Button>
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
