import { json } from "@remix-run/node";
import { convertToPermanentImage } from "../utils/storage.server.js";

export async function action({ request }) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const { imageUrl } = await request.json();
    
    if (!imageUrl) {
      return json({ error: "Image URL is required" }, { status: 400 });
    }

    const permanentUrl = await convertToPermanentImage(imageUrl);
    
    return json({ permanentUrl });
  } catch (error) {
    console.error("Error converting image:", error);
    return json({ error: "Failed to convert image" }, { status: 500 });
  }
}
