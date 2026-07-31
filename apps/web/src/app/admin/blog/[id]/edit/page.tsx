"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { BlogPostForm } from "@/components/admin/BlogPostForm";

export default function EditBlogPostPage() {
  const { id } = useParams() as { id: string };
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await apiFetch<{ data: any }>(`/api/admin/blog/${id}`);
        setData(res.data);
      } catch {
        toast.error("Failed to load blog post");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) return <div className="p-6 text-slate-500">Loading...</div>;
  if (!data) return <div className="p-6 text-red-500">Blog post not found</div>;

  return <BlogPostForm initialData={data} />;
}
