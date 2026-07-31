"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { SingleImageUploader } from "@/components/ImageUploader";
import { Folder, FolderOpen, ChevronRight, ChevronDown, File } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
  parentId: string | null;
  isActive: boolean;
  image: string | null;
}

interface TreeNode extends Category {
  children: TreeNode[];
}

export default function CategoriesPage() {
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Tree state
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState<{
    id?: string;
    name: string;
    isActive: boolean;
    parentId: string | null;
    image: string | null;
    icon: string | null;
  }>({ name: "", isActive: true, parentId: null, image: null, icon: null });
  
  const [saving, setSaving] = useState(false);
  
  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Tabs state for the right pane
  const [activeTab, setActiveTab] = useState<"general" | "image" | "seo">("general");

  const load = async () => {
    try {
      const res = await apiFetch<{ data: Category[] }>("/api/admin/categories");
      setCats(Array.isArray(res.data) ? res.data : (res.data as any)?.data || []);
    } catch {
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Build tree from flat array
  const tree = useMemo(() => {
    const map = new Map<string, TreeNode>();
    const roots: TreeNode[] = [];

    cats.forEach((cat) => {
      map.set(cat.id, { ...cat, children: [] });
    });

    cats.forEach((cat) => {
      const node = map.get(cat.id);
      if (node) {
        if (cat.parentId && map.has(cat.parentId)) {
          map.get(cat.parentId)!.children.push(node);
        } else {
          roots.push(node);
        }
      }
    });

    return roots;
  }, [cats]);

  const handleAddRoot = () => {
    setSelectedNodeId(null);
    setForm({ name: "", isActive: true, parentId: null, image: null, icon: null });
    setActiveTab("general");
  };

  const handleAddSub = () => {
    if (!selectedNodeId) {
      toast.error("Please select a category first to add a subcategory.");
      return;
    }
    const parentId = selectedNodeId;
    setSelectedNodeId(null);
    setForm({ name: "", isActive: true, parentId, image: null, icon: null });
    setActiveTab("general");
    
    // Auto-expand the parent so the new child will be visible when saved
    setExpandedNodes(prev => {
      const next = new Set(prev);
      next.add(parentId);
      return next;
    });
  };

  const handleSelectNode = (node: Category) => {
    setSelectedNodeId(node.id);
    setForm({
      id: node.id,
      name: node.name,
      isActive: node.isActive ?? true,
      parentId: node.parentId,
      image: node.image || null,
      icon: node.icon || null,
    });
  };

  const toggleExpand = (id: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    const allIds = cats.map(c => c.id);
    setExpandedNodes(new Set(allIds));
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  const save = async () => {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    try {
      const payload: any = {
        name: form.name,
        isActive: form.isActive,
        parentId: form.parentId || "",
        image: form.image || "",
        icon: form.icon || "",
      };

      if (form.id) {
        await apiFetch(`/api/admin/categories/${form.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        toast.success("Category updated successfully");
      } else {
        const res = await apiFetch<{ data: Category }>("/api/admin/categories", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.success("Category created successfully");
        if (res.data) {
          setSelectedNodeId(res.data.id);
          setForm({ ...form, id: res.data.id });
        }
      }
      load();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save category");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/admin/categories/${deleteTarget}`, { method: "DELETE" });
      toast.success("Category deleted");
      if (selectedNodeId === deleteTarget) {
        handleAddRoot();
      }
      setDeleteTarget(null);
      load();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete category");
    } finally {
      setDeleting(false);
    }
  };

  // Recursive Tree Node Renderer
  const renderTree = (nodes: TreeNode[], level = 0) => {
    return (
      <ul className={`space-y-1 ${level > 0 ? "ml-4 border-l border-dotted border-slate-300 pl-2" : ""}`}>
        {nodes.map((node, index) => {
          const isExpanded = expandedNodes.has(node.id);
          const isSelected = selectedNodeId === node.id;
          const hasChildren = node.children && node.children.length > 0;
          const isLast = index === nodes.length - 1;

          return (
            <li key={node.id} className="relative">
              {level > 0 && (
                <div 
                  className="absolute left-[-9px] top-[14px] w-2 border-t border-dotted border-slate-300" 
                />
              )}
              <div
                className={`flex items-center gap-1.5 py-1 px-2 rounded-sm cursor-pointer select-none transition-colors
                  ${isSelected ? "bg-blue-50 text-blue-600 font-medium" : "text-slate-700 hover:bg-slate-50"}
                `}
                onClick={() => handleSelectNode(node)}
              >
                {/* Expander Icon */}
                <div 
                  className="w-4 h-4 flex items-center justify-center text-slate-400 shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (hasChildren) toggleExpand(node.id);
                  }}
                >
                  {hasChildren ? (
                    <span className="text-lg leading-none mb-1 font-mono cursor-pointer hover:text-slate-600">
                      {isExpanded ? "-" : "+"}
                    </span>
                  ) : (
                    <span className="w-4" />
                  )}
                </div>

                {/* Folder/File Icon */}
                {hasChildren ? (
                  isExpanded ? (
                    <FolderOpen className="h-4 w-4 text-yellow-400 fill-yellow-400/20 shrink-0" />
                  ) : (
                    <Folder className="h-4 w-4 text-yellow-400 fill-yellow-400/20 shrink-0" />
                  )
                ) : (
                  <File className="h-4 w-4 text-slate-300 shrink-0" />
                )}

                <span className="text-[14px] truncate">{node.name}</span>
              </div>

              {hasChildren && isExpanded && (
                <div className="mt-1">
                  {renderTree(node.children, level + 1)}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className="font-poppins bg-[#f3f4f6] min-h-screen -m-6 p-6 text-slate-700">
      <div className="mb-6">
        <h1 className="text-2xl font-normal text-slate-800">Categories</h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start h-[calc(100vh-140px)]">
        
        {/* LEFT PANE: Tree View */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-md p-5 w-full lg:w-[350px] shrink-0 h-full flex flex-col">
          <div className="flex flex-col gap-2 mb-4 items-start">
            <Button 
              type="button" 
              variant="outline" 
              className="h-8 text-[13px] bg-white border-slate-300 text-slate-700 hover:bg-slate-50 rounded font-normal px-4"
              onClick={handleAddRoot}
            >
              Add Root Category
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              className="h-8 text-[13px] bg-white border-slate-300 text-slate-700 hover:bg-slate-50 rounded font-normal px-4"
              onClick={handleAddSub}
            >
              Add Subcategory
            </Button>
          </div>
          <div className="flex gap-2 text-[13px] text-blue-600 mb-4 font-medium">
            <span className="cursor-pointer hover:underline" onClick={collapseAll}>Collapse All</span>
            <span className="text-slate-300">|</span>
            <span className="cursor-pointer hover:underline" onClick={expandAll}>Expand All</span>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 -ml-4 border-t border-slate-100 pt-2">
            {loading ? (
              <div className="text-sm text-slate-400 p-4">Loading categories...</div>
            ) : tree.length > 0 ? (
              renderTree(tree)
            ) : (
              <div className="text-sm text-slate-400 p-4">No categories found.</div>
            )}
          </div>
        </div>

        {/* RIGHT PANE: Edit Form */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-md flex-1 h-full flex flex-col">
          <div className="flex border-b border-slate-200 px-4 pt-4 gap-1">
            <button
              className={`px-5 py-2.5 text-[14px] font-medium border-t-2 border-l border-r rounded-t-md transition-colors translate-y-[1px]
                ${activeTab === 'general' 
                  ? 'border-t-[#0052cc] border-l-slate-200 border-r-slate-200 border-b-transparent bg-white text-slate-800' 
                  : 'border-transparent bg-transparent text-slate-500 hover:text-slate-700'}`}
              onClick={() => setActiveTab('general')}
            >
              General
            </button>
            <button
              className={`px-5 py-2.5 text-[14px] font-medium border-t-2 border-l border-r rounded-t-md transition-colors translate-y-[1px]
                ${activeTab === 'image' 
                  ? 'border-t-[#0052cc] border-l-slate-200 border-r-slate-200 border-b-transparent bg-white text-slate-800' 
                  : 'border-transparent bg-transparent text-slate-500 hover:text-slate-700'}`}
              onClick={() => setActiveTab('image')}
            >
              Image
            </button>
            <button
              className={`px-5 py-2.5 text-[14px] font-medium border-t-2 border-l border-r rounded-t-md transition-colors translate-y-[1px]
                ${activeTab === 'seo' 
                  ? 'border-t-[#0052cc] border-l-slate-200 border-r-slate-200 border-b-transparent bg-white text-slate-800' 
                  : 'border-transparent bg-transparent text-slate-500 hover:text-slate-700'}`}
              onClick={() => setActiveTab('seo')}
            >
              SEO
            </button>
          </div>

          <div className="p-8 flex-1 overflow-y-auto">
            {activeTab === 'general' && (
              <div className="space-y-6 max-w-[700px]">
                <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                  <Label className="text-[14px] font-medium text-slate-700">ID</Label>
                  <Input value={form.id || ""} readOnly className="h-10 text-[14px] rounded border-slate-200 bg-slate-50 text-slate-500 focus-visible:ring-0 cursor-default" />
                </div>
                
                <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                  <Label className="text-[14px] font-medium text-slate-700">Name <span className="text-red-500">*</span></Label>
                  <Input 
                    value={form.name} 
                    onChange={(e) => setForm({ ...form, name: e.target.value })} 
                    className="h-10 text-[14px] rounded-sm border-slate-300 focus-visible:ring-1 focus-visible:ring-blue-500" 
                  />
                </div>

                <div className="grid grid-cols-[140px_1fr] items-center gap-4 pt-2">
                  <Label className="text-[14px] font-medium text-slate-700">Searchable</Label>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="searchable" defaultChecked className="h-5 w-5 border-slate-300 rounded-[3px] text-blue-600" />
                    <Label htmlFor="searchable" className="text-[14px] font-normal text-slate-600 cursor-pointer">Show this category in search box category list.</Label>
                  </div>
                </div>

                <div className="grid grid-cols-[140px_1fr] items-center gap-4 pt-2">
                  <Label className="text-[14px] font-medium text-slate-700">Status</Label>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="isActive" 
                      checked={form.isActive} 
                      onCheckedChange={(v) => setForm({ ...form, isActive: v as boolean })}
                      className="h-5 w-5 border-slate-300 rounded-[3px] text-blue-600" 
                    />
                    <Label htmlFor="isActive" className="text-[14px] font-normal text-slate-600 cursor-pointer">Enable the category</Label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'image' && (
              <div className="max-w-[400px] space-y-8">
                <FleetImageUploader
                  value={form.icon || ""}
                  onChange={(url) => setForm({ ...form, icon: url })}
                  label="Logo"
                />
                <FleetImageUploader
                  value={form.image || ""}
                  onChange={(url) => setForm({ ...form, image: url })}
                  label="Banner"
                />
              </div>
            )}

            {activeTab === 'seo' && (
              <div className="max-w-[600px] space-y-6">
                <div className="bg-blue-50/50 border border-blue-200 text-[#0052cc] text-[14px] p-4 rounded-sm flex items-center">
                  Note: SEO fields are present in the UI but require a database schema update to be saved permanently.
                </div>
                <div className="grid grid-cols-[140px_1fr] items-start gap-4">
                  <Label className="text-[14px] font-medium text-slate-700 pt-2">Meta Title</Label>
                  <Input className="h-10 text-[14px] rounded-sm border-slate-300 focus-visible:ring-1 focus-visible:ring-blue-500" />
                </div>
                <div className="grid grid-cols-[140px_1fr] items-start gap-4">
                  <Label className="text-[14px] font-medium text-slate-700 pt-2">Meta Description</Label>
                  <textarea rows={4} className="w-full text-[14px] rounded-sm border border-slate-300 focus-visible:ring-1 focus-visible:ring-blue-500 p-3 resize-y outline-none" />
                </div>
              </div>
            )}
          </div>

          <div className="p-8 pt-0 flex gap-4">
            <Button 
              type="button"
              className="h-10 px-8 bg-[#0052cc] hover:bg-[#0047b3] text-white text-[14px] font-medium rounded shadow-sm"
              onClick={save}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save"}
            </Button>
            {form.id && (
              <button 
                type="button"
                className="text-red-500 hover:text-red-600 text-[14px] font-medium px-2"
                onClick={() => setDeleteTarget(form.id!)}
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete category?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this category? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={remove} disabled={deleting} className="bg-red-600 hover:bg-red-700">
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function FleetImageUploader({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (url: string) => void;
  label: string;
}) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-medium text-slate-800">{label}</h3>
      <div>
        <label className="inline-flex items-center justify-center gap-2 px-3 py-1.5 bg-[#f1f1f1] hover:bg-[#e2e2e2] text-slate-700 rounded-md cursor-pointer transition-colors text-[14px] font-medium">
          <Folder className="w-4 h-4 text-slate-500" />
          {uploading ? "Uploading..." : "Browse"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploading}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              if (file.size > 5 * 1024 * 1024) {
                toast.error("File too large (max 5MB)");
                return;
              }
              setUploading(true);
              const formData = new FormData();
              formData.append("file", file);
              try {
                const res = await fetch("/api/admin/upload", {
                  method: "POST",
                  body: formData,
                });
                const json = await res.json();
                if (json.data?.url) {
                  onChange(json.data.url);
                } else {
                  throw new Error("Upload failed");
                }
              } catch (err: any) {
                toast.error("Failed to upload image");
              } finally {
                setUploading(false);
                if (e.target) e.target.value = "";
              }
            }}
          />
        </label>
      </div>

      <div className="w-[140px] h-[140px] bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center overflow-hidden relative group">
        {value ? (
          <>
            <img src={value} alt={label} className="w-full h-full object-cover" />
            <div 
              className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              onClick={() => onChange("")}
            >
              <span className="text-white text-xs font-medium bg-red-600 px-2 py-1 rounded">Remove</span>
            </div>
          </>
        ) : (
          <div className="w-16 h-16 bg-slate-200/50 rounded-md flex flex-col items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300">
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
              <circle cx="9" cy="9" r="2"/>
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}
