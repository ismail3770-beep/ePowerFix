"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { AttributeForm } from "@/components/admin/AttributeForm";

interface Attribute {
  id: string;
  name: string;
  slug: string;
  values: string[];
}

export default function EditAttributePage() {
  const { id } = useParams() as { id: string };
  const [attribute, setAttribute] = useState<Attribute | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await apiFetch<{ data: Attribute }>(`/api/admin/attributes/${id}`);
        setAttribute(res.data);
      } catch {
        toast.error("Failed to load attribute");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return <div className="p-6 text-slate-500">Loading...</div>;
  }

  if (!attribute) {
    return <div className="p-6 text-red-500">Attribute not found</div>;
  }

  return <AttributeForm initialData={attribute} />;
}
