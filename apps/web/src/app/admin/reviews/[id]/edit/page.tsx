"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { ReviewForm } from "@/components/admin/ReviewForm";

interface ReviewData {
  id: string;
  rating: number;
  comment: string;
  status: string;
  user?: {
    name?: string;
  };
}

export default function EditReviewPage() {
  const { id } = useParams() as { id: string };
  const [review, setReview] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await apiFetch<{ data: ReviewData }>(`/api/admin/reviews/${id}`);
        setReview(res.data);
      } catch {
        toast.error("Failed to load review");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return <div className="p-6 text-slate-500">Loading...</div>;
  }

  if (!review) {
    return <div className="p-6 text-red-500">Review not found</div>;
  }

  return <ReviewForm initialData={review} />;
}
