import { redirect } from "@remix-run/node";

// Redirect /privacy to /privacy-policy
export function loader() {
  return redirect("/privacy-policy", 301);
}

