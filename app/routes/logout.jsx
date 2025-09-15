import { redirect } from "@remix-run/node";
import { logout } from "../utils/session.server.js";

// This route handles logout functionality
export async function action({ request }) {
  return await logout(request);
}

// If someone tries to GET /logout, redirect them to welcome
export async function loader() {
  return redirect("/welcome");
}

// This component should never render since we always redirect
export default function Logout() {
  return null;
}
