"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { BlogTagForm } from "@/components/admin/BlogTagForm";

export default function EditBlogTagPage() {
  const { id } = useParams() as { id: string };
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        // Mocking API fetch for Edit Blog Tag
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Mock data based on id
        setData({
          id,
          name: "ClientTestimonials",
          slug: "clienttestimonials"
        });
      } catch {
        toast.error("Failed to load blog tag");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) return <div className="p-6 text-slate-500">Loading...</div>;
  if (!data) return <div className="p-6 text-red-500">Blog tag not found</div>;

  return <BlogTagForm initialData={data} />;
}
