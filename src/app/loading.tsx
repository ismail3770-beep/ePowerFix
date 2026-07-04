import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
      <Loader2 className="h-8 w-8 text-[#0EA5E9] animate-spin" />
    </div>
  );
}