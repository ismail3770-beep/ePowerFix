"use client";

import { Plus, Pencil, Trash2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { EmptyState, TableSkeleton, formatTaka } from "../shared";
import type { ServiceItem } from "../types";

export default function ServicesSection({ services, isLoading, onRetry, openAdd, openEdit, confirmDelete }: {
  services: ServiceItem[]; isLoading: boolean; onRetry: () => void;
  openAdd: () => void; openEdit: (s: ServiceItem) => void; confirmDelete: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Services</h2>
        <Button className="bg-[#0EA5E9] hover:bg-[#0284C7] text-white text-xs gap-1.5" onClick={openAdd}>
          <Plus className="size-3.5" /> Add Service
        </Button>
      </div>

      {isLoading ? <TableSkeleton rows={5} cols={6} /> : services.length === 0 ? <EmptyState message="No services yet" /> : (
        <Card className="border border-[#E2E8F0] shadow-none bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-[#E2E8F0] bg-gray-50/50">
                  <TableHead className="text-xs">Name</TableHead>
                  <TableHead className="text-xs">Category</TableHead>
                  <TableHead className="text-xs">Price</TableHead>
                  <TableHead className="text-xs">Unit</TableHead>
                  <TableHead className="text-xs">Duration</TableHead>
                  <TableHead className="text-xs">Popular</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((s) => (
                  <TableRow key={s.id} className="border-b border-[#E2E8F0]">
                    <TableCell className="text-xs font-medium">{s.name}</TableCell>
                    <TableCell className="text-xs">{s.category?.name || "—"}</TableCell>
                    <TableCell className="text-xs font-medium">{formatTaka(s.basePrice)}</TableCell>
                    <TableCell className="text-xs">{s.priceLabel}</TableCell>
                    <TableCell className="text-xs">{s.duration}</TableCell>
                    <TableCell>{s.popular ? <Star className="size-3.5 fill-yellow-400 text-yellow-400" /> : <span className="text-gray-300">—</span>}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs px-1.5 py-0 ${s.active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {s.active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(s)}><Pencil className="size-3.5" /></Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => confirmDelete(s.id)}><Trash2 className="size-3.5" /></Button>
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
