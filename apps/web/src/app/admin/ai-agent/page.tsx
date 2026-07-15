"use client";

import type * as React from "react";
import { useState, useRef, useEffect, useCallback } from "react";
import { api, apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Bot, Send, Trash2, Loader2, Sparkles, ArrowRight, MessageSquare, StopCircle, Cpu, AlertCircle } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolCalls?: string[];
  loading?: boolean;
  isError?: boolean;
}

interface ActiveProvider {
  id: string;
  name: string;
  type: string;
  defaultModel: string;
  enabled: boolean;
}

interface ModelOption {
  value: string;
  label: string;
}

const ZAI_MODEL_OPTIONS: ModelOption[] = [
  { value: "__default__", label: "Default (ZAI SDK)" },
  { value: "glm-5", label: "GLM-5" },
  { value: "glm-5-turbo", label: "GLM-5 Turbo" },
  { value: "gpt-4o", label: "GPT-4o" },
  { value: "claude-sonnet-4-20250514", label: "Claude Sonnet 4" },
];

const SUGGESTIONS = [
  "Server health check koro",
  "Dashboard stats dekao",
  "Database status dekao",
  "AI providers er ki ki ace?",
  "Recent orders ki ki ace?",
  "Pending bookings koto ace?",
  "System info dekao",
  "Unread messages dekao",
];

const STORAGE_KEY = "epf-ai-agent-settings";

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {return JSON.parse(raw);}
  } catch {}
  return null;
}

function saveSettings(data: Record<string, any>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

export default function AIAgentPage() {
  const saved = typeof window !== "undefined" ? loadSettings() : null;
  const [messages, setMessages] = useState<Message[]>(saved?.messages || []);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(saved?.sessionId || null);
  const [selectedModel, setSelectedModel] = useState(saved?.selectedModel || "__default__");
  const [selectedProvider, setSelectedProvider] = useState(saved?.selectedProvider || "__default__");
  const [providers, setProviders] = useState<ActiveProvider[]>([]);
  const [providerBadge, setProviderBadge] = useState<string | null>(saved?.providerBadge || null);
  const [modelOptions, setModelOptions] = useState<ModelOption[]>(saved?.modelOptions || ZAI_MODEL_OPTIONS);
  const [modelsLoading, setModelsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Auto-save settings to localStorage on change
  useEffect(() => {
    saveSettings({
      messages: messages.slice(-50), // keep last 50 messages max
      sessionId,
      selectedModel,
      selectedProvider,
      providerBadge,
      modelOptions,
    });
  }, [messages, sessionId, selectedModel, selectedProvider, providerBadge, modelOptions]);

  // Fetch active providers
  useEffect(() => {
    apiFetch<any>("/api/admin/ai-providers/active")
      .then(res => {
        const list: ActiveProvider[] = Array.isArray(res) ? res : res?.data || [];
        setProviders(list);
        // Don't auto-select — keep __default__ (ZAI SDK) as default
      })
      .catch(() => {});
  }, []);

  // Only create a new sessionId if one wasn't saved
  useEffect(() => {
    if (!sessionId) {
      const sid = crypto.randomUUID?.() || `session-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setSessionId(sid);
    }
  }, [sessionId]);

  // When provider changes, fetch models dynamically
  const handleProviderChange = useCallback(async (providerId: string) => {
    setSelectedProvider(providerId);

    if (providerId === "__default__") {
      // Back to ZAI SDK — show static models
      setModelOptions(ZAI_MODEL_OPTIONS);
      setSelectedModel("__default__");
      setProviderBadge(null);
      return;
    }

    const p = providers.find(pr => pr.id === providerId);
    setProviderBadge(p?.name || null);

    // Fetch models from the provider
    setModelsLoading(true);
    try {
      const res: any = await apiFetch(`/api/admin/ai-providers/${providerId}/models`, {
        method: "POST",
      });
      const models: { id: string; name: string }[] = Array.isArray(res) ? res : res?.data || [];

      if (models.length > 0) {
        const opts: ModelOption[] = models.map(m => ({
          value: m.id,
          label: m.name !== m.id ? `${m.name} (${m.id})` : m.id,
        }));
        setModelOptions(opts);
        // Auto-select the provider's defaultModel if it exists in the list
        const defaultMatch = opts.find(o => o.value === p?.defaultModel);
        setSelectedModel(defaultMatch ? defaultMatch.value : opts[0].value);
      } else {
        // No models fetched — use the provider's defaultModel as the only option
        setModelOptions([
          { value: p?.defaultModel || "default", label: p?.defaultModel || "Default Model" },
        ]);
        setSelectedModel(p?.defaultModel || "default");
      }
    } catch {
      // If model fetch fails, still allow using the default model
      setModelOptions([
        { value: p?.defaultModel || "default", label: p?.defaultModel || "Default Model" },
      ]);
      setSelectedModel(p?.defaultModel || "default");
    } finally {
      setModelsLoading(false);
    }
  }, [providers]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) {return;}

    const userMsg: Message = {
      id: crypto.randomUUID?.() || `u-${Date.now()}`,
      role: "user",
      content: text.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    const loadingId = crypto.randomUUID?.() || `a-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: loadingId, role: "assistant", content: "", loading: true },
    ]);

    try {
      abortRef.current = new AbortController();

      const body: Record<string, any> = {
        message: text.trim(),
        sessionId,
      };
      if (selectedProvider !== "__default__") {body.providerId = selectedProvider;}
      if (selectedModel !== "__default__") {body.model = selectedModel;}

      const res = await api.post<{
        success: boolean;
        data: {
          response: string;
          toolCallsExecuted: string[];
          sessionId: string;
          provider?: string;
          modelUsed?: string;
        };
      }>("/api/ai/agent", body);

      const { response, toolCallsExecuted } = res.data;

      setMessages((prev) =>
        prev.map((m) =>
          m.id === loadingId
            ? {
                ...m,
                content: response,
                toolCalls: toolCallsExecuted.length > 0 ? toolCallsExecuted : undefined,
                loading: false,
                isError: false,
              }
            : m
        )
      );

      if (toolCallsExecuted.length > 0) {
        setSessionId(res.data.sessionId);
      }
    } catch (err: any) {
      // Extract actual error message from axios response
      let errorMsg = "Something went wrong. Please try again.";
      if (err.response?.data?.error) {
        errorMsg = err.response.data.error;
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err.message) {
        errorMsg = err.message;
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === loadingId
            ? { ...m, content: errorMsg, loading: false, isError: true }
            : m
        )
      );
      if (err.message !== "Aborted") {
        toast.error(errorMsg);
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
      inputRef.current?.focus();
    }
  };

  const handleStop = () => {
    abortRef.current?.abort();
    setLoading(false);
  };

  const clearChat = async () => {
    try {
      await api.delete("/api/ai/agent");
    } catch {
      // ignore
    }
    setMessages([]);
    const sid = crypto.randomUUID?.() || `session-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setSessionId(sid);
    // Clear saved settings from localStorage
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    toast.success("Chat cleared");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const currentModelLabel = modelOptions.find(m => m.value === selectedModel)?.label || selectedModel;

  return (
    <div className="flex flex-col h-[calc(100vh-56px)]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-white shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">AI Assistant</h1>
            <p className="text-xs text-gray-500">
              Manage your store with natural language
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Provider Selector */}
          <Select value={selectedProvider} onValueChange={handleProviderChange} disabled={loading}>
            <SelectTrigger className="w-[160px] h-9 text-xs">
              <Cpu className="h-3 w-3 mr-1.5 text-sky-500" />
              <SelectValue placeholder="Select Provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__default__">ZAI SDK</SelectItem>
              {providers.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Model Selector */}
          <Select value={selectedModel} onValueChange={setSelectedModel} disabled={loading}>
            <SelectTrigger className="w-[170px] h-9 text-xs">
              {modelsLoading ? (
                <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
              ) : null}
              <SelectValue placeholder="Model" />
            </SelectTrigger>
            <SelectContent>
              {modelOptions.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {messages.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearChat}
              className="text-gray-500 hover:text-red-500"
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              Clear Chat
            </Button>
          )}
        </div>
      </div>

      {/* Provider/Model Info Bar */}
      {selectedProvider !== "__default__" && (
        <div className="px-6 py-1.5 bg-sky-50 border-b border-sky-100 text-xs text-sky-700 flex items-center gap-2 shrink-0">
          <Cpu className="h-3 w-3" />
          <span>
            <strong>{providerBadge}</strong> &middot; Model: <strong>{currentModelLabel}</strong>
          </span>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 bg-gray-50/50">
        <div className="max-w-3xl mx-auto space-y-4">
          {/* Empty State */}
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center mb-6 shadow-xl shadow-sky-500/20">
                <Bot className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                ePowerFix AI Assistant
              </h2>
              <p className="text-gray-500 mb-8 max-w-md">
                Ask me anything about your store — orders, products, users,
                bookings, reviews, and more. I can take actions for you!
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => sendMessage(suggestion)}
                    className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 hover:border-sky-400 hover:bg-sky-50 hover:text-sky-700 transition-all text-left group"
                  >
                    <MessageSquare className="h-4 w-4 text-gray-400 group-hover:text-sky-500 shrink-0" />
                    <span>{suggestion}</span>
                    <ArrowRight className="h-3 w-3 ml-auto text-gray-300 group-hover:text-sky-500 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message List */}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-1 ${
                  msg.isError
                    ? "bg-red-100"
                    : "bg-gradient-to-br from-sky-500 to-blue-600"
                }`}>
                  {msg.isError ? (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  ) : (
                    <Bot className="h-4 w-4 text-white" />
                  )}
                </div>
              )}
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-sky-500 text-white rounded-br-md"
                    : msg.isError
                      ? "bg-red-50 border border-red-200 text-red-700 rounded-bl-md"
                      : "bg-white border border-gray-200 text-gray-800 rounded-bl-md shadow-sm"
                }`}
              >
                {msg.loading ? (
                  <div className="flex items-center gap-2 text-gray-400">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Thinking...</span>
                  </div>
                ) : (
                  <>
                    <div className="whitespace-pre-wrap break-words">
                      {msg.content}
                    </div>
                    {msg.toolCalls && msg.toolCalls.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1.5">
                          Tools Used
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.toolCalls.map((tool, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 px-2 py-0.5 bg-sky-50 text-sky-600 text-[11px] rounded-full font-medium"
                            >
                              <Sparkles className="h-2.5 w-2.5" />
                              {tool}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
              {msg.role === "user" && (
                <div className="h-8 w-8 rounded-lg bg-gray-200 flex items-center justify-center shrink-0 mt-1">
                  <span className="text-xs font-bold text-gray-600">You</span>
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t bg-white px-4 py-3 shrink-0">
        <div className="max-w-3xl mx-auto flex items-center gap-2">
          {loading ? (
            <Button
              variant="outline"
              size="icon"
              onClick={handleStop}
              className="shrink-0 h-10 w-10 rounded-xl border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600"
            >
              <StopCircle className="h-5 w-5" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={clearChat}
              disabled={messages.length === 0}
              className="shrink-0 h-10 w-10 rounded-xl text-gray-400 hover:text-red-500"
            >
              <Trash2 className="h-5 w-5" />
            </Button>
          )}
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask AI Assistant anything... (e.g., 'Recent orders dekao')"
              disabled={loading}
              className="h-10 pl-4 pr-12 rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:border-sky-400 text-sm"
            />
          </div>
          <Button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            size="icon"
            className="shrink-0 h-10 w-10 rounded-xl bg-sky-500 hover:bg-sky-600 text-white shadow-lg shadow-sky-500/20 disabled:opacity-40 disabled:shadow-none"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-[11px] text-gray-400 text-center mt-2">
          AI can make changes to your store. Review responses before taking action.
        </p>
      </div>
    </div>
  );
}