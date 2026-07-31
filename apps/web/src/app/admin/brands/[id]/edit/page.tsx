"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { BrandForm } from "@/components/admin/BrandForm";

interface Brand {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  banner?: string | null;
  isActive: boolean;
  metaTitle?: string;
  metaDescription?: string;
}

export default function EditBrandPage() {
  const { id } = useParams() as { id: string };
  const [brand, setBrand] = useState<Brand | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await apiFetch<{ data: Brand }>(`/api/admin/brands/${id}`);
        setBrand(res.data);
      } catch {
        toast.error("Failed to load brand");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return <div className="p-6 text-slate-500">Loading...</div>;
  }

  if (!brand) {
    return <div className="p-6 text-red-500">Brand not found</div>;
  }

  return <BrandForm initialData={brand} />;
}
