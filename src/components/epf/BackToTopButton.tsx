"use client";
import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";

export default function BackToTopButton() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!show) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-6 left-6 z-50 h-10 w-10 bg-white border border-[#CBD5E1] shadow-md text-[#111827] flex items-center justify-center hover:bg-[#0EA5E9] hover:border-[#0EA5E9] hover:text-white transition-all rounded-full"
    >
      <ArrowUp className="h-4 w-4" />
    </button>
  );
}
