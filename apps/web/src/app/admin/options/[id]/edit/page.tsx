"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { OptionForm } from "@/components/admin/OptionForm";

interface OptionData {
  id: string;
  name: string;
  type: string;
  required: boolean;
  choices: string[];
}

export default function EditOptionPage() {
  const { id } = useParams() as { id: string };
  const [option, setOption] = useState<OptionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await apiFetch<{ data: OptionData }>(`/api/admin/options/${id}`);
        setOption(res.data);
      } catch {
        toast.error("Failed to load option");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return <div className="p-6 text-slate-500">Loading...</div>;
  }

  if (!option) {
    return <div className="p-6 text-red-500">Option not found</div>;
  }

  return <OptionForm initialData={option} />;
}
