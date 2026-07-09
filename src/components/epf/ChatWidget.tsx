"use client";
import { useState, useRef, useEffect } from "react";
import { MessageCircle, Bot, User, Send, X } from "lucide-react";
import { useUIStore } from "@/store";
import { apiFetch } from "@/lib/api";

interface Message {
  role: "bot" | "user";
  message: string;
}

export default function ChatWidget() {
  const { chatOpen, setChatOpen } = useUIStore();
  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", message: "Welcome to ePowerFix! How can I help you today?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setMessages((prev) => [...prev, { role: "user", message: userMsg }]);
    setInput("");
    setLoading(true);

    try {
      const res: any = await apiFetch("/api/ai/agent", {
        method: "POST",
        body: JSON.stringify({ message: userMsg }),
      });
      setMessages((prev) => [...prev, { role: "bot", message: res?.data?.response || res?.message || "I'm here to help!" }]);
    } catch {
      setMessages((prev) => [...prev, { role: "bot", message: "Sorry, I couldn't reach the assistant right now. Please try again later or contact us at info@epowerfix.com." }]);
    } finally {
      setLoading(false);
    }
  };

  if (!chatOpen) {
    return (
      <button
        onClick={() => setChatOpen(true)}
        className="fixed bottom-20 lg:bottom-6 right-6 z-50 h-14 w-14 flex items-center justify-center bg-epf-500 text-white shadow-lg hover:bg-epf-600 transition-all duration-200 rounded-full hover:scale-105"
        aria-label="Open chat"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[350px] border border-slate-200 flex flex-col overflow-hidden bg-white shadow-2xl rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-full bg-epf-500 flex items-center justify-center">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-[15px] font-semibold text-white leading-tight">ePowerFix Support</p>
            <p className="text-[12px] text-emerald-400 flex items-center gap-1 mt-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block" /> Online
            </p>
          </div>
        </div>
        <button
          onClick={() => setChatOpen(false)}
          className="h-7 w-7 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors"
          aria-label="Close chat"
        >
          <X className="h-4 w-4 text-white/60" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-slate-50 min-h-[280px] max-h-[280px] custom-scrollbar">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            <div
              className={`h-7 w-7 shrink-0 rounded-full flex items-center justify-center ${
                msg.role === "user" ? "bg-slate-900" : "bg-epf-500"
              }`}
            >
              {msg.role === "user" ? (
                <User className="h-3.5 w-3.5 text-white" />
              ) : (
                <Bot className="h-3.5 w-3.5 text-white" />
              )}
            </div>
            <div
              className={`max-w-[80%] rounded-lg px-3 py-2 text-[14px] leading-relaxed ${
                msg.role === "user"
                  ? "bg-slate-900 text-white rounded-tr-none"
                  : "bg-white text-slate-700 border border-slate-200 rounded-tl-none"
              }`}
            >
              {msg.message}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-2">
            <div className="h-7 w-7 shrink-0 rounded-full bg-epf-500 flex items-center justify-center">
              <Bot className="h-3.5 w-3.5 text-white" />
            </div>
            <div className="bg-white border border-slate-200 rounded-lg rounded-tl-none px-4 py-2.5">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-slate-200 bg-white shrink-0">
        <form
          onSubmit={(e) => { e.preventDefault(); send(); }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 h-9 text-[14px] border border-slate-200 px-3 focus:outline-none focus:border-epf-500 rounded-lg bg-white placeholder:text-slate-400 transition-colors"
          />
          <button
            type="submit"
            disabled={loading}
            className="shrink-0 h-9 w-9 bg-epf-500 hover:bg-epf-600 disabled:opacity-50 text-white flex items-center justify-center rounded-lg transition-colors"
            aria-label="Send message"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}