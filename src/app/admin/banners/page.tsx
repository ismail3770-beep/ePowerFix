"use client";

import { useState, useEffect, useCallback } from "react";
import { useFormDraft, loadFormDraft, clearFormDraft } from "@/hooks/use-form-draft";
import { apiFetch } from "@/lib/api";
import { useAdminHeaderStore } from "@/store/admin-header-store";
import { toast } from "sonner";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogHeader, DialogContent, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Pencil, Trash2, Image as ImageIcon, ArrowUp, ArrowDown, LayoutDashboard, Wrench, Megaphone } from "lucide-react";
import { ImageUploader } from "@/components/ImageUploader";

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  image: string;
  link: string | null;
  type: string;
  position: number;
  isActive: boolean;
  createdAt: string;
}

const bannerTypeConfig = [
  {
    value: "hero",
    label: "Hero Banner",
    icon: LayoutDashboard,
    color: "bg-blue-50 text-blue-700 border-blue-200",
    activeColor: "bg-blue-600 text-white border-blue-600",
    description: "Shows at the top of homepage",
    size: "Recommended: 1920 × 600 px",
  },
  {
    value: "services",
    label: "Services Banner",
    icon: Wrench,
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    activeColor: "bg-emerald-600 text-white border-emerald-600",
    description: "Shows in the services section (3 at a time)",
    size: "Recommended: 640 × 400 px",
  },
  {
    value: "promo",
    label: "Promo Banner",
    icon: Megaphone,
    color: "bg-amber-50 text-amber-700 border-amber-200",
    activeColor: "bg-amber-600 text-white border-amber-600",
    description: "For promotional campaigns",
    size: "Recommended: 1920 × 300 px",
  },
];

const defaultForm = { title: "", subtitle: "", image: "", link: "", type: "hero" as string, position: 0, isActive: true };

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [dialog, setDialog] = useState<{ open: boolean; edit?: Banner }>({ open: false });
  const [form, setForm] = useState(() => loadFormDraft("admin-banner-add", defaultForm));
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Banner | null>(null);

  const setAddNew = useAdminHeaderStore((s) => s.setAddNew);

  useEffect(() => {
    if (activeTab === "all") {
      setAddNew("Add Banner", () => openAdd("hero"));
    } else {
      const cfg = bannerTypeConfig.find((t) => t.value === activeTab);
      setAddNew(`Add ${cfg?.label ?? "Banner"}`, () => openAdd(activeTab));
    }
    return () => setAddNew("", null);
  }, [setAddNew, activeTab]);

  const fetchBanners = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await apiFetch("/api/admin/banners");
      setBanners(res.data ?? []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load banners");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBanners(); }, [fetchBanners]);

  // Persist the add-form draft so a refresh / navigation doesn't lose progress.
  useFormDraft("admin-banner-add", dialog.open && !dialog.edit ? form : defaultForm);

  const filteredBanners = activeTab === "all"
    ? banners
    : banners.filter((b) => b.type === activeTab || (b.type == null && activeTab === "hero"));

  function openAdd(type: string) {
    const sameTypeBanners = type === "all"
      ? banners
      : banners.filter((b) => b.type === type || (b.type == null && type === "hero"));
    // Restore draft if one exists, otherwise start with defaults for this type.
    const draft = loadFormDraft("admin-banner-add", { ...defaultForm, type, position: sameTypeBanners.length });
    setForm(draft);
    setDialog({ open: true });
  }

  function openEdit(banner: Banner) {
    setForm({
      title: banner.title,
      subtitle: banner.subtitle ?? "",
      image: banner.image,
      link: banner.link ?? "",
      type: banner.type ?? "hero",
      position: banner.position,
      isActive: banner.isActive,
    });
    setDialog({ open: true, edit: banner });
  }

  async function handleSave() {
    if (!form.title.trim() || !form.image.trim()) {
      toast.error("Title and image are required");
      return;
    }
    setSaving(true);
    try {
      const body = { ...form, subtitle: form.subtitle || null, link: form.link || null };
      if (dialog.edit) {
        await apiFetch(`/api/admin/banners/${dialog.edit.id}`, { method: "PUT", body: JSON.stringify(body) });
        toast.success("Banner updated");
      } else {
        await apiFetch("/api/admin/banners", { method: "POST", body: JSON.stringify(body) });
        toast.success("Banner created");
      }
      setDialog({ open: false });
      if (!dialog.edit) clearFormDraft("admin-banner-add");
      fetchBanners();
    } catch (err: any) {
      toast.error(err.message || "Failed to save banner");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await apiFetch(`/api/admin/banners/${deleteTarget.id}`, { method: "DELETE" });
      toast.success("Banner deleted");
      setDeleteTarget(null);
      fetchBanners();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete");
    }
  }

  async function handleToggle(id: string) {
    try {
      await apiFetch(`/api/admin/banners/${id}/toggle`, { method: "PATCH" });
      fetchBanners();
    } catch (err: any) {
      toast.error(err.message || "Failed to toggle");
    }
  }

  async function handleMove(id: string, direction: "up" | "down") {
    const list = filteredBanners;
    const idx = list.findIndex((b) => b.id === id);
    if (idx === -1) return;
    const swap = direction === "up" ? idx - 1 : idx + 1;
    if (swap < 0 || swap >= list.length) return;
    try {
      const a = list[idx];
      const b = list[swap];
      await Promise.all([
        apiFetch(`/api/admin/banners/${a.id}`, { method: "PUT", body: JSON.stringify({ position: b.position }) }),
        apiFetch(`/api/admin/banners/${b.id}`, { method: "PUT", body: JSON.stringify({ position: a.position }) }),
      ]);
      fetchBanners();
    } catch (err: any) {
      toast.error("Failed to reorder");
    }
  }

  const getTypeBadge = (type: string) => {
    const cfg = bannerTypeConfig.find((t) => t.value === type) || bannerTypeConfig[0];
    return (
      <Badge variant="secondary" className={cfg.color}>
        {cfg.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[24px] font-bold text-[#111827]">Banners</h1>
        <p className="text-[14px] text-[#6B7280] mt-1">Manage banners for different sections of your website</p>
      </div>

      {/* Type Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-4 py-2 rounded-lg text-[14px] font-medium border transition-colors cursor-pointer ${
            activeTab === "all"
              ? "bg-[#111827] text-white border-[#111827]"
              : "bg-white text-[#374151] border-gray-300 hover:border-gray-400"
          }`}
        >
          All Banners ({banners.length})
        </button>
        {bannerTypeConfig.map((t) => {
          const count = banners.filter((b) => (b as any).type === t.value || ((b as any).type == null && t.value === "hero")).length;
          return (
            <button
              key={t.value}
              onClick={() => setActiveTab(t.value)}
              className={`px-4 py-2 rounded-lg text-[14px] font-medium border transition-colors cursor-pointer flex items-center gap-2 ${
                activeTab === t.value
                  ? t.activeColor
                  : `${t.color} hover:opacity-80`
              }`}
            >
              <t.icon className="size-4" />
              {t.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Info Card for active tab */}
      {activeTab !== "all" && (
        <Card className="border-dashed">
          <CardContent className="p-4 flex items-center gap-4">
            {(() => {
              const cfg = bannerTypeConfig.find((t) => t.value === activeTab)!;
              return (
                <>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${cfg.color}`}>
                    <cfg.icon className="size-5" />
                  </div>
                  <div>
                    <p className="text-[14px] font-medium text-[#111827]">{cfg.description}</p>
                    <p className="text-[13px] text-[#6B7280]">{cfg.size}</p>
                  </div>
                </>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* Banners Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-[#6B7280]">Loading...</div>
          ) : filteredBanners.length === 0 ? (
            <div className="p-12 text-center text-[#6B7280]">
              {activeTab === "all"
                ? "No banners yet. Click \"Add Banner\" to create one."
                : `No ${bannerTypeConfig.find((t) => t.value === activeTab)?.label ?? ""} banners yet. Click "Add ${bannerTypeConfig.find((t) => t.value === activeTab)?.label ?? "Banner"}" to create one.`}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Image</TableHead>
                    <TableHead>Title</TableHead>
                    {activeTab === "all" && <TableHead>Type</TableHead>}
                    <TableHead>Subtitle</TableHead>
                    <TableHead>Link</TableHead>
                    <TableHead className="w-20">Position</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-28 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBanners.map((banner, idx) => (
                    <TableRow key={banner.id}>
                      <TableCell>
                        {banner.image ? (
                          <img src={banner.image} alt="" className="w-16 h-9 rounded object-cover" />
                        ) : (
                          <div className="w-16 h-9 rounded bg-gray-100 flex items-center justify-center">
                            <ImageIcon className="h-4 w-4 text-gray-400" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{banner.title}</TableCell>
                      {activeTab === "all" && (
                        <TableCell>{getTypeBadge((banner as any).type || "hero")}</TableCell>
                      )}
                      <TableCell className="text-[#6B7280] text-[13px] max-w-[200px] truncate">{banner.subtitle || "—"}</TableCell>
                      <TableCell className="text-[13px] text-[#0EA5E9] max-w-[150px] truncate">{banner.link || "—"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleMove(banner.id, "up")} disabled={idx === 0} className="h-6 w-6 flex items-center justify-center rounded hover:bg-gray-100 disabled:opacity-30">
                            <ArrowUp className="h-3 w-3" />
                          </button>
                          <span className="text-[13px] w-4 text-center">{banner.position}</span>
                          <button onClick={() => handleMove(banner.id, "down")} disabled={idx === filteredBanners.length - 1} className="h-6 w-6 flex items-center justify-center rounded hover:bg-gray-100 disabled:opacity-30">
                            <ArrowDown className="h-3 w-3" />
                          </button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <button onClick={() => handleToggle(banner.id)}>
                          <Badge variant={banner.isActive ? "default" : "secondary"}>
                            {banner.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </button>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" onClick={() => openEdit(banner)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => setDeleteTarget(banner)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialog.open} onOpenChange={(o) => setDialog((d) => ({ ...d, open: o }))}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{dialog.edit ? "Edit Banner" : "Add Banner"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Banner Type</Label>
              <div className="grid grid-cols-3 gap-2 mt-1.5">
                {bannerTypeConfig.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, type: t.value }))}
                    className={`px-3 py-3 rounded-lg text-[13px] font-medium border transition-colors cursor-pointer flex flex-col items-center gap-1.5 ${
                      form.type === t.value
                        ? t.activeColor
                        : `${t.color} hover:opacity-80`
                    }`}
                  >
                    <t.icon className="size-5" />
                    {t.label}
                  </button>
                ))}
              </div>
              <p className="text-[12px] text-[#9CA3AF] mt-1.5">
                {(() => {
                  const cfg = bannerTypeConfig.find((t) => t.value === form.type);
                  return cfg ? `${cfg.description} • ${cfg.size}` : "";
                })()}
              </p>
            </div>
            <div>
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Banner title" />
            </div>
            <div>
              <Label>Subtitle</Label>
              <Textarea value={form.subtitle} onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))} placeholder="Optional subtitle" rows={2} />
            </div>
            <div>
              <Label>Banner Image</Label>
              <ImageUploader value={form.image ? [form.image] : []} onChange={(urls) => setForm((f) => ({ ...f, image: urls[0] || "" }))} max={1} />
            </div>
            <div>
              <Label>Link (optional)</Label>
              <Input value={form.link} onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))} placeholder="/shop or https://..." />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label>Position</Label>
                <Input type="number" value={form.position} onChange={(e) => setForm((f) => ({ ...f, position: parseInt(e.target.value) || 0 }))} />
              </div>
              <div className="flex items-center gap-2 pt-5">
                <Switch checked={form.isActive} onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))} />
                <Label>Active</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog({ open: false })}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Banner</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete "{deleteTarget?.title}"?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}