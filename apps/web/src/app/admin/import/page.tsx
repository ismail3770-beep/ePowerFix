"use client";

import { useRef, useState } from "react";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, CheckCircle2, AlertCircle, Download, Loader2 } from "lucide-react";

interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

const CSV_TEMPLATE_HEADERS = [
  "name","slug","description","shortDesc","price","salePrice","stock","sku","category","brand","images","isFeatured","isBestDeal"
].join(",");

const CSV_SAMPLE_ROW = [
  "LED Bulb 9W","led-bulb-9w","Energy saving LED bulb","9W LED","150","","100","LED-9W-001","Lighting","Philips","","false","false"
].join(",");

export default function ImportPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = (f: File) => {
    if (!f.name.endsWith(".csv")) { toast.error("Please upload a CSV file"); return; }
    setFile(f);
    setResult(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const doImport = async () => {
    if (!file) { toast.error("No file selected"); return; }
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await apiFetch<{ data: ImportResult }>("/api/admin/import/products", { method: "POST", body: formData });
      const r = res.data as ImportResult;
      setResult(r);
      if (r.imported > 0) toast.success(`${r.imported} products imported successfully`);
      else toast.warning("No products imported");
    } catch (e: any) {
      toast.error(e?.message || "Import failed");
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const csv = [CSV_TEMPLATE_HEADERS, CSV_SAMPLE_ROW].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "products-template.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Instructions */}
      <Card className="rounded-xl border-slate-200 shadow-sm py-0">
        <CardHeader className="border-b border-slate-100 py-4">
          <CardTitle className="text-[15px]">Import Products via CSV</CardTitle>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          <p className="text-[13px] text-slate-600">Upload a CSV file to bulk-import products. Download the template to see the required format.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12px] text-slate-500">
            {[
              "name — Product name (required)",
              "slug — URL slug (auto-generated if blank)",
              "price — Price in BDT (required)",
              "salePrice — Sale price (optional)",
              "stock — Stock quantity",
              "sku — Stock keeping unit",
              "category — Category name",
              "brand — Brand name",
              "images — Comma-separated image URLs",
              "isFeatured — true / false",
            ].map(t => (
              <div key={t} className="flex items-start gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />{t}</div>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-2 text-[13px]">
            <Download className="h-4 w-4" /> Download CSV Template
          </Button>
        </CardContent>
      </Card>

      {/* Upload area */}
      <Card className="rounded-xl border-slate-200 shadow-sm py-0">
        <CardContent className="p-6">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${dragOver ? "border-epf-500 bg-epf-50" : file ? "border-emerald-400 bg-emerald-50" : "border-slate-200 hover:border-epf-400 hover:bg-slate-50"}`}
          >
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            {file ? (
              <>
                <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500 mb-3" />
                <p className="font-semibold text-emerald-700">{file.name}</p>
                <p className="text-[12px] text-emerald-600 mt-1">{(file.size / 1024).toFixed(1)} KB — ready to import</p>
              </>
            ) : (
              <>
                <Upload className="mx-auto h-10 w-10 text-slate-300 mb-3" />
                <p className="font-semibold text-slate-700">Drop CSV file here or click to browse</p>
                <p className="text-[12px] text-slate-400 mt-1">Only .csv files are accepted</p>
              </>
            )}
          </div>

          {file && (
            <div className="mt-4 flex gap-3">
              <Button onClick={doImport} disabled={importing} className="bg-epf-500 hover:bg-epf-600 text-white gap-2">
                {importing ? <><Loader2 className="h-4 w-4 animate-spin" /> Importing…</> : <><FileText className="h-4 w-4" /> Start Import</>}
              </Button>
              <Button variant="outline" onClick={() => { setFile(null); setResult(null); if (fileRef.current) fileRef.current.value = ""; }}>
                Clear
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Result */}
      {result && (
        <Card className={`rounded-xl shadow-sm py-0 border ${result.errors.length > 0 ? "border-amber-200" : "border-emerald-200"}`}>
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              {result.errors.length === 0
                ? <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                : <AlertCircle className="h-5 w-5 text-amber-500" />}
              <span className="font-semibold text-[14px]">Import Complete</span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-emerald-50 rounded-lg p-3">
                <p className="text-[22px] font-bold text-emerald-700">{result.imported}</p>
                <p className="text-[11px] text-emerald-600">Imported</p>
              </div>
              <div className="bg-amber-50 rounded-lg p-3">
                <p className="text-[22px] font-bold text-amber-700">{result.skipped}</p>
                <p className="text-[11px] text-amber-600">Skipped</p>
              </div>
              <div className="bg-red-50 rounded-lg p-3">
                <p className="text-[22px] font-bold text-red-700">{result.errors.length}</p>
                <p className="text-[11px] text-red-600">Errors</p>
              </div>
            </div>
            {result.errors.length > 0 && (
              <div className="bg-red-50 border border-red-100 rounded-lg p-3 space-y-1">
                <p className="text-[12px] font-semibold text-red-700">Errors:</p>
                {result.errors.slice(0, 10).map((e, i) => <p key={i} className="text-[11px] text-red-600">• {e}</p>)}
                {result.errors.length > 10 && <p className="text-[11px] text-red-400">…and {result.errors.length - 10} more</p>}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
