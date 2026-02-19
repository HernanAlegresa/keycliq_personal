import { redirect } from "@remix-run/node";

/**
 * Scan guide image: served from static asset in public/ for serverless compatibility.
 * Redirects to the same image so old links and bookmarks still work.
 */
export async function loader() {
  return redirect("/scan-guide-key.png", 302);
}
