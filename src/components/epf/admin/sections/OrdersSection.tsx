"use client";

import { ChevronDown, ChevronRight, Truck } from "lucide-react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { ErrorState, EmptyState, TableSkeleton, StatusBadge, formatDate, formatTaka, orderStatusMap, paymentStatusMap, shipmentStatusMap } from "../shared";
import type { Order, OrderUpdateMutation } from "../types";

export default function OrdersSection({ orders, isLoading, error, filter, setFilter, updateMutation, expandedOrderId, setExpandedOrderId, onRetry, onCreateShipment, onEditShipment }: {
  orders: Order[]; isLoading: boolean; error: Error | null; filter: string; setFilter: (f: string) => void;
  updateMutation: OrderUpdateMutation; expandedOrderId: string | null; setExpandedOrderId: (id: string | null) => void; onRetry: () => void;
  onCreateShipment: (order: Order) => void; onEditShipment: (order: Order) => void;
}) {
  if (error) return <ErrorState message="Failed to load orders" onRetry={onRetry} />;
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-lg font-bold text-gray-900">Orders</h2>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Filter status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="CONFIRMED">Confirmed</SelectItem>
            <SelectItem value="PROCESSING">Processing</SelectItem>
            <SelectItem value="SHIPPED">Shipped</SelectItem>
            <SelectItem value="DELIVERED">Delivered</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? <TableSkeleton rows={5} cols={6} /> : orders.length === 0 ? <EmptyState message="No orders found" /> : (
        <Card className="border border-[#E2E8F0] shadow-none bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-[#E2E8F0] bg-gray-50/50">
                  <TableHead className="w-8 text-xs"></TableHead>
                  <TableHead className="text-xs">Order #</TableHead>
                  <TableHead className="text-xs">Customer</TableHead>
                  <TableHead className="text-xs">Phone</TableHead>
                  <TableHead className="text-xs">Amount</TableHead>
                  <TableHead className="text-xs">Payment</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((o) => (
                  <>
                    <TableRow key={o.id} className="border-b border-[#E2E8F0]">
                      <TableCell>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setExpandedOrderId(expandedOrderId === o.id ? null : o.id)}>
                          {expandedOrderId === o.id ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
                        </Button>
                      </TableCell>
                      <TableCell className="text-xs font-mono">{o.orderNumber.slice(-8)}</TableCell>
                      <TableCell className="text-xs">
                        <div>
                          <p className="font-medium">{o.customerName}</p>
                          {o.customerEmail && <p className="text-gray-400">{o.customerEmail}</p>}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-mono">{o.customerPhone}</TableCell>
                      <TableCell className="text-xs font-medium">{formatTaka(o.total)}</TableCell>
                      <TableCell>
                        <StatusBadge status={o.paymentStatus} map={paymentStatusMap} />
                      </TableCell>
                      <TableCell><StatusBadge status={o.status} map={orderStatusMap} /></TableCell>
                      <TableCell>
                        <Select value={o.status} onValueChange={(v) => updateMutation.mutate({ id: o.id, status: v })}>
                          <SelectTrigger className="h-7 w-28 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PENDING">Pending</SelectItem>
                            <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                            <SelectItem value="PROCESSING">Processing</SelectItem>
                            <SelectItem value="SHIPPED">Shipped</SelectItem>
                            <SelectItem value="DELIVERED">Delivered</SelectItem>
                            <SelectItem value="CANCELLED">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                    {expandedOrderId === o.id && (
                      <TableRow key={`${o.id}-expanded`}>
                        <TableCell colSpan={8} className="bg-gray-50/50 px-6 py-4">
                          <div className="text-xs space-y-3">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              <div><span className="text-gray-500">Address:</span> <span className="font-medium">{o.address}, {o.area}</span></div>
                              <div><span className="text-gray-500">Subtotal:</span> <span className="font-medium">{formatTaka(o.subtotal)}</span></div>
                              <div><span className="text-gray-500">Delivery:</span> <span className="font-medium">{formatTaka(o.deliveryCharge)}</span></div>
                              <div><span className="text-gray-500">Discount:</span> <span className="font-medium">{formatTaka(o.discount)}</span></div>
                              <div><span className="text-gray-500">Payment:</span> <span className="font-medium">{o.paymentMethod}</span></div>
                              <div><span className="text-gray-500">Date:</span> <span className="font-medium">{formatDate(o.createdAt)}</span></div>
                              {o.notes && <div className="col-span-2"><span className="text-gray-500">Notes:</span> <span className="font-medium">{o.notes}</span></div>}
                            </div>
                            <Separator />
                            <div>
                              <p className="font-semibold mb-1.5">Order Items</p>
                              <div className="space-y-1">
                                {o.items.map((item, i) => (
                                  <div key={i} className="flex justify-between items-center py-1">
                                    <span>{item.productName}</span>
                                    <span className="text-gray-500">×{item.quantity} = {formatTaka(item.price * item.quantity)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <Separator />
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <p className="font-semibold flex items-center gap-1.5"><Truck className="size-3.5" /> Shipment</p>
                                {o.shipment ? (
                                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onEditShipment(o)}>Update Tracking</Button>
                                ) : (
                                  <Button size="sm" variant="default" className="h-7 text-xs" onClick={() => onCreateShipment(o)}>Create Shipment</Button>
                                )}
                              </div>
                              {o.shipment ? (
                                <div className="space-y-2">
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                    <div><span className="text-gray-500">Carrier:</span> <span className="font-medium">{o.shipment.carrier || "—"}</span></div>
                                    <div><span className="text-gray-500">Tracking #:</span> <span className="font-medium font-mono">{o.shipment.trackingNumber || "—"}</span></div>
                                    <div><span className="text-gray-500">ETA:</span> <span className="font-medium">{o.shipment.estimatedDelivery ? formatDate(o.shipment.estimatedDelivery) : "—"}</span></div>
                                    <div><span className="text-gray-500">Status:</span> <StatusBadge status={o.shipment.status} map={shipmentStatusMap} /></div>
                                  </div>
                                  {o.shipment.histories.length > 0 && (
                                    <div>
                                      <p className="text-gray-500 mb-1">Timeline:</p>
                                      <ol className="space-y-1 border-l-2 border-gray-200 pl-3">
                                        {o.shipment.histories.map((h, i) => (
                                          <li key={i} className="text-xs">
                                            <span className="font-medium">{h.status.replace(/_/g, " ").toLowerCase()}</span>
                                            <span className="text-gray-400"> — {formatDate(h.createdAt)}</span>
                                            {h.location && <span className="text-gray-500"> · {h.location}</span>}
                                            {h.note && <div className="text-gray-400 italic">{h.note}</div>}
                                          </li>
                                        ))}
                                      </ol>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <p className="text-gray-400 italic">No shipment created yet.</p>
                              )}
                            </div>
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
