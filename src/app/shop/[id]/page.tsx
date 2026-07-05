// Product detail served under the /shop route. Reuses the canonical detail
// component (app/product/[id]) so there is a single implementation. The dynamic
// segment is named [id] to match the component's useParams().id lookup.
export { default } from "@/app/product/[id]/page";
