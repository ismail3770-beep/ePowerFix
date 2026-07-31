"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { FlashSaleForm } from "@/components/admin/FlashSaleForm";

export default function EditFlashSalePage() {
  const { id } = useParams() as { id: string };
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await apiFetch<{ data: any }>(`/api/admin/flash-sales/${id}`);
        setData(res.data);
      } catch {
        toast.error("Failed to load flash sale");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) return <div className="p-6 text-slate-500">Loading...</div>;
  if (!data) return <div className="p-6 text-red-500">Flash sale not found</div>;

  return <FlashSaleForm initialData={data} />;
}
