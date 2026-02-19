# Análisis de KeyCliq y ruta recomendada

## Qué estamos intentando hacer

Objetivo: que la app **KeyCliq** funcione de principio a fin con **tu** infraestructura (Supabase), con:

- **Autenticación**: registro, inicio de sesión, cierre de sesión, recuperación de contraseña.
- **Datos de usuario**: perfil y sesiones guardados en base de datos.
- **Llaves**: crear, editar, listar y eliminar llaves; guardar nombre, descripción, ubicación, notas.
- **Imágenes de llaves**: subir y mostrar fotos de llaves (persistidas en la nube o solo en sesión según configuración).
- **Escaneo y matching**: flujo de escanear una llave, extraer “firma”, comparar con tu catálogo y ver si hay coincidencia.

Todo eso ya está implementado en el código; el bloqueo actual es **conectar la app a tu base de datos en Supabase** y aplicar el esquema de tablas una vez.

---

## Cómo está hecha la app ahora (stack actual)

Resumen de lo que hay hoy y para qué se usa:

| Componente | Qué hace | Dónde se usa |
|------------|----------|--------------|
| **Remix** | Framework web (React + servidor). Rutas, formularios, carga de datos. | Toda la app (rutas en `app/routes/`, componentes en `app/`). |
| **Prisma** | ORM que habla con PostgreSQL. Crear/leer/actualizar/borrar usuarios, sesiones, llaves, firmas, matchings. | `app/utils/db.server.js`, `auth.server.js`, `session.server.js`, `lib/keys.server.js`, `lib/matching.server.js`, `lib/keyscan.server.js`, rutas que cargan datos. |
| **PostgreSQL** | Base de datos. La app espera una URL de conexión (`DATABASE_URL` y opcionalmente `DIRECT_URL`). | Configurado en `.env`; antes era otra base (p. ej. AWS RDS), ahora el objetivo es **Supabase** (también Postgres). |
| **Sesiones** | Cookie firmada con `SESSION_SECRET` + registro en tabla `Session` en la BD. No usa Supabase Auth. | Login/logout, protección de rutas (`requireUserId`). |
| **Auth** | Registro y login con email + contraseña; contraseñas hasheadas con bcrypt; reset por email (Resend). | `auth.server.js`, rutas `signup`, `signin`, `forgot-password`, `reset-password`. |
| **Imágenes** | Si hay credenciales de **Cloudinary**: se suben ahí y se guarda la URL en la BD. Si no: no se persiste (solo en memoria/sesión). | `app/utils/cloudinary.server.js`, `lib/keys.server.js` (crear/editar llave con foto). |

Es decir: la app **no** usa el SDK de Supabase ni Supabase Auth; solo usa **Supabase como servidor PostgreSQL**. El resto (auth, sesiones, negocio) lo lleva Remix + Prisma + tus rutas.

---

## ¿Es necesario usar Prisma?

- **No es obligatorio a nivel teórico**: se podría reemplazar por el cliente de Supabase (JavaScript) y escribir las consultas a mano o con helpers. Eso implica reescribir todo lo que hoy usa `prisma.user`, `prisma.key`, `prisma.session`, etc. (auth, keys, matching, analytics, reset de contraseña). Es un refactor grande y con riesgo de regresiones.
- **Recomendación**: **sí, seguir usando Prisma** para esta app:
  - Ya está integrado en todo el flujo (usuarios, sesiones, llaves, firmas, matchings).
  - Solo necesitas **una conexión Postgres válida** (Supabase) y **aplicar el esquema una vez** (`db push`). No hay que cambiar lógica de negocio.
  - Alternativa “todo Supabase” (Auth + DB + Storage) es más limpia a largo plazo pero requiere mucho más tiempo y pruebas; tiene sentido como fase 2 si más adelante quieres un solo proveedor.

Por tanto, la ruta que recomiendo es: **mantener Prisma y conectar bien a Supabase**, no sustituir Prisma por el cliente de Supabase en este paso.

---

## Qué falla ahora y por qué

1. **Variable `DIRECT_URL` no encontrada**  
   Prisma lee el `.env`; en algunos entornos (p. ej. cómo se invoca el comando en Windows) esa lectura puede no inyectar bien `DIRECT_URL`. Solución: un script que **cargue el `.env` en Node** y luego ejecute `prisma db push`, para que las dos variables (`DATABASE_URL` y `DIRECT_URL`) estén siempre definidas.

2. **“Can't reach database server”**  
   Al probar con la URL directa de Supabase (puerto 5432), Prisma no llega al servidor. Posibles causas:
   - **Proyecto en pausa**: en el plan gratuito, Supabase puede pausar el proyecto por inactividad. Hay que entrar al dashboard y **restaurar** el proyecto.
   - **URL o contraseña incorrectas**: la contraseña no debe llevar caracteres sin codificar en la URI (p. ej. `[` y `]` deben ser `%5B` y `%5D`).
   - **Solo conexión directa**: para desarrollo local suele bastar usar la **misma** URL directa (puerto 5432) en `DATABASE_URL` y `DIRECT_URL`; el pooler (6543) es más importante en Vercel.

La ruta recomendada es: **arreglar la conexión (URLs + proyecto activo) y usar el script de `db:push`** que carga el `.env` correctamente.

---

## Ruta recomendada (paso a paso)

### Fase 1: App funcionando con Supabase + Prisma (lo que toca ahora)

1. **Comprobar Supabase**
   - Entra en [Supabase](https://supabase.com) → tu proyecto.
   - Si está pausado, restáuralo.
   - En **Project Settings → Database** copia:
     - **Connection string → Direct connection** (puerto 5432).  
   Para desarrollo local puedes usar **solo esta URL** en ambas variables.

2. **Configurar `.env`**
   - `DATABASE_URL`: URI de Postgres, p. ej.  
     `postgresql://postgres.XXXX:TU_PASSWORD@db.XXXX.supabase.co:5432/postgres`  
     Si la contraseña tiene `[` o `]`, codifícalas: `[` → `%5B`, `]` → `%5D`.
   - `DIRECT_URL`: la **misma** URI que `DATABASE_URL` (misma conexión directa).
   - `SESSION_SECRET`: una cadena larga y aleatoria (p. ej. generada con `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`).

3. **Aplicar el esquema a Supabase**
   - En la raíz del proyecto ejecuta:  
     `npm run db:push`  
   - Ese comando usará un script que carga el `.env` y luego ejecuta `prisma db push`, creando en Supabase las tablas: `User`, `Session`, `PasswordResetToken`, `Key`, `KeySignature`, `KeyQuery`, `KeyMatching`.

4. **Probar la app**
   - `npm run dev`
   - Probar: registro en `/signup`, login en `/signin`, crear una llave con imagen en `/keys`, flujo de escaneo en `/scan`. Si todo responde sin errores 500 y los datos se guardan, la app está funcionando de principio a fin con Supabase.

5. **Imágenes (opcional)**
   - Sin Cloudinary: las imágenes no se persisten; la app sigue funcionando (solo no guarda la URL de la foto).
   - Para persistir imágenes puedes: configurar **Cloudinary** (como ahora) o, en una fase posterior, integrar **Supabase Storage** y cambiar `cloudinary.server.js` por un módulo que suba a Supabase; la lógica de la app (guardar `imageUrl` en la llave) se mantiene.

### Fase 2 (opcional, más adelante)

- **Supabase Auth + Storage**: si quieres un único proveedor (Supabase) para auth e imágenes, se puede migrar sesión actual → Supabase Auth y Cloudinary → Supabase Storage. Es un trabajo mayor; conviene tener primero la app estable con Prisma + Supabase Postgres (Fase 1).

---

## Resumen

- **Objetivo**: app completa funcionando (auth, usuarios, llaves, imágenes, escaneo) usando **tu** base de datos en Supabase.
- **En qué estamos**: la app ya está hecha con Remix + Prisma + auth propio + Cloudinary; solo falta **conectar bien a Supabase** y ejecutar **una vez** el esquema.
- **Qué hacer ahora**: usar la **misma** URL directa de Supabase en `DATABASE_URL` y `DIRECT_URL`, asegurar que el proyecto no esté pausado y que la contraseña en la URL esté bien codificada, y ejecutar `npm run db:push` (con el script que carga el `.env`). Después, `npm run dev` y probar flujos principales.
- **Prisma**: recomendable mantenerlo; cambiar a “todo Supabase” (cliente JS + Auth + Storage) es una evolución posible después, no un requisito para tener la app funcionando correctamente.

Cuando tengas el `.env` con las URLs correctas y el proyecto de Supabase activo, el siguiente paso técnico es ejecutar ese `npm run db:push`; si quieres, en el siguiente mensaje podemos revisar juntos el contenido de tu `.env` (sin pegar la contraseña) y el resultado del comando.
