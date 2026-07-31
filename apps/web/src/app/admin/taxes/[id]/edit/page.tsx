"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { TaxForm } from "@/components/admin/TaxForm";
import { apiFetch } from "@/lib/api";

export default function EditTaxPage() {
  const { id } = useParams() as { id: string };
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await apiFetch<any>(`/api/admin/taxes?search=${id}`);
        const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
        const tax = list.find((t: any) => t.id === id);
        
        if (tax) {
          setData(tax);
        } else {
          toast.error("Tax not found");
        }
      } catch {
        toast.error("Failed to load tax");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) return <div className="p-6">Loading...</div>;
  if (!data) return <div className="p-6">Tax not found.</div>;

  return <TaxForm initialData={data} />;
}
