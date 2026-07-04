"use client";

import { useEffect, useState, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogHeader, DialogContent, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Plus, Pencil, Trash2, Zap, Loader2, CheckCircle, XCircle,
  Server, Wifi, RefreshCw, Eye, EyeOff, Info,
} from "lucide-react";
import { useAdminHeaderStore } from "@/store/admin-header-store";

// ======================== TYPES ========================

type ProviderType = "OPENAI" | "ANTHROPIC" | "GEMINI" | "OLLAMA" | "OPENROUTER" | "OPENCODE" | "CUSTOM";

interface Provider {
  id: string;
  name: string;
  type: ProviderType;
  apiKey: string;
  apiKeySet: boolean;
  baseUrl: string;
  defaultModel: string;
  enabled: boolean;
  isBuiltIn?: boolean;
  config: Record<string, any> | null;
  lastTestedAt?: string;
  lastTestStatus?: string;
  createdAt: string;
}

interface ProviderDefaults {
  name: string;
  baseUrl: string;
  defaultModel: string;
  needsKey: boolean;
}

interface ModelItem {
  id: string;
  name: string;
}

// ======================== CONSTANTS ========================

const PROVIDER_TYPES: { value: ProviderType; label: string; color: string }[] = [
  { value: "CUSTOM", label: "Custom API", color: "bg-gray-100 text-gray-700" },
];

const TYPE_ICON: Record<string, string> = {
  CUSTOM: "⚙️",
};

const emptyForm = () => ({
  name: "",
  type: "CUSTOM" as ProviderType,
  apiKey: "",
  baseUrl: "",
  defaultModel: "",
  enabled: true,
  endpointPath: "",
});

// ======================== PAGE ========================

export default function AIProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<Provider | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [modelsDialog, setModelsDialog] = useState(false);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [models, setModels] = useState<ModelItem[]>([]);
  const [modelsProviderName, setModelsProviderName] = useState("");

  // ======================== LOAD ========================
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await apiFetch("/api/admin/ai-providers");
      setProviders(Array.isArray(res) ? res : (res as any)?.data || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load providers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ======================== TYPE CHANGE (auto-fill defaults) ========================
  const handleTypeChange = async (type: ProviderType) => {
    setForm(f => ({ ...f, type, name: f.name || "", baseUrl: "", defaultModel: "", apiKey: "" }));
    try {
      const res: any = await apiFetch(`/api/admin/ai-providers/defaults?type=${type}`);
      const d = Array.isArray(res) ? res[0] : (res as any)?.data || res;
      setForm(f => ({
        ...f,
        type,
        name: f.name || d.name || "",
        baseUrl: f.baseUrl || d.baseUrl || "",
        defaultModel: f.defaultModel || d.defaultModel || "",
      }));
    } catch {
      // ignore — user fills manually
    }
  };

  // ======================== SAVE ========================
  const handleSave = async () => {
    if (!form.name.trim() || !form.baseUrl.trim() || !form.defaultModel.trim()) {
      toast.error("Name, Base URL, and Default Model are required");
      return;
    }
    setSaving(true);
    try {
      const body: any = {
        name: form.name.trim(),
        type: form.type,
        baseUrl: form.baseUrl.trim(),
        defaultModel: form.defaultModel.trim(),
        enabled: form.enabled,
      };
      if (form.apiKey.trim()) body.apiKey = form.apiKey.trim();

      const config: Record<string, any> = {};
      if (form.endpointPath.trim()) config.endpointPath = form.endpointPath.trim();
      if (Object.keys(config).length > 0) body.config = config;

      if (editing) {
        await apiFetch(`/api/admin/ai-providers/${editing.id}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });
        toast.success("Provider updated");
      } else {
        await apiFetch("/api/admin/ai-providers", {
          method: "POST",
          body: JSON.stringify(body),
        });
        toast.success("Provider created");
      }
      setDialog(false);
      setEditing(null);
      setForm(emptyForm());
      load();
    } catch (err: any) {
      toast.error(err.message || "Failed to save provider");
    } finally {
      setSaving(false);
    }
  };

  // ======================== DELETE ========================
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this provider?")) return;
    try {
      await apiFetch(`/api/admin/ai-providers/${id}`, { method: "DELETE" });
      toast.success("Provider deleted");
      load();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // ======================== TOGGLE ========================
  const handleToggle = async (id: string, enabled: boolean) => {
    try {
      await apiFetch(`/api/admin/ai-providers/${id}/toggle`, {
        method: "POST",
        body: JSON.stringify({ enabled }),
      });
      setProviders(prev => prev.map(p => p.id === id ? { ...p, enabled } : p));
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // ======================== TEST CONNECTION ========================
  const handleTest = async (id: string) => {
    setTestingId(id);
    try {
      const res: any = await apiFetch(`/api/admin/ai-providers/${id}/test`, {
        method: "POST",
      });
      const result = Array.isArray(res) ? res[0] : (res as any)?.data || res;
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message || "Connection failed");
      }
      // Update test status locally
      setProviders(prev => prev.map(p => p.id === id ? {
        ...p,
        lastTestStatus: result.success ? "SUCCESS" : "FAILED",
        lastTestedAt: new Date().toISOString(),
      } : p));
    } catch (err: any) {
      toast.error(err.message || "Test failed");
    } finally {
      setTestingId(null);
    }
  };

  // ======================== FETCH MODELS ========================
  const handleFetchModels = async (provider: Provider) => {
    setModelsProviderName(provider.name);
    setModelsLoading(true);
    setModelsDialog(true);
    setModels([]);
    try {
      const res: any = await apiFetch(`/api/admin/ai-providers/${provider.id}/models`, {
        method: "POST",
      });
      const data = Array.isArray(res) ? res : (res as any)?.data || [];
      setModels(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch models");
    } finally {
      setModelsLoading(false);
    }
  };

  // ======================== DIALOG HELPERS ========================
  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm());
    setShowKey(false);
    setDialog(true);
  };

  const openEdit = (p: Provider) => {
    setEditing(p);
    setForm({
      name: p.name,
      type: p.type,
      apiKey: "",
      baseUrl: p.baseUrl,
      defaultModel: p.defaultModel,
      enabled: p.enabled,
      endpointPath: (p.config as any)?.endpointPath || "",
    });
    setShowKey(false);
    setDialog(true);
  };

  const getTypeInfo = (type: string) => PROVIDER_TYPES.find(t => t.value === type) || PROVIDER_TYPES[0];

  // Register header "Add New" button
  const setAddNew = useAdminHeaderStore((s) => s.setAddNew);
  useEffect(() => { setAddNew('Add Provider', openAdd); return () => setAddNew('', null); }, [setAddNew]);

  // ======================== RENDER ========================
  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Card><CardContent className="p-6 space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
        </CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Providers</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage AI providers, test connections, and configure models
          </p>
        </div>
        <Button onClick={openAdd} className="bg-[#0EA5E9] hover:bg-sky-600">
          <Plus className="h-4 w-4 mr-1.5" /> Add Provider
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{providers.length}</p>
            <p className="text-xs text-gray-500 mt-1">Total Providers</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{providers.filter(p => p.enabled).length}</p>
            <p className="text-xs text-gray-500 mt-1">Active</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">{providers.filter(p => p.lastTestStatus === "SUCCESS").length}</p>
            <p className="text-xs text-gray-500 mt-1">Tested OK</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-500">{providers.filter(p => p.lastTestStatus === "FAILED").length}</p>
            <p className="text-xs text-gray-500 mt-1">Test Failed</p>
          </CardContent>
        </Card>
      </div>

      {/* Provider List */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80">
                  <TableHead className="w-[40px]"></TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Base URL</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Test</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {providers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2 text-gray-400">
                        <Server className="h-10 w-10" />
                        <p className="font-medium">No providers configured</p>
                        <p className="text-xs">Add your first AI provider to get started</p>
                        <Button variant="outline" size="sm" onClick={openAdd} className="mt-2">
                          <Plus className="h-3.5 w-3.5 mr-1" /> Add Provider
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  providers.map(p => {
                    const typeInfo = getTypeInfo(p.type);
                    return (
                      <TableRow key={p.id} className="group">
                        <TableCell className="text-lg">{TYPE_ICON[p.type] || "⚙️"}</TableCell>
                        <TableCell>
                          <div className="font-medium text-gray-900">{p.name}</div>
                          <div className="text-xs text-gray-400">{p.id.slice(0, 8)}...</div>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex px-2 py-0.5 text-[11px] font-semibold rounded-full ${typeInfo.color}`}>
                            {typeInfo.label}
                          </span>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-xs text-gray-600" title={p.baseUrl}>
                          {p.baseUrl}
                        </TableCell>
                        <TableCell className="text-sm font-mono text-gray-700">
                          {p.defaultModel}
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={p.enabled}
                            onCheckedChange={v => handleToggle(p.id, v)}
                          />
                        </TableCell>
                        <TableCell>
                          {p.lastTestStatus === "SUCCESS" && (
                            <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 text-[11px]">
                              <CheckCircle className="h-3 w-3 mr-1" /> OK
                            </Badge>
                          )}
                          {p.lastTestStatus === "FAILED" && (
                            <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50 text-[11px]">
                              <XCircle className="h-3 w-3 mr-1" /> Failed
                            </Badge>
                          )}
                          {!p.lastTestStatus && (
                            <span className="text-xs text-gray-400">Not tested</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-500 hover:text-blue-600"
                              onClick={() => handleFetchModels(p)}
                              title="Fetch models"
                            >
                              <RefreshCw className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-500 hover:text-green-600"
                              onClick={() => handleTest(p.id)}
                              disabled={testingId === p.id}
                              title="Test connection"
                            >
                              {testingId === p.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Wifi className="h-3.5 w-3.5" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-500 hover:text-sky-600"
                              onClick={() => openEdit(p)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-500 hover:text-red-500"
                              onClick={() => handleDelete(p.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-0 shadow-sm bg-sky-50/50">
        <CardContent className="p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-sky-500 shrink-0 mt-0.5" />
          <div className="text-sm text-sky-800 space-y-1">
            <p className="font-medium">Supported Provider Types</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 mt-2">
              {PROVIDER_TYPES.map(t => (
                <div key={t.value} className="flex items-center gap-1.5 text-xs">
                  <span>{TYPE_ICON[t.value]}</span>
                  <span>{t.label}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-sky-600 mt-2">
              API keys are encrypted at rest and masked in the UI. Use environment variables for production deployments.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* =================== ADD/EDIT DIALOG =================== */}
      <Dialog open={dialog} onOpenChange={v => { setDialog(v); if (!v) { setEditing(null); setForm(emptyForm()); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-[#0EA5E9]" />
              {editing ? "Edit Provider" : "Add Provider"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Provider Type */}
            <div className="space-y-1.5">
              <Label>Provider Type</Label>
              <Select
                value={form.type}
                onValueChange={v => handleTypeChange(v as ProviderType)}
                disabled={!!editing}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDER_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>
                      {TYPE_ICON[t.value]} {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {editing && (
                <p className="text-[11px] text-gray-400">Type cannot be changed after creation</p>
              )}
            </div>

            {/* Name */}
            <div className="space-y-1.5">
              <Label>Provider Name</Label>
              <Input
                placeholder="e.g., My OpenAI, Production Claude"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>

            {/* API Key */}
            <div className="space-y-1.5">
              <Label>API Key</Label>
              <div className="relative">
                <Input
                  type={showKey ? "text" : "password"}
                  placeholder={editing ? "Leave blank to keep current key" : "sk-..."}
                  value={form.apiKey}
                  onChange={e => setForm(f => ({ ...f, apiKey: e.target.value }))}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {editing && (
                <p className="text-[11px] text-gray-400">
                  Current: {editing.apiKey || "No key set"}
                </p>
              )}
            </div>

            {/* Base URL */}
            <div className="space-y-1.5">
              <Label>Base URL</Label>
              <Input
                placeholder="https://api.openai.com/v1"
                value={form.baseUrl}
                onChange={e => setForm(f => ({ ...f, baseUrl: e.target.value }))}
              />
              <p className="text-[11px] text-gray-400">
                {form.type === "OLLAMA" && "e.g., http://localhost:11434 or http://server-ip:11434"}
                {form.type === "CUSTOM" && "Your custom API base URL"}
              </p>
            </div>

            {/* Default Model */}
            <div className="space-y-1.5">
              <Label>Default Model</Label>
              <Input
                placeholder="gpt-4o"
                value={form.defaultModel}
                onChange={e => setForm(f => ({ ...f, defaultModel: e.target.value }))}
              />
            </div>

            {/* Endpoint Path (Custom only) */}
            {form.type === "CUSTOM" && (
              <div className="space-y-1.5">
                <Label>Endpoint Path</Label>
                <Input
                  placeholder="/v1/chat/completions"
                  value={form.endpointPath}
                  onChange={e => setForm(f => ({ ...f, endpointPath: e.target.value }))}
                />
                <p className="text-[11px] text-gray-400">Appended after Base URL for chat completions</p>
              </div>
            )}

            {/* Enabled */}
            <div className="flex items-center justify-between py-1">
              <Label>Enabled</Label>
              <Switch
                checked={form.enabled}
                onCheckedChange={v => setForm(f => ({ ...f, enabled: v }))}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !form.name.trim() || !form.baseUrl.trim() || !form.defaultModel.trim()}
              className="bg-[#0EA5E9] hover:bg-sky-600"
            >
              {saving && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              {editing ? "Update" : "Create"} Provider
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* =================== MODELS DIALOG =================== */}
      <Dialog open={modelsDialog} onOpenChange={setModelsDialog}>
        <DialogContent className="max-w-md max-h-[70vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className={`h-5 w-5 ${modelsLoading ? "animate-spin" : ""}`} />
              Models — {modelsProviderName}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-1 py-2">
            {modelsLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : models.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-6">
                No models found. Make sure the provider is running and accessible.
              </p>
            ) : (
              models.map(m => (
                <div
                  key={m.id}
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <span className="text-sm font-mono text-gray-800">{m.id}</span>
                  {m.name !== m.id && (
                    <span className="text-xs text-gray-400 ml-2 truncate max-w-[150px]">{m.name}</span>
                  )}
                </div>
              ))
            )}
          </div>
          <div className="text-xs text-gray-400 text-center pt-1">
            {models.length} model(s) available
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}