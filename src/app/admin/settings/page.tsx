"use client";

import { useEffect, useState, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Palette, Type, Layout, Globe, Share2, Save, Loader2, RotateCcw,
} from "lucide-react";
import { SingleImageUploader } from "@/components/ImageUploader";

const DEFAULTS = {
  siteName: "ePowerFix",
  siteTagline: "",
  logoUrl: "",
  faviconUrl: "",
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
  facebookUrl: "",
  instagramUrl: "",
  twitterUrl: "",
  youtubeUrl: "",
  linkedinUrl: "",
  phone: "",
  email: "",
  address: "",
  copyrightText: "© 2025 ePowerFix. All rights reserved.",
  metaTitle: "",
  metaDescription: "",
};

type Settings = typeof DEFAULTS;

const tabs = [
  { key: "brand", label: "Brand", icon: Globe },
  { key: "colors", label: "Colors", icon: Palette },
  { key: "typography", label: "Typography", icon: Type },
  { key: "layout", label: "Layout", icon: Layout },
  { key: "social", label: "Social", icon: Share2 },
] as const;

type TabKey = (typeof tabs)[number]["key"];

interface ColorField {
  key: keyof Settings;
  label: string;
  desc: string;
}

const colorFields: ColorField[] = [
  { key: "primaryColor", label: "Primary Color", desc: "Main brand color — buttons, links, accents" },
  { key: "secondaryColor", label: "Secondary Color", desc: "Darker shade for hovers and active states" },
  { key: "accentColor", label: "Accent Color", desc: "Highlights, badges, special callouts" },
  { key: "headerBg", label: "Header Background", desc: "Top navigation bar background" },
  { key: "footerBg", label: "Footer Background", desc: "Footer section background" },
  { key: "bodyBg", label: "Body Background", desc: "Main page background" },
];

function hexToHsl(hex: string): string {
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function ColorInput({
  label, desc, value, onChange,
}: { label: string; desc: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[13px] font-medium text-[#374151]">{label}</Label>
      <p className="text-[12px] text-[#94a3b8]">{desc}</p>
      <div className="flex items-center gap-3">
        <div className="relative">
          <input
            type="color"
            value={`#${value}`}
            onChange={(e) => onChange(e.target.value.replace("#", "").toUpperCase())}
            className="h-10 w-10 cursor-pointer rounded-md border border-[#e2e8f0] p-0.5"
          />
        </div>
        <Input
          value={value}
          onChange={(e) => {
            const v = e.target.value.replace("#", "").toUpperCase();
            if (/^[0-9A-F]{0,6}$/.test(v)) onChange(v);
          }}
          maxLength={6}
          className="h-10 w-32 font-mono text-[14px] uppercase"
          placeholder="0EA5E9"
        />
        <div
          className="h-10 w-24 rounded-md border border-[#e2e8f0]"
          style={{ backgroundColor: `#${value}` }}
        />
        <span className="text-[11px] text-[#94a3b8] font-mono">hsl({hexToHsl(value)})</span>
      </div>
    </div>
  );
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [original, setOriginal] = useState<Settings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("brand");

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await apiFetch("/api/admin/settings");
      const data = res.data ?? res;
      // Merge with defaults for any missing fields
      const merged = { ...DEFAULTS, ...data };
      setSettings(merged);
      setOriginal(merged);
    } catch (err: any) {
      toast.error(err.message || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const update = (key: keyof Settings, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    // L9: Validate that all color fields are exactly 6 hex chars before saving.
    const colorKeys = ["primaryColor", "secondaryColor", "accentColor", "headerBg", "footerBg", "bodyBg"];
    const invalidColor = colorKeys.find(
      (k) => (settings as any)[k] && !/^[0-9A-Fa-f]{6}$/.test((settings as any)[k])
    );
    if (invalidColor) {
      toast.error(`Invalid color: ${invalidColor} must be exactly 6 hex characters (e.g. 0EA5E9).`);
      return;
    }
    setSaving(true);
    try {
      await apiFetch("/api/admin/settings", {
        method: "PUT",
        body: JSON.stringify(settings),
      });
      setOriginal(settings);
      toast.success("Settings saved successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(original);
    toast.info("Changes discarded");
  };

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(original);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 rounded-lg bg-[#f1f5f9] animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-semibold text-[#111827]">Site Settings</h1>
          <p className="text-[13px] text-[#94a3b8] mt-0.5">Manage your website design, branding, and layout</p>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Button variant="outline" onClick={handleReset} className="h-9 text-[13px]">
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Discard
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="h-9 px-5 bg-[#0EA5E9] hover:bg-[#0284C7] text-white text-[13px] font-medium"
          >
            {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1.5 h-3.5 w-3.5" />}
            Save Changes
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabKey)}>
        <TabsList className="bg-[#f1f5f9] h-10">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger key={tab.key} value={tab.key} className="text-[13px] gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Brand Tab */}
        <TabsContent value="brand">
          <Card className="border-[#e2e8f0]">
            <CardHeader className="pb-3">
              <CardTitle className="text-[15px]">Brand Identity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 max-w-2xl">
                <div className="space-y-1.5">
                  <Label className="text-[13px] font-medium text-[#374151]">Site Name</Label>
                  <Input value={settings.siteName} onChange={(e) => update("siteName", e.target.value)} className="h-10 text-[14px]" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[13px] font-medium text-[#374151]">Tagline</Label>
                  <Input value={settings.siteTagline || ""} onChange={(e) => update("siteTagline", e.target.value)} className="h-10 text-[14px]" placeholder="Your site tagline" />
                </div>
                <div className="space-y-1.5">
                  <SingleImageUploader
                    value={settings.logoUrl || ""}
                    onChange={(url) => update("logoUrl", url)}
                    label="Logo"
                  />
                </div>
                <div className="space-y-1.5">
                  <SingleImageUploader
                    value={settings.faviconUrl || ""}
                    onChange={(url) => update("faviconUrl", url)}
                    label="Favicon"
                  />
                </div>
              </div>
              <Separator className="my-2" />
              <h4 className="text-[14px] font-medium text-[#374151]">Contact Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 max-w-2xl">
                <div className="space-y-1.5">
                  <Label className="text-[13px] font-medium text-[#374151]">Phone</Label>
                  <Input value={settings.phone || ""} onChange={(e) => update("phone", e.target.value)} className="h-10 text-[14px]" placeholder="+880..." />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[13px] font-medium text-[#374151]">Email</Label>
                  <Input value={settings.email || ""} onChange={(e) => update("email", e.target.value)} className="h-10 text-[14px]" placeholder="info@example.com" />
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <Label className="text-[13px] font-medium text-[#374151]">Address</Label>
                  <Input value={settings.address || ""} onChange={(e) => update("address", e.target.value)} className="h-10 text-[14px]" placeholder="Full address" />
                </div>
              </div>

              <Separator className="my-2" />
              <h4 className="text-[14px] font-medium text-[#374151]">Footer</h4>
              <div className="max-w-2xl space-y-1.5">
                <Label className="text-[13px] font-medium text-[#374151]">Copyright Text</Label>
                <Input value={settings.copyrightText} onChange={(e) => update("copyrightText", e.target.value)} className="h-10 text-[14px]" />
              </div>

              <Separator className="my-2" />
              <h4 className="text-[14px] font-medium text-[#374151]">SEO / Meta</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 max-w-2xl">
                <div className="space-y-1.5">
                  <Label className="text-[13px] font-medium text-[#374151]">Meta Title</Label>
                  <Input value={settings.metaTitle || ""} onChange={(e) => update("metaTitle", e.target.value)} className="h-10 text-[14px]" placeholder="Page title for search engines" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[13px] font-medium text-[#374151]">Meta Description</Label>
                  <Input value={settings.metaDescription || ""} onChange={(e) => update("metaDescription", e.target.value)} className="h-10 text-[14px]" placeholder="Brief description..." />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Colors Tab */}
        <TabsContent value="colors">
          <Card className="border-[#e2e8f0]">
            <CardHeader className="pb-3">
              <CardTitle className="text-[15px]">Color Scheme</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-5 max-w-2xl">
                {colorFields.map((f) => (
                  <ColorInput
                    key={f.key}
                    label={f.label}
                    desc={f.desc}
                    value={settings[f.key]}
                    onChange={(v) => update(f.key, v)}
                  />
                ))}
              </div>
              {/* Live Preview */}
              <div className="mt-8 p-6 rounded-lg border border-[#e2e8f0] space-y-3">
                <h4 className="text-[14px] font-medium text-[#374151] mb-3">Live Preview</h4>
                <div className="flex flex-wrap gap-3">
                  <div className="text-center space-y-1">
                    <div className="h-16 w-24 rounded-md border" style={{ backgroundColor: `#${settings.primaryColor}` }} />
                    <span className="text-[11px] text-[#94a3b8]">Primary</span>
                  </div>
                  <div className="text-center space-y-1">
                    <div className="h-16 w-24 rounded-md border" style={{ backgroundColor: `#${settings.secondaryColor}` }} />
                    <span className="text-[11px] text-[#94a3b8]">Secondary</span>
                  </div>
                  <div className="text-center space-y-1">
                    <div className="h-16 w-24 rounded-md border" style={{ backgroundColor: `#${settings.accentColor}` }} />
                    <span className="text-[11px] text-[#94a3b8]">Accent</span>
                  </div>
                  <div className="text-center space-y-1">
                    <div className="h-16 w-24 rounded-md border" style={{ backgroundColor: `#${settings.headerBg}` }} />
                    <span className="text-[11px] text-[#94a3b8]">Header</span>
                  </div>
                  <div className="text-center space-y-1">
                    <div className="h-16 w-24 rounded-md border" style={{ backgroundColor: `#${settings.footerBg}` }} />
                    <span className="text-[11px] text-[#94a3b8]">Footer</span>
                  </div>
                  <div className="text-center space-y-1">
                    <div className="h-16 w-24 rounded-md border" style={{ backgroundColor: `#${settings.bodyBg}` }} />
                    <span className="text-[11px] text-[#94a3b8]">Body</span>
                  </div>
                </div>
                {/* Button preview */}
                <div className="mt-4 flex items-center gap-3 pt-3 border-t border-[#e2e8f0]">
                  <div
                    className="h-10 px-5 rounded-md text-white text-[14px] font-medium flex items-center"
                    style={{ backgroundColor: `#${settings.primaryColor}` }}
                  >
                    Primary Button
                  </div>
                  <div
                    className="h-10 px-5 rounded-md text-white text-[14px] font-medium flex items-center"
                    style={{ backgroundColor: `#${settings.secondaryColor}` }}
                  >
                    Hover State
                  </div>
                  <div
                    className="h-10 px-5 rounded-md text-white text-[14px] font-medium flex items-center"
                    style={{ backgroundColor: `#${settings.accentColor}` }}
                  >
                    Accent
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Typography Tab */}
        <TabsContent value="typography">
          <Card className="border-[#e2e8f0]">
            <CardHeader className="pb-3">
              <CardTitle className="text-[15px]">Typography</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 max-w-2xl">
              <div className="space-y-1.5">
                <Label className="text-[13px] font-medium text-[#374151]">Heading Font</Label>
                <select
                  value={settings.headingFont}
                  onChange={(e) => update("headingFont", e.target.value)}
                  className="h-10 w-full text-[14px] border border-[#e2e8f0] rounded-md px-3 bg-white focus:border-[#0EA5E9] outline-none"
                >
                  <option value="Geist Sans">Geist Sans</option>
                  <option value="Inter">Inter</option>
                  <option value="Noto Sans Bengali">Noto Sans Bengali</option>
                  <option value="LXGW WenKai">LXGW WenKai</option>
                  <option value="System UI">System UI</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[13px] font-medium text-[#374151]">Body Font</Label>
                <select
                  value={settings.bodyFont}
                  onChange={(e) => update("bodyFont", e.target.value)}
                  className="h-10 w-full text-[14px] border border-[#e2e8f0] rounded-md px-3 bg-white focus:border-[#0EA5E9] outline-none"
                >
                  <option value="Geist Sans">Geist Sans</option>
                  <option value="Inter">Inter</option>
                  <option value="Noto Sans Bengali">Noto Sans Bengali</option>
                  <option value="LXGW WenKai">LXGW WenKai</option>
                  <option value="System UI">System UI</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[13px] font-medium text-[#374151]">Base Font Size (px)</Label>
                <Input
                  type="number"
                  min={12}
                  max={22}
                  value={settings.fontSize}
                  onChange={(e) => update("fontSize", e.target.value)}
                  className="h-10 w-32 text-[14px]"
                />
                <p className="text-[12px] text-[#94a3b8]">Recommended: 14-18px</p>
              </div>
              {/* Preview */}
              <div className="p-4 rounded-md border border-[#e2e8f0] bg-[#f8fafc] space-y-2">
                <p className="text-[12px] text-[#94a3b8]">Preview:</p>
                <p className="text-[24px] font-semibold text-[#111827]" style={{ fontFamily: settings.headingFont }}>
                  Heading Text Example
                </p>
                <p className="text-[14px] text-[#64748b]" style={{ fontFamily: settings.bodyFont, fontSize: `${settings.fontSize}px` }}>
                  This is how your body text will look with the selected font and size. The quick brown fox jumps over the lazy dog.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Layout Tab */}
        <TabsContent value="layout">
          <Card className="border-[#e2e8f0]">
            <CardHeader className="pb-3">
              <CardTitle className="text-[15px]">Layout Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 max-w-2xl">
              <div className="space-y-1.5">
                <Label className="text-[13px] font-medium text-[#374151]">Container Max Width (px)</Label>
                <Input
                  type="number"
                  min={960}
                  max={1600}
                  step={10}
                  value={settings.containerWidth}
                  onChange={(e) => update("containerWidth", e.target.value)}
                  className="h-10 w-40 text-[14px]"
                />
                <p className="text-[12px] text-[#94a3b8]">Default: 1280px. Common: 1024, 1200, 1280, 1440</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Social Tab */}
        <TabsContent value="social">
          <Card className="border-[#e2e8f0]">
            <CardHeader className="pb-3">
              <CardTitle className="text-[15px]">Social Media Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 max-w-2xl">
              {[
                { key: "facebookUrl" as const, label: "Facebook", placeholder: "https://facebook.com/..." },
                { key: "instagramUrl" as const, label: "Instagram", placeholder: "https://instagram.com/..." },
                { key: "twitterUrl" as const, label: "Twitter / X", placeholder: "https://x.com/..." },
                { key: "youtubeUrl" as const, label: "YouTube", placeholder: "https://youtube.com/..." },
                { key: "linkedinUrl" as const, label: "LinkedIn", placeholder: "https://linkedin.com/..." },
              ].map((s) => (
                <div key={s.key} className="space-y-1.5">
                  <Label className="text-[13px] font-medium text-[#374151]">{s.label}</Label>
                  <Input
                    value={settings[s.key] || ""}
                    onChange={(e) => update(s.key, e.target.value)}
                    className="h-10 text-[14px]"
                    placeholder={s.placeholder}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}