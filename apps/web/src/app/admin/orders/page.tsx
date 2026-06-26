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
  Dialog, DialogHeader, DialogContent, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye } from "lucide-react";

type OrderStatus = "PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface OrderAddress {
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

interface Order {
  id: string;
  orderNumber: string;
  total: number;
  status: OrderStatus;
  createdAt: string;
  user: { name: string | null; email: string } | null;
  items: OrderItem[];
  shippingAddress: OrderAddress | null;
  paymentStatus: string;
  paymentMethod: string;
  subtotal: number;
  shipping: number;
  tax: number;
}

const statusColors: Record<OrderStatus, "default" | "secondary" | "destructive" | "outline"> & Record<string, any> = {
  PENDING: "default",
  CONFIRMED: "default",
  PROCESSING: "default",
  SHIPPED: "outline",
  DELIVERED: "default",
  CANCELLED: "destructive",
};

const statusStyles: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 border-yellow-300",
  CONFIRMED: "bg-blue-100 text-blue-800 border-blue-300",
  PROCESSING: "bg-purple-100 text-purple-800 border-purple-300",
  SHIPPED: "bg-orange-100 text-orange-800 border-orange-300",
  DELIVERED: "bg-green-100 text-green-800 border-green-300",
  CANCELLED: "bg-red-100 text-red-800 border-red-300",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<Order | null>(null);
  const [updating, setUpdating] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await apiFetch("/api/admin/orders");
      setOrders(res.data ?? []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  async function handleStatusChange(orderId: string, status: OrderStatus) {
    setUpdating(true);
    try {
      await apiFetch(`/api/admin/orders/${orderId}/status`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
      toast.success("Status updated");
      setDetail((d) => (d?.id === orderId ? { ...d, status } : d));
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Orders</h1>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              No orders found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-20 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-sm">{order.orderNumber}</TableCell>
                      <TableCell>{order.user?.name || order.user?.email || "—"}</TableCell>
                      <TableCell>৳{order.total.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge className={statusStyles[order.status] ?? ""} variant="outline">
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{order.paymentStatus}</TableCell>
                      <TableCell>{formatDate(order.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <Button size="icon" variant="ghost" onClick={() => setDetail(order)}>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle>Order #{detail.orderNumber}</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Customer</p>
                    <p className="text-sm text-muted-foreground">
                      {detail.user?.name || detail.user?.email || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Date</p>
                    <p className="text-sm text-muted-foreground">{formatDate(detail.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Payment Method</p>
                    <p className="text-sm text-muted-foreground">{detail.paymentMethod}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Payment Status</p>
                    <p className="text-sm text-muted-foreground">{detail.paymentStatus}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Status</p>
                  <Select
                    value={detail.status}
                    onValueChange={(v) => handleStatusChange(detail.id, v as OrderStatus)}
                    disabled={updating}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING">PENDING</SelectItem>
                      <SelectItem value="CONFIRMED">CONFIRMED</SelectItem>
                      <SelectItem value="PROCESSING">PROCESSING</SelectItem>
                      <SelectItem value="SHIPPED">SHIPPED</SelectItem>
                      <SelectItem value="DELIVERED">DELIVERED</SelectItem>
                      <SelectItem value="CANCELLED">CANCELLED</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {detail.shippingAddress && (
                  <div>
                    <p className="text-sm font-medium mb-1">Shipping Address</p>
                    <p className="text-sm text-muted-foreground">
                      {detail.shippingAddress.name}, {detail.shippingAddress.phone}<br />
                      {detail.shippingAddress.address}<br />
                      {detail.shippingAddress.city}, {detail.shippingAddress.state} {detail.shippingAddress.zip}<br />
                      {detail.shippingAddress.country}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-sm font-medium mb-2">Items</p>
                  <div className="space-y-2">
                    {detail.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                        {item.image && (
                          <img src={item.image} alt="" className="w-10 h-10 rounded object-cover" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            ৳{item.price.toFixed(2)} x {item.quantity}
                          </p>
                        </div>
                        <p className="text-sm font-medium">
                          ৳{(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-4 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>৳{detail.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>৳{detail.shipping.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax</span>
                    <span>৳{detail.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-base pt-2 border-t">
                    <span>Total</span>
                    <span>৳{detail.total.toFixed(2)}</span>
                  </div>
                </div>
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
