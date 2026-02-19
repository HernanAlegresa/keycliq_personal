/**
 * Carga el .env del proyecto con dotenv y ejecuta `prisma db push`.
 * Así DATABASE_URL y DIRECT_URL llegan correctamente al proceso de Prisma
 * (evita fallos de parser o encoding en Windows).
 */
import { existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import dotenv from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const envPath = resolve(root, ".env");

if (!existsSync(envPath)) {
  console.error("No se encontró .env en la raíz del proyecto:", envPath);
  process.exit(1);
}

const result = dotenv.config({ path: envPath });
if (result.error) {
  console.error("Error leyendo .env:", result.error.message);
  process.exit(1);
}

if (!process.env.DIRECT_URL || !process.env.DATABASE_URL) {
  console.error("Error: en .env faltan DIRECT_URL o DATABASE_URL.");
  console.error("DIRECT_URL presente:", !!process.env.DIRECT_URL, "| DATABASE_URL presente:", !!process.env.DATABASE_URL);
  process.exit(1);
}

console.log("Variables de entorno cargadas desde .env (DATABASE_URL y DIRECT_URL incluidas).");
console.log("Ejecutando Prisma db push...\n");

const prismaCli = resolve(root, "node_modules", "prisma", "build", "index.js");
execSync(`node "${prismaCli}" db push`, {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});
