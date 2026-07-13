"use client";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Truck, Loader2, Check, Info } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";

interface ShippingSettings {
  shippingInsideDhaka: number;
  shippingOutsideDhaka: number;
  freeShippingThreshold: number;
  shippingInsideDhakaLabel: string;
  shippingOutsideDhakaLabel: string;
}

const DEFAULTS: ShippingSettings = {
  shippingInsideDhaka: 60,
  shippingOutsideDhaka: 120,
  freeShippingThreshold: 5000,
  shippingInsideDhakaLabel: "Inside Dhaka",
  shippingOutsideDhakaLabel: "Outside Dhaka",
};

export default function AdminShippingPage() {
  const [settings, setSettings] = useState<ShippingSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiFetch<{ data: any }>("/api/admin/settings")
      .then((res) => {
        const s = res.data;
        setSettings({
          shippingInsideDhaka: s.shippingInsideDhaka ?? 60,
          shippingOutsideDhaka: s.shippingOutsideDhaka ?? 120,
          freeShippingThreshold: s.freeShippingThreshold ?? 5000,
          shippingInsideDhakaLabel: s.shippingInsideDhakaLabel ?? "Inside Dhaka",
          shippingOutsideDhakaLabel: s.shippingOutsideDhakaLabel ?? "Outside Dhaka",
        });
      })
      .catch(() => toast.error("Failed to load shipping settings"))
      .finally(() => setLoading(false));
  }, []);

  const update = (field: keyof ShippingSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiFetch("/api/admin/settings", {
        method: "PUT",
        body: JSON.stringify(settings),
      });
      toast.success("Shipping settings saved");
    } catch (err: any) {
      toast.error(err?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-[#0EA5E9]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Shipping</h1>
          <p className="text-sm text-[#6B7280] mt-1">Delivery zones, rates, and free-shipping threshold</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-[#0EA5E9] hover:bg-[#0284C7]">
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Inside Dhaka */}
        <Card>
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg bg-teal-100 flex items-center justify-center">
                <Truck className="h-4 w-4 text-teal-600" />
              </div>
              <h3 className="font-semibold text-[#111827]">Inside Dhaka</h3>
            </div>
            <div>
              <Label className="text-xs text-[#6B7280]">Zone Label</Label>
              <Input
                value={settings.shippingInsideDhakaLabel}
                onChange={(e) => update("shippingInsideDhakaLabel", e.target.value)}
                placeholder="Inside Dhaka"
              />
            </div>
            <div>
              <Label className="text-xs text-[#6B7280]">Delivery Charge (৳)</Label>
              <Input
                type="number"
                value={settings.shippingInsideDhaka}
                onChange={(e) => update("shippingInsideDhaka", Number(e.target.value))}
                min={0}
              />
            </div>
          </CardContent>
        </Card>

        {/* Outside Dhaka */}
        <Card>
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg bg-indigo-100 flex items-center justify-center">
                <Truck className="h-4 w-4 text-indigo-600" />
              </div>
              <h3 className="font-semibold text-[#111827]">Outside Dhaka</h3>
            </div>
            <div>
              <Label className="text-xs text-[#6B7280]">Zone Label</Label>
              <Input
                value={settings.shippingOutsideDhakaLabel}
                onChange={(e) => update("shippingOutsideDhakaLabel", e.target.value)}
                placeholder="Outside Dhaka"
              />
            </div>
            <div>
              <Label className="text-xs text-[#6B7280]">Delivery Charge (৳)</Label>
              <Input
                type="number"
                value={settings.shippingOutsideDhaka}
                onChange={(e) => update("shippingOutsideDhaka", Number(e.target.value))}
                min={0}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Free shipping threshold */}
      <Card>
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-green-100 flex items-center justify-center">
              <Check className="h-4 w-4 text-green-600" />
            </div>
            <h3 className="font-semibold text-[#111827]">Free Shipping Threshold</h3>
          </div>
          <div>
            <Label className="text-xs text-[#6B7280]">Free shipping for orders above (৳)</Label>
            <Input
              type="number"
              value={settings.freeShippingThreshold}
              onChange={(e) => update("freeShippingThreshold", Number(e.target.value))}
              min={0}
            />
            <p className="text-[11px] text-[#9CA3AF] mt-1">
              Orders with a subtotal above this amount get free delivery. Set 0 to disable free shipping.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Info banner */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-medium mb-1">How delivery charges work</p>
          <p className="text-blue-700">
            At checkout, the customer selects their area. If the area contains "Dhaka" or "ঢাকা",
            the Inside Dhaka rate is applied; otherwise the Outside Dhaka rate is used. Orders above
            the free-shipping threshold get ৳0 delivery.
          </p>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button onClick={handleSave} disabled={saving} className="bg-[#0EA5E9] hover:bg-[#0284C7]">
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
