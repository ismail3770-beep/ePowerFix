"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { TagForm } from "@/components/admin/TagForm";

interface TagData {
  id: string;
  name: string;
  slug: string;
}

export default function EditTagPage() {
  const { id } = useParams() as { id: string };
  const [tag, setTag] = useState<TagData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await apiFetch<{ data: TagData }>(`/api/admin/tags/${id}`);
        setTag(res.data);
      } catch {
        toast.error("Failed to load tag");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return <div className="p-6 text-slate-500">Loading...</div>;
  }

  if (!tag) {
    return <div className="p-6 text-red-500">Tag not found</div>;
  }

  return <TagForm initialData={tag} />;
}
