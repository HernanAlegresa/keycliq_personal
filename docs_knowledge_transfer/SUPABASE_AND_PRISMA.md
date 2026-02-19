# Supabase Postgres + Prisma (serverless)

Guía mínima para usar Supabase como base de datos con KeyCliq en Vercel (sin refactors).

## 1. Crear proyecto en Supabase

1. [Supabase](https://supabase.com) → New project.
2. Elige región y contraseña de base de datos (guárdala).
3. En **Project Settings → Database** tienes:
   - **Connection string – URI**: conexión directa (puerto **5432**).
   - **Connection pooling**: conexión vía pooler (puerto **6543**, recomendada para serverless).

## 2. URLs de conexión

- **Para la app en Vercel (runtime):** usa la URL del **pooler** (Transaction mode, puerto 6543).  
  Así evitas agotar conexiones con muchas funciones serverless.
- **Para aplicar el esquema desde tu máquina:** usa la conexión **directa** (puerto 5432).  
  El pooler (PgBouncer) no soporta todas las órdenes que usa `prisma db push` / `migrate`.

En Supabase:
- **Pooler (Vercel):** "Connection string" → pestaña **"Transaction"** → copiar URI (incluye `...pooler.supabase.com:6543`).
- **Directa (solo para init):** misma sección → "Direct connection" o URI con `db.<ref>.supabase.co:5432`.

## 3. Schema Prisma: `DIRECT_URL`

El `schema.prisma` define `directUrl = env("DIRECT_URL")`. Prisma usa **`DATABASE_URL`** para el runtime (consultas) y **`DIRECT_URL`** para `db push` / migraciones (el pooler no soporta DDL).

- **Local:** Pon en `.env` **ambas**: `DATABASE_URL` = pooler (6543), `DIRECT_URL` = directa (5432). Así no cambias nada para hacer `db:push`.
- **Vercel:** `DIRECT_URL` debe existir para que `prisma generate` no falle en el build. Pon `DIRECT_URL` = misma URL que `DATABASE_URL` (pooler) o la directa; en runtime solo se usa `DATABASE_URL`.

## 4. Inicializar la base de datos (este repo no tiene migraciones)

El esquema se aplica con **`db:push`** (usa `DIRECT_URL` automáticamente).

**Desde tu máquina (una vez), con `.env` ya configurado:**

```bash
npm run db:push
```

Asegúrate de tener en `.env`: `DATABASE_URL` = pooler, `DIRECT_URL` = directa (5432).

## 5. Resumen: dónde va cada URL

| Variable | Local (.env) | Vercel |
|----------|----------------|--------|
| `DATABASE_URL` | **Pooler** (6543) — runtime y dev | **Pooler** (6543) — runtime |
| `DIRECT_URL` | **Direct** (5432) — solo para `db:push` | **Pooler** (6543) o direct — solo para `prisma generate` en build; no se usa en runtime |

Así en local usas siempre pooler para correr la app y direct solo para aplicar el esquema, sin cambiar variables.

## 6. Variables en Vercel

En Vercel → Project → Settings → Environment Variables:

- `DATABASE_URL` = **pooler** (6543). Obligatorio.
- `DIRECT_URL` = mismo valor que `DATABASE_URL` (pooler) o la URL directa; obligatorio para que el build no falle (Prisma exige la variable si está en el schema).
- `SESSION_SECRET`, `OPENAI_API_KEY`, `APP_URL`. Obligatorios para el flujo básico.
- Opcional: Cloudinary, Resend (ver `.env.example`).

---

## 7. Checklist: primer deploy y smoke test

1. **Local .env**
   - `DATABASE_URL` = **Pooler** (6543).
   - `DIRECT_URL` = **Direct** (5432).
   - `SESSION_SECRET`, `OPENAI_API_KEY`, `APP_URL` (p. ej. `https://tu-proyecto.vercel.app`).

2. **Aplicar esquema a Supabase (una vez)**
   - En la raíz del repo: `npm run db:push`.
   - Comprobar en Supabase (Table Editor) que existen tablas: `User`, `Session`, `Key`, etc.

3. **Vercel**
   - Importar repo, root = raíz del proyecto.
   - Environment Variables (Production + Preview si quieres):
     - `DATABASE_URL` = **Pooler** (6543).
     - `DIRECT_URL` = **Pooler** (6543) o Direct (5432); debe estar definida.
     - `SESSION_SECRET`, `OPENAI_API_KEY`, `APP_URL` (= URL de Vercel, ej. `https://xxx.vercel.app`).
   - Deploy.

4. **Smoke test tras el deploy**
   - Abrir `APP_URL` (o la URL que asigne Vercel).
   - Ir a `/welcome` → comprobar que carga.
   - Ir a `/signup` → crear cuenta (email + contraseña) → comprobar redirect a home o login.
   - Ir a `/signin` → iniciar sesión → comprobar que entras al dashboard (home).
   - Ir a `/keys` → comprobar que carga (puede estar vacío).
   - Ir a `/scan` → comprobar que carga la captura/guía; no hace falta escanear.
   - Cerrar sesión (Settings o `/logout`) → comprobar que vuelves a `/welcome`.

Si todo eso responde sin 500 y las rutas cargan, el primer deploy y la conexión a Supabase están bien.
