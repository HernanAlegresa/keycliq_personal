# Base de Datos y Modelo de Datos

## Introducción

KeyCliq usa PostgreSQL como base de datos relacional y Prisma como ORM. Este documento resume el modelado, las relaciones clave, índices y prácticas operativas (incluyendo Dataclips en Heroku) para mantener la consistencia de los datos.

## Modelos Prisma

La definición se encuentra en `prisma/schema.prisma`. A continuación, los modelos principales:

### `User`
- Campos: `id`, `email`, `password`, `role`, timestamps.
- Relaciones: `sessions`, `passwordResetTokens`, `keys`, `keyQueries`, `matchings`.
- Notas: `email` es único; `role` enum (`USER`, `ADMIN`). Cascada al eliminar usuario para sesiones y tokens.

### `Session`
- Representa sesiones activas en la BD (paralelas a la cookie firmada).
- Campos: `userId`, `expiration`. Se elimina en cascada con el usuario.

### `PasswordResetToken`
- Guarda tokens hashed (bcrypt) para reset.  
- Campos: `tokenHash`, `expiresAt`, `used`. Se purga periódicamente (`cleanupExpiredTokens`).  
- Relación: `user` con cascade on delete.

### `Key`
- Inventario de llaves de cada usuario.  
- Campos: `name`, `description`, `unit`, `door`, `notes`, `imageUrl`, `imagePublicId`, `signature` (firma AI), `sigStatus`.  
- Relaciones: `user`, `signatures` (`KeySignature`), `matchings`.  
- Índices: `(userId, sigStatus)` para filtrar por dueño y estado, `createdAt` para listados recientes.  
- Notas: La firma almacenada aquí es la última conocida; cada extracción individual se historiza en `KeySignature`.

### `KeySignature`
- Historial de firmas AI generadas tanto para llaves de inventario como para consultas.  
- Campos: `keyId`, `keyQueryId`, `signature` (JSON), `confidenceScore`.  
- Relación opcional con `Key` o `KeyQuery` (XOR).  
- Borrado en cascada al eliminar la llave o la query.  
- Índice: `(keyId, createdAt DESC)` para obtener la firma más reciente por llave.

### `KeyQuery`
- Registro de cada escaneo realizado.  
- Campos: `userId`, `queryType` (ej. `scan`), `result` (JSON con firma y metadatos), `status`.  
- Relaciones: `signatures` (firma asociada a la consulta), `matchings`.  
- Índices: `(userId, createdAt DESC)` y `createdAt` para listados y auditoría.

### `KeyMatching`
- Resultado de comparar una firma de consulta contra el inventario.  
- Campos: `matchType` (`MATCH_FOUND`, `POSSIBLE_KEYS`, `NO_MATCH`), `similarity`, `confidence`, `querySignature`, `matchedSignature`, `comparisonResult`.  
- Relaciones: `user`, `keyQuery`, `matchedKey` (nullable con `SET NULL` al eliminar la llave).  
- Validaciones adicionales en código:
  - `MATCH_FOUND` debe tener `matchedKeyId` (ver `saveMatchingResult`).  
  - `NO_MATCH` no debe tener `matchedKeyId`.
- Índices: `(userId, matchType)` y `createdAt` para reportes.

## Relaciones clave

```
User ───< Session
     └──< PasswordResetToken
     └──< Key ───< KeySignature
     └──< KeyQuery ───< KeySignature
                      └──< KeyMatching ──┐
Key ─────────────────────────────────────┘ (matchedKeyId opcional, SET NULL)
```

- `KeySignature` actúa como bitácora tanto para inventario (`keyId`) como para consultas (`keyQueryId`). Se espera que solo uno de los campos esté definido.
- `KeyMatching` enlaza cada comparación con la consulta (`keyQueryId`) y opcionalmente con la llave emparejada (`matchedKeyId`).

## Índices y performance

Los índices listados en el esquema son suficientes para las vistas actuales. Para validar en entornos gestionados, usa el Dataclip `F. Índices Aplicados` descrito en `docs/HEROKU_DATACLIPS.md`. Asegúrate de re-ejecutarlo después de cualquier cambio en `schema.prisma`.

## Migraciones y sincronización

- **Desarrollo rápido:** `npm run db:push` aplica el esquema actual sin historial de migraciones (útil para prototáps).  
- **Migraciones versionadas:** `npx prisma migrate dev --name <cambio>` genera archivos en `prisma/migrations/`.  
- **Producción / Heroku:** `npm run db:migrate:deploy` aplica migraciones pendientes. Recomendado incluir en el pipeline de deploy.

Si modificas el esquema:
1. Ejecuta `npx prisma generate` para actualizar el cliente.  
2. Revisa scripts en `scripts/` que dependan del modelo.  
3. Actualiza consultas SQL manuales (Dataclips) si cambian tablas/campos.

## Monitoreo con Dataclips

El repositorio ya incluye consultas listas en `docs/HEROKU_DATACLIPS.md`:

- Conteos globales por tabla.  
- Estadísticas por usuario (inventario y matchings).  
- Historial reciente de queries vs matchings.  
- Chequeos de integridad (`MATCH_FOUND` con llave asociada, rangos de score, XOR en signatures).  
- Verificación de índices.  

Se recomienda crear cada consulta como Dataclip separado y ejecutar periódicamente (al menos una vez por sprint o tras deploys).

## Limpieza y mantenimiento

- `scripts/clean-database.js` + `clean-database.sql` permiten limpiar tablas en entornos sandbox. Úsalos con precaución, nunca en producción sin respaldo.  
- `scripts/db-inspect.js` ayuda a obtener introspecciones rápidas de la BD.  
- `tests/results/` y `tests-v6/` contienen reportes HTML y JSON que pueden usarse para validar consistencia con la base tras cambios.  
- Asegura que `cleanupExpiredTokens` (en `auth.server.js`) se ejecute de forma programada si montas un cron/worker; de lo contrario puede hacerse manualmente.

## Buenas prácticas

- No almacenes data URL completas en la base; siempre sube a Cloudinary (o borra tras pruebas).  
- Valida `sigStatus` tras cargas masivas de llaves; el Dataclip B ayuda a detectar pendientes/fallidos.  
- Mantén `matchType` consistente con `matchedKeyId` (validado en código, pero revisa logs).  
- Usa transacciones (`prisma.$transaction`) cuando actualices múltiples tablas relacionadas (por ejemplo en `resetPassword`).  
- Documenta cualquier cambio en índices o relaciones en este archivo y en los Dataclips.

---

**Última actualización:** 2025-11-11

