"use client";

import { useEffect, useState } from "react";
import {
  Clock,
  Eye,
  User,
  BookOpen,
  Loader2,
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

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const blogRaw = await apiFetch<{ success: boolean; data: { data: any[]; pagination: any }; message?: string }>("/api/blog?limit=12");
        setPosts(blogRaw?.data?.data ?? []);
      } catch {
        setError("Failed to load blog posts. Please try again.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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

        {/* Page Header */}
        <div className="bg-white border-b border-slate-200">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-12 py-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Blog & Articles
            </h1>
            <p className="text-slate-500 mt-1.5 text-[15px]">
              Electrical guides, tutorials, and industry insights from the ePowerFix team.
            </p>
          </div>
        </div>

        {/* Blog Grid */}
        <div className="mx-auto max-w-[1400px] px-4 sm:px-12 py-8">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 text-epf-500 animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <p className="text-red-500 text-lg mb-4">{error}</p>
              <button onClick={() => window.location.reload()} className="text-blue-500 hover:underline">Try Again</button>
            </div>
          ) : (
            <>
              {posts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <BookOpen className="h-12 w-12 text-slate-300 mb-4" />
                  <h2 className="text-xl font-semibold text-slate-900 mb-2">
                    No articles yet
                  </h2>
                  <p className="text-slate-500 text-[15px]">
                    Check back soon for electrical guides and tutorials.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {posts.map((post) => {
                    const tags: string[] = Array.isArray(post.tags) ? post.tags : (typeof post.tags === 'string' ? (() => { try { const p = JSON.parse(post.tags); return Array.isArray(p) ? p : []; } catch { return []; } })() : []);

                    return (
                      <Link
                        key={post.slug}
                        href={`/blog/${post.slug}`}
                        className="group bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-lg hover:border-slate-300 transition-all"
                      >
                        {/* Cover Image */}
                        <div className="relative h-48 bg-slate-100 overflow-hidden">
                          {post.coverImage ? (
                            <img
                              src={post.coverImage}
                              alt={post.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <BookOpen className="h-12 w-12 text-slate-300" />
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="p-5">
                          {/* Tags */}
                          {tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-3">
                              {tags.slice(0, 3).map((tag) => (
                                <span
                                  key={tag}
                                  className="text-[12px] font-medium text-epf-500 bg-epf-50 px-2 py-0.5 rounded"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Title */}
                          <h2 className="text-[17px] font-semibold text-slate-900 leading-snug line-clamp-2 group-hover:text-epf-500 transition-colors mb-2">
                            {post.title}
                          </h2>

                          {/* Excerpt */}
                          {post.excerpt && (
                            <p className="text-[14px] text-slate-500 leading-relaxed line-clamp-2 mb-4">
                              {post.excerpt}
                            </p>
                          )}

                          {/* Meta */}
                          <div className="flex items-center justify-between text-[13px] text-slate-400">
                            <div className="flex items-center gap-3">
                              <span className="flex items-center gap-1">
                                <User className="h-3.5 w-3.5" />
                                {post.author}
                              </span>
                              <span className="flex items-center gap-1">
                                <Eye className="h-3.5 w-3.5" />
                                {post.views}
                              </span>
                            </div>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {new Date(post.createdAt).toLocaleDateString("en-BD", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
      <CartDrawer />
      <CheckoutDialog />
      <ProductDetailDialog />
      <ServiceBookingDialog />
      <ProjectDetailDialog />
      <ChatWidget />
    </>
  );
}
