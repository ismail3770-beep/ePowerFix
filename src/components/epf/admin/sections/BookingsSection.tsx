"use client";

import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { ErrorState, EmptyState, TableSkeleton, StatusBadge, formatDate, formatTaka, bookingStatusMap } from "../shared";
import type { BookingItem, BookingStatusMutation } from "../types";

export default function BookingsSection({ bookings, isLoading, error, filter, setFilter, updateMutation, onRetry }: {
  bookings: BookingItem[]; isLoading: boolean; error: Error | null; filter: string; setFilter: (f: string) => void;
  updateMutation: BookingStatusMutation; onRetry: () => void;
}) {
  if (error) return <ErrorState message="Failed to load bookings" onRetry={onRetry} />;
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-lg font-bold text-gray-900">Service Bookings</h2>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Filter status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? <TableSkeleton rows={5} cols={6} /> : bookings.length === 0 ? <EmptyState message="No bookings found" /> : (
        <Card className="border border-[#E2E8F0] shadow-none bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-[#E2E8F0] bg-gray-50/50">
                  <TableHead className="text-xs">Service</TableHead>
                  <TableHead className="text-xs">Customer</TableHead>
                  <TableHead className="text-xs">Phone</TableHead>
                  <TableHead className="text-xs">Area</TableHead>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs">Price</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((b) => (
                  <TableRow key={b.id} className="border-b border-[#E2E8F0]">
                    <TableCell className="text-xs font-medium max-w-[140px] truncate">{b.service.name}</TableCell>
                    <TableCell className="text-xs">{b.customerName}</TableCell>
                    <TableCell className="text-xs font-mono">{b.customerPhone}</TableCell>
                    <TableCell className="text-xs">{b.area || b.address}</TableCell>
                    <TableCell className="text-xs">{b.preferredDate ? formatDate(b.preferredDate) : "—"}</TableCell>
                    <TableCell className="text-xs font-medium">{formatTaka(b.totalPrice)}</TableCell>
                    <TableCell><StatusBadge status={b.status} map={bookingStatusMap} /></TableCell>
                    <TableCell>
                      <Select value={b.status} onValueChange={(v) => updateMutation.mutate({ id: b.id, status: v })}>
                        <SelectTrigger className="h-7 w-28 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
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
