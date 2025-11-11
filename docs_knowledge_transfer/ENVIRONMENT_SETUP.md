# Configuración de Entorno

## Introducción

Esta guía explica cómo preparar un entorno de desarrollo o staging para trabajar con KeyCliq. Incluye requisitos previos, variables de entorno, comandos frecuentes y recomendaciones para mantener la base de datos alineada con Prisma y las integraciones externas.

## Requisitos previos

- **Node.js 20.x** (ver `package.json:engines`): `>=20 <23`.
- **npm 10+** (incluido con Node) o `pnpm`/`yarn` si prefieres, aunque el repo está configurado con npm.
- **PostgreSQL 14+** (local o remoto). Para desarrollo puedes usar la base `prisma/dev.db` como muestra o levantar un contenedor.
- **Cuenta en OpenAI** con acceso a GPT-4o multimodal.
- **Cuenta en Cloudinary** (opcional en desarrollo, requerida en staging/producción).
- **Cuenta en Resend o Sendgrid** si vas a probar recuperación de contraseña por email.

## Variables de entorno

Crear un archivo `.env` en la raíz o exportar las variables según tu shell. Recomendado copiar `.env.example` si existiera (no está en el repo, crea uno nuevo).

| Variable | Descripción | Obligatoria | Entorno |
|----------|-------------|-------------|---------|
| `DATABASE_URL` | URL de conexión a Postgres. Ej: `postgresql://user:pass@localhost:5432/keycliq` | ✅ | Todos |
| `SESSION_SECRET` | Cadena larga y aleatoria para firmar cookies | ✅ | Todos |
| `OPENAI_API_KEY` | API key con acceso a GPT-4o | ✅ | Escaneo |
| `APP_URL` | URL pública de la app (https://...) para links de email | ✅ | Emails |
| `MAIL_FROM_NAME` | Nombre remitente para emails | ✅ (emails) | Producción |
| `MAIL_FROM_ADDRESS` | Email remitente (ej. `no-reply@keycliq.com`) | ✅ (emails) | Producción |
| `RESEND_API_KEY` | API key de Resend (prioritaria) | ✅ (emails) | Producción |
| `SENDGRID_API_KEY` | Alternativa si se usa Sendgrid | Opcional | Producción |
| `CLOUDINARY_CLOUD_NAME` | Identificador Cloudinary | Opcional | Imágenes |
| `CLOUDINARY_API_KEY` | API key Cloudinary | Opcional | Imágenes |
| `CLOUDINARY_API_SECRET` | API secret Cloudinary | Opcional | Imágenes |
| `CLOUDINARY_UPLOAD_PRESET` | Upload preset opcional | Opcional | Imágenes |

Notas:

- En desarrollo, si no configuras Cloudinary, la app sigue funcionando: guarda las imágenes en `sessionStorage` para la sesión actual, pero no persistirá URLs.
- `RESEND_API_KEY` tiene precedencia sobre `SENDGRID_API_KEY` (`email.server.js` usa la primera disponible).
- Para generar un `SESSION_SECRET`, usa `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.

## Pasos para levantar el proyecto

1. **Instalar dependencias**
   ```bash
   npm install
   ```

2. **Generar el cliente de Prisma**
   ```bash
   npx prisma generate
   # Nota: se ejecuta automáticamente en postinstall, pero puedes repetir si cambias el schema
   ```

3. **Aplicar el esquema a la base de datos**
   ```bash
   npm run db:push
   # o, si usas migraciones gestionadas:
   npm run db:migrate:deploy
   ```

4. **Iniciar el servidor de desarrollo (Remix)**
   ```bash
   npm run dev
   ```
   Remix se ejecutará por defecto en `http://localhost:3000`. El backend forma parte del mismo servidor (`remix dev`).

5. **Acceder a la app**
   - Abre `http://localhost:3000/welcome` para iniciar sesión o registrarte.
   - Usa un correo real si quieres probar emails (y tienes Resend configurado). De lo contrario, revisa los logs para ver el token de reset.

## Comandos útiles

- `npm run build`: compila el bundle Remix para producción.
- `npm run start`: levanta el servidor en modo producción (`remix-serve`). Útil para pruebas locales con la build final.
- `npx prisma studio`: abre la interfaz web para inspeccionar tablas.
- `npm run db:push`: sincroniza el esquema Prisma con la BD (sin historial de migraciones).
- `npx prisma migrate dev --name <cambio>`: genera y aplica una migración (si manejas migraciones versionadas).

## Datos de prueba y seeds

No hay seeds automáticos. Para obtener datos:

- Usa la interfaz `/scan` → sube una imagen y sigue el flujo. Esto crea entradas en `KeyQuery`, `KeySignature` y según el caso `KeyMatching`.
- Crea llaves manuales desde `/keys/new` (entra a `/keys` y usa la acción de añadir). Automáticamente se intentará generar la firma V6.
- Revisa `tests/` y `tests-v6/` para ejemplos de datos y resultados esperados.

## Consejos para desarrollo local

- **Modo sin Cloudinary**: al no tener credenciales, `createKey` dejará `imageUrl` en `null` pero retiene la imagen en memoria para la vista actual.
- **Logs verbosos**: las acciones de `/scan/check` y la lógica de matching emiten logs detallados sobre tiempos y decisiones. Úsalo para depurar.
- **Reset de base**: `scripts/clean-database.js` y `scripts/clean-database.sql` ayudan a limpiar datos en entornos sandbox. Lee `scripts/README.md` antes de ejecutar.
- **Multientorno**: el código detecta `NODE_ENV === "production"` para forzar cookies `secure`; en local mantén `NODE_ENV=development` para evitar problemas con cookies http.

## Checklist antes de desplegar a staging/producción

- [ ] Todas las variables del cuadro anterior definidas en Heroku (o plataforma equivalente).  
- [ ] Base de datos con migraciones aplicadas (`npm run db:migrate:deploy`).  
- [ ] `SESSION_SECRET` regenerado y no compartido con dev.  
- [ ] `APP_URL` apuntando al dominio correcto (https).  
- [ ] Credenciales de Cloudinary y Resend operativas.  
- [ ] Tests críticos ejecutados (`tests-v6`, scripts manuales en `docs/OPERATIVA_STAGING.md`).  
- [ ] Dataclips verificados o actualizados (`docs/HEROKU_DATACLIPS.md`).  
- [ ] Revisar logs tras el deploy inicial para confirmar conexiones con OpenAI/Cloudinary.

---

**Última actualización:** 2025-11-11

