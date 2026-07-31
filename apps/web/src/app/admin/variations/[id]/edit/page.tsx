"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { VariationForm } from "@/components/admin/VariationForm";

interface Variation {
  id: string;
  name: string;
  type: string;
  values: string[];
}

export default function EditVariationPage() {
  const { id } = useParams() as { id: string };
  const [variation, setVariation] = useState<Variation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await apiFetch<{ data: Variation }>(`/api/admin/variations/${id}`);
        setVariation(res.data);
      } catch {
        toast.error("Failed to load variation");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return <div className="p-6 text-slate-500">Loading...</div>;
  }

  if (!variation) {
    return <div className="p-6 text-red-500">Variation not found</div>;
  }

  return <VariationForm initialData={variation} />;
}
