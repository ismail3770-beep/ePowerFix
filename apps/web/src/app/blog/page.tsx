"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { ArrowRight, BookOpen, ChevronLeft, ChevronRight, Mail, Search, User } from "lucide-react";
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

const pageSize = 8;
const fallbackCategories = ["Electrical Guides", "Product Advice", "Project Tips", "Industry Updates", "Safety & Maintenance", "News"];

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function excerpt(post: BlogPost) {
  return (post.excerpt || post.content || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 105);
}

function BlogCard({ post }: { post: BlogPost }) {
  return (
    <article className="group flex min-h-[318px] flex-col overflow-hidden rounded-md border border-slate-200 bg-white transition-shadow hover:border-slate-300 hover:shadow-lg">
      <Link href={`/blog/${post.slug}`} className="relative block h-[158px] shrink-0 overflow-hidden bg-slate-100">
        {post.coverImage ? <img src={post.coverImage} alt={post.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" /> : <div className="flex h-full items-center justify-center bg-epf-50"><BookOpen className="h-9 w-9 text-epf-300" /></div>}
      </Link>
      <div className="flex flex-1 flex-col p-3.5">
        <div className="flex items-center gap-2 text-[10px] text-slate-400"><span className="inline-flex items-center gap-1"><User className="h-3 w-3" />{post.author || "ePowerFix"}</span><span>•</span><span>{formatDate(post.createdAt)}</span></div>
        <Link href={`/blog/${post.slug}`}><h2 className="mt-2 line-clamp-2 text-[14px] font-semibold leading-5 text-slate-800 group-hover:text-epf-600">{post.titleBn || post.title}</h2></Link>
        <p className="mt-2 line-clamp-2 text-[12px] leading-5 text-slate-500">{excerpt(post)}</p>
        <Link href={`/blog/${post.slug}`} className="mt-auto inline-flex items-center gap-1 pt-3 text-[11px] font-semibold text-epf-600">Read Post <ArrowRight className="h-3 w-3" /></Link>
      </div>
    </article>
  );
}

function RecentPost({ post }: { post: BlogPost }) {
  return <Link href={`/blog/${post.slug}`} className="group flex items-center gap-2.5 border-b border-slate-100 py-2.5 last:border-b-0"><div className="h-11 w-14 shrink-0 overflow-hidden bg-slate-100">{post.coverImage ? <img src={post.coverImage} alt="" className="h-full w-full object-cover" loading="lazy" /> : <BookOpen className="m-3 h-5 w-5 text-slate-300" />}</div><div className="min-w-0"><p className="line-clamp-2 text-[11px] font-medium leading-4 text-slate-700 group-hover:text-epf-600">{post.titleBn || post.title}</p><p className="mt-1 text-[10px] text-slate-400">{formatDate(post.createdAt)}</p></div></Link>;
}

function BlogContent() {
  const params = useSearchParams();
  const initialSearch = params.get("search") || "";
  const initialPage = Number(params.get("page") || "1");
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [search, setSearch] = useState(initialSearch);
  const [page, setPage] = useState(Number.isFinite(initialPage) && initialPage > 0 ? initialPage : 1);

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
    queryFn: () => apiFetch<BlogResponse>("/api/blog?limit=5"),
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
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-12 sm:py-8">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4"><div><div className="mb-2 flex items-center gap-2 text-xs text-slate-400"><Link href="/" className="hover:text-epf-600">Home</Link><span>/</span><span className="text-slate-700">Blog</span></div><h1 className="text-xl font-semibold text-slate-900">Blog</h1></div><form onSubmit={(event) => { event.preventDefault(); setPage(1); setSearch(searchInput.trim()); }} className="flex h-9 w-full sm:w-[250px]"><input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search blog posts" aria-label="Search blog posts" className="min-w-0 flex-1 border border-slate-200 bg-slate-50 px-3 text-xs outline-none focus:border-epf-500" /><button type="submit" className="flex w-10 items-center justify-center bg-slate-900 text-white hover:bg-epf-500" aria-label="Search"><Search className="h-4 w-4" /></button></form></div>

          <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_205px]">
            <section>
              {postsQuery.isLoading ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 8 }).map((_, index) => <div key={index} className="h-[318px] animate-pulse rounded-md border border-slate-200 bg-slate-50" />)}</div> : postsQuery.isError ? <div className="border border-red-100 bg-slate-50 px-6 py-16 text-center"><p className="font-semibold text-slate-800">Blog posts could not be loaded.</p><button type="button" onClick={() => postsQuery.refetch()} className="mt-4 bg-epf-500 px-4 py-2 text-sm font-semibold text-white">Try again</button></div> : posts.length > 0 ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{posts.map((post) => <BlogCard key={post.id} post={post} />)}</div> : <div className="border border-slate-200 bg-slate-50 px-6 py-20 text-center"><BookOpen className="mx-auto h-9 w-9 text-slate-300" /><h2 className="mt-3 text-lg font-semibold text-slate-800">No posts found</h2><p className="mt-1 text-sm text-slate-500">Try another search term.</p></div>}

              {posts.length > 0 && <div className="mt-7 flex items-center justify-center gap-1 border-t border-slate-100 pt-5"><button type="button" disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className="flex h-8 w-8 items-center justify-center rounded border border-slate-200 text-slate-500 disabled:opacity-40" aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></button>{Array.from({ length: Math.min(totalPages, 5) }).map((_, index) => { const pageNumber = index + 1; return <button key={pageNumber} type="button" onClick={() => setPage(pageNumber)} className={`flex h-8 w-8 items-center justify-center rounded text-xs font-semibold ${page === pageNumber ? "bg-slate-900 text-white" : "border border-slate-200 text-slate-600"}`}>{pageNumber}</button>; })}<button type="button" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)} className="flex h-8 w-8 items-center justify-center rounded border border-slate-200 text-slate-500 disabled:opacity-40" aria-label="Next page"><ChevronRight className="h-4 w-4" /></button></div>}
            </section>

            <aside className="h-fit">
              <div className="border-b border-slate-200 pb-4"><h2 className="text-[16px] font-semibold text-slate-900">Categories</h2><div className="mt-2 h-0.5 w-8 bg-epf-500" /></div>
              <div className="py-2">{fallbackCategories.map((category) => <button key={category} type="button" onClick={() => { setPage(1); setSearch(category); setSearchInput(category); }} className="flex w-full items-center justify-between border-b border-slate-100 py-2.5 text-left text-[12px] text-slate-600 hover:text-epf-600"><span>{category}</span><span className="text-[10px] text-slate-400">›</span></button>)}</div>
              <div className="mt-7 border-b border-slate-200 pb-4"><h2 className="text-[16px] font-semibold text-slate-900">Recent Posts</h2><div className="mt-2 h-0.5 w-8 bg-epf-500" /></div>
              <div>{recentQuery.isLoading ? Array.from({ length: 5 }).map((_, index) => <div key={index} className="my-3 h-12 animate-pulse bg-slate-100" />) : recent.map((post) => <RecentPost key={post.id} post={post} />)}</div>
            </aside>
          </div>
        </div>
        <section className="bg-slate-900 py-7"><div className="mx-auto flex max-w-[1400px] flex-col items-start justify-between gap-4 px-4 sm:flex-row sm:items-center sm:px-12"><div><h2 className="text-lg font-semibold text-white">Subscribe to our newsletter</h2><p className="mt-1 text-xs text-white/60">Get useful electrical guides and product updates in your inbox.</p></div><form className="flex h-9 w-full max-w-[300px]" onSubmit={(event) => event.preventDefault()}><input type="email" placeholder="Email address" aria-label="Email address" className="min-w-0 flex-1 rounded-l-full px-4 text-xs outline-none" /><button type="submit" className="rounded-r-full bg-epf-500 px-4 text-xs font-semibold text-white hover:bg-epf-600"><Mail className="mr-1 inline h-3.5 w-3.5" />Subscribe</button></form></div></section>
      </main>
      <Footer />
      <CartDrawer />
      <CheckoutDialog />
      <ChatWidget />
      <BackToTopButton />
    </>
  );
}

function LoadingPage() { return <div className="flex min-h-screen items-center justify-center bg-white"><BookOpen className="h-6 w-6 animate-pulse text-epf-500" /></div>; }

export default function BlogPage() { return <Suspense fallback={<LoadingPage />}><BlogContent /></Suspense>; }
