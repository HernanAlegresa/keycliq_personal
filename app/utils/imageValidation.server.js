const MB = 1024 * 1024;
export const MAX_IMAGE_BYTES = 4 * MB;

export function getDataUrlSizeBytes(dataUrl) {
  if (!dataUrl || typeof dataUrl !== "string" || !dataUrl.startsWith("data:")) {
    return 0;
  }
  const parts = dataUrl.split(",");
  if (parts.length < 2) return 0;
  try {
    return Buffer.from(parts[1], "base64").length;
  } catch {
    return 0;
  }
}

export function formatBytes(bytes) {
  if (!bytes || bytes < 0) return "0 B";
  if (bytes >= MB) return `${(bytes / MB).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

export function validateImageDataUrlSize(dataUrl, maxBytes = MAX_IMAGE_BYTES) {
  const sizeBytes = getDataUrlSizeBytes(dataUrl);
  return {
    ok: sizeBytes > 0 && sizeBytes <= maxBytes,
    sizeBytes,
    maxBytes,
  };
}
