"use client";

import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { EmptyState, TableSkeleton, formatDate } from "../shared";
import type { NewsletterItem } from "../types";

export default function NewsletterSection({ subscribers, isLoading, onRetry, confirmDelete }: {
  subscribers: NewsletterItem[]; isLoading: boolean; onRetry: () => void;
  confirmDelete: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Newsletter Subscribers</h2>
        <Badge variant="outline" className="text-xs bg-[#0EA5E9]/10 text-[#0EA5E9] border-[#0EA5E9]/20">
          {subscribers.length} subscribers
        </Badge>
      </div>

      {isLoading ? <TableSkeleton rows={5} cols={3} /> : subscribers.length === 0 ? <EmptyState message="No subscribers yet" /> : (
        <Card className="border border-[#E2E8F0] shadow-none bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-[#E2E8F0] bg-gray-50/50">
                  <TableHead className="text-xs">Email</TableHead>
                  <TableHead className="text-xs">Subscribed</TableHead>
                  <TableHead className="text-xs">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscribers.map((s) => (
                  <TableRow key={s.id} className="border-b border-[#E2E8F0]">
                    <TableCell className="text-xs font-medium">{s.email}</TableCell>
                    <TableCell className="text-xs">{formatDate(s.createdAt)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => confirmDelete(s.id)}><Trash2 className="size-3.5" /></Button>
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
