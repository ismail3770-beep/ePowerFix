"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { Home, GripVertical, Trash2 } from "lucide-react";

interface Attribute {
  id?: string;
  name: string;
  slug: string;
  values: string[];
}

interface AttributeSet {
  id: string;
  name: string;
}

export function AttributeForm({ initialData }: { initialData?: Attribute }) {
  const router = useRouter();
  const isEdit = !!initialData?.id;

  const [activeTab, setActiveTab] = useState<"general" | "values">("general");
  const [saving, setSaving] = useState(false);
  
  const [form, setForm] = useState<Attribute>(
    initialData || {
      name: "",
      slug: "",
      values: [""],
    }
  );

  // Form fields not in DB but shown in UI
  const [attributeSetId, setAttributeSetId] = useState("");
  const [categories, setCategories] = useState("");
  const [filterable, setFilterable] = useState(false);

  const [attributeSets, setAttributeSets] = useState<AttributeSet[]>([]);

  useEffect(() => {
    async function loadSets() {
      try {
        const res = await apiFetch<{ data: AttributeSet[] }>("/api/admin/attribute-sets");
        setAttributeSets(res.data || []);
      } catch (err) {
        console.error("Failed to load attribute sets");
      }
    }
    loadSets();
  }, []);

  const generateSlug = (name: string) => name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  const save = async () => {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    try {
      const payload = { 
        name: form.name, 
        slug: form.slug || generateSlug(form.name), 
        values: form.values.filter(v => v.trim() !== ""),
      };
      
      if (isEdit) {
        await apiFetch(`/api/admin/attributes/${initialData.id}`, { method: "PUT", body: JSON.stringify(payload) });
        toast.success("Attribute updated successfully");
      } else {
        await apiFetch("/api/admin/attributes", { method: "POST", body: JSON.stringify(payload) });
        toast.success("Attribute created successfully");
        router.push("/admin/attributes");
      }
    } catch {
      toast.error("Failed to save attribute");
    } finally {
      setSaving(false);
    }
  };

  const addValue = () => setForm({ ...form, values: [...form.values, ""] });
  
  const updateValue = (index: number, val: string) => {
    const newValues = [...form.values];
    newValues[index] = val;
    setForm({ ...form, values: newValues });
  };
  
  const removeValue = (index: number) => {
    const newValues = form.values.filter((_, i) => i !== index);
    setForm({ ...form, values: newValues.length ? newValues : [""] });
  };

  return (
    <div className="font-poppins bg-[#f3f4f6] min-h-screen -m-6 p-6 text-slate-700">
      <div className="flex justify-between items-start mb-6">
        <h1 className="text-[22px] font-normal text-slate-800">{isEdit ? "Edit Attribute" : "Create Attribute"}</h1>
        <div className="flex items-center gap-2 text-[13px] text-slate-500">
          <Home className="w-3.5 h-3.5 cursor-pointer hover:text-blue-600" onClick={() => router.push("/admin/dashboard")} />
          <span className="text-slate-300">&gt;</span>
          <span className="cursor-pointer hover:text-blue-600" onClick={() => router.push("/admin/attributes")}>Attributes</span>
          <span className="text-slate-300">&gt;</span>
          <span>{isEdit ? "Edit Attribute" : "Create Attribute"}</span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Sidebar */}
        <div className="w-full lg:w-[280px] shrink-0">
          <div className="bg-white border border-slate-200 shadow-sm rounded-sm overflow-hidden">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 text-[14px] font-medium text-slate-700">
              Attribute Information
            </div>
            <div className="flex flex-col p-2 gap-1">
              <button 
                className={`text-left px-4 py-2 text-[13px] rounded-sm transition-colors ${activeTab === 'general' ? 'bg-slate-100 text-slate-800 font-medium border-l-[3px] border-l-[#0052cc]' : 'text-slate-600 hover:bg-slate-50 border-l-[3px] border-l-transparent'}`}
                onClick={() => setActiveTab('general')}
              >
                General
              </button>
              <button 
                className={`text-left px-4 py-2 text-[13px] rounded-sm transition-colors ${activeTab === 'values' ? 'bg-slate-100 text-slate-800 font-medium border-l-[3px] border-l-[#0052cc]' : 'text-slate-600 hover:bg-slate-50 border-l-[3px] border-l-transparent'}`}
                onClick={() => setActiveTab('values')}
              >
                Values
              </button>
            </div>
          </div>
        </div>

        {/* Right Content */}
        <div className="flex-1 bg-white border border-slate-200 shadow-sm rounded-sm min-h-[400px] flex flex-col">
          {/* Tab Header */}
          <div className="px-6 py-4 border-b border-slate-100 text-[16px] font-medium text-slate-700">
            {activeTab === 'general' && "General"}
            {activeTab === 'values' && "Values"}
          </div>
          
          <div className="p-6 flex-1">
            {activeTab === 'general' && (
              <div className="space-y-6 max-w-[600px]">
                <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                  <label className="text-[13px] font-medium text-slate-700">Attribute Set <span className="text-red-500">*</span></label>
                  <select 
                    value={attributeSetId}
                    onChange={(e) => setAttributeSetId(e.target.value)}
                    className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500 bg-white"
                  >
                    <option value="">Please Select</option>
                    {attributeSets.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                  <label className="text-[13px] font-medium text-slate-700">Name <span className="text-red-500">*</span></label>
                  <input 
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500" 
                  />
                </div>

                <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                  <label className="text-[13px] font-medium text-slate-700">Categories</label>
                  <input 
                    type="text"
                    value={categories}
                    onChange={(e) => setCategories(e.target.value)}
                    className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500" 
                  />
                </div>
                
                <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                  <label className="text-[13px] font-medium text-slate-700">URL <span className="text-red-500">*</span></label>
                  <input 
                    type="text"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500" 
                  />
                </div>

                <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                  <label className="text-[13px] font-medium text-slate-700">Filterable</label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={filterable}
                      onChange={(e) => setFilterable(e.target.checked)}
                      className="rounded-sm border-slate-300 text-blue-600 focus:ring-0" 
                    />
                    <span className="text-[13px] text-slate-600">Use this attribute for filtering products</span>
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
            )}

            {activeTab === 'values' && (
              <div className="space-y-6 max-w-[800px]">
                <div className="border border-slate-200 rounded-sm">
                  <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 text-[13px] font-medium text-slate-600">
                    Value
                  </div>
                  <div className="p-4 space-y-3">
                    {form.values.map((val, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <GripVertical className="w-4 h-4 text-slate-400 cursor-move shrink-0" />
                        <input 
                          type="text"
                          value={val}
                          onChange={(e) => updateValue(i, e.target.value)}
                          className="h-9 flex-1 text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500"
                        />
                        <button 
                          onClick={() => removeValue(i)}
                          className="w-9 h-9 flex items-center justify-center border border-slate-200 rounded-sm bg-slate-50 text-slate-500 hover:text-red-500 hover:bg-red-50 shrink-0 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-4 items-start">
                  <button 
                    onClick={addValue}
                    className="bg-[#f1f1f1] hover:bg-[#e2e2e2] text-slate-700 px-4 py-1.5 rounded-sm text-[13px] font-medium transition-colors"
                  >
                    Add New Value
                  </button>
                  <button 
                    onClick={save}
                    disabled={saving}
                    className="bg-[#0052cc] hover:bg-[#0047b3] text-white px-6 py-2 rounded-sm text-[13px] font-medium transition-colors"
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
