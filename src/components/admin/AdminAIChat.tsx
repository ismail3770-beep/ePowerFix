"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { Bot, Send, X, Sparkles, Loader2, Minimize2, MessageSquare, StopCircle, Trash2 } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolCalls?: string[];
  loading?: boolean;
  isError?: boolean;
}

const STORAGE_KEY = "epf-admin-ai-chat";

function loadChat() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function saveChat(data: Record<string, any>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

export default function AdminAIChat() {
  const saved = typeof window !== "undefined" ? loadChat() : null;
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>(saved?.messages || []);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState<string>(saved?.sessionId || crypto.randomUUID?.() || `s-${Date.now()}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  useEffect(() => {
    if (open && !minimized) inputRef.current?.focus();
  }, [open, minimized]);

  // Auto-save
  useEffect(() => {
    saveChat({ messages: messages.slice(-30), sessionId });
  }, [messages, sessionId]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

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
      const res = await api.post<{
        success: boolean;
        data: { response: string; toolCallsExecuted: string[]; sessionId: string };
      }>("/api/ai/agent", {
        message: text.trim(),
        sessionId,
      });

      const { response, toolCallsExecuted } = res.data;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === loadingId
            ? { ...m, content: response, toolCalls: toolCallsExecuted?.length > 0 ? toolCallsExecuted : undefined, loading: false }
            : m
        )
      );
    } catch (err: any) {
      let errorMsg = "Something went wrong.";
      if (err.response?.data?.error) errorMsg = err.response.data.error;
      else if (err.message) errorMsg = err.message;

      setMessages((prev) =>
        prev.map((m) =>
          m.id === loadingId ? { ...m, content: errorMsg, loading: false, isError: true } : m
        )
      );
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearChat = () => {
    setMessages([]);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  };

  // Minimized floating button
  if (!open) {
    return (
      <button
        onClick={() => { setOpen(true); setMinimized(false); }}
        className="fixed bottom-6 right-6 z-[9999] h-14 w-14 rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 group"
        style={{ background: "linear-gradient(135deg, #0EA5E9, #0284C7)" }}
      >
        <Bot className="h-6 w-6 text-white" />
        <span className="absolute -top-1 -right-1 h-4 w-4 bg-green-400 rounded-full border-2 border-white animate-pulse" />
        <span className="absolute right-full mr-3 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          AI Assistant
        </span>
      </button>
    );
  }

  // Minimized bar
  if (minimized) {
    return (
      <div
        className="fixed bottom-6 right-6 z-[9999] flex items-center gap-2 px-4 py-2.5 rounded-full shadow-2xl cursor-pointer hover:opacity-90 transition-all"
        style={{ background: "linear-gradient(135deg, #0EA5E9, #0284C7)" }}
        onClick={() => setMinimized(false)}
      >
        <Bot className="h-4 w-4 text-white" />
        <span className="text-white text-[13px] font-medium">AI Assistant</span>
        <button
          onClick={(e) => { e.stopPropagation(); setOpen(false); }}
          className="ml-1 h-5 w-5 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30"
        >
          <X className="h-3 w-3 text-white" />
        </button>
      </div>
    );
  }

  // Full chat panel
  return (
    <div
      className="fixed bottom-6 right-6 z-[9999] w-[400px] h-[560px] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-white/10"
      style={{ background: "#0f0a1a" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ background: "linear-gradient(135deg, #0c4a6e, #082f49)" }}
      >
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0EA5E9, #0284C7)" }}>
            <Bot className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-[14px] font-semibold text-white">AI Assistant</p>
            <p className="text-[11px] text-green-400 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400 inline-block" />
              Online
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button onClick={clearChat} className="h-7 w-7 rounded-md hover:bg-white/10 flex items-center justify-center" title="Clear chat">
              <Trash2 className="h-3.5 w-3.5 text-white/60" />
            </button>
          )}
          <button onClick={() => setMinimized(true)} className="h-7 w-7 rounded-md hover:bg-white/10 flex items-center justify-center">
            <Minimize2 className="h-3.5 w-3.5 text-white/60" />
          </button>
          <button onClick={() => setOpen(false)} className="h-7 w-7 rounded-md hover:bg-white/10 flex items-center justify-center">
            <X className="h-3.5 w-3.5 text-white/60" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="h-14 w-14 rounded-xl flex items-center justify-center mb-4" style={{ background: "linear-gradient(135deg, #0EA5E9, #0284C7)" }}>
              <Sparkles className="h-7 w-7 text-white" />
            </div>
            <p className="text-white font-semibold text-[15px] mb-1">ePowerFix AI</p>
            <p className="text-white/40 text-[12px] mb-5 max-w-[250px]">Ask me anything about your store — orders, products, users, stats.</p>
            <div className="space-y-1.5 w-full">
              {["Show recent orders", "Check inventory status", "Revenue summary"].map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="w-full px-3 py-2 rounded-lg text-[12px] text-white/70 hover:text-white bg-white/5 hover:bg-white/10 transition-all text-left"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className={`h-6 w-6 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${msg.isError ? "bg-red-500/20" : ""}`} style={msg.isError ? {} : { background: "linear-gradient(135deg, #0EA5E9, #0284C7)" }}>
                {msg.isError ? <X className="h-3 w-3 text-red-400" /> : <Bot className="h-3 w-3 text-white" />}
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-xl px-3 py-2 text-[13px] leading-relaxed ${
                msg.role === "user"
                  ? "text-white rounded-br-sm"
                  : msg.isError
                    ? "bg-red-500/10 border border-red-500/20 text-red-300 rounded-bl-sm"
                    : "bg-white/5 border border-white/10 text-white/90 rounded-bl-sm"
              }`}
              style={msg.role === "user" ? { background: "linear-gradient(135deg, #0EA5E9, #0284C7)" } : {}}
            >
              {msg.loading ? (
                <div className="flex items-center gap-1.5 text-white/40">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span className="text-[12px]">Thinking...</span>
                </div>
              ) : (
                <>
                  <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                  {msg.toolCalls && msg.toolCalls.length > 0 && (
                    <div className="mt-1.5 pt-1.5 border-t border-white/5 flex flex-wrap gap-1">
                      {msg.toolCalls.map((t, i) => (
                        <span key={i} className="text-[10px] px-1.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300">{t}</span>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-3 pb-3 pt-1 shrink-0">
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 focus-within:border-sky-500/50 transition-colors">
          {loading ? (
            <button
              onClick={() => { abortRef.current?.abort(); setLoading(false); }}
              className="h-8 w-8 rounded-lg bg-red-500/20 flex items-center justify-center shrink-0 hover:bg-red-500/30"
            >
              <StopCircle className="h-4 w-4 text-red-400" />
            </button>
          ) : (
            <MessageSquare className="h-4 w-4 text-white/30 shrink-0" />
          )}
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything..."
            disabled={loading}
            className="flex-1 bg-transparent text-[13px] text-white placeholder:text-white/30 outline-none"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-all disabled:opacity-30"
            style={{ background: input.trim() ? "linear-gradient(135deg, #0EA5E9, #0284C7)" : "transparent" }}
          >
            <Send className="h-3.5 w-3.5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}