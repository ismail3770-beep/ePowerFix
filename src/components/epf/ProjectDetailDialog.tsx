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

interface Project {
  id: string;
  title: string;
  titleBn: string;
  description: string;
  descriptionBn: string;
  category: string;
  techStack: string;
  image: string | null;
  images: string;
  coverImage?: string;
  price: number | null;
  githubUrl: string | null;
  liveUrl: string | null;
  features: string;
  featured: boolean;
  active: boolean;
}

const categoryBn: Record<string, string> = {
  electrical: "ইলেকট্রিক্যাল",
  solar: "সোলার",
  automation: "অটোমেশন",
  iot: "আইওটি",
};

function parseJsonField(field: unknown): string[] {
  if (Array.isArray(field)) return field;
  if (typeof field === "string") {
    try { const p = JSON.parse(field); return Array.isArray(p) ? p : []; }
    catch { return []; }
  }
  return [];
}

function collectImages(project: Project): string[] {
  const imgs: string[] = [];
  const cover = project.coverImage || project.image;
  if (cover) imgs.push(cover);
  const additional = parseJsonField(project.images);
  for (const img of additional) {
    if (img && !imgs.includes(img)) imgs.push(img);
  }
  return imgs;
}

export default function ProjectDetailDialog() {
  const { projectDetailOpen, setProjectDetailOpen, selectedProjectId, setSelectedProjectId } = useUIStore();
  const { addItem } = useCartStore();
  const [project, setProject] = useState<Project | null>(null);
  const [features, setFeatures] = useState<string[]>([]);
  const [techStack, setTechStack] = useState<string[]>([]);

  useEffect(() => {
    if (!selectedProjectId || !projectDetailOpen) return;
    apiFetch<{ data: Project[] }>("/api/projects")
      .then((res) => {
        const found = (res.data || []).find((p: Project) => p.id === selectedProjectId);
        if (found) {
          setProject(found);
          setFeatures(parseJsonField(found.features));
          setTechStack(parseJsonField(found.techStack));
        }
      })
      .catch(() => {});
  }, [selectedProjectId, projectDetailOpen]);

  const handleClose = () => {
    setProjectDetailOpen(false);
    setSelectedProjectId(null);
    setProject(null);
  };

  const handleBuy = () => {
    if (!project) return;
    addItem({
      itemType: "PROJECT",
      productId: project.id,
      productName: project.titleBn || project.title,
      productImage: project.image || "",
      price: project.price || 0,
      quantity: 1,
    });
    toast.success("কার্টে যোগ হয়েছে!");
    handleClose();
  };

  const allImages = project ? collectImages(project) : [];

  return (
    <Dialog open={projectDetailOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{project?.titleBn || project?.title}</DialogTitle>
          <DialogDescription>{project?.title}</DialogDescription>
        </DialogHeader>

        {project && (
          <>
            {/* Image Gallery */}
            <ImageGallery images={allImages} />

            {/* Category & Price */}
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="text-[13px]">
                {categoryBn[project.category] || project.category}
              </Badge>
              {project.price ? (
                <span className="text-xl font-bold text-epf-500">৳{project.price.toLocaleString()}</span>
              ) : (
                <span className="text-sm font-medium text-dark-500 bg-dark-100 px-3 py-1 rounded-full">ফ্রি</span>
              )}
            </div>

            {/* Description */}
            <p className="text-sm text-dark-500 leading-relaxed">
              {project.descriptionBn || project.description}
            </p>

            <Separator />

            {/* Tech Stack */}
            {techStack.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-2 text-dark-900">টেকনোলজি স্ট্যাক</h4>
                <div className="flex flex-wrap gap-1.5">
                  {techStack.map((t) => (
                    <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Features */}
            {features.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-2 text-dark-900">ফিচারসমূহ</h4>
                <ul className="space-y-1.5">
                  {features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-dark-500">
                      <EPFTag className="size-3.5 mt-0.5 text-epf-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 pt-2">
              {project.price && (
                <Button onClick={handleBuy} className="flex-1 min-w-[140px] bg-epf-500 hover:bg-epf-600">
                  কিনুন / Buy Now
                </Button>
              )}
              {project.githubUrl && (
                <Button variant="outline" className="flex-1 min-w-[140px]" asChild>
                  <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">
                    কোড দেখুন
                  </a>
                </Button>
              )}
              {project.liveUrl && (
                <Button variant="outline" className="flex-1 min-w-[140px]" asChild>
                  <a href={project.liveUrl} target="_blank" rel="noopener noreferrer">
                    লাইভ ডেমো
                  </a>
                </Button>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}