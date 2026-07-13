"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}

/**
 * Minimal Prev/Next pagination control used across admin tables.
 * Reads the same `total`/`totalPages` shape returned by the project's
 * listResponse() helper.
 */
export default function Pagination({ page, totalPages, total, onPageChange }: PaginationProps) {
  if (totalPages <= 1) {
    return (
      <div className="flex items-center justify-between mt-4 text-sm text-slate-500">
        <span>{total} item{total === 1 ? "" : "s"} total</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between mt-4 text-sm text-slate-600">
      <span>
        Page {page} of {totalPages} · {total} item{total === 1 ? "" : "s"} total
      </span>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Prev
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
