"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronRight as CrumbArrow,
  Copy,
  Headphones,
  Heart,
  Home,
  Minus,
  Package,
  Plus,
  Share2,
  ShieldCheck,
  ShoppingCart,
  Tag,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/epf/Header";
import Footer from "@/components/epf/Footer";
import CartDrawer from "@/components/epf/CartDrawer";
import CheckoutDialog from "@/components/epf/CheckoutDialog";
import ChatWidget from "@/components/epf/ChatWidget";
import BackToTopButton from "@/components/epf/BackToTopButton";
import { apiFetch } from "@/lib/api";
import { useCartStore, useUIStore } from "@/store";
import { cn } from "@/lib/utils";

interface KitItem {
  id: string;
  quantity: number;
  isRequired: boolean;
  notes?: string | null;
  product: { id: string; name: string; price: number; salePrice?: number | null; stock?: number; images?: string[] };
}

interface ProjectKit {
  id: string;
  title: string;
  titleBn?: string | null;
  slug: string;
  description: string;
  price: number;
  salePrice: number | null;
  coverImage: string | null;
  images: string[];
  category: string | null;
  difficulty: string | null;
  stock: number;
  itemCount?: number;
  items?: KitItem[];
  createdAt?: string;
}

const benefitItems = [
  { icon: Headphones, title: "24/7 SUPPORT", sub: "Support every time" },
  { icon: ShieldCheck, title: "SECURE PAYMENT", sub: "100% secured" },
  { icon: Truck, title: "FREE SHIPPING", sub: "Order over ৳2,000" },
  { icon: CalendarDays, title: "30 DAYS RETURN", sub: "30 days guarantee" },
];

function collectImages(kit: ProjectKit) {
  return [kit.coverImage, ...(kit.images || [])].filter((image, index, all): image is string => Boolean(image) && all.indexOf(image) === index);
}

function displayPrice(kit: ProjectKit) { return kit.salePrice != null && kit.salePrice < kit.price ? kit.salePrice : kit.price; }
function formatDate(value?: string) { return value ? new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"; }

function BenefitsRail() {
  return <aside className="space-y-4 pt-1">{benefitItems.map(({ icon: Icon, title, sub }) => <div key={title} className="flex items-start gap-2"><Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-800" /><div><p className="text-[10px] font-semibold text-slate-800">{title}</p><p className="mt-0.5 text-[9px] text-slate-400">{sub}</p></div></div>)}</aside>;
}

function KitGallery({ images, title, activeImage, setActiveImage, onShare }: { images: string[]; title: string; activeImage: number; setActiveImage: (index: number) => void; onShare: () => void }) {
  const safeActive = images.length ? Math.min(activeImage, images.length - 1) : 0;
  return <div><div className="group relative aspect-square overflow-hidden border border-slate-200 bg-white"><button type="button" onClick={onShare} className="absolute left-2 top-2 z-10 flex h-7 w-7 items-center justify-center border border-slate-200 bg-white text-slate-500 hover:text-epf-600" aria-label="Share project kit"><Share2 className="h-3.5 w-3.5" /></button>{images.length ? <img src={images[safeActive]} alt={title} className="h-full w-full object-contain p-3" /> : <div className="flex h-full items-center justify-center"><Package className="h-16 w-16 text-slate-200" /></div>}{images.length > 1 && <><button type="button" onClick={() => setActiveImage(safeActive ? safeActive - 1 : images.length - 1)} className="absolute left-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-slate-800/70 text-white" aria-label="Previous image"><ChevronLeft className="h-3.5 w-3.5" /></button><button type="button" onClick={() => setActiveImage(safeActive < images.length - 1 ? safeActive + 1 : 0)} className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-slate-800/70 text-white" aria-label="Next image"><ChevronRight className="h-3.5 w-3.5" /></button></>}</div><div className="mt-2 flex gap-1.5 overflow-x-auto">{images.length ? images.map((image, index) => <button type="button" key={`${image}-${index}`} onClick={() => setActiveImage(index)} className={cn("h-11 w-11 shrink-0 overflow-hidden border bg-white p-0.5", index === safeActive ? "border-epf-500" : "border-slate-200")}><img src={image} alt="" className="h-full w-full object-contain" /></button>) : Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-11 w-11 shrink-0 border border-slate-200 bg-slate-50" />)}</div></div>;
}

function KitTabs({ kit, activeTab, setActiveTab }: { kit: ProjectKit; activeTab: string; setActiveTab: (value: string) => void }) {
  const tabs = [{ id: "description", label: "Description" }, { id: "contents", label: "What's Included" }, { id: "reviews", label: "Reviews (0)" }];
  return <section className="mt-8 border-t border-slate-200"><div className="flex items-center justify-center gap-7 border-b border-slate-200">{tabs.map((tab) => <button type="button" key={tab.id} onClick={() => setActiveTab(tab.id)} className={cn("relative py-3 text-[12px] font-medium text-slate-500 hover:text-slate-900", activeTab === tab.id && "text-slate-900 after:absolute after:bottom-[-1px] after:left-0 after:right-0 after:h-px after:bg-slate-800")}>{tab.label}</button>)}</div><div className="py-6 text-[12px] leading-6 text-slate-600">{activeTab === "description" && <div><h2 className="mb-3 text-[16px] font-semibold text-slate-900">About this project kit</h2><p className="whitespace-pre-line">{kit.description || "A complete project kit with the components and guidance you need to get started."}</p></div>}{activeTab === "contents" && <div><h2 className="mb-3 text-[16px] font-semibold text-slate-900">Kit contents</h2>{kit.items?.length ? <div className="overflow-hidden border border-slate-200"><table className="w-full text-left text-[11px]"><thead className="bg-slate-50 text-slate-500"><tr><th className="px-3 py-2">Component</th><th className="px-3 py-2">Qty</th><th className="px-3 py-2">Type</th></tr></thead><tbody>{kit.items.map((item) => <tr key={item.id} className="border-t border-slate-100"><td className="px-3 py-2 text-slate-800">{item.product.name}</td><td className="px-3 py-2">{item.quantity}</td><td className="px-3 py-2">{item.isRequired ? "Required" : "Optional"}</td></tr>)}</tbody></table></div> : <p>Component details will be available soon.</p>}</div>}{activeTab === "reviews" && <div className="py-8 text-center"><Package className="mx-auto h-8 w-8 text-slate-200" /><p className="mt-2 text-xs text-slate-500">No reviews yet</p></div>}</div></section>;
}

function RelatedKits({ kits }: { kits: ProjectKit[] }) {
  if (!kits.length) return null;
  return <section className="mt-7 border-t border-slate-200 pt-6"><div className="mb-3 flex items-center justify-between"><h2 className="text-[16px] font-semibold text-slate-900">Related Project Kits</h2><Link href="/project-kits" className="inline-flex items-center gap-1 text-[10px] font-semibold text-epf-600">View All <ArrowRight className="h-3 w-3" /></Link></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{kits.map((kit) => <Link key={kit.id} href={`/project-kits/${kit.slug}`} className="group border border-slate-200 bg-white p-2"><div className="aspect-square bg-slate-50">{collectImages(kit)[0] ? <img src={collectImages(kit)[0]} alt={kit.title} className="h-full w-full object-contain transition-transform group-hover:scale-105" loading="lazy" /> : <div className="flex h-full items-center justify-center"><Package className="h-7 w-7 text-slate-300" /></div>}</div><p className="mt-2 line-clamp-2 text-[11px] leading-4 text-slate-700 group-hover:text-epf-600">{kit.titleBn || kit.title}</p><p className="mt-1 text-[12px] font-semibold text-slate-900">{displayPrice(kit) > 0 ? `৳${Number(displayPrice(kit)).toLocaleString()}` : "Free"}</p></Link>)}</div></section>;
}

export default function ProjectKitDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const addItem = useCartStore((state) => state.addItem);
  const { setChatOpen, setCartOpen } = useUIStore();
  const [kit, setKit] = useState<ProjectKit | null>(null);
  const [related, setRelated] = useState<ProjectKit[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");
  const [wishlisted, setWishlisted] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    apiFetch<{ data: ProjectKit }>(`/api/project-kits/${slug}`).then((response) => setKit(response.data || null)).catch(() => setKit(null)).finally(() => setLoading(false));
    apiFetch<{ data: ProjectKit[] }>("/api/project-kits").then((response) => setRelated((response.data || []).filter((item) => item.slug !== slug).slice(0, 4))).catch(() => setRelated([]));
  }, [slug]);

  const images = useMemo(() => kit ? collectImages(kit) : [], [kit]);
  const price = kit ? displayPrice(kit) : 0;
  const discount = kit && kit.price > price ? Math.round(((kit.price - price) / kit.price) * 100) : 0;
  const title = kit?.titleBn || kit?.title || "";
  const addToCart = () => { if (!kit || kit.stock <= 0) return; addItem({ itemType: "PROJECT_KIT", projectKitId: kit.id, productName: kit.title, productImage: images[0] || "", price: Number(price), quantity }); toast.success("Kit added to cart", { description: `${quantity} × ${kit.title}` }); setCartOpen(true); };
  const handleShare = async () => { await navigator.clipboard?.writeText(window.location.href); toast.success("Link copied"); };

  if (loading) return <KitState loading />;
  if (!kit) return <KitState />;

  return <div className="min-h-screen bg-white text-slate-900"><Header /><main><div className="mx-auto max-w-[1400px] px-4 py-4 sm:px-10 sm:py-5"><nav className="mb-5 flex items-center gap-1.5 text-[10px] text-slate-400"><Link href="/" className="inline-flex items-center gap-1 hover:text-epf-600"><Home className="h-3 w-3" /> Home</Link><CrumbArrow className="h-3 w-3" /><Link href="/project-kits" className="hover:text-epf-600">Project Kits</Link>{kit.category && <><CrumbArrow className="h-3 w-3" /><span className="text-epf-600">{kit.category}</span></>}<CrumbArrow className="h-3 w-3" /><span className="truncate text-slate-700">{kit.title}</span></nav><div className="grid gap-5 lg:grid-cols-[285px_minmax(0,1fr)_165px]"><KitGallery images={images} title={title} activeImage={activeImage} setActiveImage={setActiveImage} onShare={handleShare} /><section className="min-w-0"><div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-400"><span className="text-epf-600">{kit.category || "Project Kit"}</span><span className="text-slate-300">|</span><span className={kit.stock > 0 ? "text-emerald-600" : "text-red-500"}>{kit.stock > 0 ? "In stock" : "Out of stock"}</span>{kit.difficulty && <><span className="text-slate-300">|</span><span>{kit.difficulty}</span></>}</div><h1 className="mt-2 text-[21px] font-semibold leading-7 text-slate-900">{title}</h1><div className="mt-3 flex flex-wrap gap-4 text-[10px] text-slate-400"><button type="button" onClick={() => setWishlisted((value) => !value)} className="inline-flex items-center gap-1 hover:text-epf-600"><Heart className={cn("h-3 w-3", wishlisted && "fill-epf-500 text-epf-500")} /> Wishlist</button><button type="button" onClick={handleShare} className="inline-flex items-center gap-1 hover:text-epf-600"><Share2 className="h-3 w-3" /> Share</button></div><div className="my-4 border-t border-slate-200" /><div className="flex items-baseline gap-3"><span className="text-[20px] font-semibold text-slate-900">{price > 0 ? `৳${Number(price).toLocaleString()}` : "Free"}</span>{discount > 0 && <><del className="text-[13px] text-slate-400">৳{Number(kit.price).toLocaleString()}</del><span className="bg-epf-500 px-1.5 py-0.5 text-[9px] font-bold text-white">-{discount}%</span></>}</div><p className="mt-1 text-[10px] text-slate-400">Complete kit with project components</p><div className="mt-4 flex flex-wrap gap-1.5">{kit.difficulty && <span className="border border-slate-200 px-2 py-1 text-[10px] text-slate-600">Difficulty: {kit.difficulty}</span>}{kit.itemCount != null && <span className="border border-slate-200 px-2 py-1 text-[10px] text-slate-600">{kit.itemCount} items</span>}</div><div className="mt-5 flex flex-wrap items-center gap-3"><span className="text-[11px] font-medium text-slate-800">Quantity</span><div className="flex h-7 items-center border border-slate-200"><button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1} className="flex h-full w-7 items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40" aria-label="Decrease quantity"><Minus className="h-3 w-3" /></button><span className="flex h-full w-8 items-center justify-center border-x border-slate-200 text-[11px]">{quantity}</span><button type="button" onClick={() => setQuantity(Math.min(kit.stock || 1, quantity + 1))} disabled={quantity >= kit.stock} className="flex h-full w-7 items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40" aria-label="Increase quantity"><Plus className="h-3 w-3" /></button></div><button type="button" onClick={addToCart} disabled={!kit.stock} className="inline-flex h-8 items-center gap-1.5 bg-slate-800 px-4 text-[11px] font-semibold text-white hover:bg-epf-500 disabled:cursor-not-allowed disabled:bg-slate-300"><ShoppingCart className="h-3.5 w-3.5" /> Add to Cart</button></div><div className="mt-4 border-t border-slate-200 pt-3 text-[10px] text-slate-500"><p><span className="font-medium text-slate-800">Kit type:</span> {kit.category || "Project solution"}</p><p className="mt-1"><span className="font-medium text-slate-800">Added:</span> {formatDate(kit.createdAt)}</p><div className="mt-2 flex items-center gap-2"><span className="font-medium text-slate-800">Share:</span><button type="button" onClick={handleShare} aria-label="Copy kit link"><Copy className="h-3 w-3" /></button><button type="button" onClick={() => setChatOpen(true)} className="text-epf-600 hover:text-epf-700">Ask about this kit</button></div></div></section><BenefitsRail /></div><KitTabs kit={kit} activeTab={activeTab} setActiveTab={setActiveTab} /><RelatedKits kits={related} /></div></main><Footer /><CartDrawer /><CheckoutDialog /><ChatWidget /><BackToTopButton /></div>;
}

function KitState({ loading = false }: { loading?: boolean }) { return <div className="flex min-h-screen flex-col bg-white"><Header /><main className="flex flex-1 items-center justify-center px-4 py-20 text-center">{loading ? <Package className="h-7 w-7 animate-pulse text-epf-500" /> : <div><Package className="mx-auto h-12 w-12 text-slate-300" /><h1 className="mt-3 text-xl font-semibold text-slate-900">Project Kit Not Found</h1><Link href="/project-kits" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-epf-600"><ArrowLeft className="h-3.5 w-3.5" /> Back to Project Kits</Link></div>}</main><Footer /></div>; }
