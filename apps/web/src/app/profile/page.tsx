"use client";

import type * as React from "react";
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
  Plus,
  Trash2,
  Package,
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
type SectionKey = "dashboard" | "orders" | "downloads" | "addresses" | "reviews" | "profile";

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
  { type: "section", key: "reviews", label: "My Reviews", icon: Star },
  { type: "section", key: "addresses", label: "My Addresses", icon: MapPin },
  { type: "section", key: "profile", label: "My Profile", icon: User },
  { type: "logout", label: "Logout", icon: LogOut },
];

/* ------------------------------------------------------------------ */
/*  Address types                                                      */
/* ------------------------------------------------------------------ */
interface UserAddress {
  id: string;
  fullName: string;
  phone: string;
  address: string;
  area: string | null;
  city: string;
  postalCode: string | null;
  label: string | null;
  isDefault: boolean;
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/*  Review types + helpers                                             */
/* ------------------------------------------------------------------ */
interface ReviewItem {
  id: string;
  rating: number;
  title: string;
  comment: string;
  status: string;
  createdAt: string;
  product: { id: string; name: string; slug: string; images: string } | null;
  service: { id: string; name: string; slug: string; images: string } | null;
}

function parseImages(val: unknown): string[] {
  if (Array.isArray(val)) {return val as string[];}
  if (typeof val === "string") {
    try { const p = JSON.parse(val); if (Array.isArray(p)) {return p;} } catch { /* ignore */ }
  }
  return [];
}

function reviewStatusBadge(status: string): { label: string; className: string } {
  switch (status) {
    case "APPROVED":
      return { label: "Approved", className: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    case "PENDING":
      return { label: "Unapproved", className: "bg-amber-50 text-amber-700 border-amber-200" };
    case "REJECTED":
      return { label: "Rejected", className: "bg-red-50 text-red-700 border-red-200" };
    default:
      return { label: status, className: "bg-slate-100 text-slate-700 border-slate-200" };
  }
}

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
  const [editForm, setEditForm] = useState({
    name: "", nameBn: "", phone: "", address: "", area: "", city: "", postalCode: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Address book state
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(null);
  const [addressForm, setAddressForm] = useState({
    fullName: "", phone: "", address: "", area: "", city: "", postalCode: "", label: "", isDefault: false,
  });
  const [savingAddress, setSavingAddress] = useState(false);

  const { data: user, isLoading: userLoading, isError } = useQuery<AuthUser>({
    queryKey: ["auth-me"],
    queryFn: () => apiFetch<{ data: AuthUser }>("/api/auth/me").then((j) => {
      if (!j.data) {throw new Error("Not authenticated");}
      return j.data;
    }),
    retry: false,
    staleTime: 0,
  });

  // Sync to store
  useEffect(() => {
    if (user) {setUser(user as Parameters<typeof setUser>[0]);}
  }, [user, setUser]);

  // When entering the "profile" section, pre-fill the inline edit form with
  // the current user data so the form shows real values (not blanks).
  useEffect(() => {
    if (activeSection === "profile" && user) {
      setEditForm({
        name: user.name || "",
        nameBn: user.nameBn || "",
        phone: user.phone || "",
        address: user.address || "",
        area: user.area || "",
        city: user.city || "",
        postalCode: user.postalCode || "",
      });
    }
  }, [activeSection, user]);

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

  // Addresses list
  const { data: addressesEnvelope, isLoading: addressesLoading } = useQuery<{ data: UserAddress[] }>({
    queryKey: ["my-addresses"],
    queryFn: () => apiFetch("/api/addresses"),
    enabled: !!user,
  });
  const addresses = addressesEnvelope?.data ?? [];

  // Reviews list (current user's reviews, any status)
  const { data: reviewsEnvelope, isLoading: reviewsLoading } = useQuery<{ data: ReviewItem[] }>({
    queryKey: ["my-reviews"],
    queryFn: () => apiFetch("/api/reviews/mine"),
    enabled: !!user,
  });
  const reviews = reviewsEnvelope?.data ?? [];

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
    if (!user) {return;}
    setEditForm({
      name: user.name || "",
      nameBn: user.nameBn || "",
      phone: user.phone || "",
      address: user.address || "",
      area: user.area || "",
      city: user.city || "",
      postalCode: user.postalCode || "",
    });
    setActiveSection("profile");
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

  // ---------- Address book handlers ----------
  function openAddAddress() {
    setEditingAddress(null);
    setAddressForm({
      fullName: user?.name || "", phone: user?.phone || "",
      address: "", area: "", city: "", postalCode: "", label: "", isDefault: addresses.length === 0,
    });
    setAddressDialogOpen(true);
  }

  function openEditAddress(addr: UserAddress) {
    setEditingAddress(addr);
    setAddressForm({
      fullName: addr.fullName || "",
      phone: addr.phone || "",
      address: addr.address || "",
      area: addr.area || "",
      city: addr.city || "",
      postalCode: addr.postalCode || "",
      label: addr.label || "",
      isDefault: addr.isDefault,
    });
    setAddressDialogOpen(true);
  }

  const handleSaveAddress = async () => {
    if (!addressForm.fullName.trim() || !addressForm.phone.trim() || !addressForm.address.trim() || !addressForm.city.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }
    setSavingAddress(true);
    try {
      const payload = {
        fullName: addressForm.fullName.trim(),
        phone: addressForm.phone.trim(),
        address: addressForm.address.trim(),
        area: addressForm.area.trim() || undefined,
        city: addressForm.city.trim(),
        postalCode: addressForm.postalCode.trim() || undefined,
        label: addressForm.label.trim() || undefined,
        isDefault: addressForm.isDefault,
      };
      if (editingAddress) {
        await apiFetch(`/api/addresses/${editingAddress.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        toast.success("Address updated successfully");
      } else {
        await apiFetch("/api/addresses", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.success("Address added successfully");
      }
      queryClient.invalidateQueries({ queryKey: ["my-addresses"] });
      setAddressDialogOpen(false);
      setEditingAddress(null);
    } catch (err: any) {
      toast.error(err?.message || "Failed to save address");
    } finally {
      setSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm("Delete this address?")) {return;}
    try {
      await apiFetch(`/api/addresses/${id}`, { method: "DELETE" });
      queryClient.invalidateQueries({ queryKey: ["my-addresses"] });
      toast.success("Address deleted");
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete address");
    }
  };

  const handleSetDefaultAddress = async (id: string) => {
    try {
      await apiFetch(`/api/addresses/${id}`, {
        method: "PUT",
        body: JSON.stringify({ isDefault: true }),
      });
      queryClient.invalidateQueries({ queryKey: ["my-addresses"] });
      toast.success("Default address updated");
    } catch (err: any) {
      toast.error(err?.message || "Failed to set default address");
    }
  };

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
                        onClick={() => setActiveSection("profile")}
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

                {/* ---- My Addresses (addresses section OR dashboard if any) ---- */}
                {(activeSection === "addresses" ||
                  (activeSection === "dashboard" && addresses.length > 0)) && (
                  <Card className="rounded-xl border border-slate-200 shadow-sm">
                    <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
                      <CardTitle className="flex items-center gap-2 text-[16px] font-semibold text-slate-900">
                        <MapPin className="h-5 w-5 text-slate-500" />
                        My Addresses
                        {addresses.length > 0 && (
                          <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-epf-50 text-epf-600 text-[11px] font-semibold">
                            {addresses.length}
                          </span>
                        )}
                      </CardTitle>
                      <Button
                        type="button"
                        onClick={openAddAddress}
                        className="h-9 bg-epf-500 hover:bg-epf-600 text-white text-[13px] font-semibold rounded-lg gap-1.5"
                      >
                        <Plus className="h-4 w-4" />
                        Add New Address
                      </Button>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {addressesLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {[1, 2].map((i) => (
                            <Skeleton key={i} className="h-36 w-full rounded-xl" />
                          ))}
                        </div>
                      ) : addresses.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                          <div className="h-14 w-14 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center mb-3">
                            <MapPin className="h-6 w-6 text-slate-300" />
                          </div>
                          <p className="text-[15px] font-medium text-slate-700">No saved addresses</p>
                          <p className="text-[13px] text-slate-400 mt-1 max-w-xs">
                            Add an address so you don't have to type it every time you checkout.
                          </p>
                          <button
                            type="button"
                            onClick={openAddAddress}
                            className="inline-flex items-center justify-center h-9 px-5 mt-4 bg-epf-500 hover:bg-epf-600 text-white text-[13px] font-semibold rounded-lg transition-colors"
                          >
                            Add Your First Address
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {addresses.map((addr) => (
                            <div
                              key={addr.id}
                              className="relative border border-slate-200 rounded-xl p-4 hover:shadow-sm transition-shadow bg-white"
                            >
                              {addr.isDefault && (
                                <span className="absolute top-3 right-3 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold text-white bg-epf-500">
                                  Default
                                </span>
                              )}
                              <div className="flex items-start gap-2.5 mb-2">
                                <User className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                                <p className="text-[14px] font-semibold text-slate-900">{addr.fullName}</p>
                              </div>
                              <div className="flex items-start gap-2.5 mb-1">
                                <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                                <p className="text-[13px] text-slate-600 leading-relaxed">
                                  {addr.address}
                                  {addr.area && <>, {addr.area}</>}
                                  <br />
                                  {addr.city}
                                  {addr.postalCode && <> {addr.postalCode}</>}
                                </p>
                              </div>
                              <div className="flex items-start gap-2.5 mb-3">
                                <Phone className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                                <p className="text-[13px] text-slate-600">{addr.phone}</p>
                              </div>
                              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                                <button
                                  type="button"
                                  onClick={() => openEditAddress(addr)}
                                  className="inline-flex items-center gap-1 text-[12px] font-medium text-slate-600 hover:text-epf-600 transition-colors"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                  Edit
                                </button>
                                <span className="text-slate-300">|</span>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAddress(addr.id)}
                                  className="inline-flex items-center gap-1 text-[12px] font-medium text-slate-600 hover:text-red-600 transition-colors"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Delete
                                </button>
                                {!addr.isDefault && (
                                  <>
                                    <span className="text-slate-300">|</span>
                                    <button
                                      type="button"
                                      onClick={() => handleSetDefaultAddress(addr.id)}
                                      className="inline-flex items-center gap-1 text-[12px] font-medium text-slate-600 hover:text-epf-600 transition-colors"
                                    >
                                      <CheckCircle2 className="h-3.5 w-3.5" />
                                      Set Default
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* ---- My Reviews (reviews section OR dashboard if any) ---- */}
                {(activeSection === "reviews" ||
                  (activeSection === "dashboard" && reviews.length > 0)) && (
                  <Card className="rounded-xl border border-slate-200 shadow-sm">
                    <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
                      <CardTitle className="flex items-center gap-2 text-[16px] font-semibold text-slate-900">
                        <Star className="h-5 w-5 text-slate-500" />
                        My Reviews
                        {reviews.length > 0 && (
                          <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-epf-50 text-epf-600 text-[11px] font-semibold">
                            {reviews.length}
                          </span>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {reviewsLoading ? (
                        <div className="space-y-2">
                          {[1, 2].map((i) => (
                            <Skeleton key={i} className="h-16 w-full rounded-lg" />
                          ))}
                        </div>
                      ) : reviews.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                          <div className="h-14 w-14 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center mb-3">
                            <Star className="h-6 w-6 text-slate-300" />
                          </div>
                          <p className="text-[15px] font-medium text-slate-700">No reviews yet</p>
                          <p className="text-[13px] text-slate-400 mt-1 max-w-xs">
                            Share your experience with products you've purchased to help other buyers.
                          </p>
                          <a
                            href="/shop"
                            className="inline-flex items-center justify-center h-9 px-5 mt-4 bg-epf-500 hover:bg-epf-600 text-white text-[13px] font-semibold rounded-lg transition-colors"
                          >
                            Browse Products
                          </a>
                        </div>
                      ) : (
                        <div className="-mx-2 overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow className="border-slate-200 bg-slate-50 hover:bg-slate-50">
                                <TableHead className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold px-4 py-3 w-[60px]">
                                  Image
                                </TableHead>
                                <TableHead className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold px-4 py-3">
                                  Product
                                </TableHead>
                                <TableHead className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold px-4 py-3">
                                  Status
                                </TableHead>
                                <TableHead className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold px-4 py-3">
                                  Date
                                </TableHead>
                                <TableHead className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold px-4 py-3">
                                  Rating
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {reviews.map((rv) => {
                                const item = rv.product || rv.service;
                                const imgs = item ? parseImages(item.images) : [];
                                const img = imgs[0] || null;
                                const href = rv.product ? `/product/${rv.product.id}` : rv.service ? `/services/${rv.service.slug}` : "#";
                                const badge = reviewStatusBadge(rv.status);
                                return (
                                  <TableRow key={rv.id} className="border-slate-200 hover:bg-slate-50/60">
                                    <TableCell className="px-4 py-3">
                                      <div className="h-11 w-11 rounded-md overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center">
                                        {img ? (
                                          <img src={img} alt={item?.name || "product"} className="w-full h-full object-cover" />
                                        ) : (
                                          <Package className="h-5 w-5 text-slate-300" />
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell className="px-4 py-3">
                                      <a
                                        href={href}
                                        className="text-[13px] font-medium text-slate-800 hover:text-epf-600 transition-colors line-clamp-2"
                                        title={item?.name || "Product"}
                                      >
                                        {item?.name || "Product removed"}
                                      </a>
                                      {rv.title && (
                                        <p className="text-[12px] text-slate-500 mt-0.5 line-clamp-1">{rv.title}</p>
                                      )}
                                    </TableCell>
                                    <TableCell className="px-4 py-3">
                                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${badge.className}`}>
                                        {badge.label}
                                      </span>
                                    </TableCell>
                                    <TableCell className="px-4 py-3 text-[13px] text-slate-500 whitespace-nowrap">
                                      {formatDate(rv.createdAt)}
                                    </TableCell>
                                    <TableCell className="px-4 py-3">
                                      <div className="flex items-center gap-0.5">
                                        {[1, 2, 3, 4, 5].map((s) => (
                                          <Star
                                            key={s}
                                            className={`h-[14px] w-[14px] ${
                                              s <= rv.rating ? "fill-amber-400 text-amber-400" : "text-slate-200 fill-slate-200"
                                            }`}
                                          />
                                        ))}
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* ---- My Profile (inline edit form — no popup) ---- */}
                {activeSection === "profile" && (
                  <Card className="rounded-xl border border-slate-200 shadow-sm">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-[18px] font-bold text-slate-900">My Profile</CardTitle>
                      <p className="text-[13px] text-slate-500 mt-1">
                        Update your personal information and address details.
                      </p>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-5">
                        {/* Personal Info row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label className="text-[13px] font-medium text-slate-700">
                              Full Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              value={editForm.name}
                              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                              placeholder="e.g. Ismail Hossen"
                              className="h-10"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-[13px] font-medium text-slate-700">নাম (বাংলা)</Label>
                            <Input
                              value={editForm.nameBn}
                              onChange={(e) => setEditForm({ ...editForm, nameBn: e.target.value })}
                              placeholder="আপনার নাম"
                              className="h-10"
                            />
                          </div>
                        </div>

                        {/* Contact row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label className="text-[13px] font-medium text-slate-700">
                              Email <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              value={user?.email || ""}
                              disabled
                              className="h-10 bg-slate-50 text-slate-500"
                            />
                            <p className="text-[11px] text-slate-400">Email change requires password verification — contact support.</p>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-[13px] font-medium text-slate-700">
                              Phone <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              value={editForm.phone}
                              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                              placeholder="01XXXXXXXXX"
                              className="h-10"
                            />
                          </div>
                        </div>

                        <Separator />

                        {/* Address row */}
                        <div className="space-y-1.5">
                          <Label className="text-[13px] font-medium text-slate-700">Street Address</Label>
                          <Input
                            value={editForm.address}
                            onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                            placeholder="House, road, street"
                            className="h-10"
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="space-y-1.5">
                            <Label className="text-[13px] font-medium text-slate-700">Area</Label>
                            <Input
                              value={editForm.area}
                              onChange={(e) => setEditForm({ ...editForm, area: e.target.value })}
                              placeholder="e.g. Gulshan"
                              className="h-10"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-[13px] font-medium text-slate-700">City</Label>
                            <Input
                              value={editForm.city}
                              onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                              placeholder="e.g. Dhaka"
                              className="h-10"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-[13px] font-medium text-slate-700">Postal Code</Label>
                            <Input
                              value={editForm.postalCode}
                              onChange={(e) => setEditForm({ ...editForm, postalCode: e.target.value })}
                              placeholder="e.g. 1212"
                              className="h-10"
                            />
                          </div>
                        </div>

                        {/* Save button */}
                        <div className="pt-2">
                          <Button
                            type="button"
                            onClick={handleSaveProfile}
                            disabled={savingProfile || !editForm.name.trim()}
                            className="bg-slate-900 hover:bg-slate-800 text-white text-[14px] font-semibold rounded-lg h-10 px-6"
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
                        </div>
                      </div>
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

      {/* Address Add/Edit Dialog — matching reference design */}
      <Dialog open={addressDialogOpen} onOpenChange={(open) => { if (!open) { setAddressDialogOpen(false); setEditingAddress(null); } }}>
        <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAddress ? "Edit Address" : "New Address"}</DialogTitle>
            <DialogDescription>
              {editingAddress ? "Update your address details." : "Save an address for faster checkout next time."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[13px] text-slate-700">Full Name <span className="text-red-500">*</span></Label>
                <Input
                  value={addressForm.fullName}
                  onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                  placeholder="e.g. Ismail Hossen"
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[13px] text-slate-700">Phone <span className="text-red-500">*</span></Label>
                <Input
                  value={addressForm.phone}
                  onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                  placeholder="01XXXXXXXXX"
                  className="h-10"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px] text-slate-700">Street Address <span className="text-red-500">*</span></Label>
              <Input
                value={addressForm.address}
                onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })}
                placeholder="House, road, street"
                className="h-10"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[13px] text-slate-700">Area</Label>
                <Input
                  value={addressForm.area}
                  onChange={(e) => setAddressForm({ ...addressForm, area: e.target.value })}
                  placeholder="e.g. Gulshan"
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[13px] text-slate-700">City <span className="text-red-500">*</span></Label>
                <Input
                  value={addressForm.city}
                  onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                  placeholder="e.g. Dhaka"
                  className="h-10"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[13px] text-slate-700">Postal Code</Label>
                <Input
                  value={addressForm.postalCode}
                  onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })}
                  placeholder="e.g. 1212"
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[13px] text-slate-700">Label (optional)</Label>
                <Input
                  value={addressForm.label}
                  onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })}
                  placeholder="Home, Office, etc."
                  className="h-10"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={addressForm.isDefault}
                onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-epf-500 focus:ring-epf-500"
              />
              <span className="text-[13px] text-slate-700">Set as default address</span>
            </label>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setAddressDialogOpen(false); setEditingAddress(null); }}
              disabled={savingAddress}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveAddress}
              disabled={savingAddress}
              className="bg-epf-500 hover:bg-epf-600 text-white"
            >
              {savingAddress ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Address"
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
