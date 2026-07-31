"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { CouponForm } from "@/components/admin/CouponForm";

export default function EditCouponPage() {
  const { id } = useParams() as { id: string };
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await apiFetch<{ data: any }>(`/api/admin/coupons/${id}`);
        setData(res.data);
      } catch {
        toast.error("Failed to load coupon");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) return <div className="p-6 text-slate-500">Loading...</div>;
  if (!data) return <div className="p-6 text-red-500">Coupon not found</div>;

  return <CouponForm initialData={data} />;
}
