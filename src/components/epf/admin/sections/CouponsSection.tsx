"use client";

import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { EmptyState, TableSkeleton, formatDate, formatTaka } from "../shared";
import type { CouponItem } from "../types";

export default function CouponsSection({ coupons, isLoading, onRetry, openAdd, openEdit, confirmDelete }: {
  coupons: CouponItem[]; isLoading: boolean; onRetry: () => void;
  openAdd: () => void; openEdit: (c: CouponItem) => void; confirmDelete: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Coupons</h2>
        <Button className="bg-[#0EA5E9] hover:bg-[#0284C7] text-white text-xs gap-1.5" onClick={openAdd}>
          <Plus className="size-3.5" /> Add Coupon
        </Button>
      </div>

      {isLoading ? <TableSkeleton rows={5} cols={7} /> : coupons.length === 0 ? <EmptyState message="No coupons yet" /> : (
        <Card className="border border-[#E2E8F0] shadow-none bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-[#E2E8F0] bg-gray-50/50">
                  <TableHead className="text-xs">Code</TableHead>
                  <TableHead className="text-xs">Type</TableHead>
                  <TableHead className="text-xs">Value</TableHead>
                  <TableHead className="text-xs">Min Order</TableHead>
                  <TableHead className="text-xs">Used/Limit</TableHead>
                  <TableHead className="text-xs">Dates</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map((c) => (
                  <TableRow key={c.id} className="border-b border-[#E2E8F0]">
                    <TableCell className="text-xs font-mono font-bold">{c.code}</TableCell>
                    <TableCell className="text-xs">
                      <Badge variant="outline" className="text-xs px-1.5 py-0">{c.type === "percentage" ? `${c.value}%` : formatTaka(c.value)}</Badge>
                    </TableCell>
                    <TableCell className="text-xs font-medium">{c.type === "percentage" ? `${c.value}%` : formatTaka(c.value)}</TableCell>
                    <TableCell className="text-xs">{formatTaka(c.minOrder)}</TableCell>
                    <TableCell className="text-xs">{c.usedCount}{c.usageLimit ? `/${c.usageLimit}` : ""}</TableCell>
                    <TableCell className="text-xs">
                      <div className="flex flex-col">
                        <span>{formatDate(c.startDate)}</span>
                        <span className="text-gray-400">→ {formatDate(c.endDate)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs px-1.5 py-0 ${c.active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {c.active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(c)}><Pencil className="size-3.5" /></Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => confirmDelete(c.id)}><Trash2 className="size-3.5" /></Button>
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
