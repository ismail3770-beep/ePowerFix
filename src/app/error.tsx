"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center px-4">
      <div className="text-center">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-[#FEF2F2] mb-6">
          <AlertTriangle className="h-8 w-8 text-[#EF4444]" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] mb-3">
          Something went wrong
        </h1>
        <p className="text-[15px] text-[#6B7280] mb-8 max-w-md mx-auto">
          An unexpected error occurred. Please try again or go back to the home page.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 h-11 px-6 bg-[#111827] hover:bg-[#0EA5E9] text-white text-[14px] font-semibold rounded-[4px] transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            Try Again
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 h-11 px-6 border border-[#E2E8F0] hover:border-[#CBD5E1] hover:bg-white text-[#374151] text-[14px] font-semibold rounded-[4px] transition-colors"
          >
            <Home className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}