# Panorama de Arquitectura

## Introducción

Este documento describe cómo está organizada la plataforma KeyCliq desde el punto de vista técnico. El objetivo es que puedas orientarte rápidamente dentro del repositorio, entender qué hace cada capa y seguir el flujo de datos desde la captura de una llave hasta el almacenamiento y la comparación con el inventario del usuario.

## Tecnologías principales

- **Remix (React 18)** para el frontend/server rendering.
- **Node.js 20** como runtime.
- **Prisma ORM** sobre **PostgreSQL** como capa de datos.
- **OpenAI GPT-4o** (multimodal) para la lógica de escaneo V6.
- **Cloudinary** para almacenamiento de imágenes.
- **Resend/Sengrid** para correo saliente (reset de contraseña).
- **Tailwind + CSS modular** para estilos.

## Estructura del repositorio

```
app/
├── components/          # UI reutilizable, layout y widgets
├── lib/                 # Lógica de negocio (AI, matching, claves)
├── routes/              # Rutas Remix (loader + action + componente)
├── utils/               # Helpers para DB, auth, email, imaging, sesiones
├── styles/              # Hojas de estilo organizadas por vista
└── root.jsx             # Layout base y providers globales
```

Otros directorios clave:

- `prisma/` → `schema.prisma` (modelos y relaciones) y `dev.db` para desarrollo local.
- `tests/` y `tests-v6/` → datasets, fixtures HTML y scripts para validar las versiones de KeyScan.
- `scripts/` → utilidades Node para mantenimiento, limpieza de BD y ejecución de suites de prueba.
- `docs/` → documentación histórica (Dataclips, operativa de staging) complementaria a esta carpeta.

## Flujo funcional de alto nivel

1. **Autenticación y sesión**  
   - Usuarios se registran/inician sesión vía rutas Remix (`/signup`, `/signin`).  
   - Se almacenan hashes de contraseña con `bcrypt`.  
   - Las sesiones se guardan en cookies firmadas y en la tabla `Session`.

2. **Gestión de inventario de llaves**  
   - CRUD manejado por `app/lib/keys.server.js` y rutas bajo `/keys`.  
   - Las imágenes se suben a Cloudinary si hay credenciales; localmente se almacenan en `sessionStorage` para previsualización.  
   - Tras crear/actualizar una llave con imagen, se dispara `extractSignatureV6` para generar la firma AI y guardarla en `KeySignature`.

3. **Escaneo y matching**  
   - Flujos multi-paso bajo `/scan`, `/scan/review`, `/scan/check`, etc.  
   - `scan_.check.jsx` orquesta la llamada a `processKeyImageV6`, arma el inventario con firmas listas y decide la redirección según `MATCH`, `POSSIBLE` o `NO_MATCH`.  
   - Los resultados se persisten en `KeyQuery`, `KeySignature` (para la consulta) y `KeyMatching`.

4. **Analítica y reportes**  
   - `app/lib/analytics.server.js` expone consultas agregadas (`getUserHistory`).  
   - `docs/HEROKU_DATACLIPS.md` contiene consultas SQL para monitoreo desde Heroku Dataclips.

5. **Operaciones y despliegue**  
   - Scripts de mantenimiento en `scripts/` (limpieza de BD, monitoreo de costos, validaciones V6).  
   - Deploy target principal: Heroku. `docs/OPERATIVA_STAGING.md` detalla checklists manuales.

## Capas clave

### 1. Presentación (Remix)

- Cada archivo en `app/routes/` expone un `loader`, opcional `action` y un componente React.  
- `root.jsx` monta el contexto global (layout, Header/Footer, estilos).  
- Componentes reutilizables viven en `app/components/ui/` (botones, cards, modales, guidelines).

### 2. Lógica de dominio

- `app/lib/` agrupa servicios:
  - `ai/active-logic/` → implementación V6 del escaneo.
  - `keyscan.server.js` → wrapper que usa AI + Prisma para guardar resultados.
  - `matching.server.js` → persistencia y validaciones de matchings.
  - `keys.server.js` → CRUD de llaves + integración con Cloudinary y AI.
  - `analytics.server.js` → historial y métricas por usuario.

### 3. Utilidades e infraestructura

- `app/utils/` contiene adaptadores a servicios externos y utilidades de sesión:
  - `db.server.js` inicializa Prisma.
  - `session.server.js` crea almacenamiento cookie + sesiones en BD (compatible con Heroku).
  - `auth.server.js` centraliza registro, login y recuperación de claves.
  - `email.server.js`, `cloudinary.server.js`, `imageConversion.js`, `imageUtils.js`, etc.

### 4. Persistencia

- Prisma define modelos `User`, `Session`, `PasswordResetToken`, `Key`, `KeySignature`, `KeyQuery`, `KeyMatching` y enum `Role`.  
- Relaciones y cascadas están configuradas para mantener consistencia al eliminar llaves o usuarios.  
- Índices específicos optimizan búsquedas por usuario, estado de firmas y historial de matchings.

### 5. Integración AI

- `multimodal-keyscan.server.js` usa el SDK oficial de OpenAI.  
- El prompt `HYBRID_BALANCED_PROMPT` limita la extracción a parámetros confiables.  
- Se usa `zod` para validar la respuesta antes de persistir.  
- Comparaciones emplean pesos por característica y tolerancias específicas.

## Diagrama conceptual de flujo de datos

```
Usuario → Remix Route (/scan) → sessionStorage (imagen) 
   → Action (/scan/check) → processKeyImageV6 → OpenAI GPT-4o
   → Firma validada (Zod) → Comparación con Prisma (KeySignature)
   → Guardado en KeyQuery + KeyMatching → Respuesta UI (match / nuevo registro)
```

## Puntos a vigilar

- Mantener sincronizadas las rutas y la lógica de negocio cuando se modifique el flujo de escaneo.  
- Asegurar que las variables de entorno críticas estén definidas (`ENVIRONMENT_SETUP.md`).  
- Cualquier cambio en el esquema Prisma requiere actualizar dataclips y scripts de migración.  
- Tocar la lógica AI implica revalidar los tests en `tests-v6/`.

---

**Última actualización:** 2025-11-11

