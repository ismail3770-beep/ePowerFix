"use client";
import { useState, useRef, useEffect } from "react";
import { MessageCircle, Bot, User, Send, X } from "lucide-react";

interface Message {
  role: "bot" | "user";
  message: string;
}

const presetResponses = [
  "Thank you for reaching out! How can I help with your electrical needs?",
  "We offer professional home wiring, industrial installation, generator servicing, and solar panel installation.",
  "Browse our shop for quality cables, circuit breakers, safety equipment, and digital guides.",
  "Our online tools include cable size calculator, voltage drop calculator, LED savings, and more!",
  "For project inquiries, check out our student projects section with Arduino and IoT kits.",
  "Contact us at info@epowerfix.com or call +880 1XXX-XXXXXX to book a service.",
];

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", message: "Welcome to ePowerFix! How can I help you today?" },
  ]);
  const [input, setInput] = useState("");
  const [responseIdx, setResponseIdx] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = () => {
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { role: "user", message: input.trim() }]);
    setInput("");
    const resp = presetResponses[responseIdx % presetResponses.length];
    const nextIdx = responseIdx + 1;
    setResponseIdx(nextIdx);
    setTimeout(() => {
      setMessages((prev) => [...prev, { role: "bot", message: resp }]);
    }, 500);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 flex items-center justify-center bg-[#0EA5E9] text-white shadow-lg hover:bg-[#0284C7] transition-all rounded-full hover:scale-105 float-badge"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[350px] border border-[#CBD5E1] flex flex-col overflow-hidden bg-white shadow-2xl rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#111827] shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-full bg-[#0EA5E9] flex items-center justify-center">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-[16px] font-semibold text-white">ePowerFix Support</p>
            <p className="text-[14px] text-[#059669] flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[#059669] inline-block" /> Online
            </p>
          </div>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="h-7 w-7 flex items-center justify-center hover:bg-white/10 rounded-full"
        >
          <X className="h-4 w-4 text-white/60" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-[#F8FAFC] min-h-[280px] max-h-[280px] custom-scrollbar">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            <div
              className={`h-7 w-7 shrink-0 rounded-full flex items-center justify-center ${
                msg.role === "user" ? "bg-[#111827]" : "bg-[#0EA5E9]"
              }`}
            >
              {msg.role === "user" ? (
                <User className="h-3.5 w-3.5 text-white" />
              ) : (
                <Bot className="h-3.5 w-3.5 text-white" />
              )}
            </div>
            <div
              className={`max-w-[80%] rounded-lg px-3 py-2 text-[15px] leading-relaxed ${
                msg.role === "user"
                  ? "bg-[#111827] text-[#F8FAFC] rounded-tr-none"
                  : "bg-white text-[#374151] border border-[#CBD5E1] rounded-tl-none"
              }`}
            >
              {msg.message}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-[#CBD5E1] bg-white shrink-0">
        <form
          onSubmit={(e) => { e.preventDefault(); send(); }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 h-9 text-[15px] border border-[#CBD5E1] px-3 focus:outline-none focus:border-[#0EA5E9] rounded-lg"
          />
          <button
            type="submit"
            className="shrink-0 h-9 w-9 bg-[#0EA5E9] hover:bg-[#0284C7] text-white flex items-center justify-center rounded-lg"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
