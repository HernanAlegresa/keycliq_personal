# KeyCliq: Base de datos Neon + deploy en Vercel (solución rápida)

Esta guía te permite tener la app funcionando con base de datos y lista para Vercel en pocos minutos, sin depender de Supabase.

---

## 1. Base de datos: Neon (gratis, sin pausas)

1. Entra en **[neon.tech](https://neon.tech)** y crea una cuenta (GitHub o email).
2. **Create a project**: nombre ej. `keycliq`, región la que prefieras.
3. En el dashboard, en **Connection string** copia la URI que te dan (formato `postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`).
4. En tu `.env` pon **la misma URL** en las dos variables:
   ```env
   DATABASE_URL=postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
   DIRECT_URL=postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
   ```
5. En la raíz del proyecto ejecuta:
   ```bash
   npm run db:push
   ```
   Debería conectar y crear las tablas sin errores.

**Ventaja**: Neon no pausa proyectos por inactividad como el plan gratis de Supabase; la conexión suele funcionar desde local y desde Vercel.

---

## 2. Imágenes: Vercel Blob (en el deploy)

- En **local**: si no configuras Cloudinary ni Blob, las llaves se guardan pero la foto no se persiste (solo en memoria).
- En **Vercel**: al conectar un **Blob store** en tu proyecto, la app usará Vercel Blob para guardar las imágenes de las llaves.

Pasos en Vercel:

1. Proyecto → pestaña **Storage** → **Create Database** → elige **Blob**.
2. Crea el store (nombre ej. `keycliq-blob`). Vercel crea la variable `BLOB_READ_WRITE_TOKEN` en el proyecto.
3. En deploys posteriores la app usará ese token y subirá las fotos de las llaves a Blob (las URLs se guardan en la BD).

Para probar en local con imágenes persistentes, puedes crear un token en la misma store y poner en `.env`:
```env
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxx...
```

---

## 3. Deploy en Vercel

1. Sube el repo a GitHub y en **[vercel.com](https://vercel.com)** importa el proyecto.
2. En **Settings → Environment Variables** añade (Production y Preview si quieres):
   - `DATABASE_URL` = misma URI de Neon
   - `DIRECT_URL` = misma URI de Neon
   - `SESSION_SECRET` = genera uno: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   - `APP_URL` = `https://tu-proyecto.vercel.app`
   - (Opcional) `OPENAI_API_KEY` si más adelante activas el escaneo con IA.
3. Si usas Blob: crea el Blob store en el proyecto (paso 2 arriba); no hace falta copiar el token a mano.
4. **Deploy**. Después del primer deploy, en la pestaña **Storage** puedes ver que el Blob está conectado.
5. Prueba: registrarte, crear una llave con foto, listar llaves y ver que la imagen carga.

---

## Resumen de variables

| Variable | Dónde | Obligatoria |
|----------|--------|-------------|
| `DATABASE_URL` | Neon (misma URI) | Sí |
| `DIRECT_URL` | Neon (misma URI) | Sí |
| `SESSION_SECRET` | Generar aleatorio | Sí |
| `APP_URL` | URL de tu app en Vercel | Sí (emails/redirects) |
| `BLOB_READ_WRITE_TOKEN` | Vercel lo inyecta si tienes Blob | Para guardar imágenes |
| `OPENAI_API_KEY` | Cuando quieras escaneo con IA | Para flujo de escaneo |

Con Neon + Vercel Blob la app queda lista para que quien entre a tu portfolio pueda usarla: registro, login, guardar llaves y ver imágenes. El escaneo con OpenAI lo activas cuando tengas la API key configurada.
