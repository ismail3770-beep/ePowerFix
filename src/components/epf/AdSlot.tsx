/**
 * Google AdSense Placeholder Component
 * Replace the inner div with actual AdSense code when ready.
 * Usage: <AdSlot slot="top-banner" format="horizontal" className="my-4" />
 */

interface AdSlotProps {
  slot: string;
  format?: "horizontal" | "rectangle";
  className?: string;
}

export default function AdSlot({ slot, format = "horizontal", className = "" }: AdSlotProps) {
  const isHorizontal = format === "horizontal";

  return (
    <div className={`text-center ${className}`}>
      <div
        className={`bg-dark-50 border border-dark-200 border-dashed rounded-lg flex items-center justify-center mx-auto ${
          isHorizontal ? "min-h-[90px] max-w-[728px]" : "min-h-[280px] max-w-[336px]"
        }`}
        data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      >
        <p className="text-[13px] text-dark-400 font-medium">
          {/* Replace with: <ins className="adsbygoogle" data-ad-client="ca-pub-XXXX" data-ad-slot="XXXX" style={{display:"block"}} data-ad-format="auto" data-full-width-responsive="true" /> */}
          বিজ্ঞাপন
        </p>
      </div>
    </div>
  );
}