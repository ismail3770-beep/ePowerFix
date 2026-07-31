"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

export default function SitemapAdminPage() {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      // Trigger Next.js dynamic sitemap.ts route
      const res = await fetch("/sitemap.xml", { method: "GET" });
      if (!res.ok) throw new Error("Failed to generate sitemap");
      
      toast.success("Sitemap has been generated successfully.");
    } catch (error: any) {
      toast.error(error.message || "Failed to generate sitemap");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-slate-800">Sitemap</h1>
        <div className="flex items-center text-sm text-slate-500">
          <Link href="/admin" className="hover:text-[#0052cc] transition-colors">
            Dashboard
          </Link>
          <ChevronRight className="w-4 h-4 mx-1" />
          <span className="text-slate-700 font-medium">Sitemap</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-1">
        <div className="p-6">
          <h2 className="text-lg font-medium text-slate-800 mb-6">
            Generate Sitemap
          </h2>
          <p className="text-[13px] text-slate-500 mb-6 max-w-2xl">
            Sitemap generation dynamically aggregates static pages, active products, and published blog posts into an XML sitemap to improve SEO. 
            Click the button below to rebuild and prime the sitemap cache.
          </p>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className={`bg-[#0052cc] hover:bg-[#0047b3] text-white px-5 py-2 rounded text-sm font-medium transition-colors ${
              isGenerating ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {isGenerating ? "Generating..." : "Generate Sitemap"}
          </button>
          
          <div className="mt-8">
            <h3 className="text-sm font-medium text-slate-800 mb-2">View current sitemap</h3>
            <a 
              href="/sitemap.xml" 
              target="_blank" 
              rel="noreferrer"
              className="text-[13px] text-[#0052cc] hover:underline flex items-center gap-1 w-fit"
            >
              /sitemap.xml
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
