"use client";

// ============================================================
// Shared presentational helpers for the Admin panel sections.
// Extracted from AdminPanel.tsx.
// ============================================================

import { Package, XCircle, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

// ==================== Status maps ====================
// All keys are UPPERCASE to match the database string values.
export const bookingStatusMap: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Pending", color: "bg-yellow-100 text-yellow-800" },
  CONFIRMED: { label: "Confirmed", color: "bg-green-100 text-green-800" },
  IN_PROGRESS: { label: "In Progress", color: "bg-sky-100 text-sky-800" },
  COMPLETED: { label: "Completed", color: "bg-emerald-100 text-emerald-800" },
  CANCELLED: { label: "Cancelled", color: "bg-red-100 text-red-800" },
};

export const orderStatusMap: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Pending", color: "bg-yellow-100 text-yellow-800" },
  CONFIRMED: { label: "Confirmed", color: "bg-green-100 text-green-800" },
  PROCESSING: { label: "Processing", color: "bg-sky-100 text-sky-800" },
  SHIPPED: { label: "Shipped", color: "bg-purple-100 text-purple-800" },
  DELIVERED: { label: "Delivered", color: "bg-emerald-100 text-emerald-800" },
  CANCELLED: { label: "Cancelled", color: "bg-red-100 text-red-800" },
};

export const paymentStatusMap: Record<string, { label: string; color: string }> = {
  PAID: { label: "Paid", color: "bg-green-100 text-green-800" },
  PENDING: { label: "Pending", color: "bg-yellow-100 text-yellow-800" },
  UNPAID: { label: "Unpaid", color: "bg-red-100 text-red-800" },
  REFUNDED: { label: "Refunded", color: "bg-gray-100 text-gray-700" },
  CONFIRMED: { label: "Confirmed", color: "bg-green-100 text-green-800" },
};

export const shipmentStatusMap: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Pending", color: "bg-gray-100 text-gray-700" },
  PICKED_UP: { label: "Picked Up", color: "bg-sky-100 text-sky-800" },
  IN_TRANSIT: { label: "In Transit", color: "bg-indigo-100 text-indigo-800" },
  OUT_FOR_DELIVERY: { label: "Out for Delivery", color: "bg-purple-100 text-purple-800" },
  DELIVERED: { label: "Delivered", color: "bg-emerald-100 text-emerald-800" },
  FAILED: { label: "Failed", color: "bg-red-100 text-red-800" },
};

export const messageTypeMap: Record<string, { label: string; color: string }> = {
  GENERAL: { label: "General", color: "bg-gray-100 text-gray-700" },
  B2B: { label: "B2B", color: "bg-sky-100 text-sky-800" },
  COMPLAINT: { label: "Complaint", color: "bg-red-100 text-red-800" },
  FEEDBACK: { label: "Feedback", color: "bg-green-100 text-green-800" },
};

export const quoteStatusMap: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Pending", color: "bg-yellow-100 text-yellow-800" },
  REPLIED: { label: "Replied", color: "bg-green-100 text-green-800" },
  CLOSED: { label: "Closed", color: "bg-gray-100 text-gray-700" },
};

export const returnStatusMap: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Pending", color: "bg-yellow-100 text-yellow-800" },
  APPROVED: { label: "Approved", color: "bg-green-100 text-green-800" },
  REJECTED: { label: "Rejected", color: "bg-red-100 text-red-800" },
  COMPLETED: { label: "Completed", color: "bg-emerald-100 text-emerald-800" },
};

export const roleColorMap: Record<string, string> = {
  ADMIN: "bg-cyan-100 text-cyan-800",
  CUSTOMER: "bg-gray-100 text-gray-700",
};

// ==================== Components ====================
export function StatusBadge({ status, map }: { status: string; map: Record<string, { label: string; color: string }> }) {
  const s = map[status] || { label: status, color: "bg-gray-100 text-gray-700" };
  return (
    <Badge variant="outline" className={`text-xs px-2 py-0.5 font-medium whitespace-nowrap ${s.color}`}>
      {s.label}
    </Badge>
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className="h-8 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
      <Package className="h-10 w-10 mb-3 opacity-30" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
      <XCircle className="h-10 w-10 mb-3 text-destructive" />
      <p className="text-sm mb-3">{message}</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}

export function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
        />
      ))}
    </div>
  );
}

// ==================== Functions ====================
export function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatTaka(amount: number) {
  return `৳${amount.toLocaleString("en-US")}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}
