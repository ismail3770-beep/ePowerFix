"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Home } from "lucide-react";
import { apiFetch } from "@/lib/api";

export default function ImportProductsPage() {
  const router = useRouter();
  const [importing, setImporting] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [zipFile, setZipFile] = useState<File | null>(null);

  const handleImport = async () => {
    if (!csvFile) {
      toast.error("Product Data (CSV or Excel) is required");
      return;
    }

    setImporting(true);
    try {
      const formData = new FormData();
      formData.append("csv", csvFile);
      if (zipFile) {
        formData.append("images", zipFile);
      }

      await apiFetch("/api/admin/import", {
        method: "POST",
        body: formData,
      });

      toast.success("Products imported successfully");
      setCsvFile(null);
      setZipFile(null);
      
      // Reset file inputs visually
      const fileInputs = document.querySelectorAll('input[type="file"]') as NodeListOf<HTMLInputElement>;
      fileInputs.forEach(input => {
        input.value = '';
      });

    } catch (error) {
      toast.error("Failed to import products");
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadSample = () => {
    // Usually triggers a download or opens a new tab to the sample file URL
    toast.info("Downloading sample file...");
    // window.open("/sample-import.csv", "_blank");
  };

  return (
    <div className="font-poppins bg-[#f3f4f6] min-h-screen -m-6 p-6 text-slate-700">
      
      {/* Header section */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-[22px] font-normal text-slate-800">Import Products</h1>
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="flex items-center gap-2 text-[13px] text-slate-500">
            <Home className="w-3.5 h-3.5 cursor-pointer hover:text-blue-600" onClick={() => router.push("/admin/dashboard")} />
            <span className="text-slate-300">&gt;</span>
            <span>Import Products</span>
          </div>
          <button 
            onClick={handleDownloadSample}
            className="bg-[#0052cc] hover:bg-[#0047b3] text-white px-4 py-1.5 rounded-sm text-[13px] font-medium transition-colors"
          >
            Download Sample File
          </button>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-sm">
        <div className="p-6 max-w-[800px]">
          <div className="space-y-6">
            
            <div className="grid grid-cols-[200px_1fr] items-center gap-4">
              <label className="text-[13px] font-medium text-slate-700">
                Product Data (CSV or Excel) <span className="text-red-500">*</span>
              </label>
              <input 
                type="file" 
                accept=".csv, .xlsx, .xls"
                onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                className="w-full text-[13px] rounded-sm border border-slate-300 bg-white text-slate-600 outline-none file:mr-2 file:py-1 file:px-3 file:border-0 file:border-r file:border-slate-300 file:text-[13px] file:bg-[#f8f9fa] file:text-slate-700 hover:file:bg-slate-200 focus:border-blue-500" 
              />
            </div>
            
            <div className="grid grid-cols-[200px_1fr] items-center gap-4">
              <label className="text-[13px] font-medium text-slate-700">
                Product Images (ZIP)
              </label>
              <input 
                type="file" 
                accept=".zip"
                onChange={(e) => setZipFile(e.target.files?.[0] || null)}
                className="w-full text-[13px] rounded-sm border border-slate-300 bg-white text-slate-600 outline-none file:mr-2 file:py-1 file:px-3 file:border-0 file:border-r file:border-slate-300 file:text-[13px] file:bg-[#f8f9fa] file:text-slate-700 hover:file:bg-slate-200 focus:border-blue-500" 
              />
            </div>

            <div className="grid grid-cols-[200px_1fr] items-center gap-4 mt-2">
              <div></div>
              <button 
                onClick={handleImport}
                disabled={importing}
                className="bg-[#0052cc] hover:bg-[#0047b3] text-white px-6 py-1.5 rounded-sm text-[13px] font-medium transition-colors w-fit"
              >
                {importing ? "Importing..." : "Import"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
