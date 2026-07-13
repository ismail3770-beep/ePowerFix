"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { EPFTag, EPFLogoBolt } from "@/components/epf/icons/EPFIcons";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useUIStore, useCartStore } from "@/store";
import { apiFetch } from "@/lib/api";
import ImageGallery from "@/components/epf/ImageGallery";

interface ProjectKit {
  id: string;
  title: string;
  titleBn?: string | null;
  description: string;
  category: string | null;
  coverImage?: string | null;
  images: string[];
  price: number;
  salePrice?: number | null;
  difficulty?: string | null;
  stock: number;
  items?: Array<{
    id: string;
    quantity: number;
    isRequired: boolean;
    notes?: string | null;
    product: { id: string; name: string; price: number; salePrice?: number | null };
  }>;
}

const categoryBn: Record<string, string> = {
  electrical: "ইলেকট্রিক্যাল",
  solar: "সোলার",
  automation: "অটোমেশন",
  iot: "আইওটি",
  arduino: "আরডুইনো",
};

function parseJsonField(field: unknown): string[] {
  if (Array.isArray(field)) {return field;}
  if (typeof field === "string") {
    try { const p = JSON.parse(field); return Array.isArray(p) ? p : []; }
    catch { return []; }
  }
  return [];
}

function collectImages(kit: ProjectKit): string[] {
  const imgs: string[] = [];
  if (kit.coverImage) {imgs.push(kit.coverImage);}
  for (const img of (kit.images || [])) {
    if (img && !imgs.includes(img)) {imgs.push(img);}
  }
  return imgs;
}

export default function ProjectDetailDialog() {
  const { projectDetailOpen, setProjectDetailOpen, selectedProjectId, setSelectedProjectId } = useUIStore();
  const { addItem } = useCartStore();
  const [kit, setKit] = useState<ProjectKit | null>(null);

  useEffect(() => {
    if (!selectedProjectId || !projectDetailOpen) {return;}
    apiFetch<{ data: ProjectKit[] }>("/api/project-kits")
      .then((res) => {
        const found = (res.data || []).find((k: ProjectKit) => k.id === selectedProjectId);
        if (found) {
          setKit({
            ...found,
            images: Array.isArray(found.images) ? found.images : parseJsonField(found.images as any),
          });
        }
      })
      .catch(() => {});
  }, [selectedProjectId, projectDetailOpen]);

  const handleClose = () => {
    setProjectDetailOpen(false);
    setSelectedProjectId(null);
    setKit(null);
  };

  const handleBuy = () => {
    if (!kit) {return;}
    addItem({
      itemType: "PROJECT",
      productId: kit.id,
      productName: kit.title,
      productImage: kit.coverImage || (kit.images && kit.images[0]) || "",
      price: Number(kit.salePrice ?? kit.price ?? 0),
      quantity: 1,
    });
    toast.success("কার্টে যোগ হয়েছে!");
    handleClose();
  };

  const allImages = kit ? collectImages(kit) : [];
  const price = kit ? Number(kit.salePrice ?? kit.price ?? 0) : 0;

  return (
    <Dialog open={projectDetailOpen} onOpenChange={(open) => { if (!open) {handleClose();} }}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{kit?.titleBn || kit?.title}</DialogTitle>
          <DialogDescription>{kit?.title}</DialogDescription>
        </DialogHeader>

        {kit && (
          <>
            {/* Image Gallery */}
            <ImageGallery images={allImages} />

            {/* Category & Price */}
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="text-[13px]">
                {kit.category ? (categoryBn[kit.category.toLowerCase()] || kit.category) : "Project Kit"}
              </Badge>
              {kit.difficulty && (
                <Badge variant="outline" className="text-[12px]">{kit.difficulty}</Badge>
              )}
              {price > 0 ? (
                <span className="text-xl font-bold text-epf-500">৳{price.toLocaleString()}</span>
              ) : (
                <span className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">ফ্রি</span>
              )}
            </div>

            {/* Description */}
            <p className="text-sm text-slate-500 leading-relaxed">
              {kit.description}
            </p>

            <Separator />

            {/* Kit contents (items) */}
            {kit.items && kit.items.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-2 text-slate-900">কিটে যা যা থাকছে</h4>
                <ul className="space-y-1.5">
                  {kit.items.map((item) => (
                    <li key={item.id} className="flex items-start gap-2 text-sm text-slate-500">
                      <EPFTag className="size-3.5 mt-0.5 text-epf-500 shrink-0" />
                      <span>
                        {item.product.name} × {item.quantity}
                        {!item.isRequired && <span className="text-[11px] text-slate-400 ml-1">(optional)</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 pt-2">
              <Button onClick={handleBuy} className="flex-1 min-w-[140px] bg-epf-500 hover:bg-epf-600">
                কিনুন / Buy Now
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}