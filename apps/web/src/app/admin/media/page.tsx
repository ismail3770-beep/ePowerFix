"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Home, Trash2, Search, ArrowUpDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, UploadCloud } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { apiFetch } from "@/lib/api";

interface MediaItem {
  id: string;
  thumbnail: string;
  filename: string;
  createdAt: string;
}

export default function MediaPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [perPage, setPerPage] = useState("20");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState(false);

  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMedia = async () => {
    try {
      const res = await apiFetch<any>("/api/admin/media");
      if (res?.data) {
        setMediaList(res.data);
      }
    } catch (e) {
      toast.error("Failed to load media");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedia();
  }, []);

  const removeBulk = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.size} media file(s)?`)) return;
    
    try {
      setLoading(true);
      await Promise.all(
        Array.from(selectedIds).map(id => {
          const m = mediaList.find(m => m.id === id);
          if (m) {
            // we delete by filename according to upload route: DELETE /api/admin/upload/:filename
            const encodedFilename = encodeURIComponent(m.filename);
            return apiFetch(`/api/admin/upload/${encodedFilename}`, { method: "DELETE" });
          }
          return Promise.resolve();
        })
      );
      toast.success(`${selectedIds.size} file(s) deleted successfully`);
      setSelectedIds(new Set());
      loadMedia();
    } catch (error) {
      toast.error("Failed to delete some files");
      loadMedia();
    }
  };

  const filtered = mediaList.filter((m) => {
    const term = search.toLowerCase();
    return m.filename.toLowerCase().includes(term);
  });

  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(filtered.map(m => m.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const uploadFiles = async (files: FileList) => {
    setLoading(true);
    let uploadedCount = 0;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append("file", file);
      try {
        await apiFetch("/api/admin/upload", {
          method: "POST",
          body: formData as any,
          headers: {} // Need to override content-type to let browser set boundary
        });
        uploadedCount++;
      } catch (e) {
        toast.error(`Failed to upload ${file.name}`);
      }
    }
    if (uploadedCount > 0) {
      toast.success(`${uploadedCount} file(s) uploaded successfully`);
      loadMedia();
    } else {
      setLoading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadFiles(e.dataTransfer.files);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadFiles(e.target.files);
    }
  };

  return (
    <div className="font-poppins bg-[#f3f4f6] min-h-screen -m-6 p-6 text-slate-700">
      
      {/* Header section */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-[22px] font-normal text-slate-800">Media</h1>
        </div>
        <div className="flex items-center gap-2 text-[13px] text-slate-500">
          <Home className="w-3.5 h-3.5 cursor-pointer hover:text-blue-600" onClick={() => router.push("/admin/dashboard")} />
          <span className="text-slate-300">&gt;</span>
          <span>Media</span>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-sm">
        
        {/* Dropzone */}
        <div className="p-6 border-b border-slate-100">
          <label 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center w-full h-[200px] border-2 border-dashed rounded-sm cursor-pointer transition-colors
              ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'}`}
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6 text-slate-500">
              <p className="text-[14px] font-medium">Drop files here or click to upload</p>
            </div>
            <input 
              type="file" 
              className="hidden" 
              multiple 
              onChange={handleFileChange}
            />
          </label>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-center p-4 border-b border-slate-100 gap-4">
          <div className="flex items-center gap-2 text-[13px] text-slate-600">
            Show
            <select 
              value={perPage} 
              onChange={e => setPerPage(e.target.value)}
              className="border border-slate-300 rounded px-2 py-1.5 bg-white outline-none focus:border-blue-400"
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
            entries
            <button 
              className={`flex items-center gap-1 border border-slate-300 rounded px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 ml-2 transition-colors ${selectedIds.size === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={selectedIds.size === 0}
              onClick={removeBulk}
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search here..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="border border-slate-300 rounded-full pl-9 pr-4 py-1.5 text-[13px] w-[260px] outline-none focus:border-blue-400 transition-colors" 
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead className="bg-[#f9fafb] text-[13px] text-slate-600 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 w-10 font-medium">
                  <input 
                    type="checkbox" 
                    className="rounded-sm border-slate-300"
                    checked={filtered.length > 0 && selectedIds.size === filtered.length}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="px-6 py-3 font-medium w-24">
                  <div className="flex items-center gap-1 cursor-pointer group">
                    ID <ArrowUpDown className="w-3 h-3 text-slate-300 group-hover:text-slate-500" />
                  </div>
                </th>
                <th className="px-6 py-3 font-medium w-32">Thumbnail</th>
                <th className="px-6 py-3 font-medium min-w-[300px]">Filename</th>
                <th className="px-6 py-3 font-medium w-48 text-right">
                  <div className="flex items-center justify-end gap-1 cursor-pointer group">
                    Created <ArrowUpDown className="w-3 h-3 text-slate-300 group-hover:text-slate-500" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-slate-500 text-[13px]">No media found.</td></tr>
              ) : (
                filtered.map((m) => (
                  <tr 
                    key={m.id} 
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors text-[13px] text-slate-700"
                  >
                    <td className="px-6 py-4">
                      <input 
                        type="checkbox" 
                        className="rounded-sm border-slate-300"
                        checked={selectedIds.has(m.id)}
                        onChange={() => toggleSelect(m.id)}
                      />
                    </td>
                    <td className="px-6 py-4 text-slate-500">{m.id}</td>
                    <td className="px-6 py-4">
                      <div className="w-10 h-10 flex items-center justify-center">
                        <img src={m.thumbnail} alt={m.filename} className="max-w-full max-h-full object-contain mix-blend-multiply" />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{m.filename}</td>
                    <td className="px-6 py-4 text-slate-500 text-right">
                      {m.createdAt ? formatDistanceToNow(new Date(m.createdAt), { addSuffix: true }) : 'Unknown'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer / Pagination */}
        <div className="flex justify-between items-center p-4 border-t border-slate-100 text-[13px] text-slate-500">
          <div>
            Showing 1 to {filtered.length} of {filtered.length} entries
          </div>
          <div className="flex items-center gap-1">
            <button className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-sm bg-slate-50 text-slate-400 hover:bg-slate-100 cursor-not-allowed">
              <ChevronsLeft className="w-3.5 h-3.5" />
            </button>
            <button className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-sm bg-slate-50 text-slate-400 hover:bg-slate-100 cursor-not-allowed">
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button className="w-8 h-8 flex items-center justify-center border border-[#0052cc] rounded-sm bg-[#0052cc] text-white">
              1
            </button>
            <button className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-sm bg-slate-50 text-slate-400 hover:bg-slate-100">
              2
            </button>
            <button className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-sm bg-slate-50 text-slate-400 hover:bg-slate-100">
              3
            </button>
            <button className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-sm bg-slate-50 text-slate-400 hover:bg-slate-100">
              4
            </button>
            <button className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-sm bg-slate-50 text-slate-400 hover:bg-slate-100">
              5
            </button>
            <span className="px-1 text-slate-400">...</span>
            <button className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-sm bg-slate-50 text-slate-400 hover:bg-slate-100">
              78
            </button>
            <button className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-sm bg-slate-50 text-slate-400 hover:bg-slate-100">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-sm bg-slate-50 text-slate-400 hover:bg-slate-100">
              <ChevronsRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}