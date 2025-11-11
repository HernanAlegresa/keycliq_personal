# Autenticación y Seguridad

## Introducción

KeyCliq protege el acceso mediante autenticación basada en correo/contraseña, sesiones firmadas y registros de sesión en la base de datos. Este documento resume el flujo completo, el manejo de contraseñas, los resets y las consideraciones de seguridad en producción.

## Flujo de autenticación

1. **Registro (`/signup`)**
   - Usa `register(email, password)` en `app/utils/auth.server.js`.  
   - Contraseñas se hashean con `bcrypt` (cost 12).  
   - No exige email verificado; se recomienda agregarlo si se amplía el producto.

2. **Inicio de sesión (`/signin`)**
   - `verifyLogin(email, password)` compara hash con bcrypt.  
   - Si es válido, `createUserSession(userId, redirectTo, request)` crea la cookie y la sesión en BD.  
   - Si `NODE_ENV === "production"`, fuerzas cookies `secure` para compatibilidad con Heroku (SSL vía proxy).

3. **Sesiones**
   - `session.server.js` crea `createCookieSessionStorage`.  
   - Cookies firmadas con `SESSION_SECRET`; duración 30 días (`maxAge`).  
   - Cada login registra un documento en tabla `Session` con `expiration`.  
   - `requireUserId(request)` valida cookie, comprueba que el usuario exista y redirige a `/welcome` si algo falla.

4. **Cierre de sesión (`/logout`)**
   - Obtiene cookie, borra sesiones de BD (`prisma.session.deleteMany`) y destruye la cookie (`destroySession`).  
   - Redirige a `/welcome` con cookie inválida.

## Recuperación de contraseña

- **Solicitud (`/forgot-password`)**
  - `createPasswordResetToken(email)` limpia tokens expirados y genera uno nuevo (32 bytes hex).  
  - Se guarda `tokenHash` (bcrypt) con expiración 1 hora.  
  - Se aplica rate limit: no permite nueva solicitud si hay un token creado en los últimos 5 minutos.  
  - Envía email vía `sendPasswordResetEmail` (Resend/Sendgrid).  
  - Si el correo no existe, responde `success` igualmente para evitar filtraciones.

- **Validación (`/reset-password`)**
  - `validatePasswordResetToken(token)` recorre tokens vigentes y compara con bcrypt.  
  - Si encuentra match, devuelve el usuario asociado.  

- **Cambio de contraseña (`resetPassword`)**
  - Vuelve a buscar token válido, hashea nueva contraseña y marca token como `used`.  
  - Ejecuta ambas operaciones en una transacción (`prisma.$transaction`).  

## Variables sensibles

- `SESSION_SECRET`: requerido al iniciar el servidor. Sin él la app lanza error.  
- `RESEND_API_KEY` / `SENDGRID_API_KEY`: se usa el primero disponible. Maneja roles/permissions con cuidado.  
- `OPENAI_API_KEY`: acceso a GPT-4o (costos).  
- `DATABASE_URL`: credenciales Postgres.  
- `CLOUDINARY_*`: protegen acceso a imágenes.  
- `APP_URL`, `MAIL_FROM_*`: usados en emails; evita exponer ambientes internos.

## Protección dentro de la aplicación

- **Verificación de propiedad**: funciones como `getKeyById` filtran por `userId`; rutas clave usan `requireUserId`.  
- **Validaciones de matching**: `saveMatchingResult` impide inconsistencias (`MATCH_FOUND` sin llave, etc.).  
- **Secure cookies en producción**: `isSecure(request)` verifica `X-Forwarded-Proto` (Heroku) antes de marcar cookie como `secure`.  
- **Limpieza de sesiones huérfanas**: si `requireUserId` detecta que el usuario ya no existe, elimina sesiones relacionadas y resetea cookie.  
- **Uploads**: tamaño máximo de imagen ~10MB en `/scan` (validación en front).  
- **Cloudinary**: usa upload preset y carpetas específicas (`keycliq_keys`).

## Recomendaciones

- **Rotar `SESSION_SECRET`** cuando se sospeche exposición (invalidará sesiones).  
- **Agregar 2FA** si el producto lo requiere; la arquitectura lo permite extendiendo `Session`.  
- **Forzar HTTPS** en todas las rutas públicas cuando se despliegue bajo dominio propio.  
- **Monitorear `PasswordResetToken`**: asegurar que el job de limpieza se ejecute (cron/worker) o agendarlo manualmente.  
- **Enmascarar correos** en logs para cumplir con privacidad.  
- **Auditoría**: usa tablas `KeyQuery` y `KeyMatching` para detectar comportamientos anómalos (ver Dataclips).  
- **Rate limiting adicional**: considera agregar limitaciones en `/signin` y `/scan` para evitar abuse/DoS.  
- **Protección de APIs**: rutas bajo `app/routes/api.*` asumen usuario autenticado; revisa permisos si expones endpoints públicos.

## Prácticas en staging/producción

- Usa valores distintos de `SESSION_SECRET` por ambiente.  
- Configura dominios personalizados y certifica TLS.  
- Revisa periódicamente la tabla `Session` para limpiar sesiones expiradas mediante job.  
- No uses credenciales de servicios reales en entornos locales compartidos.  
- Habilita alertas en Resend/Sendgrid para detectar spikes de tráfico.  
- Monitorea errores de OpenAI (costs/rate limit) y establece reintentos con backoff si la carga aumenta.

---

**Última actualización:** 2025-11-11

