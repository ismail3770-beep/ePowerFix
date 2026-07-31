"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { AttributeSetForm } from "@/components/admin/AttributeSetForm";

interface AttributeSet {
  id: string;
  name: string;
}

export default function EditAttributeSetPage() {
  const { id } = useParams() as { id: string };
  const [attributeSet, setAttributeSet] = useState<AttributeSet | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await apiFetch<{ data: AttributeSet }>(`/api/admin/attribute-sets/${id}`);
        setAttributeSet(res.data);
      } catch {
        toast.error("Failed to load attribute set");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return <div className="p-6 text-slate-500">Loading...</div>;
  }

  if (!attributeSet) {
    return <div className="p-6 text-red-500">Attribute Set not found</div>;
  }

  return <AttributeSetForm initialData={attributeSet} />;
}
