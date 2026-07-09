"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { useParams } from "next/navigation";
import DOMPurify from "isomorphic-dompurify";
import {
  ChevronRight,
  Home,
  Clock,
  Eye,
  User,
  BookOpen,
  ArrowLeft,
  Loader2,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import Header from "@/components/epf/Header";
import Footer from "@/components/epf/Footer";
import CartDrawer from "@/components/epf/CartDrawer";
import CheckoutDialog from "@/components/epf/CheckoutDialog";
import ProductDetailDialog from "@/components/epf/ProductDetailDialog";
import ServiceBookingDialog from "@/components/epf/ServiceBookingDialog";
import ProjectDetailDialog from "@/components/epf/ProjectDetailDialog";
import ChatWidget from "@/components/epf/ChatWidget";

interface BlogPost {
  id: string;
  title: string;
  titleBn: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  author: string;
  tags: string;
  published: boolean;
  views: number;
  createdAt: string;
  updatedAt: string;
}

function estimateReadTime(content: string): string {
  const words = content.split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}

export default function BlogDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    apiFetch<{ data: any }>(`/api/blog/${slug}`)
      .then((r) => {
        if (cancelled) return;
        setPost(r.data);
        setNotFound(false);
      })
      .catch(() => {
        if (cancelled) return;
        setPost(null);
        setNotFound(true);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [slug]);

  const tags: string[] = post
    ? (Array.isArray(post.tags) ? post.tags : (typeof post.tags === 'string' ? (() => { try { const p = JSON.parse(post.tags); return Array.isArray(p) ? p : []; } catch { return []; } })() : []))
    : [];

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
                <Home className="h-3.5 w-3.5" />
                <span>Home</span>
              </a>
              <ChevronRight className="h-3 w-3 text-slate-400" />
              <a
                href="/blog"
                className="text-slate-500 hover:text-slate-900 transition-colors"
              >
                Blog
              </a>
              <ChevronRight className="h-3 w-3 text-slate-400" />
              <span className="text-slate-900 font-medium truncate max-w-[200px] sm:max-w-[400px]">
                {post?.title || "Loading..."}
              </span>
            </nav>
          </div>
        </div>

        <div className="mx-auto max-w-[1400px] px-4 sm:px-12 py-8">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 text-epf-500 animate-spin" />
            </div>
          ) : notFound || !post ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <BookOpen className="h-12 w-12 text-slate-300 mb-4" />
              <h2 className="text-xl font-semibold text-slate-900 mb-2">
                Article not found
              </h2>
              <p className="text-slate-500 text-[15px] mb-4">
                The article you are looking for does not exist or has been removed.
              </p>
              <Link
                href="/blog"
                className="flex items-center gap-1.5 text-[14px] font-medium text-epf-500 hover:text-epf-600 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Blog
              </Link>
            </div>
          ) : (
            <article className="max-w-3xl mx-auto">
              {/* Back Link */}
              <Link
                href="/blog"
                className="inline-flex items-center gap-1.5 text-[14px] font-medium text-slate-500 hover:text-epf-500 transition-colors mb-6"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Blog
              </Link>

              {/* Cover Image */}
              {post.coverImage && (
                <div className="rounded-lg overflow-hidden mb-6 border border-slate-200">
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    className="w-full h-auto max-h-[400px] object-cover"
                  />
                </div>
              )}

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight mb-4">
                {post.title}
              </h1>

              {/* Meta bar */}
              <div className="flex flex-wrap items-center gap-4 text-[14px] text-slate-500 mb-6 pb-6 border-b border-slate-200">
                <span className="flex items-center gap-1.5">
                  <User className="h-4 w-4 text-slate-400" />
                  {post.author}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  {new Date(post.createdAt).toLocaleDateString("en-BD", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-slate-400" />
                  {estimateReadTime(post.content)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Eye className="h-4 w-4 text-slate-400" />
                  {post.views} views
                </span>
              </div>

              {/* Tags */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[13px] font-medium text-epf-500 bg-epf-50 px-2.5 py-1 rounded border border-epf-100"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Content */}
              <div
                className="prose prose-slate max-w-none
                  [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-slate-900 [&_h1]:mb-4 [&_h1]:mt-8
                  [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-slate-900 [&_h2]:mb-3 [&_h2]:mt-7
                  [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-slate-900 [&_h3]:mb-2 [&_h3]:mt-6
                  [&_p]:text-[15px] [&_p]:leading-relaxed [&_p]:text-slate-700 [&_p]:mb-4
                  [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ul]:space-y-1
                  [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 [&_ol]:space-y-1
                  [&_li]:text-[15px] [&_li]:leading-relaxed [&_li]:text-slate-700
                  [&_a]:text-epf-500 [&_a]:hover:text-epf-600 [&_a]:underline
                  [&_strong]:font-semibold [&_strong]:text-slate-900
                  [&_code]:text-[13px] [&_code]:bg-slate-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-epf-500
                  [&_pre]:bg-slate-900 [&_pre]:text-slate-50 [&_pre]:rounded-lg [&_pre]:p-5 [&_pre]:overflow-x-auto [&_pre]:mb-6
                  [&_pre_code]:bg-transparent [&_pre_code]:text-slate-50 [&_pre_code]:px-0 [&_pre_code]:py-0
                  [&_blockquote]:border-l-4 [&_blockquote]:border-epf-500 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-slate-500 [&_blockquote]:mb-4
                  [&_img]:rounded-lg [&_img]:my-4
                  [&_hr]:border-slate-200 [&_hr]:my-6
                "
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
              />

              {/* Bottom Back Link */}
              <div className="mt-10 pt-6 border-t border-slate-200">
                <Link
                  href="/blog"
                  className="inline-flex items-center gap-1.5 text-[14px] font-medium text-slate-500 hover:text-epf-500 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Blog
                </Link>
              </div>
            </article>
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