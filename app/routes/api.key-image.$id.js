import { json } from "@remix-run/node";
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

    if (!key.imageData || !key.imageMimeType) {
      return new Response("No image data found", { status: 404 });
    }

    // Return the image as binary data
    return new Response(key.imageData, {
      headers: {
        'Content-Type': key.imageMimeType,
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      },
    });
  } catch (error) {
    console.error('Error serving key image:', error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
