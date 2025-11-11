# Integraciones Externas

## Introducción

KeyCliq se apoya en varios servicios externos para análisis de imágenes, almacenamiento de medios y comunicaciones. Este documento detalla cada integración, cómo se configura y qué áreas del código la utilizan.

## OpenAI · GPT-4o Multimodal

- **Uso:** extracción de firmas y comparación (KeyScan V6).  
- **Archivo principal:** `app/lib/ai/active-logic/multimodal-keyscan.server.js`.  
- **SDK:** `openai` (v6). Se inicializa con `process.env.OPENAI_API_KEY`.  
- **Modelo:** `gpt-4o`.  
- **Interacción:** se envía prompt + imagen en formato `data:<mime>;base64`.  
- **Validación:** respuesta debe incluir bloque JSON; se valida con `zod`.  
- **Costos:** controlar número de llamadas (cada escaneo o creación de llave con imagen). Considera cachear resultados cuando el usuario reintenta con la misma imagen.  
- **Error handling:** si la API falla, se retorna `success: false` y el flujo redirige a `/scan/error`. Recomendado monitorear logs para reintentos.

### Consideraciones operativas
- Configura límites de uso en la cuenta OpenAI para evitar sobrecostos.  
- Mantén la versión del modelo actualizada (Ver `release notes` de OpenAI).  
- Implementa reintentos con backoff si empiezan a aparecer errores `429` (throttling). Actualmente no existen reintentos automatizados.

## Cloudinary

- **Uso:** almacenamiento de imágenes de llaves en inventario.  
- **Archivo:** `app/utils/cloudinary.server.js`.  
- **Variables:** `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_UPLOAD_PRESET`.  
- **Carga:** se convierte la imagen base64 a buffer y se envía vía `upload_stream` a carpeta `keycliq_keys`.  
- **Eliminación:** `deleteImageFromCloudinary(publicId)` se llama cuando el usuario borra una llave.  
- **Optimización:** `getOptimizedImageUrl` genera URLs con transformaciones (`width`, `height`, `quality`).  
- **Fallback local:** si faltan credenciales, `createKey` simplemente no sube la imagen; la app almacena `imageUrl = null` y prioriza mostrar la imagen guardada en `sessionStorage` durante la sesión.

### Buenas prácticas
- Usa presets con transformaciones predefinidas para mantener consistencia.  
- Borra imágenes cuando se eliminen llaves (`deleteKey` ya lo hace).  
- Configura reglas de expiración/backup en Cloudinary para entornos productivos.

## Resend / Sendgrid

- **Uso:** envío de correos de reset de contraseña.  
- **Archivo:** `app/utils/email.server.js`.  
- **Inicialización:** `getResend()` prioriza `RESEND_API_KEY` y usa `SENDGRID_API_KEY` como fallback.  
- **Contenido:** email HTML inline con botón hacia `${APP_URL}/reset-password?token=...`.  
- **Errores:** si no hay API key, se lanza error al intentar enviar; el flujo exterior debe manejarlo (Mostrar mensaje genérico).  
- **Remitente:** combina `MAIL_FROM_NAME` y `MAIL_FROM_ADDRESS`.  
- **Logs:** se loguea advertencia si falta API key; útil para detectar entornos mal configurados.

### Recomendaciones
- Configura dominios verificados (DKIM/SPF) para mejorar entregabilidad.  
- Usa templates dedicados en Resend/Sendgrid si planeas ampliar tipos de correos.  
- Implementa métricas (webhooks) para saber si los emails se entregan/abren.

## Otros servicios y librerías relevantes

- **Cloud Functions/Scripts internos**  
  - `scripts/cost-monitor.js`: pensado para monitorear costos de pruebas (ajustar según integraciones).  
  - `scripts/run-optimized-test-suite.js`: ejecuta suites optimizadas, requiere acceso a datasets locales.

- **Imagen y procesamiento**  
  - `canvas`, `sharp`: dependencias para procesamiento y análisis de imágenes. Útiles si se amplían features de validación local.  
  - `fileToDataURL`, `imageConversion.js`: utilidades para convertir `File`/`Blob` a base64 en el navegador y servidor.

- **Analítica**  
  - Actualmente no hay integración con plataformas externas de analytics; `app/lib/analytics.server.js` usa sólo PostgreSQL.

## Gestión de secretos

- Usa `.env` y gestores seguros (Heroku Config Vars) para almacenar credenciales.  
- Nunca subas llaves al repositorio.  
- Revisa `ENVIRONMENT_SETUP.md` para checklist completo de variables.  
- Rotar credenciales periódicamente, especialmente cuando cambie personal del equipo.

## Impacto en pruebas

- Pruebas automáticas (`tests-v6`) asumen acceso a OpenAI y, opcionalmente, Cloudinary. Si ejecutas en entornos sin estos servicios, mockea las llamadas o prepara fixtures.  
- Para staging, se recomienda usar cuentas separadas (clave OpenAI distinta, bucket Cloudinary aparte) para controlar costos y aislar datos.  
- Correo: en staging puedes usar servicios de testing (Mailtrap) adaptando `email.server.js` si deseas interceptar correos.

---

**Última actualización:** 2025-11-11

