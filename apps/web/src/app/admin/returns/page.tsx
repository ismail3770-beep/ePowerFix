"use client";

import { useEffect, useState, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { RefreshCw } from "lucide-react";

type ReturnStatus = "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";

interface ReturnRequest {
  id: string;
  orderNumber?: string;
  orderId?: string;
  reason: string;
  status: ReturnStatus;
  createdAt: string;
  order?: { orderNumber?: string } | null;
  user?: { name?: string | null; email?: string } | null;
}

const statusBadge: Record<ReturnStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 border-yellow-300",
  APPROVED: "bg-blue-100 text-blue-800 border-blue-300",
  REJECTED: "bg-red-100 text-red-800 border-red-300",
  COMPLETED: "bg-green-100 text-green-800 border-green-300",
};

export default function AdminReturnsPage() {
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReturns = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ data: { data: ReturnRequest[] } | ReturnRequest[] }>("/api/admin/returns");
      const list = (res.data as any)?.data ?? (Array.isArray(res.data) ? res.data : []);
      setReturns(list);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load returns");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReturns(); }, [fetchReturns]);

  const updateStatus = async (id: string, status: ReturnStatus) => {
    try {
      await apiFetch(`/api/admin/returns/${id}`, { method: "PUT", body: JSON.stringify({ status }) });
      setReturns((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
      toast.success(`Status updated to ${status}`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to update status");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Returns</h1>
          <p className="text-sm text-[#6B7280] mt-1">Manage customer return requests</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchReturns} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Return Requests</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : returns.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">No return requests found.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {returns.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs">
                        {r.order?.orderNumber || r.orderNumber || r.orderId || "—"}
                      </TableCell>
                      <TableCell>{r.user?.name || r.user?.email || "—"}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{r.reason}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusBadge[r.status]}>{r.status}</Badge>
                      </TableCell>
                      <TableCell className="text-xs">{new Date(r.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Select value={r.status} onValueChange={(v) => updateStatus(r.id, v as ReturnStatus)}>
                          <SelectTrigger className="w-[140px] h-8 text-xs ml-auto">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PENDING">Pending</SelectItem>
                            <SelectItem value="APPROVED">Approved</SelectItem>
                            <SelectItem value="REJECTED">Rejected</SelectItem>
                            <SelectItem value="COMPLETED">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
