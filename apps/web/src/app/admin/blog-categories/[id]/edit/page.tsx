"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { BlogCategoryForm } from "@/components/admin/BlogCategoryForm";

export default function EditBlogCategoryPage() {
  const { id } = useParams() as { id: string };
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        // Mocking API fetch for Edit Blog Category
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Mock data based on id
        setData({
          id,
          name: "Testimonials",
          slug: "testimonials"
        });
      } catch {
        toast.error("Failed to load blog category");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) return <div className="p-6 text-slate-500">Loading...</div>;
  if (!data) return <div className="p-6 text-red-500">Blog category not found</div>;

  return <BlogCategoryForm initialData={data} />;
}
