import { json, redirect } from "@remix-run/node";
import { getKeyById } from "../lib/keys.server.js";

export async function loader({ request, params }) {
  try {
    const keyId = params.id;
    
    if (!keyId) {
      return new Response("Key ID required", { status: 400 });
    }

    // Get the key with image data
    const key = await getKeyById(keyId);
    
    if (!key) {
      return new Response("Key not found", { status: 404 });
    }

    // If key has Cloudinary URL, redirect to it
    if (key.imageUrl) {
      return redirect(key.imageUrl);
    }

    // If no image URL, return 404
    return new Response("No image found", { status: 404 });
  } catch (error) {
    console.error('Error serving key image:', error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
