"use client";

import { useEffect, useState, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogHeader, DialogContent, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Eye, Search, X, ShoppingBag, MapPin, CreditCard, Calendar, User,
} from "lucide-react";
import Pagination from "@/components/admin/Pagination";

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
  customerName?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  notes?: string | null;
  deliveryCharge?: number | null;
  discount?: number | null;
}

/**
 * The shipping address is stored as JSON inside `order.notes` (admin-created
 * orders) OR is composed from customerName/customerPhone + notes (frontend
 * orders). Try parsing notes first, fall back to scattered fields.
 */
function extractShippingAddress(order: Order): OrderAddress | null {
  if (order.shippingAddress) return order.shippingAddress;
  if (order.notes) {
    try {
      const parsed = JSON.parse(order.notes);
      if (parsed && typeof parsed === 'object' && (parsed.address || parsed.name)) {
        return {
          name: parsed.name || order.customerName || '',
          phone: parsed.phone || order.customerPhone || '',
          address: parsed.address || '',
          city: parsed.city || '',
          state: parsed.state || '',
          zip: parsed.zip || '',
          country: parsed.country || 'Bangladesh',
        };
      }
    } catch {
      // notes is a plain string (not JSON) — fall through to scattered fields.
    }
  }
  if (order.customerName || order.customerPhone) {
    return {
      name: order.customerName || '',
      phone: order.customerPhone || '',
      address: order.notes || '',
      city: '',
      state: '',
      zip: '',
      country: 'Bangladesh',
    };
  }
  return null;
}

// Color-coded order status badges
const statusStyles: Record<OrderStatus, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  CONFIRMED: "bg-blue-50 text-blue-700 border-blue-200",
  PROCESSING: "bg-purple-50 text-purple-700 border-purple-200",
  SHIPPED: "bg-violet-50 text-violet-700 border-violet-200",
  DELIVERED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CANCELLED: "bg-red-50 text-red-700 border-red-200",
};

// Color-coded payment status badges
const paymentStyles: Record<string, string> = {
  PAID: "bg-emerald-50 text-emerald-700 border-emerald-200",
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  FAILED: "bg-red-50 text-red-700 border-red-200",
  REFUNDED: "bg-orange-50 text-orange-700 border-orange-200",
  UNPAID: "bg-amber-50 text-amber-700 border-amber-200",
};

const filterTabs: { key: OrderStatus | "ALL"; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "PENDING", label: "Pending" },
  { key: "CONFIRMED", label: "Confirmed" },
  { key: "SHIPPED", label: "Shipped" },
  { key: "DELIVERED", label: "Delivered" },
  { key: "CANCELLED", label: "Cancelled" },
];

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}

function formatCurrency(n: number) {
  return "৳" + (Number(n) || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<Order | null>(null);
  const [updating, setUpdating] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const PAGE_LIMIT = 20;

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(PAGE_LIMIT));
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (search) params.set("search", search);
      const res: any = await apiFetch(`/api/admin/orders?${params.toString()}`);
      setOrders(res.data?.data ?? []);
      setTotal(res.data?.total ?? 0);
      setTotalPages(res.data?.totalPages ?? 1);
    } catch (err: any) {
      toast.error(err.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Reset to page 1 when filter/search changes
  useEffect(() => { setPage(1); }, [statusFilter, search]);

  // Local client-side filter as a safety net in case the backend doesn't
  // support status / search query params — falls back gracefully.
  const visibleOrders = orders.filter((o) => {
    if (statusFilter !== "ALL" && o.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const match =
        o.orderNumber.toLowerCase().includes(q) ||
        (o.user?.name || "").toLowerCase().includes(q) ||
        (o.user?.email || "").toLowerCase().includes(q) ||
        (o.customerName || "").toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  // Counts per tab (best-effort from current page only)
  const statusCounts: Record<string, number> = { ALL: orders.length };
  orders.forEach((o) => {
    statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
  });

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
      {/* ---------- HEADER ---------- */}
      <div>
        <h1 className="text-[24px] font-bold text-slate-900">Orders</h1>
        <p className="text-[13px] text-slate-500 mt-0.5">
          {total} order{total === 1 ? "" : "s"} total
        </p>
      </div>

      {/* ---------- FILTER PILLS ---------- */}
      <div className="flex flex-wrap items-center gap-2">
        {filterTabs.map((tab) => {
          const active = statusFilter === tab.key;
          const count = tab.key === "ALL" ? total : statusCounts[tab.key] ?? 0;
          return (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-semibold transition-all ${
                active
                  ? "bg-epf-500 text-white shadow-sm"
                  : "bg-white text-slate-600 border border-slate-200 hover:border-epf-300 hover:text-epf-600"
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${
                  active ? "bg-white/20" : "bg-slate-100 text-slate-500"
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ---------- SEARCH ---------- */}
      <Card className="rounded-xl border-slate-200 shadow-sm py-0">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by order # or customer..."
                className="pl-9 h-10 rounded-lg border-slate-200 bg-slate-50 focus:bg-white"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {(search || statusFilter !== "ALL") && (
              <Button
                variant="outline"
                onClick={() => { setSearch(""); setStatusFilter("ALL"); }}
                className="h-10 rounded-lg border-slate-200 text-slate-600 hover:text-epf-600"
              >
                <X className="mr-1.5 h-3.5 w-3.5" /> Clear filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ---------- TABLE ---------- */}
      <Card className="rounded-xl border-slate-200 shadow-sm py-0 overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : visibleOrders.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-epf-50 flex items-center justify-center mx-auto mb-4">
                <ShoppingBag className="w-8 h-8 text-epf-500" />
              </div>
              <h3 className="text-[16px] font-semibold text-slate-900 mb-1">No orders found</h3>
              <p className="text-[13px] text-slate-500 max-w-sm mx-auto">
                {search || statusFilter !== "ALL"
                  ? "Try adjusting your search or filter to find what you're looking for."
                  : "Orders will appear here once customers start placing them."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 border-b border-slate-100 hover:bg-slate-50">
                    <TableHead className="text-[11px] font-semibold uppercase text-slate-500 px-5 py-3">Order #</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase text-slate-500 px-5 py-3">Customer</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase text-slate-500 px-5 py-3 text-center">Items</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase text-slate-500 px-5 py-3 text-right">Total</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase text-slate-500 px-5 py-3">Payment</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase text-slate-500 px-5 py-3">Status</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase text-slate-500 px-5 py-3">Date</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase text-slate-500 px-5 py-3 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleOrders.map((order) => (
                    <TableRow key={order.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <TableCell className="px-5 py-3">
                        <span className="text-[14px] font-semibold text-epf-600">#{order.orderNumber}</span>
                      </TableCell>
                      <TableCell className="px-5 py-3">
                        <div>
                          <p className="text-[14px] font-medium text-slate-900">
                            {order.user?.name || order.customerName || "Guest"}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {order.user?.email || order.customerEmail || ""}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="px-5 py-3 text-center">
                        <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-2 text-[12px] font-semibold text-slate-700 bg-slate-100 rounded-full">
                          {order.items?.length || 0}
                        </span>
                      </TableCell>
                      <TableCell className="px-5 py-3 text-right text-[14px] font-semibold text-slate-900">
                        {formatCurrency(Number(order.total))}
                      </TableCell>
                      <TableCell className="px-5 py-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 text-[11px] font-bold rounded-full border ${
                            paymentStyles[order.paymentStatus] || "bg-slate-100 text-slate-600 border-slate-200"
                          }`}
                        >
                          {order.paymentStatus}
                        </span>
                      </TableCell>
                      <TableCell className="px-5 py-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 text-[11px] font-bold rounded-full border ${
                            statusStyles[order.status] || "bg-slate-100 text-slate-600 border-slate-200"
                          }`}
                        >
                          {order.status}
                        </span>
                      </TableCell>
                      <TableCell className="px-5 py-3 text-[13px] text-slate-500">
                        {formatDate(order.createdAt)}
                      </TableCell>
                      <TableCell className="px-5 py-3 text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setDetail(order)}
                          className="h-8 w-8 rounded-lg text-slate-400 hover:text-epf-600 hover:bg-epf-50"
                          title="View details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {!loading && visibleOrders.length > 0 && (
            <div className="px-5 py-4 border-t border-slate-100">
              <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* ---------- ORDER DETAIL DIALOG ---------- */}
      <Dialog open={!!detail} onOpenChange={(o) => { if (!o) setDetail(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  Order <span className="text-epf-600">#{detail.orderNumber}</span>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-5">
                {/* Top info row */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border border-slate-200 p-3">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase text-slate-400 mb-1">
                      <User className="w-3 h-3" /> Customer
                    </div>
                    <p className="text-[14px] font-medium text-slate-900">
                      {detail.user?.name || detail.customerName || "Guest"}
                    </p>
                    <p className="text-[12px] text-slate-500">
                      {detail.user?.email || detail.customerEmail || "—"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-3">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase text-slate-400 mb-1">
                      <Calendar className="w-3 h-3" /> Order Date
                    </div>
                    <p className="text-[14px] font-medium text-slate-900">{formatDate(detail.createdAt)}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-3">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase text-slate-400 mb-1">
                      <CreditCard className="w-3 h-3" /> Payment
                    </div>
                    <p className="text-[14px] font-medium text-slate-900">{detail.paymentMethod}</p>
                    <span
                      className={`inline-flex items-center mt-1 px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                        paymentStyles[detail.paymentStatus] || "bg-slate-100 text-slate-600 border-slate-200"
                      }`}
                    >
                      {detail.paymentStatus}
                    </span>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-3">
                    <div className="text-[11px] font-semibold uppercase text-slate-400 mb-1">Order Status</div>
                    <Select
                      value={detail.status}
                      onValueChange={(v) => handleStatusChange(detail.id, v as OrderStatus)}
                      disabled={updating}
                    >
                      <SelectTrigger className="h-9 w-full rounded-lg">
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
                </div>

                {/* Shipping address */}
                {(() => {
                  const addr = detail ? extractShippingAddress(detail) : null;
                  if (!addr) return null;
                  return (
                    <div className="rounded-lg border border-slate-200 p-3">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase text-slate-400 mb-1">
                        <MapPin className="w-3 h-3" /> Shipping Address
                      </div>
                      <p className="text-[14px] text-slate-700 leading-relaxed">
                        <span className="font-medium">{addr.name}</span>{addr.phone && <>, {addr.phone}</>}<br />
                        {addr.address}<br />
                        {addr.city}{addr.city && (addr.state || addr.zip) ? ", " : ""}{addr.state} {addr.zip}<br />
                        {addr.country}
                      </p>
                    </div>
                  );
                })()}

                {/* Items */}
                <div>
                  <p className="text-[13px] font-semibold text-slate-900 mb-2">
                    Items ({detail.items?.length || 0})
                  </p>
                  <div className="space-y-2">
                    {(detail.items || []).map((item) => (
                      <div key={item.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                        {item.image ? (
                          <img src={item.image} alt="" className="w-10 h-10 rounded-lg object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-slate-200 flex items-center justify-center text-slate-400">
                            <ShoppingBag className="w-4 h-4" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-medium text-slate-900 truncate">{item.name}</p>
                          <p className="text-[12px] text-slate-500">
                            {formatCurrency(Number(item.price))} × {item.quantity}
                          </p>
                        </div>
                        <p className="text-[14px] font-semibold text-slate-900">
                          {formatCurrency(Number(item.price) * item.quantity)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totals */}
                <div className="border-t border-slate-200 pt-4 space-y-1.5 text-[13px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Subtotal</span>
                    <span className="text-slate-900 font-medium">{formatCurrency(Number(detail.subtotal))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Shipping</span>
                    <span className="text-slate-900 font-medium">{formatCurrency(Number(detail.shipping))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tax</span>
                    <span className="text-slate-900 font-medium">{formatCurrency(Number(detail.tax))}</span>
                  </div>
                  <div className="flex justify-between font-bold text-[16px] pt-2 border-t border-slate-200">
                    <span className="text-slate-900">Total</span>
                    <span className="text-epf-600">{formatCurrency(Number(detail.total))}</span>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDetail(null)}
                  className="rounded-lg"
                >
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
