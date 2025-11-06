import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const IMAGE_SOURCE_PATH = path.resolve("app/assets/key-example-lockbox-02.png");

let cachedOriginalPromise;
const transformedCache = new Map();

async function getOriginalBuffer() {
  if (!cachedOriginalPromise) {
    cachedOriginalPromise = fs.readFile(IMAGE_SOURCE_PATH);
  }

  return cachedOriginalPromise;
}

function clamp(value, { min, max }) {
  if (Number.isNaN(value)) return undefined;
  return Math.min(Math.max(value, min), max);
}

export async function loader({ request }) {
  try {
    const url = new URL(request.url);

    const widthParam = Number.parseInt(url.searchParams.get("w") || "720", 10);
    const width = clamp(widthParam, { min: 240, max: 1920 }) || 720;

    const qualityParam = Number.parseInt(url.searchParams.get("quality") || "70", 10);
    const quality = clamp(qualityParam, { min: 40, max: 92 }) || 70;

    const requestedFormat = (url.searchParams.get("format") || "webp").toLowerCase();
    const allowedFormats = new Set(["webp", "jpeg", "jpg", "png", "avif"]);
    const format = allowedFormats.has(requestedFormat) ? requestedFormat : "webp";

    const cacheKey = `${width}-${quality}-${format}`;
    if (transformedCache.has(cacheKey)) {
      const cached = transformedCache.get(cacheKey);
      return new Response(cached.data, cached.responseOptions);
    }

    const originalBuffer = await getOriginalBuffer();

    let pipeline = sharp(originalBuffer, { failOn: "none" });
    if (width) {
      pipeline = pipeline.resize({ width, withoutEnlargement: true });
    }

    const targetFormat = format === "jpg" ? "jpeg" : format;

    const { data, info } = await pipeline
      .toFormat(targetFormat, { quality })
      .toBuffer({ resolveWithObject: true });

    const contentType = `image/${info.format === "jpeg" ? "jpeg" : info.format}`;

    const responseOptions = {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    };

    transformedCache.set(cacheKey, { data, responseOptions });

    return new Response(data, responseOptions);
  } catch (error) {
    console.error("Error generating optimized scan guide image:", error);
    return new Response("Failed to generate optimized image", { status: 500 });
  }
}


