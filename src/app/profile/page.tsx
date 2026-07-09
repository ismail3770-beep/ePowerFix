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
  Loader2,
  RotateCcw,
  Clock,
  CheckCircle2,
  XCircle,
  Download,
  Lock,
  Pencil,
  LayoutDashboard,
  ShoppingBag,
  Star,
  Eye,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  nameBn?: string | null;
  email: string;
  phone: string | null;
  address: string | null;
  area: string | null;
  city: string | null;
  postalCode?: string | null;
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

/* ------------------------------------------------------------------ */
/*  Status color maps                                                  */
/* ------------------------------------------------------------------ */
// Color-coded pill styles for order statuses (per task spec)
const orderStatusColor: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  CONFIRMED: "bg-blue-50 text-blue-700 border-blue-200",
  PROCESSING: "bg-sky-50 text-sky-700 border-sky-200",
  SHIPPED: "bg-purple-50 text-purple-700 border-purple-200",
  DELIVERED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CANCELLED: "bg-red-50 text-red-700 border-red-200",
  RETURNED: "bg-slate-100 text-slate-700 border-slate-200",
};

const returnStatusColor: Record<string, { color: string; icon: React.ElementType }> = {
  PENDING: { color: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock },
  APPROVED: { color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  REJECTED: { color: "bg-red-50 text-red-700 border-red-200", icon: XCircle },
  COMPLETED: { color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
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
/*  Info row (Account Information card)                                */
/*  icon h-5 w-5 text-slate-400 + label uppercase text-[12px] + value  */
/* ------------------------------------------------------------------ */
function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="flex items-start gap-3 py-3">
      <Icon className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
      <div className="min-w-0">
        <p className="text-[12px] text-slate-500 uppercase tracking-wider font-medium">
          {label}
        </p>
        <p className="text-[14px] text-slate-900 mt-0.5 break-words">
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sidebar config                                                     */
/* ------------------------------------------------------------------ */
type SectionKey = "dashboard" | "orders" | "downloads";

type SidebarItem =
  | { type: "section"; key: SectionKey; label: string; icon: React.ElementType }
  | { type: "link"; href: string; label: string; icon: React.ElementType }
  | { type: "dialog"; label: string; icon: React.ElementType }
  | { type: "logout"; label: string; icon: React.ElementType };

const sidebarItems: SidebarItem[] = [
  { type: "section", key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { type: "section", key: "orders", label: "My Orders", icon: ShoppingBag },
  { type: "section", key: "downloads", label: "My Downloads", icon: Download },
  { type: "link", href: "/wishlist", label: "My Wishlist", icon: Heart },
  { type: "link", href: "/", label: "My Reviews", icon: Star },
  { type: "dialog", label: "My Addresses", icon: MapPin },
  { type: "dialog", label: "My Profile", icon: User },
  { type: "logout", label: "Logout", icon: LogOut },
];

/* ------------------------------------------------------------------ */
/*  Profile page                                                       */
/* ------------------------------------------------------------------ */
export default function ProfilePage() {
  const router = useRouter();
  const { setUser, clearUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState<SectionKey>("dashboard");
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [returnOrderId, setReturnOrderId] = useState<string | null>(null);
  const [returnReason, setReturnReason] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "", nameBn: "", phone: "", address: "", area: "", city: "", postalCode: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);

  const { data: user, isLoading: userLoading, isError } = useQuery<AuthUser>({
    queryKey: ["auth-me"],
    queryFn: () => apiFetch<{ data: AuthUser }>("/api/auth/me").then((j) => {
      if (!j.data) throw new Error("Not authenticated");
      return j.data;
    }),
    retry: false,
    staleTime: 0,
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

  function openEditDialog() {
    if (!user) return;
    setEditForm({
      name: user.name || "",
      nameBn: user.nameBn || "",
      phone: user.phone || "",
      address: user.address || "",
      area: user.area || "",
      city: user.city || "",
      postalCode: user.postalCode || "",
    });
    setEditDialogOpen(true);
  }

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const res = await apiFetch<{ data: AuthUser }>("/api/auth/profile", {
        method: "PUT",
        body: JSON.stringify(editForm),
      });
      if (res.data) {
        setUser(res.data as Parameters<typeof setUser>[0]);
        queryClient.invalidateQueries({ queryKey: ["auth-me"] });
        toast.success("প্রোফাইল সফলভাবে আপডেট হয়েছে");
        setEditDialogOpen(false);
      }
    } catch (err: any) {
      toast.error(err?.message || "প্রোফাইল আপডেট করতে সমস্যা হয়েছে");
    } finally {
      setSavingProfile(false);
    }
  };

  function openReturnDialog(orderId: string) {
    setReturnOrderId(orderId);
    setReturnReason("");
    setReturnDialogOpen(true);
  }

  function handleSidebarClick(item: SidebarItem) {
    switch (item.type) {
      case "section":
        setActiveSection(item.key);
        break;
      case "link":
        router.push(item.href);
        break;
      case "dialog":
        openEditDialog();
        break;
      case "logout":
        handleLogout();
        break;
    }
  }

  // Combined address string for the Account Information card
  const fullAddress = user
    ? [user.address, user.area, user.city, user.postalCode].filter(Boolean).join(", ") || null
    : null;

  /* ---------------------------------------------------------------- */
  /*  Not authenticated                                               */
  /* ---------------------------------------------------------------- */
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
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center max-w-sm w-full">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center">
                <User className="h-8 w-8 text-slate-400" />
              </div>
              <h2 className="text-[18px] font-semibold text-slate-900 mb-2">Please Login</h2>
              <p className="text-[14px] text-slate-500 mb-6">
                You need to be logged in to view your account.
              </p>
              <a
                href="/login?redirect=/profile"
                className="inline-flex items-center justify-center h-11 px-6 bg-epf-500 hover:bg-epf-600 text-white font-semibold text-[15px] rounded-lg transition-colors"
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

  /* ---------------------------------------------------------------- */
  /*  Authenticated                                                   */
  /* ---------------------------------------------------------------- */
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
        <div className="mx-auto max-w-[1400px] px-4 sm:px-12 py-6 sm:py-8">
          {userLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6">
              <Skeleton className="h-72 w-full rounded-xl" />
              <div className="space-y-6">
                <Skeleton className="h-64 w-full rounded-xl" />
                <Skeleton className="h-48 w-full rounded-xl" />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6">
              {/* ---------- Sidebar ---------- */}
              <aside className="md:shrink-0">
                <nav className="bg-white border border-slate-200 rounded-xl shadow-sm p-2 md:sticky md:top-4">
                  <ul className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible">
                    {sidebarItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = item.type === "section" && activeSection === item.key;
                      const isLogout = item.type === "logout";
                      return (
                        <li key={item.label} className="shrink-0">
                          <button
                            type="button"
                            onClick={() => handleSidebarClick(item)}
                            className={`flex items-center gap-3 h-11 px-4 text-[14px] font-medium rounded-lg whitespace-nowrap transition-colors w-full text-left border-l-[3px] border-transparent ${
                              isLogout
                                ? "text-red-500 hover:bg-red-50"
                                : isActive
                                ? "bg-epf-50 text-epf-600 border-epf-500"
                                : "text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            <Icon className="h-[18px] w-[18px] shrink-0" />
                            <span>{item.label}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </nav>
              </aside>

              {/* ---------- Main Content ---------- */}
              <div className="space-y-6 min-w-0">

                {/* ---- Recent Orders (Dashboard + Orders sections) ---- */}
                {(activeSection === "dashboard" || activeSection === "orders") && (
                  <Card className="rounded-xl border border-slate-200 shadow-sm">
                    <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
                      <CardTitle className="text-[16px] font-semibold text-slate-900">
                        Recent Orders
                      </CardTitle>
                      <a
                        href="/order-track"
                        className="text-[13px] font-medium text-epf-500 hover:text-epf-600 transition-colors"
                      >
                        View All
                      </a>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {ordersLoading ? (
                        <div className="space-y-2">
                          {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-12 w-full rounded-lg" />
                          ))}
                        </div>
                      ) : orders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                          <div className="h-14 w-14 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center mb-3">
                            <ShoppingBag className="h-6 w-6 text-slate-300" />
                          </div>
                          <p className="text-[15px] font-medium text-slate-700">No orders yet</p>
                          <p className="text-[13px] text-slate-400 mt-1 max-w-xs">
                            When you place orders, they will appear here.
                          </p>
                          <a
                            href="/shop"
                            className="inline-flex items-center justify-center h-9 px-5 mt-4 bg-epf-500 hover:bg-epf-600 text-white text-[13px] font-semibold rounded-lg transition-colors"
                          >
                            Start Shopping
                          </a>
                        </div>
                      ) : (
                        <div className="-mx-2">
                          <Table>
                            <TableHeader>
                              <TableRow className="border-slate-200 bg-slate-50 hover:bg-slate-50">
                                <TableHead className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold px-4 py-3">
                                  Order #
                                </TableHead>
                                <TableHead className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold px-4 py-3">
                                  Date
                                </TableHead>
                                <TableHead className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold px-4 py-3">
                                  Status
                                </TableHead>
                                <TableHead className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold px-4 py-3 text-right">
                                  Total
                                </TableHead>
                                <TableHead className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold px-4 py-3">
                                  Tracking
                                </TableHead>
                                <TableHead className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold px-4 py-3 text-right">
                                  Action
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {orders.map((order) => (
                                <TableRow key={order.id} className="border-slate-200 hover:bg-slate-50/60">
                                  <TableCell className="px-4 py-3">
                                    <span className="text-[13px] font-mono font-medium text-slate-900">
                                      #{order.orderNumber.slice(-8)}
                                    </span>
                                  </TableCell>
                                  <TableCell className="px-4 py-3 text-[13px] text-slate-600">
                                    {formatDate(order.createdAt)}
                                  </TableCell>
                                  <TableCell className="px-4 py-3">
                                    <span
                                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                                        orderStatusColor[order.status] ||
                                        "bg-slate-100 text-slate-700 border-slate-200"
                                      }`}
                                    >
                                      {order.status}
                                    </span>
                                  </TableCell>
                                  <TableCell className="px-4 py-3 text-right text-[14px] font-semibold text-slate-900">
                                    {formatBDT(order.total)}
                                  </TableCell>
                                  <TableCell className="px-4 py-3">
                                    <a
                                      href={`/order-track?order=${encodeURIComponent(order.orderNumber)}`}
                                      className="text-[13px] font-medium text-epf-500 hover:text-epf-600 transition-colors"
                                    >
                                      Track
                                    </a>
                                  </TableCell>
                                  <TableCell className="px-4 py-3 text-right">
                                    <div className="inline-flex items-center gap-1">
                                      {order.status === "DELIVERED" && (
                                        <button
                                          type="button"
                                          onClick={() => openReturnDialog(order.id)}
                                          className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-slate-500 hover:bg-amber-50 hover:text-amber-600 transition-colors"
                                          title="Request return"
                                        >
                                          <RotateCcw className="h-4 w-4" />
                                          <span className="sr-only">Request return</span>
                                        </button>
                                      )}
                                      <a
                                        href={`/order-track?order=${encodeURIComponent(order.orderNumber)}`}
                                        className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-slate-500 hover:bg-epf-50 hover:text-epf-600 transition-colors"
                                        title="View order"
                                      >
                                        <Eye className="h-4 w-4" />
                                        <span className="sr-only">View order</span>
                                      </a>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* ---- Account Information (Dashboard only) ---- */}
                {activeSection === "dashboard" && (
                  <Card className="rounded-xl border border-slate-200 shadow-sm">
                    <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-[16px] font-semibold text-slate-900">
                        Account Information
                      </CardTitle>
                      <button
                        type="button"
                        onClick={openEditDialog}
                        className="inline-flex items-center gap-1 text-[13px] font-medium text-epf-500 hover:text-epf-600 transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </button>
                    </CardHeader>
                    <CardContent className="pt-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 sm:divide-x sm:divide-slate-100">
                        <div className="sm:pr-8">
                          <InfoRow icon={User} label="Name" value={user?.name} />
                          <InfoRow icon={Mail} label="Email" value={user?.email} />
                        </div>
                        <div className="sm:pl-8">
                          <InfoRow icon={Phone} label="Phone" value={user?.phone} />
                          <InfoRow icon={MapPin} label="Address" value={fullAddress} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* ---- My Downloads (Dashboard only-if-exists, OR Downloads section) ---- */}
                {(activeSection === "downloads" ||
                  (activeSection === "dashboard" &&
                    (downloadsLoading || downloads.length > 0))) && (
                  <Card className="rounded-xl border border-slate-200 shadow-sm">
                    <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
                      <CardTitle className="flex items-center gap-2 text-[16px] font-semibold text-slate-900">
                        <Download className="h-5 w-5 text-slate-500" />
                        My Downloads
                        {downloads.length > 0 && (
                          <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-epf-50 text-epf-600 text-[11px] font-semibold">
                            {downloads.length}
                          </span>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {downloadsLoading ? (
                        <div className="space-y-3">
                          {[1, 2].map((i) => (
                            <Skeleton key={i} className="h-14 w-full rounded-lg" />
                          ))}
                        </div>
                      ) : downloads.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                          <div className="h-12 w-12 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center mb-3">
                            <Download className="h-5 w-5 text-slate-300" />
                          </div>
                          <p className="text-[14px] font-medium text-slate-700">
                            No downloads available
                          </p>
                          <p className="text-[13px] text-slate-400 mt-1 max-w-xs">
                            Digital products you purchase will appear here for download.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {downloads.map((d) => {
                            const exhausted = d.remaining != null && d.remaining <= 0;
                            const canDownload = d.unlocked && d.hasFile && !exhausted;
                            return (
                              <div
                                key={d.orderItemId}
                                className="border border-slate-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                              >
                                <div className="space-y-1 min-w-0">
                                  <p className="text-[14px] font-medium text-slate-900 truncate">
                                    {d.productName}
                                  </p>
                                  <div className="flex items-center gap-2 text-[12px] text-slate-500 flex-wrap">
                                    <span className="font-mono">#{d.orderNumber.slice(-8)}</span>
                                    <span>·</span>
                                    <span>{formatDate(d.purchasedAt)}</span>
                                    {d.downloadLimit != null && (
                                      <>
                                        <span>·</span>
                                        <span>
                                          {d.remaining} / {d.downloadLimit} left
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>
                                {canDownload ? (
                                  <Button
                                    asChild
                                    size="sm"
                                    className="h-9 text-[13px] gap-1.5 bg-epf-500 hover:bg-epf-600 text-white rounded-lg shrink-0"
                                  >
                                    <a href={`/api/downloads/${d.orderItemId}`}>
                                      <Download className="size-3.5" />
                                      Download
                                    </a>
                                  </Button>
                                ) : (
                                  <Badge
                                    variant="outline"
                                    className="text-[11px] gap-1 text-slate-400 shrink-0 self-start sm:self-auto"
                                  >
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

                {/* ---- My Returns (Dashboard only, only if returns exist) ---- */}
                {activeSection === "dashboard" &&
                  (returnsLoading || returns.length > 0) && (
                    <Card className="rounded-xl border border-slate-200 shadow-sm">
                      <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
                        <CardTitle className="flex items-center gap-2 text-[16px] font-semibold text-slate-900">
                          <RotateCcw className="h-5 w-5 text-slate-500" />
                          My Returns
                          {returns.length > 0 && (
                            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-epf-50 text-epf-600 text-[11px] font-semibold">
                              {returns.length}
                            </span>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        {returnsLoading ? (
                          <div className="space-y-3">
                            {[1, 2].map((i) => (
                              <Skeleton key={i} className="h-14 w-full rounded-lg" />
                            ))}
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {returns.map((r) => {
                              const statusInfo = returnStatusColor[r.status] || {
                                color: "bg-slate-100 text-slate-700 border-slate-200",
                                icon: Clock,
                              };
                              const StatusIcon = statusInfo.icon;
                              return (
                                <div key={r.id} className="border border-slate-200 rounded-lg p-4">
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="space-y-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className="text-[13px] font-mono font-medium text-slate-900">
                                          #{r.order.orderNumber.slice(-8)}
                                        </span>
                                        <span
                                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${statusInfo.color}`}
                                        >
                                          <StatusIcon className="size-3" />
                                          {r.status}
                                        </span>
                                      </div>
                                      <p className="text-[12px] text-slate-500 line-clamp-2">{r.reason}</p>
                                      <div className="flex items-center gap-2 text-[12px] text-slate-400 flex-wrap">
                                        <span>Requested: {formatDate(r.createdAt)}</span>
                                        {r.refundAmount && (
                                          <>
                                            <span>·</span>
                                            <span className="font-medium text-slate-900">
                                              Refund: {formatBDT(r.refundAmount)}
                                            </span>
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
                  )}
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

      {/* Edit Profile Dialog — functionality preserved */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update your personal information and delivery address.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[13px] text-slate-700">Name (English)</Label>
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Your name"
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[13px] text-slate-700">নাম (বাংলা)</Label>
                <Input
                  value={editForm.nameBn}
                  onChange={(e) => setEditForm({ ...editForm, nameBn: e.target.value })}
                  placeholder="আপনার নাম"
                  className="h-10"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px] text-slate-700">Phone</Label>
              <Input
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                placeholder="01XXXXXXXXX"
                className="h-10"
              />
              <p className="text-[12px] text-slate-400">Email change requires password verification — contact support.</p>
            </div>
            <Separator />
            <div className="space-y-1.5">
              <Label className="text-[13px] text-slate-700">Address</Label>
              <Input
                value={editForm.address}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                placeholder="House, road, street"
                className="h-10"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[13px] text-slate-700">Area</Label>
                <Input
                  value={editForm.area}
                  onChange={(e) => setEditForm({ ...editForm, area: e.target.value })}
                  placeholder="Area"
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[13px] text-slate-700">City</Label>
                <Input
                  value={editForm.city}
                  onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                  placeholder="City"
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[13px] text-slate-700">Postal Code</Label>
                <Input
                  value={editForm.postalCode}
                  onChange={(e) => setEditForm({ ...editForm, postalCode: e.target.value })}
                  placeholder="XXXX"
                  className="h-10"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={savingProfile}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveProfile}
              disabled={savingProfile || !editForm.name}
              className="bg-epf-500 hover:bg-epf-600 text-white"
            >
              {savingProfile ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Return Request Dialog — functionality preserved */}
      <Dialog
        open={returnDialogOpen}
        onOpenChange={() => {
          setReturnDialogOpen(false);
          setReturnReason("");
        }}
      >
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
            <Button
              variant="outline"
              onClick={() => {
                setReturnDialogOpen(false);
                setReturnReason("");
              }}
            >
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
