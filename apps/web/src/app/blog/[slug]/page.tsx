"use client";

import { useMemo, useState } from "react";
import DOMPurify from "isomorphic-dompurify";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Calendar,
  ChevronRight,
  Copy,
  FolderOpen,
  Search,
  User,
} from "lucide-react";
import Header from "@/components/epf/Header";
import Footer from "@/components/epf/Footer";
import CartDrawer from "@/components/epf/CartDrawer";
import CheckoutDialog from "@/components/epf/CheckoutDialog";
import ChatWidget from "@/components/epf/ChatWidget";
import BackToTopButton from "@/components/epf/BackToTopButton";
import { apiFetch } from "@/lib/api";

interface BlogPost {
  id: string;
  title: string;
  titleBn?: string | null;
  slug: string;
  excerpt?: string | null;
  content?: string | null;
  coverImage?: string | null;
  author?: string | null;
  tags?: string[] | null;
  createdAt: string;
}

interface BlogDetailResponse {
  data: BlogPost;
}

interface BlogListResponse {
  data: {
    data: BlogPost[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  };
}

const fallbackCategories = ["Electrical Guides", "Product Advice", "Project Tips", "Industry Updates", "Safety & Maintenance", "News"];

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function excerptText(value: string) {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function safeArticleHtml(content: string) {
  const source = /<([a-z][\s\S]*?)>/i.test(content)
    ? content
    : content.split(/\r?\n\s*\r?\n/).filter(Boolean).map((paragraph) => `<p>${paragraph}</p>`).join("");
  return DOMPurify.sanitize(source, { USE_PROFILES: { html: true } });
}

function ShareRow({ title }: { title: string }) {
  const copyLink = async () => { await navigator.clipboard?.writeText(window.location.href); };
  return <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4 text-[11px] text-slate-500"><span className="mr-2 font-semibold text-slate-800">Social Share</span><button type="button" onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, "_blank", "noopener,noreferrer")} className="flex h-7 w-7 items-center justify-center border border-slate-200 text-[11px] font-bold hover:border-epf-500 hover:text-epf-600" aria-label={`Share ${title} on Facebook`}>f</button><button type="button" onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(title)}`, "_blank", "noopener,noreferrer")} className="flex h-7 w-7 items-center justify-center border border-slate-200 text-[11px] font-bold hover:border-epf-500 hover:text-epf-600" aria-label="Share on X">𝕏</button><button type="button" onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`, "_blank", "noopener,noreferrer")} className="flex h-7 w-7 items-center justify-center border border-slate-200 text-[11px] font-bold hover:border-epf-500 hover:text-epf-600" aria-label="Share on LinkedIn">in</button><button type="button" onClick={copyLink} className="flex h-7 w-7 items-center justify-center border border-slate-200 hover:border-epf-500 hover:text-epf-600" aria-label="Copy link"><Copy className="h-3 w-3" /></button></div>;
}

function RecentPost({ post }: { post: BlogPost }) {
  return <Link href={`/blog/${post.slug}`} className="group flex items-center gap-2.5 border-b border-slate-100 py-2.5 last:border-b-0"><div className="flex h-11 w-14 shrink-0 items-center justify-center overflow-hidden bg-slate-100">{post.coverImage ? <img src={post.coverImage} alt="" className="h-full w-full object-cover" loading="lazy" /> : <BookOpen className="h-5 w-5 text-slate-300" />}</div><div className="min-w-0"><p className="line-clamp-2 text-[11px] font-medium leading-4 text-slate-700 group-hover:text-epf-600">{post.titleBn || post.title}</p><p className="mt-1 text-[10px] text-slate-400">{formatDate(post.createdAt)}</p></div></Link>;
}

export default function BlogDetailPage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const [heroError, setHeroError] = useState(false);
  const detailQuery = useQuery<BlogDetailResponse>({ queryKey: ["blog-detail", slug], queryFn: () => apiFetch(`/api/blog/${slug}`), enabled: Boolean(slug), retry: false });
  const recentQuery = useQuery<BlogListResponse>({ queryKey: ["blog-recent"], queryFn: () => apiFetch("/api/blog?limit=5"), staleTime: 5 * 60 * 1000, retry: false });
  const post = detailQuery.data?.data;
  const recent = useMemo(() => (recentQuery.data?.data?.data ?? []).filter((item) => item.slug !== slug).slice(0, 5), [recentQuery.data, slug]);

  if (detailQuery.isLoading) return <LoadingPage />;
  if (!post) return <NotFoundPage onBack={() => router.push("/blog")} />;

  const title = post.titleBn || post.title;
  const tags = post.tags?.filter(Boolean) ?? [];
  const articleHtml = safeArticleHtml(post.content || post.excerpt || "");

  return <div className="min-h-screen bg-white text-slate-900"><Header /><main><div className="mx-auto max-w-[1400px] px-4 py-5 sm:px-12 sm:py-7"><nav className="mb-5 flex items-center gap-2 text-xs text-slate-400"><Link href="/" className="hover:text-epf-600">Home</Link><ChevronRight className="h-3 w-3" /><Link href="/blog" className="hover:text-epf-600">Blog</Link><ChevronRight className="h-3 w-3" /><span className="truncate text-slate-700">{post.title}</span></nav><button type="button" onClick={() => router.push("/blog")} className="mb-5 inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-epf-600"><ArrowLeft className="h-3.5 w-3.5" /> Back to Blog</button>

<div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_205px]"><article className="min-w-0"><div className="relative h-[250px] overflow-hidden bg-slate-100 sm:h-[390px]">{!heroError && post.coverImage ? <img src={post.coverImage} alt={post.title} className="h-full w-full object-cover" onError={() => setHeroError(true)} /> : <div className="flex h-full items-center justify-center"><BookOpen className="h-14 w-14 text-slate-300" /></div>}</div><div className="pt-5"><div className="mb-2 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-wide text-epf-600"><span>News &amp; Insights</span><span className="text-slate-300">•</span><span>Electrical Knowledge</span></div><h1 className="text-2xl font-semibold leading-tight text-slate-900 sm:text-[30px]">{title}</h1><div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-slate-200 pb-4 text-[11px] text-slate-400"><span className="inline-flex items-center gap-1"><User className="h-3.5 w-3.5" /> {post.author || "ePowerFix"}</span><span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {formatDate(post.createdAt)}</span></div>{post.excerpt && <p className="mt-5 border-l-2 border-epf-500 pl-3 text-[13px] font-medium leading-6 text-slate-600">{excerptText(post.excerpt)}</p>}<div className="prose prose-slate mt-5 max-w-none text-[13px] leading-7 prose-headings:font-semibold prose-headings:text-slate-900 prose-h2:mt-6 prose-h2:text-lg prose-h3:mt-5 prose-h3:text-base prose-p:my-3 prose-a:text-epf-600 prose-img:max-h-[420px] prose-img:w-full prose-img:object-cover" dangerouslySetInnerHTML={{ __html: articleHtml }} /><ShareRow title={title} /><div className="mt-4 flex flex-wrap items-center gap-2 text-[10px] text-slate-400"><span className="font-semibold text-slate-700">Tags</span>{(tags.length > 0 ? tags : ["Electrical", "Guides"]).map((tag) => <Link key={tag} href={`/blog?search=${encodeURIComponent(tag)}`} className="border border-slate-200 px-2 py-1 hover:border-epf-500 hover:text-epf-600">{tag}</Link>)}</div></div></article>

<aside className="h-fit lg:sticky lg:top-[92px]"><div className="border-b border-slate-200 pb-3"><h2 className="text-[16px] font-semibold text-slate-900">Search</h2><div className="mt-2 h-0.5 w-8 bg-epf-500" /></div><form className="mt-3 flex h-8" onSubmit={(event) => { event.preventDefault(); const value = new FormData(event.currentTarget).get("search")?.toString().trim(); if (value) router.push(`/blog?search=${encodeURIComponent(value)}`); }}><input name="search" placeholder="Search posts" aria-label="Search blog posts" className="min-w-0 flex-1 border border-slate-200 bg-slate-50 px-2.5 text-[11px] outline-none focus:border-epf-500" /><button type="submit" className="flex w-8 items-center justify-center bg-slate-900 text-white hover:bg-epf-500" aria-label="Search"><Search className="h-3.5 w-3.5" /></button></form><div className="mt-7 border-b border-slate-200 pb-3"><h2 className="text-[16px] font-semibold text-slate-900">Categories</h2><div className="mt-2 h-0.5 w-8 bg-epf-500" /></div><div className="py-2">{fallbackCategories.map((category) => <Link key={category} href={`/blog?search=${encodeURIComponent(category)}`} className="flex items-center justify-between border-b border-slate-100 py-2.5 text-[12px] text-slate-600 hover:text-epf-600"><span>{category}</span><span className="text-[10px] text-slate-400">›</span></Link>)}</div><div className="mt-7 border-b border-slate-200 pb-3"><h2 className="text-[16px] font-semibold text-slate-900">Recent Posts</h2><div className="mt-2 h-0.5 w-8 bg-epf-500" /></div><div>{recentQuery.isLoading ? Array.from({ length: 5 }).map((_, index) => <div key={index} className="my-3 h-12 animate-pulse bg-slate-100" />) : recent.length > 0 ? recent.map((item) => <RecentPost key={item.id} post={item} />) : <p className="py-4 text-xs text-slate-400">No recent posts.</p>}</div></aside></div></div></main><Footer /><CartDrawer /><CheckoutDialog /><ChatWidget /><BackToTopButton /></div>;
}

function LoadingPage() { return <div className="flex min-h-screen items-center justify-center bg-white"><BookOpen className="h-6 w-6 animate-pulse text-epf-500" /></div>; }
function NotFoundPage({ onBack }: { onBack: () => void }) { return <div className="flex min-h-screen flex-col bg-white"><Header /><div className="flex flex-1 items-center justify-center px-4 py-20 text-center"><div><FolderOpen className="mx-auto h-10 w-10 text-slate-300" /><h1 className="mt-3 text-xl font-semibold text-slate-900">Post not found</h1><p className="mt-1 text-sm text-slate-500">This article may have been removed.</p><button type="button" onClick={onBack} className="mt-5 bg-epf-500 px-4 py-2 text-sm font-semibold text-white">Back to Blog</button></div></div><Footer /></div>; }
