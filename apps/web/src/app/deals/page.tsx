import { redirect } from "next/navigation";

/**
 * /deals — redirects to the shop page.
 * The footer links here; a dedicated deals page can be built later.
 */
export default function DealsPage() {
  redirect("/shop");
}
