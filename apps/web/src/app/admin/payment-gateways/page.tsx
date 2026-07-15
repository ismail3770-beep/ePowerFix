"use client";
import type * as React from "react";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";

interface PaymentSettings {
  bkashEnabled: boolean;
  bkashPhoneNumber: string | null;
  bkashApiKey: string | null;
  bkashSecretKey: string | null;
  bkashSandbox: boolean;

  nagadEnabled: boolean;
  nagadPhoneNumber: string | null;
  nagadApiKey: string | null;
  nagadSecretKey: string | null;
  nagadSandbox: boolean;

  sslcommerzEnabled: boolean;
  sslcommerzStoreId: string | null;
  sslcommerzStorePassword: string | null;
  sslcommerzSandbox: boolean;

  bankTransferEnabled: boolean;
  bankTransferInstructions: string | null;

  codEnabled: boolean;
  codFee: number;
}

const DEFAULTS: PaymentSettings = {
  bkashEnabled: false,
  bkashPhoneNumber: "",
  bkashApiKey: "",
  bkashSecretKey: "",
  bkashSandbox: true,
  nagadEnabled: false,
  nagadPhoneNumber: "",
  nagadApiKey: "",
  nagadSecretKey: "",
  nagadSandbox: true,
  sslcommerzEnabled: false,
  sslcommerzStoreId: "",
  sslcommerzStorePassword: "",
  sslcommerzSandbox: true,
  bankTransferEnabled: false,
  bankTransferInstructions: "",
  codEnabled: true,
  codFee: 0,
};

function GatewayCard({
  name,
  icon,
  color,
  enabled,
  onToggle,
  children,
}: {
  name: string;
  icon: string;
  color: string;
  enabled: boolean;
  onToggle: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <Card className={`border-2 transition-colors ${enabled ? "border-[#0EA5E9]" : "border-[#E2E8F0]"}`}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className={`h-10 w-10 rounded-lg flex items-center justify-center text-sm font-bold ${color}`}>
              {icon}
            </span>
            <div>
              <p className="text-sm font-semibold text-[#111827]">{name}</p>
              <Badge variant={enabled ? "default" : "secondary"} className={`text-[10px] mt-0.5 ${enabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                {enabled ? "Active" : "Disabled"}
              </Badge>
            </div>
          </div>
          <Switch checked={enabled} onCheckedChange={onToggle} />
        </div>
        {enabled && <div className="space-y-3 pt-2 border-t">{children}</div>}
      </CardContent>
    </Card>
  );
}

function SecretInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <Label className="text-xs text-[#6B7280]">{label}</Label>
      <div className="relative">
        <Input
          type={show ? "text" : "password"}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pr-10"
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#111827]"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

export default function AdminPaymentGatewaysPage() {
  const [settings, setSettings] = useState<PaymentSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiFetch<{ data: any }>("/api/admin/settings")
      .then((res) => {
        const s = res.data;
        setSettings({
          bkashEnabled: s.bkashEnabled ?? false,
          bkashPhoneNumber: s.bkashPhoneNumber ?? "",
          bkashApiKey: s.bkashApiKey ?? "",
          bkashSecretKey: s.bkashSecretKey ?? "",
          bkashSandbox: s.bkashSandbox ?? true,
          nagadEnabled: s.nagadEnabled ?? false,
          nagadPhoneNumber: s.nagadPhoneNumber ?? "",
          nagadApiKey: s.nagadApiKey ?? "",
          nagadSecretKey: s.nagadSecretKey ?? "",
          nagadSandbox: s.nagadSandbox ?? true,
          sslcommerzEnabled: s.sslcommerzEnabled ?? false,
          sslcommerzStoreId: s.sslcommerzStoreId ?? "",
          sslcommerzStorePassword: s.sslcommerzStorePassword ?? "",
          sslcommerzSandbox: s.sslcommerzSandbox ?? true,
          bankTransferEnabled: s.bankTransferEnabled ?? false,
          bankTransferInstructions: s.bankTransferInstructions ?? "",
          codEnabled: s.codEnabled ?? true,
          codFee: s.codFee ?? 0,
        });
      })
      .catch(() => toast.error("Failed to load payment settings"))
      .finally(() => setLoading(false));
  }, []);

  const update = (field: keyof PaymentSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiFetch("/api/admin/settings", {
        method: "PUT",
        body: JSON.stringify(settings),
      });
      toast.success("Payment gateway settings saved");
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
          <h1 className="text-2xl font-bold text-[#111827]">Payment Gateways</h1>
          <p className="text-sm text-[#6B7280] mt-1">Configure payment methods for checkout</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-[#0EA5E9] hover:bg-[#0284C7]">
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* bKash */}
        <GatewayCard
          name="bKash"
          icon="bK"
          color="bg-pink-100 text-pink-700"
          enabled={settings.bkashEnabled}
          onToggle={(v) => update("bkashEnabled", v)}
        >
          <div>
            <Label className="text-xs text-[#6B7280]">bKash Merchant Phone Number</Label>
            <Input
              value={settings.bkashPhoneNumber || ""}
              onChange={(e) => update("bkashPhoneNumber", e.target.value)}
              placeholder="01XXXXXXXXX"
            />
          </div>
          <SecretInput
            label="API Key"
            value={settings.bkashApiKey || ""}
            onChange={(v) => update("bkashApiKey", v)}
            placeholder="bkash API key"
          />
          <SecretInput
            label="Secret Key"
            value={settings.bkashSecretKey || ""}
            onChange={(v) => update("bkashSecretKey", v)}
            placeholder="bkash secret key"
          />
          <div className="flex items-center justify-between pt-1">
            <Label className="text-xs text-[#6B7280]">Sandbox / Test Mode</Label>
            <Switch checked={settings.bkashSandbox} onCheckedChange={(v) => update("bkashSandbox", v)} />
          </div>
        </GatewayCard>

        {/* Nagad */}
        <GatewayCard
          name="Nagad"
          icon="N"
          color="bg-orange-100 text-orange-700"
          enabled={settings.nagadEnabled}
          onToggle={(v) => update("nagadEnabled", v)}
        >
          <div>
            <Label className="text-xs text-[#6B7280]">Nagad Merchant Phone Number</Label>
            <Input
              value={settings.nagadPhoneNumber || ""}
              onChange={(e) => update("nagadPhoneNumber", e.target.value)}
              placeholder="01XXXXXXXXX"
            />
          </div>
          <SecretInput
            label="API Key"
            value={settings.nagadApiKey || ""}
            onChange={(v) => update("nagadApiKey", v)}
            placeholder="Nagad API key"
          />
          <SecretInput
            label="Secret Key"
            value={settings.nagadSecretKey || ""}
            onChange={(v) => update("nagadSecretKey", v)}
            placeholder="Nagad secret key"
          />
          <div className="flex items-center justify-between pt-1">
            <Label className="text-xs text-[#6B7280]">Sandbox / Test Mode</Label>
            <Switch checked={settings.nagadSandbox} onCheckedChange={(v) => update("nagadSandbox", v)} />
          </div>
        </GatewayCard>

        {/* SSLCommerz */}
        <GatewayCard
          name="SSLCommerz"
          icon="SSL"
          color="bg-blue-100 text-blue-700"
          enabled={settings.sslcommerzEnabled}
          onToggle={(v) => update("sslcommerzEnabled", v)}
        >
          <div>
            <Label className="text-xs text-[#6B7280]">Store ID</Label>
            <Input
              value={settings.sslcommerzStoreId || ""}
              onChange={(e) => update("sslcommerzStoreId", e.target.value)}
              placeholder="your_store_id"
            />
          </div>
          <SecretInput
            label="Store Password"
            value={settings.sslcommerzStorePassword || ""}
            onChange={(v) => update("sslcommerzStorePassword", v)}
            placeholder="store password"
          />
          <div className="flex items-center justify-between pt-1">
            <Label className="text-xs text-[#6B7280]">Sandbox / Test Mode</Label>
            <Switch checked={settings.sslcommerzSandbox} onCheckedChange={(v) => update("sslcommerzSandbox", v)} />
          </div>
        </GatewayCard>

        {/* Bank Transfer */}
        <GatewayCard
          name="Bank Transfer"
          icon="BT"
          color="bg-gray-100 text-gray-700"
          enabled={settings.bankTransferEnabled}
          onToggle={(v) => update("bankTransferEnabled", v)}
        >
          <div>
            <Label className="text-xs text-[#6B7280]">Bank Transfer Instructions</Label>
            <Textarea
              value={settings.bankTransferInstructions || ""}
              onChange={(e) => update("bankTransferInstructions", e.target.value)}
              placeholder={"Bank: XXX Bank\nAccount Name: ePowerFix\nAccount Number: 1234567890\nBranch: Dhaka"}
              rows={4}
            />
            <p className="text-[11px] text-[#9CA3AF] mt-1">Shown to customers at checkout.</p>
          </div>
        </GatewayCard>

        {/* Cash on Delivery */}
        <GatewayCard
          name="Cash on Delivery"
          icon="COD"
          color="bg-green-100 text-green-700"
          enabled={settings.codEnabled}
          onToggle={(v) => update("codEnabled", v)}
        >
          <div>
            <Label className="text-xs text-[#6B7280]">COD Extra Fee (৳)</Label>
            <Input
              type="number"
              value={settings.codFee}
              onChange={(e) => update("codFee", Number(e.target.value))}
              placeholder="0"
              min={0}
            />
            <p className="text-[11px] text-[#9CA3AF] mt-1">Additional charge added to COD orders. Set 0 for no extra fee.</p>
          </div>
        </GatewayCard>
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
