"use client";

import { useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import { Upload, X, Loader2, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";

/* ─── Multi-image uploader ─────────────────────────────────── */

interface ImageUploaderProps {
  value: string[];           // Array of image URLs
  onChange: (urls: string[]) => void; // Callback with updated URLs
  max?: number;              // Max images (default 5)
  label?: string;            // Label text
}

export function ImageUploader({ value, onChange, max = 5, label = "Images" }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(async (file: File) => {
    if (value.length >= max) {
      toast.error(`Maximum ${max} images allowed`);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large (max 5MB)");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Only image files allowed");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      // Use same-origin proxy (Next.js rewrite → API server)
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) {throw new Error(json.error || "Upload failed");}
      const url = json.data?.url;
      if (url) {
        onChange([...value, url]);
        toast.success("Image uploaded");
      }
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }, [value, onChange, max]);

  const handleFiles = (files: FileList | null) => {
    if (!files) {return;}
    Array.from(files).forEach((f) => uploadFile(f));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeImage = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-[13px] font-medium text-[#374151]">{label}</label>
      )}

      {/* Drop zone */}
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed cursor-pointer transition-colors h-32 ${
          dragOver
            ? "border-[#0EA5E9] bg-[#F0F9FF]"
            : "border-[#e2e8f0] bg-[#f8fafc] hover:border-[#94a3b8] hover:bg-[#f1f5f9]"
        } ${uploading ? "pointer-events-none opacity-60" : ""}`}
      >
        {uploading ? (
          <Loader2 className="h-6 w-6 text-[#0EA5E9] animate-spin" />
        ) : (
          <Upload className="h-6 w-6 text-[#94a3b8]" />
        )}
        <div className="text-center">
          <p className="text-[13px] text-[#64748b] font-medium">
            {uploading ? "Uploading..." : "Click or drag image here"}
          </p>
          <p className="text-[11px] text-[#94a3b8]">JPG, PNG, GIF, WebP, SVG — max 5MB</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
          multiple={max > 1}
        />
      </div>

      {/* Image previews */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((url, i) => (
            <div
              key={i}
              className="relative group rounded-md border border-[#e2e8f0] overflow-hidden bg-[#f8fafc]"
            >
              <img
                src={url}
                alt={`Upload ${i + 1}`}
                className="h-20 w-20 object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
              <button
                onClick={(e) => { e.stopPropagation(); removeImage(i); }}
                className="absolute top-0.5 right-0.5 h-5 w-5 flex items-center justify-center rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {value.length < max && !uploading && (
            <button
              onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
              className="h-20 w-20 flex flex-col items-center justify-center rounded-md border-2 border-dashed border-[#e2e8f0] text-[#94a3b8] hover:border-[#0EA5E9] hover:text-[#0EA5E9] transition-colors"
            >
              <ImagePlus className="h-5 w-5" />
              <span className="text-[10px] mt-0.5">Add</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Single-image uploader (logo, favicon, avatar, cover) ─── */

export function SingleImageUploader({
  value,
  onChange,
  label = "Image",
}: {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large (max 5MB)");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Only image files allowed");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      // Use same-origin proxy (Next.js rewrite → API server)
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) {throw new Error(json.error || "Upload failed");}
      const url = json.data?.url;
      if (url) {
        onChange(url);
        toast.success("Image uploaded");
      }
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-[13px] font-medium text-[#374151]">{label}</label>
      )}

      <div className="flex items-center gap-4">
        {/* Preview */}
        {value ? (
          <div className="relative group rounded-md border border-[#e2e8f0] overflow-hidden bg-[#f8fafc] h-20 w-20 shrink-0">
            <img
              src={value}
              alt="Preview"
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
            <button
              onClick={() => onChange("")}
              className="absolute top-0.5 right-0.5 h-5 w-5 flex items-center justify-center rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <div
            onClick={() => !uploading && inputRef.current?.click()}
            className="h-20 w-20 flex flex-col items-center justify-center rounded-md border-2 border-dashed border-[#e2e8f0] text-[#94a3b8] hover:border-[#0EA5E9] hover:text-[#0EA5E9] transition-colors cursor-pointer shrink-0"
          >
            {uploading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <ImagePlus className="h-5 w-5" />
            )}
          </div>
        )}

        <div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="text-[13px]"
          >
            {uploading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Upload className="mr-1.5 h-3.5 w-3.5" />}
            {value ? "Change" : "Upload"}
          </Button>
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange("")}
              className="text-[13px] text-red-600 ml-1"
            >
              Remove
            </Button>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) {uploadFile(e.target.files[0]);}
            }}
          />
        </div>
      </div>
    </div>
  );
}