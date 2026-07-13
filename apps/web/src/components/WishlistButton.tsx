"use client";

import { useState } from "react";
import { Bookmark } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface WishlistButtonProps {
  productId: string;
  initialFav?: boolean;
  className?: string;
}

export default function WishlistButton({ productId, initialFav = false, className = "" }: WishlistButtonProps) {
  const { user } = useAuthStore();
  const router = useRouter();
  const [isFav, setIsFav] = useState(initialFav);
  const [pending, setPending] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (!user) {
      toast.error("Please login to save favorites");
      router.push("/login");
      return;
    }

    setPending(true);
    try {
      if (isFav) {
        // Find and delete wishlist item
        const res = await apiFetch<{ success: boolean; data: { id: string; productId: string }[] }>("/api/wishlist");
        const item = res?.data?.find((w) => w.productId === productId);
        if (item) {
          await apiFetch(`/api/wishlist/${item.id}`, { method: "DELETE" });
          setIsFav(false);
          toast.success("Removed from wishlist");
        }
      } else {
        await apiFetch("/api/wishlist", { method: "POST", body: JSON.stringify({ productId }) });
        setIsFav(true);
        toast.success("Added to wishlist");
      }
    } catch (err: any) {
      toast.error(err?.message || "Could not update wishlist");
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      aria-label={isFav ? "Remove from wishlist" : "Add to wishlist"}
      className={`w-7 h-7 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:scale-110 transition-transform z-10 ${className}`}
    >
      <Bookmark
        className={`w-4 h-4 transition-colors ${
          isFav ? "text-red-500 fill-red-500" : "text-slate-300"
        }`}
      />
    </button>
  );
}
