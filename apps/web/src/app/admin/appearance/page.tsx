"use client";

import { useEffect, useState, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Save, Palette, Type, Layout, Image, RotateCcw } from "lucide-react";
import { SingleImageUploader } from "@/components/ImageUploader";

interface AppearanceSettings {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  headerBg: string;
  footerBg: string;
  bodyBg: string;
  headingFont: string;
  bodyFont: string;
  fontSize: string;
  containerWidth: string;
  heroStyle: string;
  cardRadius: string;
  buttonRadius: string;
  logoUrl: string;
  faviconUrl: string;
  customCss: string;
}

const DEFAULTS: AppearanceSettings = {
  primaryColor: "0EA5E9",
  secondaryColor: "0284C7",
  accentColor: "4D7300",
  headerBg: "FFFFFF",
  footerBg: "111827",
  bodyBg: "F8FAFC",
  headingFont: "Geist Sans",
  bodyFont: "Geist Sans",
  fontSize: "16",
  containerWidth: "1280",
  heroStyle: "gradient",
  cardRadius: "8",
  buttonRadius: "8",
  logoUrl: "",
  faviconUrl: "",
  customCss: "",
};

const FONT_OPTIONS = ["Geist Sans","Inter","Roboto","Open Sans","Lato","Poppins","Nunito","Hind Siliguri"];
const HERO_STYLES = ["gradient","image","solid","minimal"];

function ColorField({ label, desc, hex, onChange }: { label: string; desc: string; hex: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
      <div>
        <p className="text-[13px] font-medium text-slate-800">{label}</p>
        <p className="text-[11px] text-slate-500">{desc}</p>
      </div>
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="w-8 h-8 rounded-lg border border-slate-200 overflow-hidden cursor-pointer">
          <input type="color" value={`#${hex}`} onChange={(e) => onChange(e.target.value.replace("#",""))}
            className="w-10 h-10 -translate-x-1 -translate-y-1 cursor-pointer border-0 bg-transparent" />
        </div>
        <Input value={hex} onChange={(e) => onChange(e.target.value.replace("#","").toUpperCase())}
          maxLength={6} className="w-24 h-8 text-[12px] font-mono uppercase" />
      </div>
    </div>
  );
}

export default function AppearancePage() {
  const [settings, setSettings] = useState<AppearanceSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ data: Partial<AppearanceSettings> }>("/api/admin/settings?key=appearance");
      if (res.data) setSettings({ ...DEFAULTS, ...res.data });
    } catch { /* use defaults */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const set = (k: keyof AppearanceSettings, v: string) => setSettings(s => ({ ...s, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      await apiFetch("/api/admin/settings", { method: "POST", body: JSON.stringify({ key: "appearance", value: settings }) });
      toast.success("Appearance settings saved");
    } catch { toast.error("Failed to save settings"); } finally { setSaving(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-epf-500" /></div>
  );

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-slate-500">Customize the visual appearance of your storefront.</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setSettings(DEFAULTS)} className="gap-1.5 text-[13px]">
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </Button>
          <Button size="sm" onClick={save} disabled={saving} className="bg-epf-500 hover:bg-epf-600 text-white gap-1.5 text-[13px]">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save Changes
          </Button>
        </div>
      </div>

      <Tabs defaultValue="colors">
        <TabsList className="bg-slate-100 border border-slate-200 h-10">
          <TabsTrigger value="colors" className="data-[state=active]:bg-white gap-1.5 text-[13px]"><Palette className="h-3.5 w-3.5" />Colors</TabsTrigger>
          <TabsTrigger value="typography" className="data-[state=active]:bg-white gap-1.5 text-[13px]"><Type className="h-3.5 w-3.5" />Typography</TabsTrigger>
          <TabsTrigger value="layout" className="data-[state=active]:bg-white gap-1.5 text-[13px]"><Layout className="h-3.5 w-3.5" />Layout</TabsTrigger>
          <TabsTrigger value="assets" className="data-[state=active]:bg-white gap-1.5 text-[13px]"><Image className="h-3.5 w-3.5" />Assets</TabsTrigger>
        </TabsList>

        {/* Colors */}
        <TabsContent value="colors">
          <Card className="rounded-xl border-slate-200 shadow-sm py-0">
            <CardHeader className="border-b border-slate-100 py-4"><CardTitle className="text-[15px]">Color Scheme</CardTitle></CardHeader>
            <CardContent className="p-5">
              <ColorField label="Primary Color" desc="Main brand color — buttons, links, accents" hex={settings.primaryColor} onChange={(v) => set("primaryColor", v)} />
              <ColorField label="Secondary Color" desc="Hover states and secondary actions" hex={settings.secondaryColor} onChange={(v) => set("secondaryColor", v)} />
              <ColorField label="Accent Color" desc="Highlight and special elements" hex={settings.accentColor} onChange={(v) => set("accentColor", v)} />
              <ColorField label="Header Background" desc="Top navigation bar background" hex={settings.headerBg} onChange={(v) => set("headerBg", v)} />
              <ColorField label="Footer Background" desc="Footer section background" hex={settings.footerBg} onChange={(v) => set("footerBg", v)} />
              <ColorField label="Page Background" desc="Main content area background" hex={settings.bodyBg} onChange={(v) => set("bodyBg", v)} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Typography */}
        <TabsContent value="typography">
          <Card className="rounded-xl border-slate-200 shadow-sm py-0">
            <CardHeader className="border-b border-slate-100 py-4"><CardTitle className="text-[15px]">Typography</CardTitle></CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label>Heading Font</Label>
                  <select value={settings.headingFont} onChange={(e) => set("headingFont", e.target.value)} className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm">
                    {FONT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5"><Label>Body Font</Label>
                  <select value={settings.bodyFont} onChange={(e) => set("bodyFont", e.target.value)} className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm">
                    {FONT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5"><Label>Base Font Size (px)</Label>
                  <Input type="number" min="12" max="20" value={settings.fontSize} onChange={(e) => set("fontSize", e.target.value)} /></div>
              </div>
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <p className="text-[12px] text-slate-500 mb-2">Preview</p>
                <p style={{ fontFamily: settings.headingFont, fontSize: `${Number(settings.fontSize) * 1.5}px`, fontWeight: 700 }}>Heading Text Sample</p>
                <p style={{ fontFamily: settings.bodyFont, fontSize: `${settings.fontSize}px` }} className="mt-1 text-slate-600">Body text sample — ePowerFix electrical marketplace.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Layout */}
        <TabsContent value="layout">
          <Card className="rounded-xl border-slate-200 shadow-sm py-0">
            <CardHeader className="border-b border-slate-100 py-4"><CardTitle className="text-[15px]">Layout & Style</CardTitle></CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label>Max Container Width (px)</Label>
                  <Input type="number" value={settings.containerWidth} onChange={(e) => set("containerWidth", e.target.value)} /></div>
                <div className="space-y-1.5"><Label>Card Border Radius (px)</Label>
                  <Input type="number" min="0" max="24" value={settings.cardRadius} onChange={(e) => set("cardRadius", e.target.value)} /></div>
                <div className="space-y-1.5"><Label>Button Border Radius (px)</Label>
                  <Input type="number" min="0" max="24" value={settings.buttonRadius} onChange={(e) => set("buttonRadius", e.target.value)} /></div>
                <div className="space-y-1.5"><Label>Hero Section Style</Label>
                  <select value={settings.heroStyle} onChange={(e) => set("heroStyle", e.target.value)} className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm">
                    {HERO_STYLES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Custom CSS <span className="text-[11px] text-slate-400">(injected into storefront)</span></Label>
                <textarea value={settings.customCss} onChange={(e) => set("customCss", e.target.value)}
                  rows={6} placeholder="/* Add custom CSS here */" className="w-full border border-slate-200 rounded-md px-3 py-2 text-[12px] font-mono resize-y outline-none focus:border-epf-500 transition-colors" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assets */}
        <TabsContent value="assets">
          <Card className="rounded-xl border-slate-200 shadow-sm py-0">
            <CardHeader className="border-b border-slate-100 py-4"><CardTitle className="text-[15px]">Logo & Favicon</CardTitle></CardHeader>
            <CardContent className="p-5 space-y-6">
              <div className="space-y-2">
                <Label>Site Logo</Label>
                <p className="text-[12px] text-slate-500">Recommended: PNG with transparent background, min 200px wide.</p>
                <SingleImageUploader value={settings.logoUrl} onChange={(url) => set("logoUrl", url || "")} />
              </div>
              <div className="space-y-2">
                <Label>Favicon</Label>
                <p className="text-[12px] text-slate-500">Recommended: 32×32 or 64×64 PNG/ICO.</p>
                <SingleImageUploader value={settings.faviconUrl} onChange={(url) => set("faviconUrl", url || "")} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
