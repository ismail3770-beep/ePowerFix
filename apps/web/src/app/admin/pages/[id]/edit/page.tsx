"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { PageForm } from "@/components/admin/PageForm";

export default function EditPagePage() {
  const { id } = useParams() as { id: string };
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await apiFetch<{ data: any }>(`/api/admin/pages/${id}`);
        setData(res.data);
      } catch {
        toast.error("Failed to load page");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) return <div className="p-6 text-slate-500">Loading...</div>;
  if (!data) return <div className="p-6 text-red-500">Page not found</div>;

  return <PageForm initialData={data} />;
}
