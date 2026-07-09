import { permanentRedirect } from "next/navigation";

// Canonical: /best-deals is permanently redirected to /deals so search
// engines consolidate ranking signals onto a single URL.
export default function BestDealsPage() {
  permanentRedirect("/deals");
}