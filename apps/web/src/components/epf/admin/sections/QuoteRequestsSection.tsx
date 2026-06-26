"use client";

import { Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { EmptyState, TableSkeleton, StatusBadge, formatDate, quoteStatusMap } from "../shared";
import type { QuoteRequestItem } from "../types";

export default function QuoteRequestsSection({ quotes, isLoading, onRetry, openReply, confirmDelete }: {
  quotes: QuoteRequestItem[]; isLoading: boolean; onRetry: () => void;
  openReply: (q: QuoteRequestItem) => void; confirmDelete: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-900">Quote Requests</h2>

      {isLoading ? <TableSkeleton rows={5} cols={6} /> : quotes.length === 0 ? <EmptyState message="No quote requests" /> : (
        <Card className="border border-[#E2E8F0] shadow-none bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-[#E2E8F0] bg-gray-50/50">
                  <TableHead className="text-xs">Name</TableHead>
                  <TableHead className="text-xs">Email</TableHead>
                  <TableHead className="text-xs">Subject</TableHead>
                  <TableHead className="text-xs">Company</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotes.map((q) => (
                  <TableRow key={q.id} className="border-b border-[#E2E8F0]">
                    <TableCell className="text-xs font-medium">{q.name}</TableCell>
                    <TableCell className="text-xs text-gray-500">{q.email}</TableCell>
                    <TableCell className="text-xs">{q.subject}</TableCell>
                    <TableCell className="text-xs">{q.company || "—"}</TableCell>
                    <TableCell><StatusBadge status={q.status} map={quoteStatusMap} /></TableCell>
                    <TableCell className="text-xs">{formatDate(q.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => openReply(q)}>
                          <Send className="size-3.5" />Reply
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => confirmDelete(q.id)}><Trash2 className="size-3.5" /></Button>
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
