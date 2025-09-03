import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";


const provider = process.env.STORAGE_PROVIDER || "local";
const uploadDir = path.join(process.cwd(), "public", "uploads");


async function ensureDir() {
await fs.mkdir(uploadDir, { recursive: true });
}


export async function saveImage(file) {
const ext = path.extname(file.name) || ".jpg";
const id = randomUUID();
const fileName = `${id}${ext}`;


if (provider === "local") {
await ensureDir();
const arrayBuffer = await file.arrayBuffer();
const buf = Buffer.from(arrayBuffer);
const filePath = path.join(uploadDir, fileName);
await fs.writeFile(filePath, buf);
const publicUrl = `/uploads/${fileName}`;
return { url: publicUrl, id };
}


// TODO: implement S3 upload here using @aws-sdk/client-s3 when switching provider
throw new Error("S3 provider not yet wired; set STORAGE_PROVIDER=local in .env");
}