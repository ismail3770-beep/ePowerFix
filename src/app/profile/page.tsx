"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import {
  Home,
  ChevronRight,
  User,
  Mail,
  Phone,
  MapPin,
  Heart,
  LogOut,
  Package,
  Loader2,
  RotateCcw,
  Clock,
  CheckCircle2,
  XCircle,
  Download,
  Lock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAuthStore } from "@/store";
import Header from "@/components/epf/Header";
import Footer from "@/components/epf/Footer";
import CartDrawer from "@/components/epf/CartDrawer";
import CheckoutDialog from "@/components/epf/CheckoutDialog";
import ProductDetailDialog from "@/components/epf/ProductDetailDialog";
import ServiceBookingDialog from "@/components/epf/ServiceBookingDialog";
import ProjectDetailDialog from "@/components/epf/ProjectDetailDialog";
import ChatWidget from "@/components/epf/ChatWidget";
import BackToTopButton from "@/components/epf/BackToTopButton";
import NotificationBell from "@/components/epf/NotificationBell";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  area: string | null;
  city: string | null;
  role: string;
}

interface OrderItem {
  id: string;
  productName: string;
  productImage: string | null;
  quantity: number;
  price: number;
  total: number;
}

interface Order {
  id: string;
  orderNumber: string;
  subtotal: number;
  deliveryCharge: number;
  discount: number;
  total: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  createdAt: string;
  items: OrderItem[];
}

interface ReturnRequest {
  id: string;
  reason: string;
  status: string;
  refundAmount: number | null;
  notes: string | null;
  createdAt: string;
  order: { id: string; orderNumber: string; status: string; total: number };
}

interface DownloadItem {
  orderItemId: string;
  orderNumber: string;
  productName: string;
  purchasedAt: string;
  unlocked: boolean;
  hasFile: boolean;
  downloadCount: number;
  downloadLimit: number | null;
  remaining: number | null;
}

const orderStatusColor: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-green-100 text-green-800",
  PROCESSING: "bg-sky-100 text-sky-800",
  SHIPPED: "bg-purple-100 text-purple-800",
  DELIVERED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-red-100 text-red-800",
  RETURNED: "bg-slate-100 text-slate-700",
};

const returnStatusColor: Record<string, { color: string; icon: React.ElementType }> = {
  PENDING: { color: "bg-yellow-100 text-yellow-800", icon: Clock },
  APPROVED: { color: "bg-green-100 text-green-800", icon: CheckCircle2 },
  REJECTED: { color: "bg-red-100 text-red-800", icon: XCircle },
  COMPLETED: { color: "bg-emerald-100 text-emerald-800", icon: CheckCircle2 },
};

function formatBDT(amount: number) {
  return `৳${amount.toLocaleString("en-US")}`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/* ------------------------------------------------------------------ */
/*  Info row helper                                                    */
/* ------------------------------------------------------------------ */
function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-start gap-3 py-3">
      <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-slate-50 border border-slate-200 shrink-0">
        <Icon className="h-4 w-4 text-slate-500" />
      </div>
      <div className="min-w-0">
        <p className="text-[12px] text-slate-500 uppercase tracking-wider font-medium">{label}</p>
        <p className="text-[15px] text-slate-900 font-medium mt-0.5">{value || "—"}</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Profile page                                                       */
/* ------------------------------------------------------------------ */
export default function ProfilePage() {
  const router = useRouter();
  const { setUser, clearUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [returnOrderId, setReturnOrderId] = useState<string | null>(null);
  const [returnReason, setReturnReason] = useState("");

  const { data: user, isLoading: userLoading, isError } = useQuery<AuthUser>({
    queryKey: ["auth-me"],
    queryFn: () => apiFetch<{ success: boolean; data: AuthUser }>("/api/auth/me").then((j) => {
      if (!j.success) throw new Error("Not authenticated");
      return j.data;
    }),
    retry: false,
  });

  // Sync to store
  useEffect(() => {
    if (user) setUser(user as Parameters<typeof setUser>[0]);
  }, [user, setUser]);

  const { data: ordersEnvelope, isLoading: ordersLoading } = useQuery<{ data: Order[] }>({
    queryKey: ["my-orders"],
    queryFn: () => apiFetch("/api/orders?limit=5"),
    enabled: !!user,
  });
  const orders = ordersEnvelope?.data ?? [];

  const { data: returnsEnvelope, isLoading: returnsLoading } = useQuery<{ data: ReturnRequest[] }>({
    queryKey: ["my-returns"],
    queryFn: () => apiFetch("/api/returns?limit=10"),
    enabled: !!user,
  });
  const returns = returnsEnvelope?.data ?? [];

  const { data: downloadsEnvelope, isLoading: downloadsLoading } = useQuery<{ success: boolean; data: DownloadItem[] }>({
    queryKey: ["my-downloads"],
    queryFn: () => apiFetch("/api/downloads"),
    enabled: !!user,
  });
  const downloads = downloadsEnvelope?.data ?? [];

  const createReturnMutation = useMutation({
    mutationFn: ({ orderId, reason }: { orderId: string; reason: string }) =>
      apiFetch(`/api/orders/${orderId}/return`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-orders"] });
      queryClient.invalidateQueries({ queryKey: ["my-returns"] });
      toast.success("Return request submitted");
      setReturnDialogOpen(false);
      setReturnReason("");
      setReturnOrderId(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleLogout = async () => {
    clearUser();
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore — clear local state regardless
    }
    router.push("/");
  };

  function openReturnDialog(orderId: string) {
    setReturnOrderId(orderId);
    setReturnReason("");
    setReturnDialogOpen(true);
  }

  // Not authenticated
  if (!userLoading && (isError || !user)) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 bg-slate-50">
          <div className="bg-white border-b border-slate-200">
            <div className="mx-auto max-w-[1400px] px-4 sm:px-12">
              <nav className="flex items-center gap-1.5 h-[44px] text-[14px]">
                <a href="/" className="flex items-center gap-1 text-slate-500 hover:text-slate-900 transition-colors">
                  <Home className="h-3.5 w-3.5" />
                  <span>Home</span>
                </a>
                <ChevronRight className="h-3 w-3 text-slate-400" />
                <span className="text-slate-900 font-medium">My Account</span>
              </nav>
            </div>
          </div>
          <div className="mx-auto max-w-[1400px] px-4 sm:px-12 py-20 flex flex-col items-center justify-center min-h-[calc(100vh-270px)]">
            <div className="bg-white rounded-lg border border-slate-200 p-8 text-center max-w-sm w-full">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center">
                <User className="h-8 w-8 text-slate-400" />
              </div>
              <h2 className="text-[18px] font-semibold text-slate-900 mb-2">Please Login</h2>
              <p className="text-[14px] text-slate-500 mb-6">
                You need to be logged in to view your account.
              </p>
              <a
                href="/login"
                className="inline-flex items-center justify-center h-11 px-6 bg-slate-900 hover:bg-epf-500 text-white font-semibold text-[15px] rounded-md transition-colors"
              >
                Sign In
              </a>
            </div>
          </div>
        </main>
        <div className="mt-auto"><Footer /></div>
        <CartDrawer />
        <CheckoutDialog />
        <ServiceBookingDialog />
        <ProductDetailDialog />
        <ProjectDetailDialog />
        <ChatWidget />
        <BackToTopButton />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-slate-50">
        {/* Breadcrumb */}
        <div className="bg-white border-b border-slate-200">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-12">
            <nav className="flex items-center justify-between gap-4 h-[44px] text-[14px]">
              <div className="flex items-center gap-1.5">
                <a href="/" className="flex items-center gap-1 text-slate-500 hover:text-slate-900 transition-colors">
                  <Home className="h-3.5 w-3.5" />
                  <span>Home</span>
                </a>
                <ChevronRight className="h-3 w-3 text-slate-400" />
                <span className="text-slate-900 font-medium">My Account</span>
              </div>
              <NotificationBell />
            </nav>
          </div>
        </div>

        {/* Page Content */}
        <div className="mx-auto max-w-[1400px] px-4 sm:px-12 py-8">
          {userLoading ? (
            <div className="mx-auto max-w-[1400px] grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border border-slate-200">
                <CardContent className="p-6 space-y-4">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-52" />
                </CardContent>
              </Card>
              <Card className="border border-slate-200 md:col-span-2">
                <CardContent className="p-6 space-y-4">
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="mx-auto max-w-[1400px] grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Sidebar */}
              <div className="space-y-6">
                {/* Profile Info Card */}
                <Card className="border border-slate-200">
                  <CardHeader className="pb-0">
                    <CardTitle className="text-[16px] font-semibold text-slate-900">Profile Info</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="flex flex-col items-center mb-4">
                      <div className="h-16 w-16 rounded-full bg-slate-900 flex items-center justify-center mb-3">
                        <span className="text-[22px] font-bold text-white">
                          {user?.name?.charAt(0)?.toUpperCase() || "U"}
                        </span>
                      </div>
                      <h2 className="text-[17px] font-semibold text-slate-900">{user?.name}</h2>
                      <p className="text-[13px] text-slate-500">{user?.role || "Customer"}</p>
                    </div>
                    <Separator className="mb-2" />
                    <InfoRow icon={Mail} label="Email" value={user?.email} />
                    <InfoRow icon={Phone} label="Phone" value={user?.phone} />
                    <InfoRow icon={MapPin} label="Address" value={user?.address} />
                    <InfoRow icon={MapPin} label="Area" value={user?.area} />
                    <InfoRow icon={MapPin} label="City" value={user?.city} />
                  </CardContent>
                </Card>

                {/* Quick Links */}
                <Card className="border border-slate-200">
                  <CardContent className="p-4 space-y-2">
                    <a
                      href="/wishlist"
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] text-slate-700 hover:bg-slate-50 hover:text-epf-500 transition-colors"
                    >
                      <Heart className="h-4 w-4" />
                      <span>My Wishlist</span>
                    </a>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] text-red-500 hover:bg-red-50 transition-colors w-full text-left"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </button>
                  </CardContent>
                </Card>
              </div>

              {/* Right Content */}
              <div className="md:col-span-2 space-y-6">

                {/* Recent Orders */}
                <Card className="border border-slate-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-[16px] font-semibold text-slate-900">
                      <Package className="h-5 w-5 text-slate-500" />
                      Recent Orders
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {ordersLoading ? (
                      <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                          <Skeleton key={i} className="h-16 w-full" />
                        ))}
                      </div>
                    ) : orders.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 text-center">
                        <div className="h-14 w-14 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center mb-3">
                          <Package className="h-6 w-6 text-slate-300" />
                        </div>
                        <p className="text-[15px] font-medium text-slate-500">No orders yet</p>
                        <p className="text-[13px] text-slate-400 mt-1">
                          When you place orders, they will appear here.
                        </p>
                        <a
                          href="/shop"
                          className="inline-flex items-center justify-center h-9 px-5 mt-4 bg-slate-900 hover:bg-epf-500 text-white text-[13px] font-semibold rounded-md transition-colors"
                        >
                          Start Shopping
                        </a>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {orders.map((order) => (
                          <div key={order.id} className="border border-slate-200 rounded-lg p-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-[13px] font-mono font-medium text-slate-900">
                                    #{order.orderNumber.slice(-8)}
                                  </span>
                                  <Badge variant="outline" className={`text-[11px] px-2 py-0.5 font-medium ${orderStatusColor[order.status] || "bg-slate-100 text-slate-700"}`}>
                                    {order.status}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-3 text-[12px] text-slate-500">
                                  <span>{formatDate(order.createdAt)}</span>
                                  <span>·</span>
                                  <span>{order.items.length} item{order.items.length > 1 ? "s" : ""}</span>
                                </div>
                                <div className="text-[12px] text-slate-500">
                                  {order.items.map((item) => item.productName).join(", ")}
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-[15px] font-bold text-slate-900">{formatBDT(order.total)}</span>
                                {order.status === "DELIVERED" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 text-[12px] gap-1 border-epf-500 text-epf-500 hover:bg-epf-500 hover:text-white"
                                    onClick={() => openReturnDialog(order.id)}
                                  >
                                    <RotateCcw className="size-3.5" />
                                    Return
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* My Downloads */}
                {(downloadsLoading || downloads.length > 0) && (
                  <Card className="border border-slate-200">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-[16px] font-semibold text-slate-900">
                        <Download className="h-5 w-5 text-slate-500" />
                        My Downloads
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {downloadsLoading ? (
                        <div className="space-y-3">
                          {[1, 2].map((i) => (
                            <Skeleton key={i} className="h-14 w-full" />
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {downloads.map((d) => {
                            const exhausted = d.remaining != null && d.remaining <= 0;
                            const canDownload = d.unlocked && d.hasFile && !exhausted;
                            return (
                              <div key={d.orderItemId} className="border border-slate-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="space-y-1">
                                  <p className="text-[14px] font-medium text-slate-900">{d.productName}</p>
                                  <div className="flex items-center gap-3 text-[12px] text-slate-500">
                                    <span className="font-mono">#{d.orderNumber.slice(-8)}</span>
                                    <span>·</span>
                                    <span>{formatDate(d.purchasedAt)}</span>
                                    {d.downloadLimit != null && (
                                      <>
                                        <span>·</span>
                                        <span>{d.remaining} / {d.downloadLimit} left</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                                {canDownload ? (
                                  <Button
                                    asChild
                                    size="sm"
                                    className="h-8 text-[12px] gap-1 bg-epf-500 hover:bg-epf-600 text-white"
                                  >
                                    <a href={`/api/downloads/${d.orderItemId}`}>
                                      <Download className="size-3.5" />
                                      Download
                                    </a>
                                  </Button>
                                ) : (
                                  <Badge variant="outline" className="text-[11px] gap-1 text-slate-400">
                                    <Lock className="size-3" />
                                    {!d.unlocked ? "Awaiting payment" : exhausted ? "Limit reached" : "Unavailable"}
                                  </Badge>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* My Returns */}
                <Card className="border border-slate-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-[16px] font-semibold text-slate-900">
                      <RotateCcw className="h-5 w-5 text-slate-500" />
                      My Returns
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {returnsLoading ? (
                      <div className="space-y-3">
                        {[1, 2].map((i) => (
                          <Skeleton key={i} className="h-14 w-full" />
                        ))}
                      </div>
                    ) : returns.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="h-12 w-12 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center mb-3">
                          <RotateCcw className="h-5 w-5 text-slate-300" />
                        </div>
                        <p className="text-[14px] font-medium text-slate-500">No return requests</p>
                        <p className="text-[12px] text-slate-400 mt-1">
                          If you need to return a delivered order, use the Return button above.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {returns.map((r) => {
                          const statusInfo = returnStatusColor[r.status] || { color: "bg-slate-100 text-slate-700", icon: Clock };
                          const StatusIcon = statusInfo.icon;
                          return (
                            <div key={r.id} className="border border-slate-200 rounded-lg p-4">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[13px] font-mono font-medium text-slate-900">
                                      #{r.order.orderNumber.slice(-8)}
                                    </span>
                                    <Badge variant="outline" className={`text-[11px] px-2 py-0.5 font-medium flex items-center gap-1 ${statusInfo.color}`}>
                                      <StatusIcon className="size-3" />
                                      {r.status}
                                    </Badge>
                                  </div>
                                  <p className="text-[12px] text-slate-500 line-clamp-2">{r.reason}</p>
                                  <div className="flex items-center gap-3 text-[12px] text-slate-400">
                                    <span>Requested: {formatDate(r.createdAt)}</span>
                                    {r.refundAmount && (
                                      <>
                                        <span>·</span>
                                        <span className="font-medium text-slate-900">Refund: {formatBDT(r.refundAmount)}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                                {r.notes && (
                                  <div className="text-[12px] text-slate-500 bg-slate-50 rounded-md p-3 max-w-xs">
                                    <p className="font-medium text-slate-700 mb-1">Admin Note:</p>
                                    <p>{r.notes}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>

      <div className="mt-auto">
        <Footer />
      </div>

      {/* Overlays & Dialogs */}
      <CartDrawer />
      <CheckoutDialog />
      <ServiceBookingDialog />
      <ProductDetailDialog />
      <ProjectDetailDialog />
      <ChatWidget />
      <BackToTopButton />

      {/* Return Request Dialog */}
      <Dialog open={returnDialogOpen} onOpenChange={() => { setReturnDialogOpen(false); setReturnReason(""); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request Return</DialogTitle>
            <DialogDescription>
              Please explain why you want to return this order. Our team will review your request.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Reason for Return</Label>
              <Textarea
                placeholder="Describe the reason (minimum 10 characters)"
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                rows={4}
              />
              <p className="text-[12px] text-slate-400">Min 10 characters required</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setReturnDialogOpen(false); setReturnReason(""); }}>
              Cancel
            </Button>
            <Button
              className="bg-epf-500 hover:bg-epf-600 text-white"
              disabled={createReturnMutation.isPending || returnReason.length < 10}
              onClick={() => {
                if (returnOrderId) {
                  createReturnMutation.mutate({ orderId: returnOrderId, reason: returnReason });
                }
              }}
            >
              {createReturnMutation.isPending ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
