"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { ErrorState, EmptyState, TableSkeleton, StatusBadge, formatDate, formatTaka, returnStatusMap } from "../shared";
import type { ReturnRequestItem, ReturnUpdateMutation } from "../types";

export default function ReturnRequestsSection({ returns, isLoading, error, filter, setFilter, updateMutation, expandedId, setExpandedId, onRetry }: {
  returns: ReturnRequestItem[]; isLoading: boolean; error: Error | null;
  filter: string; setFilter: (f: string) => void;
  updateMutation: ReturnUpdateMutation;
  expandedId: string | null; setExpandedId: (id: string | null) => void;
  onRetry: () => void;
}) {
  if (error) {return <ErrorState message="Failed to load return requests" onRetry={onRetry} />;}

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-lg font-bold text-gray-900">Return Requests</h2>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Filter status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? <TableSkeleton rows={5} cols={7} /> : returns.length === 0 ? <EmptyState message="No return requests" /> : (
        <Card className="border border-[#E2E8F0] shadow-none bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-[#E2E8F0] bg-gray-50/50">
                  <TableHead className="w-8 text-xs"></TableHead>
                  <TableHead className="text-xs">Order #</TableHead>
                  <TableHead className="text-xs">Customer</TableHead>
                  <TableHead className="text-xs">Reason</TableHead>
                  <TableHead className="text-xs">Refund</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {returns.map((r) => (
                  <>
                    <TableRow key={r.id} className="border-b border-[#E2E8F0]">
                      <TableCell>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}>
                          {expandedId === r.id ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
                        </Button>
                      </TableCell>
                      <TableCell className="text-xs font-mono">{r.order.orderNumber.slice(-8)}</TableCell>
                      <TableCell className="text-xs">
                        <div>
                          <p className="font-medium">{r.user.name}</p>
                          <p className="text-gray-400">{r.user.phone}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs max-w-[200px] truncate">{r.reason}</TableCell>
                      <TableCell className="text-xs font-medium">
                        {r.refundAmount ? formatTaka(r.refundAmount) : "—"}
                      </TableCell>
                      <TableCell><StatusBadge status={r.status} map={returnStatusMap} /></TableCell>
                      <TableCell className="text-xs">{formatDate(r.createdAt)}</TableCell>
                    </TableRow>

                    {expandedId === r.id && (
                      <TableRow key={`${r.id}-expanded`}>
                        <TableCell colSpan={7} className="bg-gray-50/50 px-6 py-4">
                          <div className="text-xs space-y-4">
                            {/* Order & customer info */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              <div>
                                <span className="text-gray-500">Order Total:</span>{" "}
                                <span className="font-medium">{formatTaka(r.order.total)}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Payment:</span>{" "}
                                <span className="font-medium">{r.order.paymentStatus}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Customer Email:</span>{" "}
                                <span className="font-medium">{r.user.email}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Requested:</span>{" "}
                                <span className="font-medium">{formatDate(r.createdAt)}</span>
                              </div>
                            </div>

                            {/* Reason */}
                            <div>
                              <span className="text-gray-500">Reason:</span>
                              <p className="mt-1 text-gray-700 whitespace-pre-wrap">{r.reason}</p>
                            </div>

                            {/* Admin notes */}
                            {r.notes && (
                              <div>
                                <span className="text-gray-500">Admin Notes:</span>
                                <p className="mt-1 text-gray-700 whitespace-pre-wrap">{r.notes}</p>
                              </div>
                            )}

                            <Separator />

                            {/* Action panel — only show actions for PENDING / APPROVED */}
                            {r.status === "PENDING" && (
                              <PendingActions
                                returnRequest={r}
                                updateMutation={updateMutation}
                              />
                            )}
                            {r.status === "APPROVED" && (
                              <CompleteAction
                                returnRequest={r}
                                updateMutation={updateMutation}
                              />
                            )}
                            {r.status === "REJECTED" && (
                              <p className="text-gray-400 italic">This return request has been rejected.</p>
                            )}
                            {r.status === "COMPLETED" && (
                              <p className="text-emerald-600 font-medium">
                                Return completed — refund of {r.refundAmount ? formatTaka(r.refundAmount) : "—"} processed.
                              </p>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}

// ==================== Inline action sub-components ====================

function PendingActions({ returnRequest, updateMutation }: {
  returnRequest: ReturnRequestItem;
  updateMutation: ReturnUpdateMutation;
}) {
  const [refundAmount, setRefundAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [action, setAction] = useState<"approve" | "reject" | null>(null);

  if (!action) {
    return (
      <div className="flex items-center gap-2">
        <Button size="sm" variant="default" className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white" onClick={() => setAction("approve")}>
          <CheckCircle2 className="size-3.5 mr-1" /> Approve
        </Button>
        <Button size="sm" variant="default" className="h-7 text-xs bg-red-600 hover:bg-red-700 text-white" onClick={() => setAction("reject")}>
          <XCircle className="size-3.5 mr-1" /> Reject
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3 border rounded-md p-3 bg-white">
      {action === "approve" && (
        <>
          <div className="space-y-1">
            <Label>Refund Amount (৳)</Label>
            <Input
              type="number"
              placeholder="Enter refund amount"
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
            />
          </div>
          <p className="text-gray-400">Order total: {formatTaka(returnRequest.order.total)}</p>
        </>
      )}
      <div className="space-y-1">
        <Label>Admin Notes</Label>
        <Textarea
          placeholder={action === "approve" ? "Optional notes for the customer" : "Explain why the return is rejected"}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
        />
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          className="h-7 text-xs"
          disabled={updateMutation.isPending || (action === "approve" && !refundAmount)}
          onClick={() => updateMutation.mutate({
            id: returnRequest.id,
            status: action === "approve" ? "APPROVED" : "REJECTED",
            refundAmount: action === "approve" ? Number(refundAmount) : undefined,
            notes: notes || undefined,
          })}
        >
          {updateMutation.isPending ? "Processing..." : action === "approve" ? "Confirm Approve" : "Confirm Reject"}
        </Button>
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setAction(null)}>Cancel</Button>
      </div>
    </div>
  );
}

function CompleteAction({ returnRequest, updateMutation }: {
  returnRequest: ReturnRequestItem;
  updateMutation: ReturnUpdateMutation;
}) {
  const [notes, setNotes] = useState("");

  return (
    <div className="space-y-3 border rounded-md p-3 bg-white">
      <p className="text-gray-500">
        Approved refund: <span className="font-bold text-gray-900">{returnRequest.refundAmount ? formatTaka(returnRequest.refundAmount) : "—"}</span>
      </p>
      <div className="space-y-1">
        <Label>Admin Notes (optional)</Label>
        <Textarea
          placeholder="Any notes before completing the refund"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
        />
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
          disabled={updateMutation.isPending}
          onClick={() => updateMutation.mutate({
            id: returnRequest.id,
            status: "COMPLETED",
            notes: notes || undefined,
          })}
        >
          <RotateCcw className="size-3.5 mr-1" />
          {updateMutation.isPending ? "Processing..." : "Complete Refund"}
        </Button>
      </div>
    </div>
  );
}
