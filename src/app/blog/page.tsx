"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  User,
  Calendar,
  ArrowRight,
  Search,
  Pen,
  ChevronLeft,
  ChevronRight,
  Loader2,
  FolderOpen,
} from "lucide-react";
import { EPFHome, EPFChevronRight } from "@/components/epf/icons/EPFIcons";
import { apiFetch } from "@/lib/api";
import Header from "@/components/epf/Header";
import Footer from "@/components/epf/Footer";
import CartDrawer from "@/components/epf/CartDrawer";
import CheckoutDialog from "@/components/epf/CheckoutDialog";
import ProductDetailDialog from "@/components/epf/ProductDetailDialog";
import ServiceBookingDialog from "@/components/epf/ServiceBookingDialog";
import ProjectDetailDialog from "@/components/epf/ProjectDetailDialog";
import ChatWidget from "@/components/epf/ChatWidget";
import BackToTopButton from "@/components/epf/BackToTopButton";
import Link from "next/link";

interface BlogPost {
  id: string;
  title: string;
  titleBn: string;
  slug: string;
  excerpt: string;
  coverImage: string;
  author: string;
  tags: string;
  views: number;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const PAGE_SIZE = 8;

function parseTags(raw: any): string[] {
  if (Array.isArray(raw)) return raw.filter(Boolean);
  if (typeof raw === "string") {
    try {
      const p = JSON.parse(raw);
      return Array.isArray(p) ? p.filter(Boolean) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-BD", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function firstTag(post: BlogPost): string | null {
  const tags = parseTags(post.tags);
  return tags[0] ?? null;
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [recentPosts, setRecentPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  /* ----- fetch main list ----- */
  const fetchPosts = useCallback(async (p: number, q: string, tag: string | null) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(PAGE_SIZE) });
      if (q) params.set("search", q);
      if (tag) params.set("tag", tag);
      const raw = await apiFetch<{
        success: boolean;
        data: { data: any[]; pagination: Pagination };
        message?: string;
      }>(`/api/blog?${params.toString()}`);
      const list = (raw?.data?.data ?? []) as BlogPost[];
      setPosts(list);
      setPagination(raw?.data?.pagination ?? null);
    } catch {
      setError("Failed to load blog posts. Please try again.");
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /* ----- fetch recent posts once for sidebar ----- */
  useEffect(() => {
    (async () => {
      try {
        const raw = await apiFetch<{
          success: boolean;
          data: { data: any[]; pagination: Pagination };
        }>(`/api/blog?limit=5`);
        setRecentPosts((raw?.data?.data ?? []) as BlogPost[]);
      } catch {
        /* silent — sidebar is non-critical */
      }
    })();
  }, []);

  /* ----- fetch main list on filter/page change ----- */
  useEffect(() => {
    fetchPosts(page, searchQuery, activeTag);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [page, searchQuery, activeTag, fetchPosts]);

  /* ----- search submit ----- */
  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearchQuery(searchInput.trim());
  };

  /* ----- categories (derived from recent posts to keep sidebar stable) ----- */
  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    recentPosts.forEach((p) => {
      parseTags(p.tags).forEach((t) => counts.set(t, (counts.get(t) ?? 0) + 1));
    });
    return Array.from(counts.entries()).slice(0, 8);
  }, [recentPosts]);

  const totalPages = pagination?.totalPages ?? 1;
  const currentPages = Array.from({ length: Math.max(1, totalPages) }, (_, i) => i + 1);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-slate-50">
        {/* Breadcrumb */}
        <div className="bg-white border-b border-slate-200">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-12">
            <nav className="flex items-center gap-1.5 h-[44px] text-[14px]">
              <a
                href="/"
                className="flex items-center gap-1 text-slate-500 hover:text-slate-900 transition-colors"
              >
                <EPFHome size={14} />
                <span>Home</span>
              </a>
              <EPFChevronRight size={12} className="text-slate-400" />
              <span className="text-slate-900 font-medium">Blog</span>
            </nav>
          </div>
        </div>

        {/* Page Header (title + search) */}
        <div className="bg-white border-b border-slate-200">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-12 py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-[24px] font-bold text-slate-900 leading-tight">
                  Blog
                </h1>
                <p className="text-slate-500 mt-1 text-[14px]">
                  Electrical guides, tutorials, and industry insights from the ePowerFix team.
                </p>
              </div>
              <form onSubmit={onSearchSubmit} className="relative w-full sm:w-[320px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search articles..."
                  className="w-full h-10 pl-10 pr-4 rounded-lg border border-slate-200 bg-slate-50 text-[14px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-epf-500/20 focus:border-epf-500 transition-colors"
                />
              </form>
            </div>
          </div>
        </div>

        {/* Content: 2-column */}
        <div className="mx-auto max-w-[1400px] px-4 sm:px-12 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
            {/* MAIN GRID */}
            <div>
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 text-epf-500 animate-spin" />
                </div>
              ) : error ? (
                <div className="text-center py-16">
                  <p className="text-red-500 text-[15px] mb-4">{error}</p>
                  <button
                    onClick={() => fetchPosts(page, searchQuery, activeTag)}
                    className="text-[14px] font-medium text-epf-500 hover:text-epf-600"
                  >
                    Try Again
                  </button>
                </div>
              ) : posts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-xl border border-slate-200">
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                    <Pen className="h-8 w-8 text-slate-400" />
                  </div>
                  <h2 className="text-[18px] font-semibold text-slate-900 mb-2">
                    No blog posts found
                  </h2>
                  <p className="text-slate-500 text-[14px] max-w-sm">
                    {searchQuery || activeTag
                      ? "Try adjusting your search or filters to find what you're looking for."
                      : "Check back soon for electrical guides and tutorials."}
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {posts.map((post) => {
                      const tag = firstTag(post);
                      return (
                        <article
                          key={post.slug}
                          className="group bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-lg hover:-translate-y-0.5 hover:border-slate-300 transition-all duration-200 flex flex-col"
                        >
                          {/* Cover Image */}
                          <Link href={`/blog/${post.slug}`} className="block relative h-48 bg-slate-100 overflow-hidden">
                            {post.coverImage ? (
                              <img
                                src={post.coverImage}
                                alt={post.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-epf-50 to-slate-100">
                                <Pen className="h-10 w-10 text-epf-300" />
                              </div>
                            )}
                          </Link>

                          {/* Content */}
                          <div className="p-4 flex flex-col flex-1">
                            {/* Metadata row */}
                            <div className="flex items-center gap-4 text-[12px] text-slate-400 mb-2.5">
                              <span className="flex items-center gap-1">
                                <User className="h-3.5 w-3.5" />
                                <span className="truncate max-w-[120px]">
                                  {post.author || "ePowerFix"}
                                </span>
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                {formatDate(post.createdAt)}
                              </span>
                            </div>

                            {/* Category badge */}
                            {tag && (
                              <span className="inline-flex self-start rounded-full px-2 py-0.5 text-[11px] font-medium bg-epf-50 text-epf-600 mb-2">
                                {tag}
                              </span>
                            )}

                            {/* Title */}
                            <Link href={`/blog/${post.slug}`}>
                              <h2 className="text-[16px] font-semibold text-slate-900 leading-snug line-clamp-2 group-hover:text-epf-600 transition-colors mb-2">
                                {post.title}
                              </h2>
                            </Link>

                            {/* Excerpt */}
                            {post.excerpt && (
                              <p className="text-[13px] text-slate-500 leading-relaxed line-clamp-2 mb-4">
                                {post.excerpt}
                              </p>
                            )}

                            {/* Read more */}
                            <Link
                              href={`/blog/${post.slug}`}
                              className="mt-auto inline-flex items-center gap-1 text-[13px] font-medium text-epf-500 hover:text-epf-600 transition-colors"
                            >
                              Read Post
                              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                            </Link>
                          </div>
                        </article>
                      );
                    })}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <nav
                      className="flex items-center justify-center gap-1.5 mt-8"
                      aria-label="Blog pagination"
                    >
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page <= 1}
                        className="flex items-center justify-center h-9 w-9 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        aria-label="Previous page"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      {currentPages.slice(0, 7).map((p) => (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={`flex items-center justify-center h-9 w-9 rounded-lg text-[14px] font-medium border transition-colors ${
                            p === page
                              ? "bg-epf-500 border-epf-500 text-white"
                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                      <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages}
                        className="flex items-center justify-center h-9 w-9 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        aria-label="Next page"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </nav>
                  )}
                </>
              )}
            </div>

            {/* SIDEBAR */}
            <aside className="lg:sticky lg:top-6 lg:self-start space-y-6">
              {/* Categories */}
              <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                <h3 className="text-[16px] font-semibold text-slate-900 border-b border-slate-200 pb-2 mb-3 flex items-center gap-2">
                  <FolderOpen className="h-4 w-4 text-epf-500" />
                  Categories
                </h3>
                {categories.length === 0 ? (
                  <p className="text-[13px] text-slate-400 py-2">No categories yet.</p>
                ) : (
                  <ul className="space-y-1">
                    <li>
                      <button
                        onClick={() => {
                          setActiveTag(null);
                          setPage(1);
                        }}
                        className={`w-full flex items-center justify-between text-[14px] py-1.5 px-2 rounded-md transition-colors ${
                          activeTag === null
                            ? "bg-epf-50 text-epf-600 font-medium"
                            : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <span>All Posts</span>
                        <span className="text-[11px] rounded-full px-2 py-0.5 bg-epf-50 text-epf-600">
                          {pagination?.total ?? posts.length}
                        </span>
                      </button>
                    </li>
                    {categories.map(([name, count]) => (
                      <li key={name}>
                        <button
                          onClick={() => {
                            setActiveTag(activeTag === name ? null : name);
                            setPage(1);
                          }}
                          className={`w-full flex items-center justify-between text-[14px] py-1.5 px-2 rounded-md transition-colors ${
                            activeTag === name
                              ? "bg-epf-50 text-epf-600 font-medium"
                              : "text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          <span className="truncate">{name}</span>
                          <span className="text-[11px] rounded-full px-2 py-0.5 bg-epf-50 text-epf-600">
                            {count}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* Recent Posts */}
              <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                <h3 className="text-[16px] font-semibold text-slate-900 border-b border-slate-200 pb-2 mb-3">
                  Recent Posts
                </h3>
                {recentPosts.length === 0 ? (
                  <p className="text-[13px] text-slate-400 py-2">No recent posts.</p>
                ) : (
                  <ul className="space-y-3">
                    {recentPosts.map((post) => (
                      <li key={post.id}>
                        <Link
                          href={`/blog/${post.slug}`}
                          className="flex items-start gap-3 group"
                        >
                          <div className="shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-slate-100">
                            {post.coverImage ? (
                              <img
                                src={post.coverImage}
                                alt={post.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-epf-50 to-slate-100">
                                <Pen className="h-4 w-4 text-epf-300" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-[13px] font-medium text-slate-700 leading-snug line-clamp-1 group-hover:text-epf-600 transition-colors">
                              {post.title}
                            </h4>
                            <span className="flex items-center gap-1 text-[11px] text-slate-400 mt-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(post.createdAt)}
                            </span>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* Search */}
              <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                <h3 className="text-[16px] font-semibold text-slate-900 border-b border-slate-200 pb-2 mb-3">
                  Search
                </h3>
                <form onSubmit={onSearchSubmit} className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Search articles..."
                    className="w-full h-10 pl-10 pr-4 rounded-lg border border-slate-200 bg-slate-50 text-[14px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-epf-500/20 focus:border-epf-500 transition-colors"
                  />
                </form>
              </section>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
      <CartDrawer />
      <CheckoutDialog />
      <ProductDetailDialog />
      <ServiceBookingDialog />
      <ProjectDetailDialog />
      <ChatWidget />
      <BackToTopButton />
    </>
  );
}
