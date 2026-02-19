# KeyCliq – Revisión arquitectónica y checklist de producción

## 1. Evaluación del stack actual

| Componente | Tecnología | ¿Óptimo para portfolio en producción? |
|------------|------------|----------------------------------------|
| **Framework** | Remix (React SSR) | ✅ Sí. Buen equilibrio entre DX, SEO y rendimiento; encaja con Vercel. |
| **ORM** | Prisma | ✅ Sí. Type-safe, migraciones claras, Neon compatible. Mantener. |
| **Base de datos** | Neon (Postgres serverless) | ✅ Sí. Conexión estable, sin pausas, buen free tier. |
| **Imágenes** | Vercel Blob | ✅ Sí. Misma plataforma que el deploy, token automático. |
| **Auth** | Custom (bcrypt + Session en BD + cookie) | ✅ Aceptable. Funcional y sin dependencia de terceros. No reescribir. |

**Conclusión:** El stack (Remix + Prisma + Neon + Vercel Blob + custom auth) es **adecuado y estable** para un proyecto portfolio listo para producción. No se recomienda cambiar ORM ni auth; los riesgos están en configuración, límites y costes externos, no en la arquitectura base.

---

## 2. Debilidades y riesgos (antes de Vercel)

| Riesgo | Severidad | Descripción |
|--------|-----------|-------------|
| **OpenAI sin guardrail** | Alta | Si `OPENAI_API_KEY` está definida, cada escaneo/creación de llave con imagen llama a GPT-4o. Sin límite por usuario o por IP, un abuso puede disparar la factura. |
| **OpenAI sin key** | Media | Si la key no está o falla, el SDK puede lanzar; no hay mensaje claro tipo "escaneo no disponible". |
| **Tamaño de imagen sin límite** | Media | El cliente puede enviar data URLs muy grandes. Vercel Blob y serverless tienen límite de body (~4.5 MB); un payload enorme puede causar timeout o error 413. |
| **Sin rate limiting** | Media | Signup, signin, forgot-password y scan son candidatos a abuso (spam, fuerza bruta, consumo de OpenAI). |
| **Password reset** | Baja | Ya hay rate limit por usuario (5 min entre solicitudes). Riesgo residual: muchos emails desde muchas IPs. |
| **Secrets en logs** | Baja | Evitar loguear `process.env` o tokens. Revisar que no se impriman errores con datos sensibles. |
| **Headers de seguridad** | Baja | Solo cache en root; no hay X-Frame-Options, X-Content-Type-Options, etc. Opcional pero recomendable. |

---

## 3. Mejoras recomendadas (orden de prioridad)

Sin refactors grandes: solo añadir guardas, validaciones y configuración.

### Prioridad 1 – Estabilidad y coste

1. **Guardrail OpenAI**
   - En `extractSignatureV6` y en `processKeyImageV6`: si `!process.env.OPENAI_API_KEY`, no llamar a la API; devolver `{ success: false, error: "Scan not configured" }` (o similar).
   - Así, con key de placeholder o sin key, la app no rompe y el escaneo se puede mostrar como "no disponible" en la UI.
2. **Límite de tamaño de imagen (recomendado: 4 MB)**
   - Antes de subir a Blob o de llamar a OpenAI, comprobar el tamaño del buffer/base64 de la data URL.
   - Si supera el límite, rechazar con mensaje claro ("Image too large. Max 4 MB") en createKey, updateKey y en la ruta de scan que procese la imagen.
   - Evita timeouts y 413 en Vercel (límite típico de request body).

### Prioridad 2 – Seguridad y abuso

3. **Rate limiting (recomendado)**
   - Opción simple: middleware o wrapper en rutas `signup`, `signin`, `forgot-password` y en la action de scan que use OpenAI (p. ej. por IP con un mapa en memoria o con Vercel KV/Upstash si quieres persistencia).
   - Límites sugeridos: signup/signin/forgot 5–10 req/min por IP; scan (con OpenAI) 10–20 req/min por usuario o por IP.
   - No requiere reescribir auth; solo envolver las actions/loaders afectadas.

4. **Headers de seguridad (opcional)**
   - En `root.jsx` `headers()` añadir, por ejemplo:
     - `X-Frame-Options: DENY`
     - `X-Content-Type-Options: nosniff`
     - `Referrer-Policy: strict-origin-when-cross-origin`
   - Bajo impacto, mejora postura de seguridad.

### Prioridad 3 – Operación

5. **Variables de entorno**
   - Documentar en un solo sitio (p. ej. este doc + `.env.example`) las variables mínimas y las opcionales.
   - Ver sección 4 más abajo.

6. **Manejo de errores de OpenAI**
   - En `multimodal-keyscan.server.js`, capturar errores de cuota/rate limit (429, 5xx) y devolver un mensaje estable en lugar de propagar el raw error al usuario.

---

## 4. Variables de entorno mínimas para producción (Vercel)

**Obligatorias (app estable y desplegable):**

| Variable | Uso |
|----------|-----|
| `DATABASE_URL` | Conexión Postgres (Neon). Prisma en runtime. |
| `DIRECT_URL` | Misma URI que Neon para Prisma (build + migraciones). |
| `SESSION_SECRET` | Firma de la cookie de sesión. Generar valor aleatorio largo. |
| `APP_URL` | URL pública de la app (ej. `https://tu-proyecto.vercel.app`). Redirects y emails. |

**Recomendadas para portfolio “completo”:**

| Variable | Uso |
|----------|-----|
| `BLOB_READ_WRITE_TOKEN` | Imágenes de llaves. Se inyecta al conectar Vercel Blob al proyecto. |
| `OPENAI_API_KEY` | Escaneo con GPT-4o. Si no está, la app debe seguir funcionando; escaneo “no disponible”. |

**Opcionales (según uso):**

| Variable | Uso |
|----------|-----|
| `RESEND_API_KEY` (o `SENDGRID_API_KEY`) | Envío de emails (reset de contraseña). |
| `MAIL_FROM_NAME`, `MAIL_FROM_ADDRESS` | Remitente de los emails. |
| `CLOUDINARY_*` | Alternativa a Blob para imágenes (no necesaria si usas solo Blob). |

**No necesarias para que la app “corra”:**  
`NODE_ENV` lo fija Vercel. El resto (Cloudinary, SendGrid, etc.) solo si usas esas funciones.

---

## 5. Checklist de deploy en Vercel (revisión pre-producción)

### Repo y build

- [ ] Código en GitHub (o integración que uses) y proyecto Vercel conectado al repo.
- [ ] Build: `npm run build` pasa en local (y en Vercel tras el primer deploy).
- [ ] `engines` en `package.json`: Node >=20 (Vercel usará la versión adecuada).

### Base de datos

- [ ] Neon: proyecto creado, conexión estable desde local.
- [ ] En Vercel → Settings → Environment Variables:
  - [ ] `DATABASE_URL` = URI de Neon (Production y Preview si aplica).
  - [ ] `DIRECT_URL` = misma URI que `DATABASE_URL`.
- [ ] Esquema aplicado una vez: `npm run db:push` (desde local con las mismas URLs). No hace falta correrlo en cada deploy.

### Sesión y app URL

- [ ] `SESSION_SECRET`: generado nuevo (no el de desarrollo), solo en Vercel.
- [ ] `APP_URL`: igual a la URL de producción (ej. `https://keycliq.vercel.app`).

### Imágenes

- [ ] En Vercel → Storage: Blob store creado y vinculado al proyecto.
- [ ] Comprobar que `BLOB_READ_WRITE_TOKEN` aparece en las variables del proyecto (suele inyectarse al conectar el store).

### OpenAI (opcional para primer deploy)

- [ ] Si quieres escaneo desde día 1: `OPENAI_API_KEY` en Vercel.
- [ ] Si no: dejar sin definir y asegurar en código que la app no llame a la API y muestre “scan no disponible”.

### Email (opcional)

- [ ] Si quieres “forgot password”: `RESEND_API_KEY` (o SendGrid), `MAIL_FROM_NAME`, `MAIL_FROM_ADDRESS`.

### Pruebas post-deploy

- [ ] Abrir `APP_URL` y cargar la app.
- [ ] Registro: crear cuenta y ver que redirige correctamente.
- [ ] Login: iniciar sesión y ver dashboard/home.
- [ ] Crear llave con foto: subir imagen, guardar, ver que la imagen se muestra (Blob).
- [ ] Listar llaves y editar/eliminar una.
- [ ] Si OpenAI está configurado: flujo de escaneo y que no devuelva 500.
- [ ] Cerrar sesión y volver a entrar.

### Seguridad básica

- [ ] No commitear `.env` ni secrets en el repo.
- [ ] HTTPS: Vercel lo fuerza; el redirect en `root.jsx` es defensa adicional.

---

## 6. Respuestas directas a tus preguntas

- **¿Mantener Prisma?**  
  **Sí.** Encaja con Neon, el esquema ya está aplicado y no hay motivo para cambiar.

- **¿Mantener custom auth?**  
  **Sí.** Está integrada (sesión en BD, bcrypt, reset con token). Cambiarla sería un refactor grande; el riesgo no lo justifica para un portfolio.

- **¿Añadir rate limiting antes de publicar?**  
  **Recomendado.** Sobre todo en signup/signin, forgot-password y en la action que llama a OpenAI. Reduce abuso y coste; se puede hacer con poco código (por IP o con KV).

- **¿Límite de tamaño de imagen?**  
  **Sí.** 4 MB (o menos) antes de subir a Blob y antes de llamar a OpenAI. Evita 413 y timeouts y mejora la experiencia.

- **¿Guardrails de coste OpenAI?**  
  **Sí.** 1) No llamar a la API si no hay `OPENAI_API_KEY`. 2) Rate limit por usuario o IP en la ruta de scan. 3) (Opcional) Límite máximo de escaneos por usuario/día en BD. Con eso el coste queda acotado sin tocar la lógica de negocio.

---

## Resumen

- **Stack:** Mantener Remix + Prisma + Neon + Vercel Blob + custom auth.
- **Riesgos:** Controlar coste OpenAI, tamaño de imagen y abuso (rate limiting).
- **Mejoras prioritarias:** Guardrail OpenAI (no llamar sin key), límite de imagen ~4 MB, rate limiting en auth y scan.
- **Deploy:** Checklist de la sección 5; variables mínimas de la sección 4.
- **Objetivo:** Versión estable, lista para portfolio en Vercel, con complejidad acotada y buena fiabilidad.
