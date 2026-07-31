"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { UserForm } from "@/components/admin/UserForm";
import { apiFetch } from "@/lib/api";

export default function EditUserPage() {
  const { id } = useParams() as { id: string };
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await apiFetch<any>(`/api/admin/users?search=${id}`);
        const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
        const user = list.find((u: any) => u.id === id);
        
        if (user) {
          setData(user);
        } else {
          toast.error("User not found");
        }
      } catch {
        toast.error("Failed to load user");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) return <div className="p-6 text-slate-500">Loading...</div>;
  if (!data) return <div className="p-6 text-red-500">User not found</div>;

  return <UserForm initialData={data} />;
}
