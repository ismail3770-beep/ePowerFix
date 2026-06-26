"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { ExternalLink, Github, FolderOpen, Tag } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useUIStore, useCartStore } from "@/store";
import { apiFetch } from "@/lib/api";

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
  price: number | null;
  githubUrl: string | null;
  liveUrl: string | null;
  features: string;
  featured: boolean;
  active: boolean;
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
          try { setFeatures(Array.isArray(found.features) ? found.features : (typeof found.features === 'string' ? JSON.parse(found.features) : [])); } catch { setFeatures([]); }
          try { setTechStack(Array.isArray(found.techStack) ? found.techStack : (typeof found.techStack === 'string' ? JSON.parse(found.techStack) : [])); } catch { setTechStack([]); }
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
      productId: project.id,
      productName: project.titleBn || project.title,
      productImage: project.image || "",
      price: project.price || 0,
      quantity: 1,
    });
    toast.success("কার্টে যোগ হয়েছে!");
    handleClose();
  };

  return (
    <Dialog open={projectDetailOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{project?.titleBn || project?.title}</DialogTitle>
          <DialogDescription>{project?.title}</DialogDescription>
        </DialogHeader>

        {project && (
          <>
            {/* Image area */}
            <div className="aspect-video bg-gradient-to-br from-muted to-muted/60 rounded-lg flex items-center justify-center">
              <FolderOpen className="size-16 text-muted-foreground/25" />
            </div>

            {/* Category & Price */}
            <div className="flex items-center justify-between">
              <Badge variant="secondary">{project.category}</Badge>
              {project.price ? (
                <span className="text-xl font-bold text-primary">৳{project.price.toLocaleString()}</span>
              ) : (
                <span className="text-sm font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full">Showcase</span>
              )}
            </div>

            {/* Description */}
            <p className="text-sm text-muted-foreground leading-relaxed">
              {project.descriptionBn || project.description}
            </p>

            <Separator />

            {/* Tech stack */}
            {techStack.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-2">Tech Stack / টেকনোলজি</h4>
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
                <h4 className="font-semibold text-sm mb-2">Features / ফিচারসমূহ</h4>
                <ul className="space-y-1.5">
                  {features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Tag className="size-3.5 mt-0.5 text-primary shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2 pt-2">
              {project.price && (
                <Button onClick={handleBuy} className="flex-1 min-w-[140px]">
                  Buy Now / কিনুন
                </Button>
              )}
              {project.githubUrl && (
                <Button variant="outline" className="flex-1 min-w-[140px]" asChild>
                  <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">
                    <Github className="size-4" />
                    View Code
                  </a>
                </Button>
              )}
              {project.liveUrl && (
                <Button variant="outline" className="flex-1 min-w-[140px]" asChild>
                  <a href={project.liveUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="size-4" />
                    Live Demo
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