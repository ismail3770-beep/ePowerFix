"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Home, Trash2, X, Image as ImageIcon } from "lucide-react";

export function SliderForm({ initialData = null }: { initialData?: any }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"slides" | "settings">("slides");

  const [slides, setSlides] = useState([
    { id: 1, caption1: "", caption2: "", url: "", openInNewWindow: false, direction: "Left" }
  ]);

  const save = async () => {
    setSaving(true);
    setTimeout(() => {
      toast.success(`Slider ${initialData ? "updated" : "created"} successfully`);
      setSaving(false);
      router.push("/admin/sliders");
    }, 500);
  };

  const addSlide = () => {
    setSlides([...slides, { id: Date.now(), caption1: "", caption2: "", url: "", openInNewWindow: false, direction: "Left" }]);
  };

  const removeSlide = (id: number) => {
    setSlides(slides.filter(s => s.id !== id));
  };

  return (
    <div className="font-poppins bg-[#f3f4f6] min-h-screen -m-6 p-6 text-slate-700">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-[22px] font-normal text-slate-800">{initialData ? "Edit Slider" : "Create Slider"}</h1>
        </div>
        <div className="flex items-center gap-2 text-[13px] text-slate-500">
          <Home className="w-3.5 h-3.5 cursor-pointer hover:text-blue-600" onClick={() => router.push("/admin/dashboard")} />
          <span className="text-slate-300">&gt;</span>
          <span className="cursor-pointer hover:text-blue-600" onClick={() => router.push("/admin/sliders")}>Sliders</span>
          <span className="text-slate-300">&gt;</span>
          <span>{initialData ? "Edit Slider" : "Create Slider"}</span>
        </div>
      </div>

      <div className="bg-white border border-slate-200 shadow-sm rounded-sm p-6 flex flex-col md:flex-row gap-8 items-start">
        
        {/* Left Sidebar Menu */}
        <div className="w-full md:w-[250px] shrink-0 space-y-1">
          <div className="text-[14px] font-medium text-slate-700 bg-slate-50 px-4 py-3 rounded-sm">
            Slider Information
          </div>
          <div className="bg-slate-100 rounded-sm">
            <div 
              onClick={() => setActiveTab("slides")}
              className={`px-4 py-2.5 text-[13px] border-l-2 cursor-pointer font-medium transition-colors ${
                activeTab === "slides" 
                  ? "border-[#0052cc] bg-white text-slate-700 shadow-sm" 
                  : "border-transparent text-slate-600 hover:bg-slate-200"
              }`}
            >
              Slides
            </div>
            <div 
              onClick={() => setActiveTab("settings")}
              className={`px-4 py-2.5 text-[13px] border-l-2 cursor-pointer font-medium transition-colors ${
                activeTab === "settings" 
                  ? "border-[#0052cc] bg-white text-slate-700 shadow-sm" 
                  : "border-transparent text-slate-600 hover:bg-slate-200"
              }`}
            >
              Settings
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 w-full overflow-x-auto">
          
          {activeTab === "slides" && (
            <div className="max-w-[900px]">
              <div className="border-b border-slate-200 pb-3 mb-6">
                <h2 className="text-[16px] font-medium text-slate-800">Slides</h2>
              </div>

              <div className="space-y-6">
                {slides.map((s, i) => (
                  <div key={s.id} className="border border-slate-200 rounded-sm bg-white shadow-sm overflow-hidden">
                    <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center cursor-move">
                      <div className="flex items-center gap-2 text-[13px] font-medium text-slate-700">
                        <svg className="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/></svg>
                        Image Slide
                      </div>
                      <X className="w-4 h-4 text-slate-400 cursor-pointer hover:text-red-500" onClick={() => removeSlide(s.id)} />
                    </div>
                    
                    <div className="p-6 grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6">
                      {/* Image Picker placeholder */}
                      <div>
                        <div className="w-full aspect-[4/3] bg-slate-100 border border-slate-200 rounded-sm flex items-center justify-center cursor-pointer hover:bg-slate-200 transition-colors">
                          <ImageIcon className="w-10 h-10 text-slate-300" />
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[13px] text-slate-600 mb-1">Caption 1</label>
                            <input type="text" className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500" />
                          </div>
                          <div>
                            <label className="block text-[13px] text-slate-600 mb-1">Caption 2</label>
                            <input type="text" className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500" />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[13px] text-slate-600 mb-1">Call to Action URL</label>
                            <input type="text" className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500" />
                            <div className="flex items-center gap-2 mt-2">
                              <input type="checkbox" className="rounded-sm border-slate-300" />
                              <span className="text-[13px] text-slate-600">Open in new window</span>
                            </div>
                          </div>
                          <div>
                            <label className="block text-[13px] text-slate-600 mb-1">Direction</label>
                            <select className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500 bg-white">
                              <option value="Left">Left</option>
                              <option value="Right">Right</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <div>
                  <button 
                    onClick={addSlide}
                    className="bg-[#f8f9fa] hover:bg-slate-200 border border-slate-300 text-slate-700 px-4 py-1.5 rounded-sm text-[13px] font-medium transition-colors"
                  >
                    Add Slide
                  </button>
                </div>
                
                <div className="pt-2">
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
          )}

          {activeTab === "settings" && (
            <div>
              <div className="border-b border-slate-200 pb-3 mb-6">
                <h2 className="text-[16px] font-medium text-slate-800">Settings</h2>
              </div>
              <div className="text-[13px] text-slate-500">Settings coming soon...</div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
