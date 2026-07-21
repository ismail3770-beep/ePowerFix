"use client";

import { useEffect, useState, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Pencil, Trash2, Search, Globe } from "lucide-react";
import { useAdminHeaderStore } from "@/store/admin-header-store";

interface Language {
  id: string;
  name: string;
  code: string;        // e.g. "en", "bn"
  nativeName: string;  // e.g. "বাংলা"
  direction: "ltr" | "rtl";
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
}

type LangForm = { name: string; code: string; nativeName: string; direction: "ltr" | "rtl"; isDefault: boolean; isActive: boolean };
const defaultForm: LangForm = { name: "", code: "", nativeName: "", direction: "ltr", isDefault: false, isActive: true };

const PRESET_LANGUAGES = [
  { name: "English", code: "en", nativeName: "English", direction: "ltr" },
  { name: "Bengali", code: "bn", nativeName: "বাংলা", direction: "ltr" },
  { name: "Arabic", code: "ar", nativeName: "العربية", direction: "rtl" },
  { name: "Hindi", code: "hi", nativeName: "हिन्दी", direction: "ltr" },
  { name: "Urdu", code: "ur", nativeName: "اردو", direction: "rtl" },
];

export default function LanguagesPage() {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<Language | null>(null);
  const [form, setForm] = useState<LangForm>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Language | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ data: Language[] | { data: Language[] } }>("/api/admin/languages");
      const list: Language[] = (res.data as any)?.data ?? (Array.isArray(res.data) ? res.data : []);
      setLanguages(list);
    } catch { toast.error("Failed to load languages"); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = useCallback(() => { setEditing(null); setForm(defaultForm); setDialog(true); }, []);
  const openEdit = (l: Language) => {
    setEditing(l);
    setForm({ name: l.name, code: l.code, nativeName: l.nativeName, direction: (l.direction === "rtl" ? "rtl" : "ltr"), isDefault: l.isDefault, isActive: l.isActive });
    setDialog(true);
  };

  const setAddNew = useAdminHeaderStore((s) => s.setAddNew);
  useEffect(() => { setAddNew("Add Language", openAdd); return () => setAddNew("", null); }, [setAddNew, openAdd]);

  const set = (k: keyof typeof defaultForm, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));

  const applyPreset = (p: typeof PRESET_LANGUAGES[0]) => {
    setForm(f => ({ ...f, name: p.name, code: p.code, nativeName: p.nativeName, direction: p.direction as "ltr"|"rtl" }));
  };

  const save = async () => {
    if (!form.name.trim() || !form.code.trim()) { toast.error("Name and code are required"); return; }
    setSaving(true);
    try {
      if (editing) {
        await apiFetch(`/api/admin/languages/${editing.id}`, { method: "PUT", body: JSON.stringify(form) });
        toast.success("Language updated");
      } else {
        await apiFetch("/api/admin/languages", { method: "POST", body: JSON.stringify(form) });
        toast.success("Language added");
      }
      setDialog(false); load();
    } catch (e: any) { toast.error(e?.message || "Save failed"); } finally { setSaving(false); }
  };

  const doDelete = async () => {
    if (!deleteTarget) return;
    try {
      await apiFetch(`/api/admin/languages/${deleteTarget.id}`, { method: "DELETE" });
      toast.success("Language removed"); setDeleteTarget(null); load();
    } catch { toast.error("Delete failed"); }
  };

  const filtered = languages.filter(l => !search || l.name.toLowerCase().includes(search.toLowerCase()) || l.code.includes(search.toLowerCase()));

  return (
    <div className="space-y-5">
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input placeholder="Search languages..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-sm border-slate-200" />
      </div>

      <Card className="rounded-xl border-slate-200 shadow-sm py-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 border-b border-slate-100 hover:bg-slate-50">
              {["Language","Code","Native Name","Direction","Status","Default",""].map(h => (
                <TableHead key={h} className="text-[11px] font-semibold uppercase text-slate-500 px-4 py-3">{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? Array.from({length:3}).map((_,i) => (
              <TableRow key={i}><TableCell colSpan={7} className="px-4 py-3"><Skeleton className="h-5 w-full" /></TableCell></TableRow>
            )) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-16 text-slate-400">
                <Globe className="mx-auto h-8 w-8 mb-2 opacity-30" />
                No languages configured.
              </TableCell></TableRow>
            ) : filtered.map((l) => (
              <TableRow key={l.id} className="border-b border-slate-100 hover:bg-slate-50">
                <TableCell className="px-4 py-3 font-semibold text-[13px] text-slate-900">{l.name}</TableCell>
                <TableCell className="px-4 py-3"><code className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">{l.code}</code></TableCell>
                <TableCell className="px-4 py-3 text-[13px] text-slate-600">{l.nativeName}</TableCell>
                <TableCell className="px-4 py-3"><span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{l.direction?.toUpperCase()}</span></TableCell>
                <TableCell className="px-4 py-3">
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${l.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"}`}>
                    {l.isActive ? "Active" : "Inactive"}
                  </span>
                </TableCell>
                <TableCell className="px-4 py-3">
                  {l.isDefault && <span className="text-[11px] font-bold px-2 py-0.5 rounded-full border bg-sky-50 text-sky-700 border-sky-200">Default</span>}
                </TableCell>
                <TableCell className="px-4 py-3">
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEdit(l)}><Pencil className="h-3.5 w-3.5" /></Button>
                    {!l.isDefault && <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500 hover:bg-red-50" onClick={() => setDeleteTarget(l)}><Trash2 className="h-3.5 w-3.5" /></Button>}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Edit Language" : "Add Language"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            {/* Quick presets */}
            {!editing && (
              <div className="space-y-1.5">
                <Label className="text-[11px] text-slate-500">Quick add preset</Label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_LANGUAGES.map(p => (
                    <button key={p.code} type="button" onClick={() => applyPreset(p)}
                      className="text-[11px] px-2.5 py-1 rounded-full border border-slate-200 hover:border-epf-500 hover:text-epf-600 transition-colors">
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Name <span className="text-red-500">*</span></Label>
                <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="English" /></div>
              <div className="space-y-1.5"><Label>Code <span className="text-red-500">*</span></Label>
                <Input value={form.code} onChange={(e) => set("code", e.target.value.toLowerCase())} placeholder="en" maxLength={5} /></div>
              <div className="space-y-1.5"><Label>Native Name</Label>
                <Input value={form.nativeName} onChange={(e) => set("nativeName", e.target.value)} placeholder="বাংলা" /></div>
              <div className="space-y-1.5"><Label>Direction</Label>
                <select value={form.direction} onChange={(e) => set("direction", e.target.value)} className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm">
                  <option value="ltr">LTR (Left to Right)</option>
                  <option value="rtl">RTL (Right to Left)</option>
                </select>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="flex items-center gap-2"><Switch checked={form.isActive} onCheckedChange={(v) => set("isActive", v)} /><Label>Active</Label></div>
              <div className="flex items-center gap-2"><Switch checked={form.isDefault} onCheckedChange={(v) => set("isDefault", v)} /><Label>Default</Label></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving} className="bg-epf-500 hover:bg-epf-600 text-white">{saving ? "Saving…" : editing ? "Update" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Remove Language</AlertDialogTitle>
            <AlertDialogDescription>Remove <strong>{deleteTarget?.name}</strong> from the site?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={doDelete} className="bg-red-500 hover:bg-red-600 text-white">Remove</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
