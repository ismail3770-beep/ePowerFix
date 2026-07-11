"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import {
  Upload,
  Trash2,
  Loader2,
  ImagePlus,
  Search,
  Grid3X3,
  List,
  Copy,
  X,
  ExternalLink,
  Image as ImageIcon,
  FolderOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface MediaFile {
  filename: string;
  url: string;
  size: number;
  createdAt: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) {return `${bytes} B`;}
  if (bytes < 1024 * 1024) {return `${(bytes / 1024).toFixed(1)} KB`;}
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminMediaPage() {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [previewFile, setPreviewFile] = useState<MediaFile | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const json = await apiFetch<{ data: MediaFile[] }>("/api/admin/upload");
      setFiles(json.data || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load media");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) {return;}
    setUploading(true);
    let successCount = 0;
    let failCount = 0;

    for (const file of Array.from(fileList)) {
      if (file.size > 5 * 1024 * 1024) {
        failCount++;
        continue;
      }
      if (!file.type.startsWith("image/")) {
        failCount++;
        continue;
      }

      const formData = new FormData();
      formData.append("file", file);
      try {
        const res = await fetch("/api/admin/upload", {
          method: "POST",
          credentials: "include",
          body: formData,
        });
        const json = await res.json();
        if (!res.ok) {throw new Error(json.error);}
        successCount++;
      } catch {
        failCount++;
      }
    }

    setUploading(false);
    if (successCount > 0) {toast.success(`${successCount} file(s) uploaded`);}
    if (failCount > 0) {toast.error(`${failCount} file(s) failed`);}
    fetchFiles();
  };

  const handleDelete = async (filename: string) => {
    if (!confirm("Delete this file?")) {return;}
    setDeleting(filename);
    try {
      await apiFetch(`/api/admin/upload/${filename}`, {
        method: "DELETE",
      });
      toast.success("File deleted");
      setFiles((prev) => prev.filter((f) => f.filename !== filename));
      setSelectedFiles((prev) => {
        const next = new Set(prev);
        next.delete(filename);
        return next;
      });
      if (previewFile?.filename === filename) {setPreviewFile(null);}
    } catch (err: any) {
      toast.error(err.message || "Delete failed");
    } finally {
      setDeleting(null);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedFiles.size === 0) {return;}
    if (!confirm(`Delete ${selectedFiles.size} selected file(s)?`)) {return;}
    let count = 0;
    for (const fn of selectedFiles) {
      try {
        await fetch(`/api/admin/upload/${fn}`, {
          method: "DELETE",
          credentials: "include",
        });
        count++;
      } catch { /* skip */ }
    }
    toast.success(`${count} file(s) deleted`);
    setSelectedFiles(new Set());
    fetchFiles();
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("URL copied");
  };

  const toggleSelect = (filename: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(filename)) {next.delete(filename);}
      else {next.add(filename);}
      return next;
    });
  };

  const filteredFiles = files.filter((f) =>
    f.filename.toLowerCase().includes(search.toLowerCase())
  );

  const totalSize = files.reduce((acc, f) => acc + f.size, 0);

  // Drag & drop handlers
  const [dragOver, setDragOver] = useState(false);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-semibold text-[#111827]">Media Library</h1>
          <p className="text-[13px] text-[#94a3b8] mt-0.5">
            {files.length} file{files.length !== 1 ? "s" : ""} &middot; {formatSize(totalSize)} total
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedFiles.size > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteSelected}
              className="text-[13px] text-red-600 border-red-200 hover:bg-red-50"
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Delete ({selectedFiles.size})
            </Button>
          )}
          <Button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="h-9 px-4 bg-[#0EA5E9] hover:bg-[#0284C7] text-white text-[13px] font-medium"
          >
            {uploading ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Upload className="mr-1.5 h-3.5 w-3.5" />
            )}
            Upload
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleUpload(e.target.files)}
          />
        </div>
      </div>

      {/* Search & View Toggle */}
      <div className="flex items-center gap-3">
        <div className="flex-1 max-w-sm relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#94a3b8]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search files..."
            className="h-9 pl-9 text-[13px]"
          />
        </div>
        <div className="flex items-center border border-[#e2e8f0] rounded-md overflow-hidden">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 ${viewMode === "grid" ? "bg-[#0EA5E9] text-white" : "text-[#94a3b8] hover:bg-[#f1f5f9]"}`}
          >
            <Grid3X3 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 ${viewMode === "list" ? "bg-[#0EA5E9] text-white" : "text-[#94a3b8] hover:bg-[#f1f5f9]"}`}
          >
            <List className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Drop zone overlay */}
      {dragOver && (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleUpload(e.dataTransfer.files); }}
          className="fixed inset-0 z-50 bg-[#0EA5E9]/10 border-4 border-dashed border-[#0EA5E9] flex items-center justify-center"
        >
          <div className="bg-white rounded-xl p-8 shadow-xl text-center">
            <Upload className="h-10 w-10 text-[#0EA5E9] mx-auto mb-3" />
            <p className="text-[16px] font-medium text-[#111827]">Drop files here</p>
            <p className="text-[13px] text-[#94a3b8]">JPG, PNG, GIF, WebP, SVG — max 5MB</p>
          </div>
        </div>
      )}

      {/* Global drag listener */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        className="hidden"
      />

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 text-[#0EA5E9] animate-spin" />
          <span className="ml-2 text-[14px] text-[#94a3b8]">Loading media...</span>
        </div>
      ) : filteredFiles.length === 0 ? (
        /* Empty state */
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleUpload(e.dataTransfer.files); }}
          className="flex flex-col items-center justify-center py-20 rounded-lg border-2 border-dashed border-[#e2e8f0] bg-[#f8fafc] cursor-pointer hover:border-[#94a3b8] transition-colors"
          onClick={() => inputRef.current?.click()}
        >
          <div className="h-16 w-16 rounded-full bg-[#f1f5f9] flex items-center justify-center mb-4">
            {files.length === 0 ? (
              <FolderOpen className="h-8 w-8 text-[#94a3b8]" />
            ) : (
              <Search className="h-8 w-8 text-[#94a3b8]" />
            )}
          </div>
          <p className="text-[15px] font-medium text-[#374151]">
            {files.length === 0 ? "No media files yet" : "No matching files"}
          </p>
          <p className="text-[13px] text-[#94a3b8] mt-1">
            {files.length === 0
              ? "Upload images to get started"
              : "Try a different search term"}
          </p>
          {files.length === 0 && (
            <Button
              variant="outline"
              size="sm"
              className="mt-4 text-[13px]"
              onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
            >
              <ImagePlus className="mr-1.5 h-3.5 w-3.5" />
              Upload First Image
            </Button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        /* Grid View */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filteredFiles.map((file) => (
            <div
              key={file.filename}
              onClick={() => setPreviewFile(file)}
              className="group relative rounded-lg border border-[#e2e8f0] overflow-hidden bg-[#f8fafc] cursor-pointer hover:border-[#0EA5E9] hover:shadow-sm transition-all"
            >
              {/* Checkbox */}
              <div
                onClick={(e) => toggleSelect(file.filename, e)}
                className="absolute top-2 left-2 z-10"
              >
                <div
                  className={`h-5 w-5 rounded border-2 flex items-center justify-center transition-colors ${
                    selectedFiles.has(file.filename)
                      ? "bg-[#0EA5E9] border-[#0EA5E9]"
                      : "border-[#d1d5db] bg-white opacity-0 group-hover:opacity-100"
                  }`}
                >
                  {selectedFiles.has(file.filename) && (
                    <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>

              {/* Image */}
              <div className="aspect-square overflow-hidden bg-[#f1f5f9]">
                <img
                  src={file.url}
                  alt={file.filename}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
              </div>

              {/* Info bar */}
              <div className="p-2">
                <p className="text-[11px] text-[#374151] font-medium truncate" title={file.filename}>
                  {file.filename}
                </p>
                <p className="text-[10px] text-[#94a3b8]">
                  {formatSize(file.size)}
                </p>
              </div>

              {/* Hover actions */}
              <div className="absolute bottom-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => { e.stopPropagation(); copyUrl(file.url); }}
                  className="h-7 w-7 flex items-center justify-center rounded-md bg-white/90 border border-[#e2e8f0] text-[#64748b] hover:text-[#0EA5E9] hover:border-[#0EA5E9] transition-colors shadow-sm"
                  title="Copy URL"
                >
                  <Copy className="h-3 w-3" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(file.filename); }}
                  disabled={deleting === file.filename}
                  className="h-7 w-7 flex items-center justify-center rounded-md bg-white/90 border border-[#e2e8f0] text-[#64748b] hover:text-red-600 hover:border-red-300 transition-colors shadow-sm"
                  title="Delete"
                >
                  {deleting === file.filename ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Trash2 className="h-3 w-3" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="border border-[#e2e8f0] rounded-lg overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-[#f8fafc] border-b border-[#e2e8f0]">
                <th className="text-left py-2.5 px-3 font-medium text-[#64748b] w-8">
                  <div
                    onClick={() => {
                      if (selectedFiles.size === filteredFiles.length) {
                        setSelectedFiles(new Set());
                      } else {
                        setSelectedFiles(new Set(filteredFiles.map((f) => f.filename)));
                      }
                    }}
                    className="h-4 w-4 rounded border-2 flex items-center justify-center cursor-pointer bg-white"
                    style={{ borderColor: selectedFiles.size === filteredFiles.length ? "#0EA5E9" : "#d1d5db" }}
                  >
                    {selectedFiles.size === filteredFiles.length && (
                      <svg className="h-2.5 w-2.5 text-[#0EA5E9]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </th>
                <th className="text-left py-2.5 px-3 font-medium text-[#64748b]">Preview</th>
                <th className="text-left py-2.5 px-3 font-medium text-[#64748b]">Filename</th>
                <th className="text-left py-2.5 px-3 font-medium text-[#64748b]">Size</th>
                <th className="text-left py-2.5 px-3 font-medium text-[#64748b]">Date</th>
                <th className="text-right py-2.5 px-3 font-medium text-[#64748b]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFiles.map((file) => (
                <tr
                  key={file.filename}
                  className="border-b border-[#f1f5f9] hover:bg-[#f8fafc] cursor-pointer"
                  onClick={() => setPreviewFile(file)}
                >
                  <td className="py-2.5 px-3">
                    <div
                      onClick={(e) => toggleSelect(file.filename, e)}
                      className="h-4 w-4 rounded border-2 flex items-center justify-center cursor-pointer"
                      style={{
                        borderColor: selectedFiles.has(file.filename) ? "#0EA5E9" : "#d1d5db",
                        backgroundColor: selectedFiles.has(file.filename) ? "#0EA5E9" : "white",
                      }}
                    >
                      {selectedFiles.has(file.filename) && (
                        <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <img src={file.url} alt="" className="h-10 w-10 object-cover rounded border border-[#e2e8f0]" />
                  </td>
                  <td className="py-2.5 px-3 text-[#374151] font-medium truncate max-w-[200px]" title={file.filename}>
                    {file.filename}
                  </td>
                  <td className="py-2.5 px-3 text-[#64748b]">{formatSize(file.size)}</td>
                  <td className="py-2.5 px-3 text-[#64748b]">{formatDate(file.createdAt)}</td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); copyUrl(file.url); }}
                        className="h-7 w-7 flex items-center justify-center rounded-md text-[#64748b] hover:text-[#0EA5E9] hover:bg-[#f0f9ff] transition-colors"
                        title="Copy URL"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); window.open(file.url, "_blank"); }}
                        className="h-7 w-7 flex items-center justify-center rounded-md text-[#64748b] hover:text-[#0EA5E9] hover:bg-[#f0f9ff] transition-colors"
                        title="Open in new tab"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(file.filename); }}
                        disabled={deleting === file.filename}
                        className="h-7 w-7 flex items-center justify-center rounded-md text-[#64748b] hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete"
                      >
                        {deleting === file.filename ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewFile && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => setPreviewFile(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-[#e2e8f0]">
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-medium text-[#111827] truncate">{previewFile.filename}</p>
                <p className="text-[12px] text-[#94a3b8]">
                  {formatSize(previewFile.size)} &middot; {formatDate(previewFile.createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyUrl(previewFile.url)}
                  className="text-[12px]"
                >
                  <Copy className="mr-1.5 h-3 w-3" />
                  Copy URL
                </Button>
                <button
                  onClick={() => setPreviewFile(null)}
                  className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-[#f1f5f9] text-[#64748b]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Image */}
            <div className="flex items-center justify-center bg-[#f8fafc] p-4 max-h-[70vh] overflow-auto">
              <img
                src={previewFile.url}
                alt={previewFile.filename}
                className="max-w-full max-h-[65vh] object-contain rounded-lg"
              />
            </div>

            {/* URL display */}
            <div className="px-5 py-3 border-t border-[#e2e8f0] bg-[#f8fafc]">
              <div className="flex items-center gap-2">
                <code className="flex-1 text-[12px] text-[#64748b] bg-white border border-[#e2e8f0] rounded-md px-3 py-2 truncate">
                  {previewFile.url}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(previewFile.url, "_blank")}
                  className="text-[12px] shrink-0"
                >
                  <ExternalLink className="mr-1.5 h-3 w-3" />
                  Open
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}