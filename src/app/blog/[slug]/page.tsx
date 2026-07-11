"use client";

import { useState, useEffect, useMemo } from "react";
import { apiFetch } from "@/lib/api";
import { useParams } from "next/navigation";
import DOMPurify from "isomorphic-dompurify";
import {
  ChevronRight,
  Home,
  User,
  Calendar,
  BookOpen,
  ArrowLeft,
  Loader2,
  Facebook,
  Twitter,
  Linkedin,
  Mail,
  Tag,
  FolderOpen,
  Pen,
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
import BackToTopButton from "@/components/epf/BackToTopButton";

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

interface SidebarPost {
  id: string;
  title: string;
  slug: string;
  coverImage: string;
  tags: string;
  createdAt: string;
}

function parseTags(raw: any): string[] {
  if (Array.isArray(raw)) {return raw.filter(Boolean);}
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
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function formatDateShort(iso: string): string {
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

function estimateReadTime(content: string): string {
  const text = content?.replace(/<[^>]+>/g, " ") || "";
  const words = text.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}

export default function BlogDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [fetchedSlug, setFetchedSlug] = useState<string | null>(null);

  const [recentPosts, setRecentPosts] = useState<SidebarPost[]>([]);

  /* ----- fetch post (setState only in async callbacks to avoid cascading renders) ----- */
  useEffect(() => {
    if (!slug) {return;}
    let cancelled = false;
    apiFetch<{ data: any }>(`/api/blog/${slug}`)
      .then((r) => {
        if (cancelled) {return;}
        setPost(r.data);
        setNotFound(false);
        setFetchedSlug(slug);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) {return;}
        setPost(null);
        setNotFound(true);
        setFetchedSlug(slug);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  // Derived loading state so slug changes show a loading spinner without
  // triggering synchronous setState inside the effect body.
  const isLoading = loading || fetchedSlug !== slug;

  /* ----- fetch recent posts for sidebar ----- */
  useEffect(() => {
    (async () => {
      try {
        const raw = await apiFetch<{
          success: boolean;
          data: { data: any[] };
        }>(`/api/blog?limit=5`);
        const list = (raw?.data?.data ?? [])
          .filter((p) => p.slug !== slug)
          .slice(0, 5) as SidebarPost[];
        setRecentPosts(list);
      } catch {
        /* silent */
      }
    })();
  }, [slug]);

  const tags: string[] = useMemo(
    () => (post ? parseTags(post.tags) : []),
    [post]
  );

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    recentPosts.forEach((p) => {
      parseTags(p.tags).forEach((t) => counts.set(t, (counts.get(t) ?? 0) + 1));
    });
    return Array.from(counts.entries()).slice(0, 8);
  }, [recentPosts]);

  const currentUrl =
    typeof window !== "undefined" ? window.location.href : "";

  const shareLinks = useMemo(
    () => [
      {
        label: "Facebook",
        icon: Facebook,
        href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`,
      },
      {
        label: "Twitter",
        icon: Twitter,
        href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(post?.title ?? "")}`,
      },
      {
        label: "LinkedIn",
        icon: Linkedin,
        href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`,
      },
      {
        label: "Email",
        icon: Mail,
        href: `mailto:?subject=${encodeURIComponent(post?.title ?? "")}&body=${encodeURIComponent(currentUrl)}`,
      },
    ],
    [currentUrl, post?.title]
  );

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
              <Link
                href="/blog"
                className="text-slate-500 hover:text-slate-900 transition-colors"
              >
                Blog
              </Link>
              <ChevronRight className="h-3 w-3 text-slate-400" />
              <span className="text-slate-900 font-medium truncate max-w-[200px] sm:max-w-[400px]">
                {post?.title || "Loading..."}
              </span>
            </nav>
          </div>
        </div>

        <div className="mx-auto max-w-[1400px] px-4 sm:px-12 py-8">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 text-epf-500 animate-spin" />
            </div>
          ) : notFound || !post ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-xl border border-slate-200">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                <BookOpen className="h-8 w-8 text-slate-400" />
              </div>
              <h2 className="text-[18px] font-semibold text-slate-900 mb-2">
                Article not found
              </h2>
              <p className="text-slate-500 text-[14px] mb-4 max-w-sm">
                The article you are looking for does not exist or has been removed.
              </p>
              <Link
                href="/blog"
                className="inline-flex items-center gap-1.5 text-[14px] font-medium text-epf-500 hover:text-epf-600 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Blog
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
              {/* MAIN CONTENT */}
              <article className="min-w-0">
                {/* Back Link */}
                <Link
                  href="/blog"
                  className="inline-flex items-center gap-1.5 text-[14px] font-medium text-slate-500 hover:text-epf-500 transition-colors mb-5"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Blog
                </Link>

                {/* Hero Image */}
                {post.coverImage && (
                  <div className="rounded-xl overflow-hidden mb-6 border border-slate-200 shadow-sm">
                    <img
                      src={post.coverImage}
                      alt={post.title}
                      className="w-full h-64 sm:h-80 object-cover"
                    />
                  </div>
                )}

                {/* Category Badge */}
                {tags[0] && (
                  <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium bg-epf-50 text-epf-600 mb-3">
                    {tags[0]}
                  </span>
                )}

                {/* Title */}
                <h1 className="text-[28px] sm:text-[32px] font-bold text-slate-900 leading-tight mb-4">
                  {post.title}
                </h1>

                {/* Metadata row */}
                <div className="flex flex-wrap items-center gap-4 text-[13px] text-slate-400 mb-6 pb-6 border-b border-slate-200">
                  <span className="flex items-center gap-1.5">
                    <User className="h-4 w-4" />
                    <span className="text-slate-600">{post.author || "ePowerFix"}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    {formatDate(post.createdAt)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="h-4 w-4" />
                    {estimateReadTime(post.content)}
                  </span>
                </div>

                {/* Excerpt lead */}
                {post.excerpt && (
                  <p className="text-[16px] leading-7 text-slate-600 mb-6 font-medium">
                    {post.excerpt}
                  </p>
                )}

                {/* Content body */}
                <div
                  className="prose prose-slate max-w-none
                    [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-slate-900 [&_h1]:mb-4 [&_h1]:mt-8
                    [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-slate-900 [&_h2]:mb-3 [&_h2]:mt-7
                    [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-slate-900 [&_h3]:mb-2 [&_h3]:mt-6
                    [&_p]:text-[15px] [&_p]:leading-7 [&_p]:text-slate-700 [&_p]:mb-4
                    [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ul]:space-y-1
                    [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 [&_ol]:space-y-1
                    [&_li]:text-[15px] [&_li]:leading-7 [&_li]:text-slate-700
                    [&_a]:text-epf-500 [&_a]:hover:text-epf-600 [&_a]:underline
                    [&_strong]:font-semibold [&_strong]:text-slate-900
                    [&_code]:text-[13px] [&_code]:bg-slate-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-epf-600
                    [&_pre]:bg-slate-900 [&_pre]:text-slate-50 [&_pre]:rounded-lg [&_pre]:p-5 [&_pre]:overflow-x-auto [&_pre]:mb-6
                    [&_pre_code]:bg-transparent [&_pre_code]:text-slate-50 [&_pre_code]:px-0 [&_pre_code]:py-0
                    [&_blockquote]:border-l-4 [&_blockquote]:border-epf-500 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-slate-500 [&_blockquote]:mb-4
                    [&_img]:rounded-lg [&_img]:my-4
                    [&_hr]:border-slate-200 [&_hr]:my-6
                  "
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
                />

                {/* Tags */}
                {tags.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-slate-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Tag className="h-4 w-4 text-slate-400" />
                      <span className="text-[13px] font-semibold text-slate-700">Tags</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <Link
                          key={tag}
                          href={`/blog?tag=${encodeURIComponent(tag)}`}
                          className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-[12px] font-medium text-slate-600 hover:bg-epf-50 hover:text-epf-600 hover:border-epf-100 transition-colors"
                        >
                          {tag}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Social Share */}
                <div className="mt-8 pt-6 border-t border-slate-200">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-[13px] font-semibold text-slate-700">Share</span>
                    <div className="flex items-center gap-2">
                      {shareLinks.map(({ label, icon: Icon, href }) => (
                        <a
                          key={label}
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Share on ${label}`}
                          className="flex items-center justify-center h-9 w-9 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-epf-500 hover:border-epf-100 transition-colors"
                        >
                          <Icon className="h-4 w-4" />
                        </a>
                      ))}
                    </div>
                  </div>
                </div>

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
                      {categories.map(([name, count]) => (
                        <li key={name}>
                          <Link
                            href={`/blog?tag=${encodeURIComponent(name)}`}
                            className="w-full flex items-center justify-between text-[14px] py-1.5 px-2 rounded-md text-slate-600 hover:bg-slate-50 transition-colors"
                          >
                            <span className="truncate">{name}</span>
                            <span className="text-[11px] rounded-full px-2 py-0.5 bg-epf-50 text-epf-600">
                              {count}
                            </span>
                          </Link>
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
                      {recentPosts.map((p) => (
                        <li key={p.id}>
                          <Link
                            href={`/blog/${p.slug}`}
                            className="flex items-start gap-3 group"
                          >
                            <div className="shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-slate-100">
                              {p.coverImage ? (
                                <img
                                  src={p.coverImage}
                                  alt={p.title}
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
                                {p.title}
                              </h4>
                              <span className="flex items-center gap-1 text-[11px] text-slate-400 mt-1">
                                <Calendar className="h-3 w-3" />
                                {formatDateShort(p.createdAt)}
                              </span>
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </aside>
            </div>
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
      <BackToTopButton />
    </>
  );
}
