"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { Home } from "lucide-react";

interface ReviewData {
  id: string;
  rating: number;
  comment: string;
  status: string;
  user?: {
    name?: string;
  };
}

export function ReviewForm({ initialData }: { initialData: ReviewData }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  
  const [form, setForm] = useState({
    rating: initialData.rating || 5,
    reviewerName: initialData.user?.name || "",
    comment: initialData.comment || "",
    approved: initialData.status === "APPROVED",
  });

  const save = async () => {
    if (!form.comment.trim()) {
      toast.error("Comment is required");
      return;
    }
    
    setSaving(true);
    try {
      const payload = { 
        rating: Number(form.rating),
        comment: form.comment,
        status: form.approved ? "APPROVED" : "PENDING"
      };
      
      await apiFetch(`/api/admin/reviews/${initialData.id}`, { method: "PUT", body: JSON.stringify(payload) });
      toast.success("Review updated successfully");
      router.push("/admin/reviews");
    } catch {
      toast.error("Failed to update review");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="font-poppins bg-[#f3f4f6] min-h-screen -m-6 p-6 text-slate-700">
      <div className="flex justify-between items-start mb-6">
        <h1 className="text-[22px] font-normal text-slate-800">Edit Review</h1>
        <div className="flex items-center gap-2 text-[13px] text-slate-500">
          <Home className="w-3.5 h-3.5 cursor-pointer hover:text-blue-600" onClick={() => router.push("/admin/dashboard")} />
          <span className="text-slate-300">&gt;</span>
          <span className="cursor-pointer hover:text-blue-600" onClick={() => router.push("/admin/reviews")}>Reviews</span>
          <span className="text-slate-300">&gt;</span>
          <span>Edit Review</span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Sidebar */}
        <div className="w-full lg:w-[280px] shrink-0">
          <div className="bg-white border border-slate-200 shadow-sm rounded-sm overflow-hidden">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 text-[14px] font-medium text-slate-700">
              Review Information
            </div>
            <div className="flex flex-col p-2 gap-1">
              <button className="text-left px-4 py-2 text-[13px] rounded-sm transition-colors bg-slate-100 text-slate-800 font-medium border-l-[3px] border-l-[#0052cc]">
                General
              </button>
            </div>
          </div>
        </div>

        {/* Right Content */}
        <div className="flex-1 bg-white border border-slate-200 shadow-sm rounded-sm min-h-[400px] flex flex-col">
          {/* Tab Header */}
          <div className="px-6 py-4 border-b border-slate-100 text-[16px] font-medium text-slate-700">
            General
          </div>
          
          <div className="p-6 flex-1">
            <div className="space-y-6 max-w-[600px]">
              <div className="grid grid-cols-[140px_1fr] items-start gap-4 pt-1">
                <label className="text-[13px] font-medium text-slate-700">Rating <span className="text-red-500">*</span></label>
                <select 
                  value={form.rating}
                  onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}
                  className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500 bg-white" 
                >
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={4}>4</option>
                  <option value={5}>5</option>
                </select>
              </div>

              <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                <label className="text-[13px] font-medium text-slate-700">Reviewer Name <span className="text-red-500">*</span></label>
                <input 
                  type="text"
                  value={form.reviewerName}
                  disabled
                  className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none bg-slate-50 text-slate-500 cursor-not-allowed" 
                />
              </div>
              
              <div className="grid grid-cols-[140px_1fr] items-start gap-4">
                <label className="text-[13px] font-medium text-slate-700 pt-2">Comment <span className="text-red-500">*</span></label>
                <textarea 
                  value={form.comment}
                  onChange={(e) => setForm({ ...form, comment: e.target.value })}
                  rows={6}
                  className="w-full text-[13px] rounded-sm border border-slate-300 p-3 outline-none focus:border-blue-500 resize-y" 
                />
              </div>

              <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                <label className="text-[13px] font-medium text-slate-700">Status</label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={form.approved}
                    onChange={(e) => setForm({ ...form, approved: e.target.checked })}
                    className="rounded-sm border-slate-300 text-blue-600 focus:ring-0 w-4 h-4" 
                  />
                  <span className="text-[13px] text-slate-600">Approve this review</span>
                </label>
              </div>
              
              <div className="pt-4 grid grid-cols-[140px_1fr] gap-4">
                <div></div>
                <button 
                  onClick={save}
                  disabled={saving}
                  className="bg-[#0052cc] hover:bg-[#0047b3] text-white px-6 py-2 rounded-sm text-[13px] font-medium transition-colors w-fit"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
