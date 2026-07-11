"use client";

// DEPRECATED: This component is replaced by individual admin pages under /app/admin/*
// Kept temporarily in case any remaining references depend on it.

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  CalendarCheck,
  ShoppingBag,
  Mail,
  Wrench,
  Package,
  ArrowLeft,
  Clock,
  FolderOpen,
  Trash2,
  Star,
  Users,
  Tag,
  MessageSquareQuote,
  FileText,
  Send,
  Plus,
  Pencil,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  DollarSign,
  Menu,
  X,
  ImageIcon,
  RotateCcw,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useUIStore, useAuthStore } from "@/store";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

// ==================== Shared admin types & helpers ====================
import type { TabKey, AdminStats, BookingItem, Order, Message, ServiceItem, ProductItem, CategoryItem, UserItem, BrandItem, ReviewItem, CouponItem, BlogPostItem, QuoteRequestItem, NewsletterItem, ServiceCategoryItem, ReturnRequestItem } from "./admin/types";
import { slugify } from "./admin/shared";

// ==================== Extracted section components ====================
import DashboardSection from "./admin/sections/DashboardSection";
import BookingsSection from "./admin/sections/BookingsSection";
import OrdersSection from "./admin/sections/OrdersSection";
import MessagesSection from "./admin/sections/MessagesSection";
import ProductsSection from "./admin/sections/ProductsSection";
import CategoriesSection from "./admin/sections/CategoriesSection";
import ServicesSection from "./admin/sections/ServicesSection";
import UsersSection from "./admin/sections/UsersSection";
import BrandsSection from "./admin/sections/BrandsSection";
import ReviewsSection from "./admin/sections/ReviewsSection";
import CouponsSection from "./admin/sections/CouponsSection";
import BlogSection from "./admin/sections/BlogSection";
import QuoteRequestsSection from "./admin/sections/QuoteRequestsSection";
import NewsletterSection from "./admin/sections/NewsletterSection";
import ReturnRequestsSection from "./admin/sections/ReturnRequestsSection";

// ==================== Tab config ====================
const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "orders", label: "Orders", icon: ShoppingBag },
  { key: "returns", label: "Returns", icon: RotateCcw },
  { key: "bookings", label: "Bookings", icon: CalendarCheck },
  { key: "products", label: "Products", icon: Package },
  { key: "categories", label: "Categories", icon: FolderOpen },
  { key: "services", label: "Services", icon: Wrench },
  { key: "users", label: "Users", icon: Users },
  { key: "brands", label: "Brands", icon: Tag },
  { key: "reviews", label: "Reviews", icon: Star },
  { key: "coupons", label: "Coupons", icon: DollarSign },
  { key: "blog", label: "Blog", icon: FileText },
  { key: "messages", label: "Messages", icon: Mail },
  { key: "quote-requests", label: "Quotes", icon: MessageSquareQuote },
  { key: "newsletter", label: "Newsletter", icon: Send },
];

// ==================== Main Component ====================
export default function AdminPanel() {
  const { setAdminOpen } = useUIStore();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabKey>("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const queryClient = useQueryClient();

  // Filter states
  const [bookingFilter, setBookingFilter] = useState<string>("all");
  const [orderFilter, setOrderFilter] = useState<string>("all");
  const [returnFilter, setReturnFilter] = useState<string>("all");

  // Dialog states
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteConfirmAction, setDeleteConfirmAction] = useState<() => void>(() => {});
  const [deleteConfirmLabel, setDeleteConfirmLabel] = useState("");
  const [expandedMsgId, setExpandedMsgId] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [expandedReturnId, setExpandedReturnId] = useState<string | null>(null);

  // Product form
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [productForm, setProductForm] = useState({
    name: "", nameBn: "", categoryId: "", brandId: "", price: "", comparePrice: "",
    stock: "", description: "", descriptionBn: "", featured: false, specifications: "{}", images: "[]",
  });

  // Shipment form
  const [shipmentDialogOpen, setShipmentDialogOpen] = useState(false);
  const [editingShipment, setEditingShipment] = useState<any>(null);
  const [shipmentForm, setShipmentForm] = useState({
    orderId: "",
    trackingNumber: "",
    carrier: "",
    estimatedDelivery: "",
    status: "PENDING",
    note: "",
    location: "",
  });

  // Category form
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<CategoryItem | null>(null);
  const [catForm, setCatForm] = useState({ name: "", nameBn: "", sortOrder: "0", active: true });

  // Service form
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [serviceForm, setServiceForm] = useState({
    name: "", nameBn: "", categoryId: "", basePrice: "", priceUnit: "fixed", priceLabel: "Fixed",
    duration: "1-2 days", description: "", descriptionBn: "", popular: false, features: "[]", image: "",
  });

  // Brand form
  const [brandDialogOpen, setBrandDialogOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<BrandItem | null>(null);
  const [brandForm, setBrandForm] = useState({
    name: "", slug: "", logo: "", country: "", description: "", sortOrder: "0", active: true,
  });

  // Coupon form
  const [couponDialogOpen, setCouponDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponItem | null>(null);
  const [couponForm, setCouponForm] = useState({
    code: "", type: "percentage", value: "", minOrder: "0", maxDiscount: "", usageLimit: "",
    startDate: "", endDate: "", active: true,
  });

  // Blog form
  const [blogDialogOpen, setBlogDialogOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<BlogPostItem | null>(null);
  const [blogForm, setBlogForm] = useState({
    title: "", titleBn: "", slug: "", excerpt: "", content: "", coverImage: "", tags: "[]", published: false,
  });

  // Quote reply dialog
  const [quoteReplyOpen, setQuoteReplyOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<QuoteRequestItem | null>(null);
  const [quoteReplyForm, setQuoteReplyForm] = useState({ reply: "", status: "REPLIED" });

  // ==================== Queries ====================
  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ["admin-stats"],
    queryFn: () => fetch("/api/admin/stats").then((r) => r.json()).then((d) => d.data),
    refetchInterval: 30000,
  });

  const { data: bookingsRaw, isLoading: bookingsLoading, error: bookingsError, refetch: refetchBookings } = useQuery<{ data: BookingItem[] }>({
    queryKey: ["admin-bookings", bookingFilter],
    queryFn: () =>
      fetch(`/api/admin/bookings${bookingFilter !== "all" ? `?status=${bookingFilter}` : ""}`).then((r) => r.json()),
  });
  const bookings = bookingsRaw?.data ?? [];

  const { data: ordersRaw, isLoading: ordersLoading, error: ordersError, refetch: refetchOrders } = useQuery<{ data: { data: Order[] } }>({
    queryKey: ["admin-orders", orderFilter],
    queryFn: () =>
      fetch(`/api/admin/orders${orderFilter !== "all" ? `?status=${orderFilter}` : ""}`).then((r) => r.json()),
  });
  const orders = ordersRaw?.data?.data ?? [];

  const { data: messagesRaw, isLoading: messagesLoading, refetch: refetchMessages } = useQuery<{ data: Message[] }>({
    queryKey: ["admin-messages"],
    queryFn: () => fetch("/api/admin/messages").then((r) => r.json()),
  });
  const messages = messagesRaw?.data ?? [];

  const { data: servicesRaw, isLoading: servicesLoading, refetch: refetchServices } = useQuery<{ data: ServiceItem[] }>({
    queryKey: ["admin-services"],
    queryFn: () => fetch("/api/admin/services").then((r) => r.json()),
  });
  const services = servicesRaw?.data ?? [];

  const { data: productsData, isLoading: productsLoading, refetch: refetchProducts } = useQuery<{ data: { data: ProductItem[]; pagination: { total: number } } }>({
    queryKey: ["admin-products"],
    queryFn: () => fetch("/api/admin/products").then((r) => r.json()),
  });
  const products = productsData?.data?.data ?? [];

  const { data: categoriesRaw, isLoading: catsLoading, refetch: refetchCategories } = useQuery<{ data: CategoryItem[] }>({
    queryKey: ["admin-product-categories"],
    queryFn: () => fetch("/api/admin/product-categories").then((r) => r.json()),
  });
  const categories = categoriesRaw?.data ?? [];

  const { data: usersData, isLoading: usersLoading, refetch: refetchUsers } = useQuery<{ data: { data: UserItem[] } }>({
    queryKey: ["admin-users"],
    queryFn: () => fetch("/api/admin/users").then((r) => r.json()),
  });
  const users = usersData?.data?.data ?? [];

  const { data: brandsData, isLoading: brandsLoading, refetch: refetchBrands } = useQuery<{ data: BrandItem[] }>({
    queryKey: ["admin-brands"],
    queryFn: () => fetch("/api/admin/brands").then((r) => r.json()),
  });
  const brands = brandsData?.data ?? [];

  const { data: reviewsData, isLoading: reviewsLoading, refetch: refetchReviews } = useQuery<{ data: ReviewItem[] }>({
    queryKey: ["admin-reviews"],
    queryFn: () => fetch("/api/admin/reviews").then((r) => r.json()),
  });
  const reviews = reviewsData?.data ?? [];

  const { data: couponsData, isLoading: couponsLoading, refetch: refetchCoupons } = useQuery<{ data: CouponItem[] }>({
    queryKey: ["admin-coupons"],
    queryFn: () => fetch("/api/admin/coupons").then((r) => r.json()),
  });
  const coupons = couponsData?.data ?? [];

  const { data: blogData, isLoading: blogLoading, refetch: refetchBlog } = useQuery<{ data: BlogPostItem[] }>({
    queryKey: ["admin-blog"],
    queryFn: () => fetch("/api/admin/blog").then((r) => r.json()),
  });
  const blogPosts = blogData?.data ?? [];

  const { data: quoteRequestsData, isLoading: quotesLoading, refetch: refetchQuotes } = useQuery<{ data: QuoteRequestItem[] }>({
    queryKey: ["admin-quote-requests"],
    queryFn: () => fetch("/api/admin/quote-requests").then((r) => r.json()),
  });
  const quoteRequests = quoteRequestsData?.data ?? [];

  const { data: newsletterData, isLoading: newsletterLoading, refetch: refetchNewsletter } = useQuery<{ data: NewsletterItem[] }>({
    queryKey: ["admin-newsletter"],
    queryFn: () => fetch("/api/admin/newsletter").then((r) => r.json()),
  });
  const subscribers = newsletterData?.data ?? [];

  const { data: returnsData, isLoading: returnsLoading, error: returnsError, refetch: refetchReturns } = useQuery<{ data: ReturnRequestItem[] }>({
    queryKey: ["admin-returns", returnFilter],
    queryFn: () =>
      fetch(`/api/admin/returns${returnFilter !== "all" ? `?status=${returnFilter}` : ""}`)
        .then((r) => r.json())
        .then((d) => d.success ? d.data : { data: [] }),
  });
  const returns = returnsData?.data ?? [];

  const { data: serviceCategoriesRaw, isLoading: svcCatsLoading } = useQuery<{ data: ServiceCategoryItem[] }>({
    queryKey: ["admin-service-categories"],
    queryFn: () => fetch("/api/admin/service-categories").then((r) => r.json()),
  });
  const serviceCategories = serviceCategoriesRaw?.data ?? [];

  // ==================== Mutations ====================
  const updateBookingMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      fetch(`/api/admin/bookings/${id}/status`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) }).then((r) => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-bookings"] }); queryClient.invalidateQueries({ queryKey: ["admin-stats"] }); toast.success("Booking status updated"); },
    onError: () => toast.error("Failed to update booking status"),
  });

  const updateOrderMutation = useMutation({
    mutationFn: ({ id, status, paymentStatus }: { id: string; status?: string; paymentStatus?: string }) =>
      fetch(`/api/admin/orders/${id}/status`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status, paymentStatus }) }).then((r) => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-orders"] }); queryClient.invalidateQueries({ queryKey: ["admin-stats"] }); toast.success("Order status updated"); },
    onError: () => toast.error("Failed to update order status"),
  });

  const createShipmentMutation = useMutation({
    mutationFn: (data: any) =>
      fetch("/api/admin/shipments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
        .then((r) => { if (!r.ok) {return r.json().then((d) => { throw new Error(d.error || "Failed"); });} return r.json(); }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-orders"] }); toast.success("Shipment created"); setShipmentDialogOpen(false); },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateShipmentMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      fetch(`/api/admin/shipments/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
        .then((r) => { if (!r.ok) {return r.json().then((d) => { throw new Error(d.error || "Failed"); });} return r.json(); }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-orders"] }); toast.success("Shipment updated"); setShipmentDialogOpen(false); },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateShipmentStatusMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      fetch(`/api/admin/shipments/${id}/status`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
        .then((r) => { if (!r.ok) {return r.json().then((d) => { throw new Error(d.error || "Failed"); });} return r.json(); }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-orders"] }); toast.success("Shipment status updated"); setShipmentDialogOpen(false); },
    onError: (e: Error) => toast.error(e.message),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/admin/messages/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "IN_PROGRESS" }) }).then((r) => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-messages"] }); queryClient.invalidateQueries({ queryKey: ["admin-stats"] }); toast.success("Marked as read"); },
    onError: () => toast.error("Failed to mark as read"),
  });

  const deleteMessageMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/admin/messages/${id}`, { method: "DELETE" }).then((r) => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-messages"] }); queryClient.invalidateQueries({ queryKey: ["admin-stats"] }); setDeleteConfirmId(null); toast.success("Message deleted"); },
    onError: () => toast.error("Failed to delete message"),
  });

  // Product CRUD
  const createProductMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      fetch("/api/admin/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => { if (!r.ok) {return r.json().then((d) => { throw new Error(d.error || "Failed"); });} return r.json(); }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-products"] }); queryClient.invalidateQueries({ queryKey: ["admin-stats"] }); setProductDialogOpen(false); resetProductForm(); toast.success("Product created"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      fetch(`/api/admin/products/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => { if (!r.ok) {return r.json().then((d) => { throw new Error(d.error || "Failed"); });} return r.json(); }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-products"] }); setProductDialogOpen(false); setEditingProduct(null); resetProductForm(); toast.success("Product updated"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/admin/products/${id}`, { method: "DELETE" }).then((r) => { if (!r.ok) {throw new Error("Failed");} return r.json(); }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-products"] }); queryClient.invalidateQueries({ queryKey: ["admin-stats"] }); setDeleteConfirmId(null); toast.success("Product deleted"); },
    onError: () => toast.error("Failed to delete product"),
  });

  // Category CRUD
  const createCategoryMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      fetch("/api/admin/product-categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => { if (!r.ok) {return r.json().then((d) => { throw new Error(d.error || "Failed"); });} return r.json(); }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-product-categories"] }); setCatDialogOpen(false); resetCatForm(); toast.success("Category created"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      fetch(`/api/admin/product-categories/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => { if (!r.ok) {return r.json().then((d) => { throw new Error(d.error || "Failed"); });} return r.json(); }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-product-categories"] }); setCatDialogOpen(false); setEditingCat(null); resetCatForm(); toast.success("Category updated"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/admin/product-categories/${id}`, { method: "DELETE" }).then((r) => { if (!r.ok) {throw new Error("Failed");} return r.json(); }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-product-categories"] }); setDeleteConfirmId(null); toast.success("Category deactivated"); },
    onError: () => toast.error("Failed to deactivate category"),
  });

  // Service CRUD
  const createServiceMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      fetch("/api/admin/services", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => { if (!r.ok) {return r.json().then((d) => { throw new Error(d.error || "Failed"); });} return r.json(); }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-services"] }); queryClient.invalidateQueries({ queryKey: ["admin-stats"] }); setServiceDialogOpen(false); resetServiceForm(); toast.success("Service created"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateServiceMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      fetch(`/api/admin/services/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => { if (!r.ok) {return r.json().then((d) => { throw new Error(d.error || "Failed"); });} return r.json(); }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-services"] }); setServiceDialogOpen(false); setEditingService(null); resetServiceForm(); toast.success("Service updated"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteServiceMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/admin/services/${id}`, { method: "DELETE" }).then((r) => { if (!r.ok) {throw new Error("Failed");} return r.json(); }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-services"] }); queryClient.invalidateQueries({ queryKey: ["admin-stats"] }); setDeleteConfirmId(null); toast.success("Service deactivated"); },
    onError: () => toast.error("Failed to deactivate service"),
  });

  // User toggle
  const toggleUserMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      fetch(`/api/admin/users/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive }) }).then((r) => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-users"] }); toast.success("User status updated"); },
    onError: () => toast.error("Failed to update user status"),
  });

  // Brand CRUD
  const createBrandMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      fetch("/api/admin/brands", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => { if (!r.ok) {return r.json().then((d) => { throw new Error(d.error || "Failed"); });} return r.json(); }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-brands"] }); setBrandDialogOpen(false); resetBrandForm(); toast.success("Brand created"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateBrandMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      fetch(`/api/admin/brands/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => { if (!r.ok) {return r.json().then((d) => { throw new Error(d.error || "Failed"); });} return r.json(); }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-brands"] }); setBrandDialogOpen(false); setEditingBrand(null); resetBrandForm(); toast.success("Brand updated"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteBrandMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/admin/brands/${id}`, { method: "DELETE" }).then((r) => { if (!r.ok) {throw new Error("Failed");} return r.json(); }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-brands"] }); setDeleteConfirmId(null); toast.success("Brand deleted"); },
    onError: () => toast.error("Failed to delete brand"),
  });

  // Review toggle & delete
  const toggleReviewMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/admin/reviews/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "APPROVED" }) }).then((r) => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-reviews"] }); toast.success("Review approved"); },
    onError: () => toast.error("Failed to approve review"),
  });

  const deleteReviewMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/admin/reviews/${id}`, { method: "DELETE" }).then((r) => { if (!r.ok) {throw new Error("Failed");} return r.json(); }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-reviews"] }); setDeleteConfirmId(null); toast.success("Review deleted"); },
    onError: () => toast.error("Failed to delete review"),
  });

  // Coupon CRUD
  const createCouponMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      fetch("/api/admin/coupons", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => { if (!r.ok) {return r.json().then((d) => { throw new Error(d.error || "Failed"); });} return r.json(); }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-coupons"] }); setCouponDialogOpen(false); resetCouponForm(); toast.success("Coupon created"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateCouponMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      fetch(`/api/admin/coupons/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => { if (!r.ok) {return r.json().then((d) => { throw new Error(d.error || "Failed"); });} return r.json(); }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-coupons"] }); setCouponDialogOpen(false); setEditingCoupon(null); resetCouponForm(); toast.success("Coupon updated"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteCouponMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/admin/coupons/${id}`, { method: "DELETE" }).then((r) => { if (!r.ok) {throw new Error("Failed");} return r.json(); }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-coupons"] }); setDeleteConfirmId(null); toast.success("Coupon deleted"); },
    onError: () => toast.error("Failed to delete coupon"),
  });

  // Blog CRUD
  const createBlogMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      fetch("/api/admin/blog", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => { if (!r.ok) {return r.json().then((d) => { throw new Error(d.error || "Failed"); });} return r.json(); }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-blog"] }); setBlogDialogOpen(false); resetBlogForm(); toast.success("Blog post created"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateBlogMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      fetch(`/api/admin/blog/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => { if (!r.ok) {return r.json().then((d) => { throw new Error(d.error || "Failed"); });} return r.json(); }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-blog"] }); setBlogDialogOpen(false); setEditingBlog(null); resetBlogForm(); toast.success("Blog post updated"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteBlogMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/admin/blog/${id}`, { method: "DELETE" }).then((r) => { if (!r.ok) {throw new Error("Failed");} return r.json(); }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-blog"] }); setDeleteConfirmId(null); toast.success("Blog post deleted"); },
    onError: () => toast.error("Failed to delete blog post"),
  });

  // Quote reply
  const replyQuoteMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      fetch(`/api/admin/quote-requests/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-quote-requests"] }); setQuoteReplyOpen(false); setEditingQuote(null); setQuoteReplyForm({ reply: "", status: "REPLIED" }); toast.success("Reply sent"); },
    onError: () => toast.error("Failed to send reply"),
  });

  const deleteQuoteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/admin/quote-requests/${id}`, { method: "DELETE" }).then((r) => { if (!r.ok) {throw new Error("Failed");} return r.json(); }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-quote-requests"] }); setDeleteConfirmId(null); toast.success("Quote request deleted"); },
    onError: () => toast.error("Failed to delete quote request"),
  });

  // Newsletter delete
  const deleteNewsletterMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/admin/newsletter/${id}`, { method: "DELETE" }).then((r) => { if (!r.ok) {throw new Error("Failed");} return r.json(); }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-newsletter"] }); setDeleteConfirmId(null); toast.success("Subscriber deleted"); },
    onError: () => toast.error("Failed to delete subscriber"),
  });

  // Return request status update
  const updateReturnMutation = useMutation({
    mutationFn: ({ id, status, refundAmount, notes }: { id: string; status: string; refundAmount?: number; notes?: string }) =>
      fetch(`/api/admin/returns/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status, refundAmount, notes }) })
        .then((r) => { if (!r.ok) {return r.json().then((d) => { throw new Error(d.error || "Failed"); });} return r.json(); }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-returns"] }); queryClient.invalidateQueries({ queryKey: ["admin-orders"] }); toast.success("Return request updated"); },
    onError: (e: Error) => toast.error(e.message),
  });

  // ==================== Form helpers ====================
  function resetProductForm() {
    setProductForm({ name: "", nameBn: "", categoryId: "", brandId: "", price: "", comparePrice: "", stock: "", description: "", descriptionBn: "", featured: false, specifications: "{}", images: "[]" });
    setEditingProduct(null);
  }
  function resetCatForm() {
    setCatForm({ name: "", nameBn: "", sortOrder: "0", active: true });
    setEditingCat(null);
  }
  function resetServiceForm() {
    setServiceForm({ name: "", nameBn: "", categoryId: "", basePrice: "", priceUnit: "fixed", priceLabel: "Fixed", duration: "1-2 days", description: "", descriptionBn: "", popular: false, features: "[]", image: "" });
    setEditingService(null);
  }
  function resetBrandForm() {
    setBrandForm({ name: "", slug: "", logo: "", country: "", description: "", sortOrder: "0", active: true });
    setEditingBrand(null);
  }
  function resetCouponForm() {
    setCouponForm({ code: "", type: "percentage", value: "", minOrder: "0", maxDiscount: "", usageLimit: "", startDate: "", endDate: "", active: true });
    setEditingCoupon(null);
  }
  function resetBlogForm() {
    setBlogForm({ title: "", titleBn: "", slug: "", excerpt: "", content: "", coverImage: "", tags: "[]", published: false });
    setEditingBlog(null);
  }

  function openProductEdit(p: ProductItem) {
    setEditingProduct(p);
    setProductForm({
      name: p.name, nameBn: p.nameBn, categoryId: p.categoryId, brandId: p.brandId || "",
      price: String(p.price), comparePrice: p.comparePrice ? String(p.comparePrice) : "",
      stock: String(p.stock), description: p.description, descriptionBn: p.descriptionBn,
      featured: p.featured, specifications: p.specifications, images: p.images,
    });
    setProductDialogOpen(true);
  }

  function openCatEdit(c: CategoryItem) {
    setEditingCat(c);
    setCatForm({ name: c.name, nameBn: c.nameBn, sortOrder: String(c.sortOrder), active: c.active });
    setCatDialogOpen(true);
  }

  function openServiceEdit(s: ServiceItem) {
    setEditingService(s);
    setServiceForm({
      name: s.name, nameBn: s.nameBn, categoryId: s.categoryId, basePrice: String(s.basePrice),
      priceUnit: s.priceUnit, priceLabel: s.priceLabel, duration: s.duration,
      description: s.description, descriptionBn: s.descriptionBn, popular: s.popular, features: s.features, image: s.image,
    });
    setServiceDialogOpen(true);
  }

  function openBrandEdit(b: BrandItem) {
    setEditingBrand(b);
    setBrandForm({ name: b.name, slug: b.slug, logo: b.logo, country: b.country, description: b.description, sortOrder: String(b.sortOrder), active: b.active });
    setBrandDialogOpen(true);
  }

  function openCouponEdit(c: CouponItem) {
    setEditingCoupon(c);
    setCouponForm({
      code: c.code, type: c.type, value: String(c.value), minOrder: String(c.minOrder),
      maxDiscount: c.maxDiscount ? String(c.maxDiscount) : "",
      usageLimit: c.usageLimit ? String(c.usageLimit) : "",
      startDate: c.startDate?.split("T")[0] || "", endDate: c.endDate?.split("T")[0] || "", active: c.active,
    });
    setCouponDialogOpen(true);
  }

  function openBlogEdit(b: BlogPostItem) {
    setEditingBlog(b);
    setBlogForm({ title: b.title, titleBn: b.titleBn, slug: b.slug, excerpt: b.excerpt, content: b.content, coverImage: b.coverImage, tags: b.tags, published: b.published });
    setBlogDialogOpen(true);
  }

  function confirmDelete(id: string, action: () => void, label: string) {
    setDeleteConfirmId(id);
    setDeleteConfirmAction(() => action);
    setDeleteConfirmLabel(label);
  }

  function onCreateShipment(order: any) {
    setEditingShipment(null);
    setShipmentForm({ orderId: order.id, trackingNumber: "", carrier: "", estimatedDelivery: "", status: "PENDING", note: "", location: "" });
    setShipmentDialogOpen(true);
  }

  function onEditShipment(order: any) {
    const s = order.shipment;
    setEditingShipment(s);
    setShipmentForm({
      orderId: order.id,
      trackingNumber: s.trackingNumber || "",
      carrier: s.carrier || "",
      estimatedDelivery: s.estimatedDelivery ? s.estimatedDelivery.slice(0, 10) : "",
      status: s.status || "PENDING",
      note: "",
      location: "",
    });
    setShipmentDialogOpen(true);
  }

  const handleTabChange = useCallback((key: TabKey) => {
    setActiveTab(key);
    setExpandedMsgId(null);
    setExpandedOrderId(null);
    setExpandedReturnId(null);
    setMobileMenuOpen(false);
  }, []);

  // ==================== Sidebar ====================
  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#111827] text-white">
      <div className="px-4 py-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-[#0EA5E9] rounded-lg p-1.5">
              <Wrench className="size-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm leading-tight">ePowerFix</p>
              <p className="text-xs text-gray-400">Admin Panel</p>
            </div>
          </div>
          <button className="lg:hidden text-gray-400 hover:text-white" onClick={() => setMobileMenuOpen(false)}>
            <X className="size-5" />
          </button>
        </div>
      </div>

      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors text-left ${
                isActive
                  ? "bg-[#0EA5E9] text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <Icon className="size-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-2 border-t border-gray-700">
        <button
          onClick={() => setAdminOpen(false)}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <ArrowLeft className="size-4" />
          <span>Back to Site</span>
        </button>
      </div>
    </div>
  );

  // ==================== Render sections ====================
  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardSection stats={stats} isLoading={statsLoading} bookings={bookings} orders={orders} bookingsLoading={bookingsLoading} ordersLoading={ordersLoading} />;
      case "bookings":
        return <BookingsSection bookings={bookings} isLoading={bookingsLoading} error={bookingsError} filter={bookingFilter} setFilter={setBookingFilter} updateMutation={updateBookingMutation} onRetry={refetchBookings} />;
      case "orders":
        return <OrdersSection orders={orders} isLoading={ordersLoading} error={ordersError} filter={orderFilter} setFilter={setOrderFilter} updateMutation={updateOrderMutation} expandedOrderId={expandedOrderId} setExpandedOrderId={setExpandedOrderId} onRetry={refetchOrders} onCreateShipment={onCreateShipment} onEditShipment={onEditShipment} />;
      case "returns":
        return <ReturnRequestsSection returns={returns} isLoading={returnsLoading} error={returnsError} filter={returnFilter} setFilter={setReturnFilter} updateMutation={updateReturnMutation} expandedId={expandedReturnId} setExpandedId={setExpandedReturnId} onRetry={refetchReturns} />;
      case "messages":
        return <MessagesSection messages={messages} isLoading={messagesLoading} expandedMsgId={expandedMsgId} setExpandedMsgId={setExpandedMsgId} markRead={markReadMutation} deleteMsgId={deleteConfirmId} setDeleteMsgId={(id) => confirmDelete(id ?? "", () => deleteMessageMutation.mutate(id ?? ""), "this message")} deleteMutation={deleteMessageMutation} onRetry={refetchMessages} />;
      case "products":
        return <ProductsSection products={products} isLoading={productsLoading} onRetry={refetchProducts} openAdd={() => { resetProductForm(); setProductDialogOpen(true); }} openEdit={openProductEdit} confirmDelete={(id) => confirmDelete(id, () => deleteProductMutation.mutate(id), "this product")} />;
      case "categories":
        return <CategoriesSection categories={categories} isLoading={catsLoading} onRetry={refetchCategories} openAdd={() => { resetCatForm(); setCatDialogOpen(true); }} openEdit={openCatEdit} confirmDelete={(id) => confirmDelete(id, () => deleteCategoryMutation.mutate(id), "this category")} />;
      case "services":
        return <ServicesSection services={services} isLoading={servicesLoading} onRetry={refetchServices} openAdd={() => { resetServiceForm(); setServiceDialogOpen(true); }} openEdit={openServiceEdit} confirmDelete={(id) => confirmDelete(id, () => deleteServiceMutation.mutate(id), "this service")} />;
      case "users":
        return <UsersSection users={users} isLoading={usersLoading} onRetry={refetchUsers} toggleMutation={toggleUserMutation} />;
      case "brands":
        return <BrandsSection brands={brands} isLoading={brandsLoading} onRetry={refetchBrands} openAdd={() => { resetBrandForm(); setBrandDialogOpen(true); }} openEdit={openBrandEdit} confirmDelete={(id) => confirmDelete(id, () => deleteBrandMutation.mutate(id), "this brand")} />;
      case "reviews":
        return <ReviewsSection reviews={reviews} isLoading={reviewsLoading} onRetry={refetchReviews} toggleMutation={toggleReviewMutation} confirmDelete={(id) => confirmDelete(id, () => deleteReviewMutation.mutate(id), "this review")} />;
      case "coupons":
        return <CouponsSection coupons={coupons} isLoading={couponsLoading} onRetry={refetchCoupons} openAdd={() => { resetCouponForm(); setCouponDialogOpen(true); }} openEdit={openCouponEdit} confirmDelete={(id) => confirmDelete(id, () => deleteCouponMutation.mutate(id), "this coupon")} />;
      case "blog":
        return <BlogSection posts={blogPosts} isLoading={blogLoading} onRetry={refetchBlog} openAdd={() => { resetBlogForm(); setBlogDialogOpen(true); }} openEdit={openBlogEdit} confirmDelete={(id) => confirmDelete(id, () => deleteBlogMutation.mutate(id), "this post")} />;
      case "quote-requests":
        return <QuoteRequestsSection quotes={quoteRequests} isLoading={quotesLoading} onRetry={refetchQuotes} openReply={(q) => { setEditingQuote(q); setQuoteReplyForm({ reply: q.reply || "", status: q.status === "replied" ? "replied" : "replied" }); setQuoteReplyOpen(true); }} confirmDelete={(id) => confirmDelete(id, () => deleteQuoteMutation.mutate(id), "this quote request")} />;
      case "newsletter":
        return <NewsletterSection subscribers={subscribers} isLoading={newsletterLoading} onRetry={refetchNewsletter} confirmDelete={(id) => confirmDelete(id, () => deleteNewsletterMutation.mutate(id), "this subscriber")} />;
      default:
        return null;
    }
  };

  const sectionTitle = tabs.find((t) => t.key === activeTab)?.label || "Dashboard";

  // Auth guard — deny access if not admin
  if (user?.role !== "ADMIN") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="text-center">
          <p className="text-lg font-semibold text-[#111827] mb-2">Access Denied</p>
          <p className="text-sm text-[#6B7280] mb-4">You do not have permission to view this page.</p>
          <button onClick={() => setAdminOpen(false)} className="text-sm text-[#0EA5E9] hover:underline">Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-64 z-50 lg:hidden"
            >
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-60 shrink-0 sticky top-0 h-screen overflow-y-auto">
        {sidebarContent}
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 bg-white border-b border-[#E2E8F0] px-4 md:px-6 h-14 flex items-center gap-4">
          <button className="lg:hidden text-gray-600 hover:text-gray-900" onClick={() => setMobileMenuOpen(true)}>
            <Menu className="size-5" />
          </button>
          <div className="flex items-center gap-2 lg:hidden">
            <div className="bg-[#0EA5E9] rounded-lg p-1">
              <Wrench className="size-3.5 text-white" />
            </div>
            <span className="font-bold text-sm">Admin</span>
          </div>
          <h1 className="hidden lg:block text-lg font-semibold text-gray-900">{sectionTitle}</h1>
          <div className="flex-1" />
          <Button variant="outline" size="sm" onClick={() => setAdminOpen(false)} className="lg:hidden text-xs gap-1.5">
            <ArrowLeft className="size-3.5" />
            Back
          </Button>
        </header>

        <main className="flex-1 p-4 md:p-6 pb-20 lg:pb-6">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            {renderContent()}
          </motion.div>
        </main>
      </div>

      {/* Mobile bottom tab bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-[#E2E8F0]">
        <ScrollArea className="w-full">
          <div className="flex items-center min-w-max">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => handleTabChange(tab.key)}
                  className={`flex flex-col items-center gap-0.5 py-2 px-3 transition-colors min-w-[60px] ${
                    isActive ? "text-[#0EA5E9]" : "text-gray-400"
                  }`}
                >
                  <Icon className="size-4" />
                  <span className="text-[10px] font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </nav>

      {/* ==================== DIALOGS ==================== */}

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>Are you sure you want to delete {deleteConfirmLabel}? This item will be moved to trash. You can restore it from the trash.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { deleteConfirmAction(); setDeleteConfirmId(null); }}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Shipment Dialog */}
      <Dialog open={shipmentDialogOpen} onOpenChange={() => setShipmentDialogOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingShipment ? "Update Shipment" : "Create Shipment"}</DialogTitle>
            <DialogDescription>{editingShipment ? "Update tracking info or advance status." : "Create a shipment for this order."}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Carrier</Label>
              <Select value={shipmentForm.carrier} onValueChange={(v) => setShipmentForm({ ...shipmentForm, carrier: v })}>
                <SelectTrigger><SelectValue placeholder="Select carrier" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pathao">Pathao</SelectItem>
                  <SelectItem value="Steadfast">Steadfast</SelectItem>
                  <SelectItem value="RedX">RedX</SelectItem>
                  <SelectItem value="Sundarban">Sundarban</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Tracking Number</Label>
              <Input value={shipmentForm.trackingNumber} onChange={(e) => setShipmentForm({ ...shipmentForm, trackingNumber: e.target.value })} placeholder="e.g. STD123456" />
            </div>
            <div className="space-y-1">
              <Label>Estimated Delivery</Label>
              <Input type="date" value={shipmentForm.estimatedDelivery} onChange={(e) => setShipmentForm({ ...shipmentForm, estimatedDelivery: e.target.value })} />
            </div>
            {editingShipment && (
              <div className="space-y-1 border-t pt-3">
                <Label>Advance Status</Label>
                <Select value={shipmentForm.status} onValueChange={(v) => setShipmentForm({ ...shipmentForm, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="PICKED_UP">Picked Up</SelectItem>
                    <SelectItem value="IN_TRANSIT">In Transit</SelectItem>
                    <SelectItem value="OUT_FOR_DELIVERY">Out for Delivery</SelectItem>
                    <SelectItem value="DELIVERED">Delivered</SelectItem>
                    <SelectItem value="FAILED">Failed</SelectItem>
                  </SelectContent>
                </Select>
                <Input className="mt-2" value={shipmentForm.note} onChange={(e) => setShipmentForm({ ...shipmentForm, note: e.target.value })} placeholder="Note (optional)" />
                <Input className="mt-2" value={shipmentForm.location} onChange={(e) => setShipmentForm({ ...shipmentForm, location: e.target.value })} placeholder="Location / hub (optional)" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShipmentDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              if (editingShipment) {
                const statusChanged = shipmentForm.status !== editingShipment.status;
                // Update fields first
                updateShipmentMutation.mutate({
                  id: editingShipment.id,
                  data: {
                    trackingNumber: shipmentForm.trackingNumber || null,
                    carrier: shipmentForm.carrier || null,
                    estimatedDelivery: shipmentForm.estimatedDelivery ? new Date(shipmentForm.estimatedDelivery).toISOString() : null,
                  },
                });
                // Then advance status if changed
                if (statusChanged) {
                  updateShipmentStatusMutation.mutate({
                    id: editingShipment.id,
                    data: { status: shipmentForm.status, note: shipmentForm.note || undefined, location: shipmentForm.location || undefined },
                  });
                }
              } else {
                createShipmentMutation.mutate({
                  orderId: shipmentForm.orderId,
                  trackingNumber: shipmentForm.trackingNumber || undefined,
                  carrier: shipmentForm.carrier || undefined,
                  estimatedDelivery: shipmentForm.estimatedDelivery ? new Date(shipmentForm.estimatedDelivery).toISOString() : undefined,
                });
              }
            }}>{editingShipment ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Product Dialog */}
      <Dialog open={productDialogOpen} onOpenChange={() => { setProductDialogOpen(false); resetProductForm(); }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Edit Product" : "Add Product"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input value={productForm.name} onChange={(e) => setProductForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Name (Bengali) *</Label>
              <Input value={productForm.nameBn} onChange={(e) => setProductForm((f) => ({ ...f, nameBn: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Category *</Label>
              <Select value={productForm.categoryId} onValueChange={(v) => setProductForm((f) => ({ ...f, categoryId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {categories.filter((c) => c.active || c.id === editingProduct?.categoryId).map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Brand</Label>
              <Select value={productForm.brandId} onValueChange={(v) => setProductForm((f) => ({ ...f, brandId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select brand" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {brands.filter((b) => b.active || b.id === editingProduct?.brandId).map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Price *</Label>
              <Input type="number" value={productForm.price} onChange={(e) => setProductForm((f) => ({ ...f, price: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Compare Price</Label>
              <Input type="number" value={productForm.comparePrice} onChange={(e) => setProductForm((f) => ({ ...f, comparePrice: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Stock *</Label>
              <Input type="number" value={productForm.stock} onChange={(e) => setProductForm((f) => ({ ...f, stock: e.target.value }))} />
            </div>
            <div className="space-y-1.5 flex items-center gap-3 pt-6">
              <Switch checked={productForm.featured} onCheckedChange={(v) => setProductForm((f) => ({ ...f, featured: v }))} />
              <Label>Featured</Label>
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>Description</Label>
              <Textarea value={productForm.description} onChange={(e) => setProductForm((f) => ({ ...f, description: e.target.value }))} rows={2} />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>Description (Bengali)</Label>
              <Textarea value={productForm.descriptionBn} onChange={(e) => setProductForm((f) => ({ ...f, descriptionBn: e.target.value }))} rows={2} />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>Specifications (JSON)</Label>
              <Textarea value={productForm.specifications} onChange={(e) => setProductForm((f) => ({ ...f, specifications: e.target.value }))} rows={3} className="font-mono text-xs" />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>Image URLs (comma-separated)</Label>
              <Input value={productForm.images} onChange={(e) => setProductForm((f) => ({ ...f, images: e.target.value }))} placeholder="https://..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setProductDialogOpen(false); resetProductForm(); }}>Cancel</Button>
            <Button
              className="bg-[#0EA5E9] hover:bg-[#0284C7] text-white"
              disabled={createProductMutation.isPending || updateProductMutation.isPending}
              onClick={() => {
                const data = {
                  name: productForm.name, nameBn: productForm.nameBn, categoryId: productForm.categoryId,
                  brandId: productForm.brandId === "none" ? null : productForm.brandId || null,
                  price: Number(productForm.price), comparePrice: productForm.comparePrice ? Number(productForm.comparePrice) : null,
                  stock: Number(productForm.stock), description: productForm.description, descriptionBn: productForm.descriptionBn,
                  featured: productForm.featured, specifications: productForm.specifications, images: productForm.images,
                };
                if (editingProduct) {updateProductMutation.mutate({ id: editingProduct.id, data });}
                else {createProductMutation.mutate(data);}
              }}
            >
              {createProductMutation.isPending || updateProductMutation.isPending ? "Saving..." : editingProduct ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={catDialogOpen} onOpenChange={() => { setCatDialogOpen(false); resetCatForm(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCat ? "Edit Category" : "Add Category"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input value={catForm.name} onChange={(e) => setCatForm((f) => ({ ...f, name: e.target.value, slug: slugify(e.target.value) }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Name (Bengali) *</Label>
              <Input value={catForm.nameBn} onChange={(e) => setCatForm((f) => ({ ...f, nameBn: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Slug</Label>
              <Input value={catForm.name ? slugify(catForm.name) : ""} readOnly className="bg-gray-50" />
            </div>
            <div className="space-y-1.5">
              <Label>Sort Order</Label>
              <Input type="number" value={catForm.sortOrder} onChange={(e) => setCatForm((f) => ({ ...f, sortOrder: e.target.value }))} />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={catForm.active} onCheckedChange={(v) => setCatForm((f) => ({ ...f, active: v }))} />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCatDialogOpen(false); resetCatForm(); }}>Cancel</Button>
            <Button
              className="bg-[#0EA5E9] hover:bg-[#0284C7] text-white"
              disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
              onClick={() => {
                const data = { name: catForm.name, nameBn: catForm.nameBn, slug: slugify(catForm.name), sortOrder: Number(catForm.sortOrder), active: catForm.active };
                if (editingCat) {updateCategoryMutation.mutate({ id: editingCat.id, data });}
                else {createCategoryMutation.mutate(data);}
              }}
            >
              {createCategoryMutation.isPending || updateCategoryMutation.isPending ? "Saving..." : editingCat ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Service Dialog */}
      <Dialog open={serviceDialogOpen} onOpenChange={() => { setServiceDialogOpen(false); resetServiceForm(); }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingService ? "Edit Service" : "Add Service"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input value={serviceForm.name} onChange={(e) => setServiceForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Name (Bengali) *</Label>
              <Input value={serviceForm.nameBn} onChange={(e) => setServiceForm((f) => ({ ...f, nameBn: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Category *</Label>
              <Select value={serviceForm.categoryId} onValueChange={(v) => setServiceForm((f) => ({ ...f, categoryId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {serviceCategories.filter((c) => c.active || c.id === editingService?.categoryId).map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Base Price *</Label>
              <Input type="number" value={serviceForm.basePrice} onChange={(e) => setServiceForm((f) => ({ ...f, basePrice: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Price Unit</Label>
              <Select value={serviceForm.priceUnit} onValueChange={(v) => setServiceForm((f) => ({ ...f, priceUnit: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixed</SelectItem>
                  <SelectItem value="per_sqft">Per Sqft</SelectItem>
                  <SelectItem value="per_point">Per Point</SelectItem>
                  <SelectItem value="per_watt">Per Watt</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Price Label</Label>
              <Input value={serviceForm.priceLabel} onChange={(e) => setServiceForm((f) => ({ ...f, priceLabel: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Duration</Label>
              <Input value={serviceForm.duration} onChange={(e) => setServiceForm((f) => ({ ...f, duration: e.target.value }))} />
            </div>
            <div className="space-y-1.5 flex items-center gap-3 pt-6">
              <Switch checked={serviceForm.popular} onCheckedChange={(v) => setServiceForm((f) => ({ ...f, popular: v }))} />
              <Label>Popular</Label>
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>Description *</Label>
              <Textarea value={serviceForm.description} onChange={(e) => setServiceForm((f) => ({ ...f, description: e.target.value }))} rows={2} />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>Description (Bengali)</Label>
              <Textarea value={serviceForm.descriptionBn} onChange={(e) => setServiceForm((f) => ({ ...f, descriptionBn: e.target.value }))} rows={2} />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>Image URL</Label>
              <Input value={serviceForm.image} onChange={(e) => setServiceForm((f) => ({ ...f, image: e.target.value }))} placeholder="https://..." />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>Features (JSON array)</Label>
              <Textarea value={serviceForm.features} onChange={(e) => setServiceForm((f) => ({ ...f, features: e.target.value }))} rows={3} className="font-mono text-xs" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setServiceDialogOpen(false); resetServiceForm(); }}>Cancel</Button>
            <Button
              className="bg-[#0EA5E9] hover:bg-[#0284C7] text-white"
              disabled={createServiceMutation.isPending || updateServiceMutation.isPending}
              onClick={() => {
                const data = { name: serviceForm.name, nameBn: serviceForm.nameBn, categoryId: serviceForm.categoryId, basePrice: Number(serviceForm.basePrice), priceUnit: serviceForm.priceUnit, priceLabel: serviceForm.priceLabel, duration: serviceForm.duration, description: serviceForm.description, descriptionBn: serviceForm.descriptionBn, popular: serviceForm.popular, features: serviceForm.features, image: serviceForm.image };
                if (editingService) {updateServiceMutation.mutate({ id: editingService.id, data });}
                else {createServiceMutation.mutate(data);}
              }}
            >
              {createServiceMutation.isPending || updateServiceMutation.isPending ? "Saving..." : editingService ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Brand Dialog */}
      <Dialog open={brandDialogOpen} onOpenChange={() => { setBrandDialogOpen(false); resetBrandForm(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingBrand ? "Edit Brand" : "Add Brand"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input value={brandForm.name} onChange={(e) => setBrandForm((f) => ({ ...f, name: e.target.value, slug: !editingBrand ? slugify(e.target.value) : f.slug }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Slug *</Label>
              <Input value={brandForm.slug} onChange={(e) => setBrandForm((f) => ({ ...f, slug: e.target.value }))} readOnly={!editingBrand} className={!editingBrand ? "bg-gray-50" : ""} />
            </div>
            <div className="space-y-1.5">
              <Label>Logo URL</Label>
              <Input value={brandForm.logo} onChange={(e) => setBrandForm((f) => ({ ...f, logo: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Country</Label>
              <Input value={brandForm.country} onChange={(e) => setBrandForm((f) => ({ ...f, country: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea value={brandForm.description} onChange={(e) => setBrandForm((f) => ({ ...f, description: e.target.value }))} rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label>Sort Order</Label>
              <Input type="number" value={brandForm.sortOrder} onChange={(e) => setBrandForm((f) => ({ ...f, sortOrder: e.target.value }))} />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={brandForm.active} onCheckedChange={(v) => setBrandForm((f) => ({ ...f, active: v }))} />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setBrandDialogOpen(false); resetBrandForm(); }}>Cancel</Button>
            <Button
              className="bg-[#0EA5E9] hover:bg-[#0284C7] text-white"
              disabled={createBrandMutation.isPending || updateBrandMutation.isPending}
              onClick={() => {
                const data = { name: brandForm.name, slug: brandForm.slug, logo: brandForm.logo, country: brandForm.country, description: brandForm.description, sortOrder: Number(brandForm.sortOrder), active: brandForm.active };
                if (editingBrand) {updateBrandMutation.mutate({ id: editingBrand.id, data });}
                else {createBrandMutation.mutate(data);}
              }}
            >
              {createBrandMutation.isPending || updateBrandMutation.isPending ? "Saving..." : editingBrand ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Coupon Dialog */}
      <Dialog open={couponDialogOpen} onOpenChange={() => { setCouponDialogOpen(false); resetCouponForm(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCoupon ? "Edit Coupon" : "Add Coupon"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Code *</Label>
              <Input value={couponForm.code} onChange={(e) => setCouponForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="SAVE10" />
            </div>
            <div className="space-y-1.5">
              <Label>Type *</Label>
              <Select value={couponForm.type} onValueChange={(v) => setCouponForm((f) => ({ ...f, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="fixed">Fixed Amount</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Value *</Label>
              <Input type="number" value={couponForm.value} onChange={(e) => setCouponForm((f) => ({ ...f, value: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Min Order</Label>
              <Input type="number" value={couponForm.minOrder} onChange={(e) => setCouponForm((f) => ({ ...f, minOrder: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Max Discount</Label>
              <Input type="number" value={couponForm.maxDiscount} onChange={(e) => setCouponForm((f) => ({ ...f, maxDiscount: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Usage Limit</Label>
              <Input type="number" value={couponForm.usageLimit} onChange={(e) => setCouponForm((f) => ({ ...f, usageLimit: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Start Date *</Label>
                <Input type="date" value={couponForm.startDate} onChange={(e) => setCouponForm((f) => ({ ...f, startDate: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>End Date *</Label>
                <Input type="date" value={couponForm.endDate} onChange={(e) => setCouponForm((f) => ({ ...f, endDate: e.target.value }))} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={couponForm.active} onCheckedChange={(v) => setCouponForm((f) => ({ ...f, active: v }))} />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCouponDialogOpen(false); resetCouponForm(); }}>Cancel</Button>
            <Button
              className="bg-[#0EA5E9] hover:bg-[#0284C7] text-white"
              disabled={createCouponMutation.isPending || updateCouponMutation.isPending}
              onClick={() => {
                const data = {
                  code: couponForm.code, type: couponForm.type, value: Number(couponForm.value),
                  minOrder: Number(couponForm.minOrder), maxDiscount: couponForm.maxDiscount ? Number(couponForm.maxDiscount) : null,
                  usageLimit: couponForm.usageLimit ? Number(couponForm.usageLimit) : null,
                  startDate: couponForm.startDate, endDate: couponForm.endDate, active: couponForm.active,
                };
                if (editingCoupon) {updateCouponMutation.mutate({ id: editingCoupon.id, data });}
                else {createCouponMutation.mutate(data);}
              }}
            >
              {createCouponMutation.isPending || updateCouponMutation.isPending ? "Saving..." : editingCoupon ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Blog Dialog */}
      <Dialog open={blogDialogOpen} onOpenChange={() => { setBlogDialogOpen(false); resetBlogForm(); }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingBlog ? "Edit Blog Post" : "Add Blog Post"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Title *</Label>
                <Input value={blogForm.title} onChange={(e) => setBlogForm((f) => ({ ...f, title: e.target.value, slug: !editingBlog ? slugify(e.target.value) : f.slug }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Title (Bengali)</Label>
                <Input value={blogForm.titleBn} onChange={(e) => setBlogForm((f) => ({ ...f, titleBn: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Slug *</Label>
              <Input value={blogForm.slug} onChange={(e) => setBlogForm((f) => ({ ...f, slug: e.target.value }))} readOnly={!editingBlog} className={!editingBlog ? "bg-gray-50" : ""} />
            </div>
            <div className="space-y-1.5">
              <Label>Excerpt</Label>
              <Textarea value={blogForm.excerpt} onChange={(e) => setBlogForm((f) => ({ ...f, excerpt: e.target.value }))} rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label>Content</Label>
              <Textarea value={blogForm.content} onChange={(e) => setBlogForm((f) => ({ ...f, content: e.target.value }))} rows={8} className="font-mono text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label>Cover Image URL</Label>
              <Input value={blogForm.coverImage} onChange={(e) => setBlogForm((f) => ({ ...f, coverImage: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Tags (JSON array)</Label>
              <Input value={blogForm.tags} onChange={(e) => setBlogForm((f) => ({ ...f, tags: e.target.value }))} className="font-mono text-xs" />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={blogForm.published} onCheckedChange={(v) => setBlogForm((f) => ({ ...f, published: v }))} />
              <Label>Published</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setBlogDialogOpen(false); resetBlogForm(); }}>Cancel</Button>
            <Button
              className="bg-[#0EA5E9] hover:bg-[#0284C7] text-white"
              disabled={createBlogMutation.isPending || updateBlogMutation.isPending}
              onClick={() => {
                const data = { title: blogForm.title, titleBn: blogForm.titleBn, slug: blogForm.slug, excerpt: blogForm.excerpt, content: blogForm.content, coverImage: blogForm.coverImage, tags: blogForm.tags, published: blogForm.published };
                if (editingBlog) {updateBlogMutation.mutate({ id: editingBlog.id, data });}
                else {createBlogMutation.mutate(data);}
              }}
            >
              {createBlogMutation.isPending || updateBlogMutation.isPending ? "Saving..." : editingBlog ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quote Reply Dialog */}
      <Dialog open={quoteReplyOpen} onOpenChange={() => { setQuoteReplyOpen(false); setEditingQuote(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reply to Quote Request</DialogTitle>
            <DialogDescription>{editingQuote?.subject}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p><strong>From:</strong> {editingQuote?.name} ({editingQuote?.email})</p>
              <p className="mt-1"><strong>Message:</strong> {editingQuote?.description}</p>
            </div>
            <div className="space-y-1.5">
              <Label>Reply</Label>
              <Textarea value={quoteReplyForm.reply} onChange={(e) => setQuoteReplyForm((f) => ({ ...f, reply: e.target.value }))} rows={4} />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={quoteReplyForm.status} onValueChange={(v) => setQuoteReplyForm((f) => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="replied">Replied</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuoteReplyOpen(false)}>Cancel</Button>
            <Button className="bg-[#0EA5E9] hover:bg-[#0284C7] text-white" disabled={replyQuoteMutation.isPending} onClick={() => { if (editingQuote) {replyQuoteMutation.mutate({ id: editingQuote.id, data: { reply: quoteReplyForm.reply, status: quoteReplyForm.status } });} }}>
              {replyQuoteMutation.isPending ? "Sending..." : "Send Reply"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
