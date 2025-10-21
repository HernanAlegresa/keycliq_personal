import { redirect } from "@remix-run/node";

// Redirect /terms to /terms-of-use
export function loader() {
  return redirect("/terms-of-use", 301);
}

