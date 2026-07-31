"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { Home, Trash2, GripVertical } from "lucide-react";

interface Variation {
  id?: string;
  name: string;
  type: string;
  values: string[]; // backend stores array of strings
}

interface VariationValue {
  label: string;
  value: string;
}

export function VariationForm({ initialData }: { initialData?: Variation }) {
  const router = useRouter();
  const isEdit = !!initialData?.id;
  const [saving, setSaving] = useState(false);
  
  // Parse initial values
  const initialParsedValues: VariationValue[] = (initialData?.values || []).map(v => {
    try {
      const parsed = JSON.parse(v);
      return { label: parsed.label || "", value: parsed.value || "" };
    } catch {
      return { label: v, value: v };
    }
  });

  const [form, setForm] = useState<{name: string; type: string}>({
    name: initialData?.name || "",
    type: initialData?.type || "", // Will map to Color, Image, Text
  });

  const [values, setValues] = useState<VariationValue[]>(
    initialParsedValues.length ? initialParsedValues : [{ label: "", value: "" }]
  );

  const save = async () => {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!form.type) {
      toast.error("Type is required");
      return;
    }
    setSaving(true);
    try {
      // Serialize values back to string array
      const serializedValues = values
        .filter(v => v.label.trim() !== "")
        .map(v => JSON.stringify({ label: v.label, value: v.value }));

      const payload = { 
        name: form.name,
        type: form.type,
        values: serializedValues
      };
      
      if (isEdit) {
        await apiFetch(`/api/admin/variations/${initialData.id}`, { method: "PUT", body: JSON.stringify(payload) });
        toast.success("Variation updated successfully");
      } else {
        await apiFetch("/api/admin/variations", { method: "POST", body: JSON.stringify(payload) });
        toast.success("Variation created successfully");
        router.push("/admin/variations");
      }
    } catch {
      toast.error("Failed to save variation");
    } finally {
      setSaving(false);
    }
  };

  const addValue = () => setValues([...values, { label: "", value: "" }]);
  
  const updateValueRow = (index: number, field: "label" | "value", val: string) => {
    const newValues = [...values];
    newValues[index] = { ...newValues[index], [field]: val };
    setValues(newValues);
  };
  
  const removeValue = (index: number) => {
    const newValues = values.filter((_, i) => i !== index);
    setValues(newValues.length ? newValues : [{ label: "", value: "" }]);
  };

  const isColor = form.type === "Color";
  const valueHeader = isColor ? "Color" : form.type === "Image" ? "Image" : "Value";

  return (
    <div className="font-poppins bg-[#f3f4f6] min-h-screen -m-6 p-6 text-slate-700">
      <div className="flex justify-between items-start mb-6">
        <h1 className="text-[22px] font-normal text-slate-800">{isEdit ? "Edit Variation" : "Create Variation"}</h1>
        <div className="flex items-center gap-2 text-[13px] text-slate-500">
          <Home className="w-3.5 h-3.5 cursor-pointer hover:text-blue-600" onClick={() => router.push("/admin/dashboard")} />
          <span className="text-slate-300">&gt;</span>
          <span className="cursor-pointer hover:text-blue-600" onClick={() => router.push("/admin/variations")}>Variations</span>
          <span className="text-slate-300">&gt;</span>
          <span>{isEdit ? "Edit Variation" : "Create Variation"}</span>
        </div>
      </div>

      <div className="bg-white border border-slate-200 shadow-sm rounded-sm p-6 min-h-[400px]">
        {/* Top Section */}
        <div className="grid grid-cols-[140px_1fr] items-start gap-4 mb-8">
          <div className="text-[14px] font-medium text-slate-700 pt-2">General</div>
          <div className="flex gap-6 max-w-[800px]">
            <div className="flex-1">
              <label className="text-[12px] font-medium text-slate-600 block mb-1">Name <span className="text-red-500">*</span></label>
              <input 
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500" 
              />
            </div>
            <div className="flex-1">
              <label className="text-[12px] font-medium text-slate-600 block mb-1">Type <span className="text-red-500">*</span></label>
              <select 
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500 bg-white" 
              >
                <option value="">Please Select</option>
                <option value="Color">Color</option>
                <option value="Image">Image</option>
                <option value="Text">Text</option>
              </select>
            </div>
          </div>
        </div>

        {/* Values Section */}
        {form.type && (
          <div className="grid grid-cols-[140px_1fr] items-start gap-4">
            <div className="text-[14px] font-medium text-slate-700 pt-2">Values</div>
            <div className="max-w-[800px]">
              <div className="border border-slate-200 rounded-sm mb-4 overflow-hidden">
                <div className="bg-white flex px-4 py-2 border-b border-slate-200 text-[12px] font-medium text-slate-600">
                  <div className="w-8"></div>
                  <div className="flex-1">Label <span className="text-red-500">*</span></div>
                  <div className="flex-1 ml-4">{valueHeader} <span className="text-red-500">*</span></div>
                  <div className="w-10"></div>
                </div>
                <div className="p-4 space-y-3 bg-white">
                  {values.map((v, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <GripVertical className="w-4 h-4 text-slate-300 cursor-move shrink-0" />
                      
                      <div className="flex-1">
                        <input 
                          type="text"
                          value={v.label}
                          onChange={(e) => updateValueRow(i, "label", e.target.value)}
                          className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500"
                        />
                      </div>

                      <div className="flex-1 flex items-center gap-2">
                        <input 
                          type="text"
                          value={v.value}
                          onChange={(e) => updateValueRow(i, "value", e.target.value)}
                          className="h-9 flex-1 text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500"
                        />
                        {isColor && (
                          <div className="w-8 h-8 rounded-sm shrink-0 border border-slate-200 flex items-center justify-center overflow-hidden">
                            <input 
                              type="color" 
                              value={v.value || "#000000"} 
                              onChange={(e) => updateValueRow(i, "value", e.target.value)}
                              className="w-10 h-10 cursor-pointer border-none p-0 bg-transparent -m-2"
                            />
                          </div>
                        )}
                      </div>
                      
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
              
              <button 
                onClick={addValue}
                className="bg-[#f1f1f1] hover:bg-[#e2e2e2] text-slate-700 px-4 py-1.5 rounded-sm text-[13px] font-medium transition-colors"
              >
                Add Row
              </button>
            </div>
          </div>
        )}

        <div className="flex justify-end mt-8 border-t border-slate-100 pt-6">
          <button 
            onClick={save}
            disabled={saving}
            className="bg-[#0052cc] hover:bg-[#0047b3] text-white px-6 py-2 rounded-sm text-[13px] font-medium transition-colors"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
