# Cloudinary Migration Plan

## Configuración actual en KeyCliq

- El SDK de Cloudinary se inicializa en `app/utils/cloudinary.server.js` con `cloudinary.v2.config`.
- Variables requeridas:
  - `CLOUDINARY_CLOUD_NAME`
  - `CLOUDINARY_API_KEY`
  - `CLOUDINARY_API_SECRET`
  - `CLOUDINARY_UPLOAD_PRESET`
- Las operaciones que dependen de Cloudinary se encuentran en `app/lib/keys.server.js`:
  - `createKey` sube imágenes nuevas.
  - `updateKey` reemplaza la imagen existente (y elimina la previa).
  - `deleteKey` elimina la imagen cuando se borra la llave.
- El frontend construye URLs optimizadas mediante `buildOptimizedCloudinaryUrl` (`app/utils/imageUtils.js`) y componentes como `RecentKeys`, `KeyCard` y `app/routes/keys._index.jsx`.
- La subida usa por defecto la carpeta `keycliq_keys`. Si se pasa otro folder a `uploadImageToCloudinary`, se respeta el parámetro.

## Datos que debe exponer la nueva cuenta

Obtén estos valores desde el dashboard de Cloudinary (Settings → General y Access Keys):

| Campo en Cloudinary          | Variable en KeyCliq              | Nota |
| ---------------------------- | -------------------------------- | ---- |
| Cloud Name                   | `CLOUDINARY_CLOUD_NAME`          | Obligatorio |
| API Key                      | `CLOUDINARY_API_KEY`             | Obligatorio |
| API Secret                   | `CLOUDINARY_API_SECRET`          | Mantener privado |
| Upload Preset (nombre)       | `CLOUDINARY_UPLOAD_PRESET`       | Debe existir en la cuenta nueva |

> Tip: antes de migrar, anota el valor actual de `CLOUDINARY_UPLOAD_PRESET` en Heroku para replicarlo igual.

## Configuración a replicar en Cloudinary

1. **Folder raíz:** crea `keycliq_keys` (o el folder vigente si se cambió en producción) para mantener la misma estructura de URLs.
2. **Upload preset (firmado):**
   - Nombre exacto: valor de `CLOUDINARY_UPLOAD_PRESET`.
   - Tipo: Signed.
   - Carpeta por defecto: `keycliq_keys`.
   - Formatos permitidos: imágenes (`image/*`) y videos opcionalmente (el backend usa `resource_type: "auto"`).
   - Activar `Use filename or externally defined Public ID` si hoy se usa.
   - Desactivar transformaciones automáticas que no estén necesitadas (el backend aplica optimizaciones al consumir).
3. **Seguridad:** deshabilitar `Strict Mode` solo si ya estaba deshabilitado; mantener consistencia con la cuenta actual.
4. **Roles de equipo:** otorgar acceso al grupo de ingeniería para que puedan rotar claves futuras.

## Checklist post-reunión (sin cambios en producción hasta entonces)

1. Ingresar a Heroku (`Settings → Config Vars`) y respaldar los valores actuales.
2. Actualizar:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
   - `CLOUDINARY_UPLOAD_PRESET`
3. Revisar que la variable `NODE_ENV` siga marcando `production` (sin cambios).
4. Hacer deploy/restart de la app en Heroku para propagar las nuevas vars.
5. Verificar en logs (`heroku logs --tail`) la primera subida de imagen luego del cambio:
   - Buscar el log `Subiendo imagen a Cloudinary...`.
   - Confirmar que no aparezcan errores de autenticación o preset.
6. Cargar una imagen de prueba desde la app (en staging primero, si existe) y validar:
   - Se crea el asset en la carpeta `keycliq_keys`.
   - Se genera `imageUrl` y `imagePublicId` en la base de datos.
7. Probar actualización y eliminación de imagen para asegurar que `deleteImageFromCloudinary` funciona con la nueva cuenta.
8. Documentar en el handbook interno la fecha de la rotación y la ubicación segura del API Secret.

## Siguientes pasos inmediatos

- Crear la cuenta nueva con `engineering@rebltech.com`.
- Configurar el folder y el upload preset antes de la reunión.
- Compartir este documento con el equipo para que quede todo listo después de la reunión.


