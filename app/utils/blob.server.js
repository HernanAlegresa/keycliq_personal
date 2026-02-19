/**
 * Vercel Blob: subir y eliminar imágenes cuando no se usa Cloudinary.
 * Necesita BLOB_READ_WRITE_TOKEN (Vercel lo inyecta si el proyecto tiene Blob storage).
 */
import { put, del } from "@vercel/blob";

const BLOB_PREFIX = "keycliq_keys";

/**
 * Subir imagen (data URL) a Vercel Blob.
 * @param {string} imageDataUrl - data:image/...;base64,...
 * @returns {Promise<{ success: boolean, url?: string, publicId?: string, error?: string }>}
 */
export async function uploadImageToBlob(imageDataUrl) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return { success: false, error: "BLOB_READ_WRITE_TOKEN not set" };
  }
  try {
    const base64Data = imageDataUrl.split(",")[1];
    if (!base64Data) return { success: false, error: "Invalid data URL" };
    const buffer = Buffer.from(base64Data, "base64");
    const mimeMatch = imageDataUrl.match(/^data:([^;]+);/);
    const contentType = mimeMatch ? mimeMatch[1] : "image/jpeg";
    const ext = contentType.includes("png") ? "png" : "jpg";
    const pathname = `${BLOB_PREFIX}/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;

    const blob = await put(pathname, buffer, {
      access: "public",
      addRandomSuffix: true,
      contentType,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    return {
      success: true,
      url: blob.url,
      publicId: blob.url,
    };
  } catch (error) {
    console.error("Error uploading to Vercel Blob:", error);
    return { success: false, error: error?.message || "Upload failed" };
  }
}

/**
 * Eliminar imagen de Vercel Blob por su URL.
 * @param {string} url - URL pública del blob
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function deleteImageFromBlob(url) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return { success: false, error: "BLOB_READ_WRITE_TOKEN not set" };
  }
  if (!url || !url.includes("blob.vercel-storage.com")) {
    return { success: false, error: "Invalid Blob URL" };
  }
  try {
    await del(url, { token: process.env.BLOB_READ_WRITE_TOKEN });
    return { success: true };
  } catch (error) {
    console.error("Error deleting from Vercel Blob:", error);
    return { success: false, error: error?.message || "Delete failed" };
  }
}

/** Devuelve true si la URL es de Vercel Blob. */
export function isBlobUrl(url) {
  return url && typeof url === "string" && url.includes("blob.vercel-storage.com");
}
