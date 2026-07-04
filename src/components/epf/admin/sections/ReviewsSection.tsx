"use client";

import { Eye, EyeOff, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { EmptyState, TableSkeleton, Stars, formatDate } from "../shared";
import type { ReviewItem, StringMutation } from "../types";

export default function ReviewsSection({ reviews, isLoading, onRetry, toggleMutation, confirmDelete }: {
  reviews: ReviewItem[]; isLoading: boolean; onRetry: () => void;
  toggleMutation: StringMutation; confirmDelete: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-900">Reviews</h2>

      {isLoading ? <TableSkeleton rows={5} cols={6} /> : reviews.length === 0 ? <EmptyState message="No reviews yet" /> : (
        <Card className="border border-[#E2E8F0] shadow-none bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-[#E2E8F0] bg-gray-50/50">
                  <TableHead className="text-xs">User</TableHead>
                  <TableHead className="text-xs">Product</TableHead>
                  <TableHead className="text-xs">Rating</TableHead>
                  <TableHead className="text-xs">Comment</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviews.map((r) => (
                  <TableRow key={r.id} className="border-b border-[#E2E8F0]">
                    <TableCell className="text-xs font-medium">{r.user.name}</TableCell>
                    <TableCell className="text-xs">{r.product.name}</TableCell>
                    <TableCell><Stars rating={r.rating} /></TableCell>
                    <TableCell className="text-xs max-w-[200px] truncate">{r.comment || r.title || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs px-1.5 py-0 ${r.isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {r.isActive ? "Approved" : "Hidden"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{formatDate(r.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => toggleMutation.mutate(r.id)} title={r.isActive ? "Unapprove" : "Approve"}>
                          {r.isActive ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => confirmDelete(r.id)}><Trash2 className="size-3.5" /></Button>
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
