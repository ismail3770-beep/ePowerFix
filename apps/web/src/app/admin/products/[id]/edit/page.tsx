"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ProductForm from "@/components/admin/ProductForm";
import { apiFetch } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    
    apiFetch(`/api/admin/products/${id}`)
      .then((res: any) => {
        setProduct(res.data);
      })
      .catch((err) => {
        console.error("Failed to fetch product:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-[400px] w-full rounded-md" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-[200px] w-full rounded-md" />
            <Skeleton className="h-[300px] w-full rounded-md" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return <div>Product not found.</div>;
  }

  return <ProductForm initialData={product} />;
}
