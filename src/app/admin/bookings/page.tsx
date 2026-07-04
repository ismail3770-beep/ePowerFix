"use client";

import { useEffect, useState, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import {
  Dialog, DialogHeader, DialogContent, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye } from "lucide-react";

type BookingStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";

interface Booking {
  id: string;
  date: string;
  time: string;
  status: BookingStatus;
  notes: string | null;
  createdAt: string;
  user: { name: string | null; email: string } | null;
  service: { name: string } | null;
}

const statusBadge: Record<BookingStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 border-yellow-300",
  CONFIRMED: "bg-blue-100 text-blue-800 border-blue-300",
  COMPLETED: "bg-green-100 text-green-800 border-green-300",
  CANCELLED: "bg-red-100 text-red-800 border-red-300",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [detail, setDetail] = useState<Booking | null>(null);
  const [updating, setUpdating] = useState(false);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const params = statusFilter !== "ALL" ? `?status=${statusFilter}` : "";
      const res: any = await apiFetch(`/api/admin/bookings${params}`);
      setBookings(Array.isArray(res.data) ? res.data : res.data?.data || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  async function handleStatusChange(bookingId: string, status: BookingStatus) {
    setUpdating(true);
    try {
      await apiFetch(`/api/admin/bookings/${bookingId}`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
      toast.success("Status updated");
      setDetail((d) => (d?.id === bookingId ? { ...d, status } : d));
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status } : b))
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Bookings</h1>
      </div>

      <div className="flex items-center gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="PENDING">PENDING</SelectItem>
            <SelectItem value="CONFIRMED">CONFIRMED</SelectItem>
            <SelectItem value="COMPLETED">COMPLETED</SelectItem>
            <SelectItem value="CANCELLED">CANCELLED</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : bookings.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              No data found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="w-16 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-medium">
                        {booking.user?.name || booking.user?.email || "—"}
                      </TableCell>
                      <TableCell>{booking.service?.name || "—"}</TableCell>
                      <TableCell>{formatDate(booking.date)}</TableCell>
                      <TableCell>{booking.time}</TableCell>
                      <TableCell>
                        <Badge className={statusBadge[booking.status]} variant="outline">
                          {booking.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-muted-foreground">
                        {booking.notes || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="icon" variant="ghost" onClick={() => setDetail(booking)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!detail} onOpenChange={(o) => { if (!o) setDetail(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle>Booking Details</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Customer</p>
                    <p className="text-sm text-muted-foreground">
                      {detail.user?.name || detail.user?.email || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Service</p>
                    <p className="text-sm text-muted-foreground">
                      {detail.service?.name || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Date</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(detail.date)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Time</p>
                    <p className="text-sm text-muted-foreground">{detail.time}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Status</p>
                  <Select
                    value={detail.status}
                    onValueChange={(v) => handleStatusChange(detail.id, v as BookingStatus)}
                    disabled={updating}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING">PENDING</SelectItem>
                      <SelectItem value="CONFIRMED">CONFIRMED</SelectItem>
                      <SelectItem value="COMPLETED">COMPLETED</SelectItem>
                      <SelectItem value="CANCELLED">CANCELLED</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {detail.notes && (
                  <div>
                    <p className="text-sm font-medium mb-1">Notes</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {detail.notes}
                    </p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDetail(null)}>Close</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
