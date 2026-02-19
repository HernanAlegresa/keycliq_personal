import { redirect } from "@remix-run/node";
import { requireUserId } from "../utils/session.server.js";
import { getKeyById } from "../lib/keys.server.js";

export async function loader({ request, params }) {
  try {
    const userId = await requireUserId(request);
    const keyId = params.id;

    if (!keyId) {
      return new Response("Key ID required", { status: 400 });
    }

    const key = await getKeyById(keyId, userId);
    if (!key) {
      return new Response("Key not found", { status: 404 });
    }

    if (key.imageUrl) {
      return redirect(key.imageUrl);
    }

    return new Response("No image found", { status: 404 });
  } catch (error) {
    if (error instanceof Response) throw error;
    console.error("Error serving key image:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
