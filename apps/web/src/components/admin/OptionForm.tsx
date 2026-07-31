"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { Home, Trash2, GripVertical } from "lucide-react";

interface OptionData {
  id?: string;
  name: string;
  type: string;
  required: boolean;
  choices: string[]; // backend stores array of strings
}

interface OptionChoice {
  label: string;
  price: string;
  priceType: "Fixed" | "Percent";
}

export function OptionForm({ initialData }: { initialData?: OptionData }) {
  const router = useRouter();
  const isEdit = !!initialData?.id;
  const [activeTab, setActiveTab] = useState<"general" | "values">("general");
  const [saving, setSaving] = useState(false);
  
  // Parse initial choices
  const initialParsedChoices: OptionChoice[] = (initialData?.choices || []).map(c => {
    try {
      const parsed = JSON.parse(c);
      return { 
        label: parsed.label || "", 
        price: parsed.price || "",
        priceType: parsed.priceType || "Fixed"
      };
    } catch {
      return { label: c, price: "", priceType: "Fixed" };
    }
  });

  const [form, setForm] = useState<{name: string; type: string; required: boolean}>({
    name: initialData?.name || "",
    type: initialData?.type || "Field", 
    required: initialData?.required || false,
  });

  const [choices, setChoices] = useState<OptionChoice[]>(
    initialParsedChoices.length ? initialParsedChoices : [{ label: "", price: "", priceType: "Fixed" }]
  );

  const isField = form.type === "TEXT" || form.type === "Field";

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
      // Map frontend type to backend enum
      const backendTypeMap: Record<string, string> = {
        "Dropdown": "SELECT",
        "Radio": "RADIO",
        "Checkbox": "CHECKBOX",
        "Field": "TEXT"
      };
      
      const backendType = backendTypeMap[form.type] || form.type;

      // Serialize choices back to string array
      let serializedChoices: string[] = [];
      if (isField) {
        serializedChoices = [JSON.stringify({ label: "", price: choices[0]?.price || "", priceType: choices[0]?.priceType || "Fixed" })];
      } else {
        serializedChoices = choices
          .filter(c => c.label.trim() !== "")
          .map(c => JSON.stringify({ label: c.label, price: c.price, priceType: c.priceType }));
      }

      const payload = { 
        name: form.name,
        type: backendType,
        required: form.required,
        choices: serializedChoices
      };
      
      if (isEdit) {
        await apiFetch(`/api/admin/options/${initialData.id}`, { method: "PUT", body: JSON.stringify(payload) });
        toast.success("Option updated successfully");
      } else {
        await apiFetch("/api/admin/options", { method: "POST", body: JSON.stringify(payload) });
        toast.success("Option created successfully");
        router.push("/admin/options");
      }
    } catch {
      toast.error("Failed to save option");
    } finally {
      setSaving(false);
    }
  };

  const addChoice = () => setChoices([...choices, { label: "", price: "", priceType: "Fixed" }]);
  
  const updateChoiceRow = (index: number, field: keyof OptionChoice, val: string) => {
    const newChoices = [...choices];
    newChoices[index] = { ...newChoices[index], [field]: val };
    setChoices(newChoices);
  };
  
  const removeChoice = (index: number) => {
    const newChoices = choices.filter((_, i) => i !== index);
    setChoices(newChoices.length ? newChoices : [{ label: "", price: "", priceType: "Fixed" }]);
  };

  // Convert backend type to frontend type for initial load
  const frontendTypeMap: Record<string, string> = {
    "SELECT": "Dropdown",
    "RADIO": "Radio",
    "CHECKBOX": "Checkbox",
    "TEXT": "Field"
  };
  const displayType = frontendTypeMap[form.type] || form.type;

  return (
    <div className="font-poppins bg-[#f3f4f6] min-h-screen -m-6 p-6 text-slate-700">
      <div className="flex justify-between items-start mb-6">
        <h1 className="text-[22px] font-normal text-slate-800">{isEdit ? "Edit Option" : "Create Option"}</h1>
        <div className="flex items-center gap-2 text-[13px] text-slate-500">
          <Home className="w-3.5 h-3.5 cursor-pointer hover:text-blue-600" onClick={() => router.push("/admin/dashboard")} />
          <span className="text-slate-300">&gt;</span>
          <span className="cursor-pointer hover:text-blue-600" onClick={() => router.push("/admin/options")}>Options</span>
          <span className="text-slate-300">&gt;</span>
          <span>{isEdit ? "Edit Option" : "Create Option"}</span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Sidebar */}
        <div className="w-full lg:w-[280px] shrink-0">
          <div className="bg-white border border-slate-200 shadow-sm rounded-sm overflow-hidden">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 text-[14px] font-medium text-slate-700">
              Option Information
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
                  <label className="text-[13px] font-medium text-slate-700">Name <span className="text-red-500">*</span></label>
                  <input 
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500" 
                  />
                </div>

                <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                  <label className="text-[13px] font-medium text-slate-700">Type <span className="text-red-500">*</span></label>
                  <select 
                    value={displayType}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500 bg-white" 
                  >
                    <option value="Dropdown">Dropdown</option>
                    <option value="Radio">Radio</option>
                    <option value="Checkbox">Checkbox</option>
                    <option value="Field">Field</option>
                  </select>
                </div>

                <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                  <label className="text-[13px] font-medium text-slate-700">Required</label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={form.required}
                      onChange={(e) => setForm({ ...form, required: e.target.checked })}
                      className="rounded-sm border-slate-300 text-blue-600 focus:ring-0" 
                    />
                    <span className="text-[13px] text-slate-600">This option is required</span>
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
                {isField ? (
                  // Simple price fields for TEXT/Field type
                  <div className="flex gap-6 max-w-[600px]">
                    <div className="flex-1">
                      <label className="text-[12px] font-medium text-slate-600 block mb-1">Price</label>
                      <input 
                        type="text"
                        value={choices[0].price}
                        onChange={(e) => updateChoiceRow(0, "price", e.target.value)}
                        className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-[12px] font-medium text-slate-600 block mb-1">Price Type</label>
                      <select 
                        value={choices[0].priceType}
                        onChange={(e) => updateChoiceRow(0, "priceType", e.target.value)}
                        className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500 bg-white"
                      >
                        <option value="Fixed">Fixed</option>
                        <option value="Percent">Percent</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  // Table for multiple choices
                  <div className="border border-slate-200 rounded-sm">
                    <div className="bg-white flex px-4 py-2 border-b border-slate-200 text-[12px] font-medium text-slate-600">
                      <div className="w-8"></div>
                      <div className="flex-[2]">Label <span className="text-red-500">*</span></div>
                      <div className="flex-1 ml-4">Price</div>
                      <div className="flex-1 ml-4">Price Type</div>
                      <div className="w-10"></div>
                    </div>
                    <div className="p-4 space-y-3 bg-white">
                      {choices.map((c, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <GripVertical className="w-4 h-4 text-slate-300 cursor-move shrink-0" />
                          
                          <div className="flex-[2]">
                            <input 
                              type="text"
                              value={c.label}
                              onChange={(e) => updateChoiceRow(i, "label", e.target.value)}
                              className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500"
                            />
                          </div>

                          <div className="flex-1 ml-1">
                            <input 
                              type="text"
                              value={c.price}
                              onChange={(e) => updateChoiceRow(i, "price", e.target.value)}
                              className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500"
                            />
                          </div>

                          <div className="flex-1 ml-1">
                            <select 
                              value={c.priceType}
                              onChange={(e) => updateChoiceRow(i, "priceType", e.target.value)}
                              className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500 bg-white"
                            >
                              <option value="Fixed">Fixed</option>
                              <option value="Percent">Percent</option>
                            </select>
                          </div>
                          
                          <button 
                            onClick={() => removeChoice(i)}
                            className="w-9 h-9 flex items-center justify-center border border-slate-200 rounded-sm bg-slate-50 text-slate-500 hover:text-red-500 hover:bg-red-50 shrink-0 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-4 items-start">
                  {!isField && (
                    <button 
                      onClick={addChoice}
                      className="bg-[#f1f1f1] hover:bg-[#e2e2e2] text-slate-700 px-4 py-1.5 rounded-sm text-[13px] font-medium transition-colors"
                    >
                      Add Row
                    </button>
                  )}
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
