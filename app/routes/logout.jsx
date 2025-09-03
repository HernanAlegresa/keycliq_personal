// If you already have this, you're set.
import { getSession, destroySession } from "../utils/session.server.js";
import { redirect } from "@remix-run/node";

export async function action({ request }) {
  const session = await getSession(request.headers.get("Cookie"));
  return redirect("/", {
    headers: { "Set-Cookie": await destroySession(session) },
  });
}
