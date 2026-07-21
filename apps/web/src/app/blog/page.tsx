"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { BookOpen, ChevronLeft, ChevronRight, Clock, Search, User } from "lucide-react";
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
  content?: string;
  coverImage?: string | null;
  author?: string | null;
  tags?: string[];
  createdAt: string;
}

interface BlogResponse {
  data: {
    data: BlogPost[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  };
}

const pageSize = 9;
const sidebarCategories = [
  { name: "Testimonials" },
  { name: "Trends" },
  { name: "Promotions" },
  { name: "Company Updates" },
  { name: "Guides & Tutorials" },
  { name: "Shopping Tips" },
  { name: "News" },
];

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function getExcerpt(post: BlogPost) {
  return (post.excerpt || post.content || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 100);
}

function BlogCard({ post }: { post: BlogPost }) {
  return (
    <article className="group bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer border border-gray-100">
      <Link href={`/blog/${post.slug}`} className="block aspect-[16/10] overflow-hidden bg-gray-100">
        {post.coverImage
          ? <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
          : <div className="flex h-full items-center justify-center bg-gray-50"><BookOpen className="h-8 w-8 text-gray-300" /></div>}
      </Link>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2.5 text-xs text-gray-400">
          <User className="h-3.5 w-3.5" />
          <span className="font-medium text-gray-600">{post.author || "ePowerFix"}</span>
          <span className="text-gray-200">|</span>
          <span>{formatDate(post.createdAt)}</span>
        </div>
        <Link href={`/blog/${post.slug}`}>
          <h3 className="font-semibold text-sm text-gray-800 line-clamp-2 mb-3 group-hover:text-[#0EA5E9] transition-colors leading-snug">
            {post.titleBn || post.title}
          </h3>
        </Link>
        <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-5">{getExcerpt(post)}</p>
        <Link href={`/blog/${post.slug}`} className="text-xs font-semibold text-gray-500 hover:text-[#0EA5E9] transition-colors flex items-center gap-0.5 group/btn">
          Read Post <ChevronRight className="h-3 w-3 group-hover/btn:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </article>
  );
}

function RecentPostItem({ post }: { post: BlogPost }) {
  return (
    <Link href={`/blog/${post.slug}`} className="flex gap-3 cursor-pointer group">
      <div className="w-14 h-14 rounded-md overflow-hidden shrink-0 bg-gray-100">
        {post.coverImage
          ? <img src={post.coverImage} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
          : <BookOpen className="m-4 h-5 w-5 text-gray-300" />}
      </div>
      <div className="min-w-0">
        <h4 className="text-xs font-medium text-gray-700 line-clamp-2 group-hover:text-[#0EA5E9] transition-colors leading-snug">{post.titleBn || post.title}</h4>
        <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1"><Clock className="h-2.5 w-2.5" /> {formatDate(post.createdAt)}</p>
      </div>
    </Link>
  );
}

function BlogContent() {
  const params = useSearchParams();
  const initialSearch = params.get("search") || "";
  const initialPage = Number(params.get("page") || "1");
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [search, setSearch] = useState(initialSearch);
  const [page, setPage] = useState(Number.isFinite(initialPage) && initialPage > 0 ? initialPage : 1);
  const [selectedCat, setSelectedCat] = useState("");

  const postsQuery = useQuery<BlogResponse>({
    queryKey: ["blog-list", { page, search }],
    queryFn: () => {
      const query = new URLSearchParams({ page: String(page), limit: String(pageSize) });
      if (search) query.set("search", search);
      return apiFetch<BlogResponse>(`/api/blog?${query.toString()}`);
    },
    retry: false,
  });
  const recentQuery = useQuery<BlogResponse>({
    queryKey: ["blog-recent"],
    queryFn: () => apiFetch<BlogResponse>("/api/blog?limit=4"),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const posts = postsQuery.data?.data?.data ?? [];
  const pagination = postsQuery.data?.data?.pagination;
  const recent = recentQuery.data?.data?.data ?? [];
  const totalPages = pagination?.totalPages ?? 1;

  return (
    <>
      <Header />
      <main className="bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Breadcrumb + title + search */}
          <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
                <Link href="/" className="hover:text-[#0EA5E9]">Home</Link>
                <ChevronRight className="h-3 w-3" />
                <span className="text-gray-700">Blog</span>
              </div>
              <h1 className="font-black text-3xl tracking-tight text-gray-900">Blog</h1>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); setPage(1); setSearch(searchInput.trim()); }} className="flex items-center border border-gray-300 rounded overflow-hidden bg-white shadow-sm">
              <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search blog posts..." aria-label="Search blog posts" className="px-3 py-2 text-sm outline-none text-gray-700 w-56 bg-white" />
              <button type="submit" className="bg-[#0EA5E9] px-3 py-2.5 text-white hover:bg-sky-600 transition-colors" aria-label="Search"><Search className="h-3.5 w-3.5" /></button>
            </form>
          </div>

          <div className="flex gap-8">
            {/* Main post grid */}
            <div className="flex-1 min-w-0">
              {postsQuery.isLoading
                ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">{Array.from({ length: 9 }).map((_, i) => <div key={i} className="h-72 animate-pulse bg-white border border-gray-100 rounded-lg" />)}</div>
                : postsQuery.isError
                  ? <div className="text-center py-16 bg-white border border-gray-100 rounded-lg"><p className="font-semibold text-gray-700">Blog posts could not be loaded.</p><button type="button" onClick={() => postsQuery.refetch()} className="mt-4 bg-[#0EA5E9] px-4 py-2 text-sm font-semibold text-white rounded">Try again</button></div>
                  : posts.length > 0
                    ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">{posts.map((post) => <BlogCard key={post.id} post={post} />)}</div>
                    : <div className="text-center py-20"><BookOpen className="mx-auto h-12 w-12 text-gray-300 mb-4" /><p className="text-gray-500 text-sm">No posts found. Try a different search or category.</p></div>}

              {/* Pagination */}
              {posts.length > 0 && totalPages > 1 && (
                <div className="flex items-center justify-center gap-1.5 mt-2">
                  <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="w-8 h-8 border border-gray-300 rounded flex items-center justify-center text-gray-400 hover:border-[#0EA5E9] hover:text-[#0EA5E9] disabled:opacity-30 transition-colors bg-white"><ChevronLeft className="h-3.5 w-3.5" /></button>
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((n) => (
                    <button key={n} type="button" onClick={() => setPage(n)} className={`w-8 h-8 border rounded text-sm font-medium transition-colors ${page === n ? "bg-[#0EA5E9] text-white border-[#0EA5E9]" : "border-gray-300 text-gray-600 hover:border-[#0EA5E9] hover:text-[#0EA5E9] bg-white"}`}>{n}</button>
                  ))}
                  <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="w-8 h-8 border border-gray-300 rounded flex items-center justify-center text-gray-400 hover:border-[#0EA5E9] hover:text-[#0EA5E9] disabled:opacity-30 transition-colors bg-white"><ChevronRight className="h-3.5 w-3.5" /></button>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <aside className="hidden lg:block w-60 shrink-0 space-y-5">
              <div className="bg-white border border-gray-100 rounded-lg p-5 shadow-sm">
                <h3 className="font-bold text-sm text-gray-800 mb-4 pb-2 border-b border-gray-100">Categories</h3>
                <div>
                  {sidebarCategories.map((cat) => (
                    <button key={cat.name} type="button" onClick={() => { setSelectedCat(selectedCat === cat.name ? "" : cat.name); setPage(1); setSearch(selectedCat === cat.name ? "" : cat.name); setSearchInput(selectedCat === cat.name ? "" : cat.name); }} className={`w-full flex items-center justify-between py-2.5 text-sm border-b border-gray-50 group transition-colors ${selectedCat === cat.name ? "text-[#0EA5E9]" : "text-gray-600 hover:text-[#0EA5E9]"}`}>
                      <span>{cat.name}</span>
                      <ChevronRight className={`h-3.5 w-3.5 shrink-0 transition-colors ${selectedCat === cat.name ? "text-[#0EA5E9]" : "text-gray-300 group-hover:text-[#0EA5E9]"}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="bg-white border border-gray-100 rounded-lg p-5 shadow-sm">
                <h3 className="font-bold text-sm text-gray-800 mb-4 pb-2 border-b border-gray-100">Recent Posts</h3>
                <div className="space-y-4">
                  {recentQuery.isLoading
                    ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-14 animate-pulse bg-gray-100 rounded" />)
                    : recent.map((post) => <RecentPostItem key={post.id} post={post} />)}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
      <CartDrawer />
      <CheckoutDialog />
      <ChatWidget />
      <BackToTopButton />
    </>
  );
}

function LoadingPage() {
  return <div className="flex min-h-screen items-center justify-center bg-gray-50"><BookOpen className="h-6 w-6 animate-pulse text-[#0EA5E9]" /></div>;
}

export default function BlogPage() {
  return <Suspense fallback={<LoadingPage />}><BlogContent /></Suspense>;
}
