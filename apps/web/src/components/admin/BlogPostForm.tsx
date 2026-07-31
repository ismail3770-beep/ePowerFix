"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { Home, X, Image as ImageIcon } from "lucide-react";

export function BlogPostForm({ initialData = null }: { initialData?: any }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  
  const [form, setForm] = useState({
    title: initialData?.title || "",
    content: initialData?.content || "",
    slug: initialData?.slug || "",
    metaTitle: initialData?.metaTitle || "",
    metaDescription: initialData?.metaDescription || "",
    featuredImage: initialData?.featuredImage || initialData?.imageUrl || "",
    isPublished: initialData?.isPublished ?? true,
    categoryId: initialData?.categoryId || "",
    tags: initialData?.tags || [],
  });

  const [tagInput, setTagInput] = useState("");

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!form.tags.includes(tagInput.trim())) {
        setForm({ ...form, tags: [...form.tags, tagInput.trim()] });
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setForm({ ...form, tags: form.tags.filter((t: string) => t !== tagToRemove) });
  };

  const save = async (exit: boolean = true) => {
    if (!form.title) {
      toast.error("Title is required");
      return;
    }

    setSaving(true);
    try {
      if (initialData) {
        await apiFetch(`/api/admin/blog/${initialData.id}`, { method: "PUT", body: JSON.stringify(form) });
        toast.success("Blog post updated");
      } else {
        await apiFetch(`/api/admin/blog`, { method: "POST", body: JSON.stringify(form) });
        toast.success("Blog post created");
      }
      if (exit) {
        router.push("/admin/blog");
      }
    } catch {
      toast.error("Failed to save blog post");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="font-poppins bg-[#f3f4f6] min-h-screen -m-6 p-6 text-slate-700">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-[22px] font-normal text-slate-800">{initialData ? "Edit Blog Post" : "Create Blog Post"}</h1>
        </div>
        <div className="flex items-center gap-2 text-[13px] text-slate-500">
          <Home className="w-3.5 h-3.5 cursor-pointer hover:text-blue-600" onClick={() => router.push("/admin/dashboard")} />
          <span className="text-slate-300">&gt;</span>
          <span className="cursor-pointer hover:text-blue-600" onClick={() => router.push("/admin/blog")}>Blog Posts</span>
          <span className="text-slate-300">&gt;</span>
          <span>{initialData ? "Edit Blog Post" : "Create Blog Post"}</span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start pb-20">
        
        {/* Left Column */}
        <div className="flex-1 flex flex-col gap-6 w-full">
          
          {/* General Section */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-sm">
            <div className="px-4 py-3 border-b border-slate-100 text-[15px] font-medium text-slate-700">
              General
            </div>
            <div className="p-5 space-y-5">
              <div>
                <label className="text-[13px] font-medium text-slate-700 block mb-1">Title <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500" 
                  placeholder="Enter title"
                />
              </div>

              <div>
                <label className="text-[13px] font-medium text-slate-700 block mb-1">Description <span className="text-red-500">*</span></label>
                <div className="border border-slate-300 rounded-sm overflow-hidden flex flex-col">
                  {/* Mock Editor Toolbar */}
                  <div className="bg-[#f9fafb] border-b border-slate-300 px-2 py-1.5 flex items-center gap-1 flex-wrap text-slate-600">
                    <select className="text-[13px] bg-transparent border-none outline-none mr-2">
                      <option>Paragraph</option>
                      <option>Heading 1</option>
                      <option>Heading 2</option>
                    </select>
                    <div className="w-[1px] h-4 bg-slate-300 mx-1"></div>
                    <button className="p-1 hover:bg-slate-200 rounded font-serif font-bold w-7 h-7 flex items-center justify-center">B</button>
                    <button className="p-1 hover:bg-slate-200 rounded font-serif italic w-7 h-7 flex items-center justify-center">I</button>
                    <button className="p-1 hover:bg-slate-200 rounded underline w-7 h-7 flex items-center justify-center">U</button>
                    <button className="p-1 hover:bg-slate-200 rounded line-through w-7 h-7 flex items-center justify-center">S</button>
                  </div>
                  <textarea 
                    value={form.content}
                    onChange={e => setForm({ ...form, content: e.target.value })}
                    className="w-full min-h-[300px] text-[14px] p-4 outline-none resize-y text-slate-600 leading-relaxed" 
                    placeholder="Write your blog content here..."
                  />
                  <div className="bg-[#f9fafb] border-t border-slate-300 px-3 py-1 flex justify-between items-center text-[11px] text-slate-500">
                    <span>P</span>
                    <span>{form.content.split(/\s+/).filter(Boolean).length} WORDS</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SEO Section */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-sm">
            <div className="px-4 py-3 border-b border-slate-100 text-[15px] font-medium text-slate-700">
              SEO
            </div>
            <div className="p-5 space-y-5">
              <div>
                <label className="text-[13px] font-medium text-slate-700 block mb-1">URL</label>
                <input 
                  type="text" 
                  value={form.slug}
                  onChange={e => setForm({ ...form, slug: e.target.value })}
                  className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500" 
                />
              </div>
              <div>
                <label className="text-[13px] font-medium text-slate-700 block mb-1">Meta Title</label>
                <input 
                  type="text" 
                  value={form.metaTitle}
                  onChange={e => setForm({ ...form, metaTitle: e.target.value })}
                  className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500" 
                />
              </div>
              <div>
                <label className="text-[13px] font-medium text-slate-700 block mb-1">Meta Description</label>
                <textarea 
                  value={form.metaDescription}
                  onChange={e => setForm({ ...form, metaDescription: e.target.value })}
                  className="w-full h-24 text-[13px] rounded-sm border border-slate-300 p-3 outline-none focus:border-blue-500 resize-y" 
                />
              </div>
            </div>
          </div>

        </div>

        {/* Right Column */}
        <div className="w-full lg:w-[320px] shrink-0 flex flex-col gap-6">
          
          {/* Featured Image */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-sm">
            <div className="px-4 py-3 border-b border-slate-100 text-[14px] font-medium text-slate-700">
              Featured Image
            </div>
            <div className="p-4">
              <div className="w-[120px] h-[120px] border-2 border-dashed border-slate-300 rounded-md flex flex-col items-center justify-center text-slate-400 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors relative overflow-hidden">
                {form.featuredImage ? (
                  <>
                    <img src={form.featuredImage} alt="Featured" className="w-full h-full object-cover" />
                    <button 
                      onClick={(e) => { e.stopPropagation(); setForm({ ...form, featuredImage: "" }); }}
                      className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-sm text-slate-500 hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </>
                ) : (
                  <ImageIcon className="w-10 h-10 mb-2 opacity-50" />
                )}
              </div>
            </div>
          </div>

          {/* Publish */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-sm">
            <div className="px-4 py-3 border-b border-slate-100 text-[14px] font-medium text-slate-700">
              Publish
            </div>
            <div className="p-4">
              <label className="text-[12px] font-medium text-slate-600 block mb-1">Publish Status <span className="text-red-500">*</span></label>
              <select 
                value={form.isPublished ? "Published" : "Draft"}
                onChange={e => setForm({ ...form, isPublished: e.target.value === "Published" })}
                className="w-full text-[13px] border border-slate-300 rounded-sm px-3 py-2 outline-none focus:border-blue-500 bg-white"
              >
                <option value="Published">Published</option>
                <option value="Draft">Draft</option>
              </select>
            </div>
          </div>

          {/* Categories */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-sm">
            <div className="px-4 py-3 border-b border-slate-100 text-[14px] font-medium text-slate-700">
              Categories
            </div>
            <div className="p-4">
              <label className="text-[12px] font-medium text-slate-600 block mb-1">Select Category</label>
              <select 
                value={form.categoryId}
                onChange={e => setForm({ ...form, categoryId: e.target.value })}
                className="w-full text-[13px] border border-slate-300 rounded-sm px-3 py-2 outline-none focus:border-blue-500 bg-white"
              >
                <option value="">Please Select</option>
                <option value="Testimonials">Testimonials</option>
                <option value="News">News</option>
                <option value="Tips">Tips</option>
              </select>
            </div>
          </div>

          {/* Tags */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-sm">
            <div className="px-4 py-3 border-b border-slate-100 text-[14px] font-medium text-slate-700">
              Tags
            </div>
            <div className="p-4">
              <label className="text-[12px] font-medium text-slate-600 block mb-1">Add Tags</label>
              <div className="border border-slate-300 rounded-sm p-2 flex flex-wrap gap-2 min-h-[40px] focus-within:border-blue-500">
                {form.tags.map((tag: string) => (
                  <span key={tag} className="flex items-center gap-1 bg-[#f1f5f9] border border-slate-200 px-2 py-0.5 rounded text-[12px] text-slate-700">
                    {tag}
                    <X 
                      className="w-3 h-3 cursor-pointer text-slate-400 hover:text-red-500" 
                      onClick={() => handleRemoveTag(tag)}
                    />
                  </span>
                ))}
                <input 
                  type="text" 
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  className="flex-1 outline-none text-[13px] min-w-[80px]"
                  placeholder={form.tags.length === 0 ? "Type and press enter" : ""}
                />
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Sticky Action Bar */}
      <div className="fixed bottom-0 left-[260px] right-0 bg-white border-t border-slate-200 px-6 py-3 flex justify-end gap-3 z-10">
        <button 
          onClick={() => save(true)}
          disabled={saving}
          className="px-4 py-1.5 border border-slate-300 rounded-sm text-[13px] text-slate-700 font-medium hover:bg-slate-50 transition-colors"
        >
          Save
        </button>
        <button 
          onClick={() => save(false)}
          disabled={saving}
          className="px-4 py-1.5 border border-blue-600 text-blue-600 rounded-sm text-[13px] font-medium hover:bg-blue-50 transition-colors"
        >
          Save & Edit
        </button>
        <button 
          onClick={() => save(true)}
          disabled={saving}
          className="px-4 py-1.5 bg-[#0052cc] text-white rounded-sm text-[13px] font-medium hover:bg-[#0047b3] transition-colors"
        >
          Save & Exit
        </button>
      </div>
    </div>
  );
}
