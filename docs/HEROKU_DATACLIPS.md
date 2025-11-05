# Heroku Dataclips - SQLs de Validación

**Objetivo**: Crear Dataclips en Heroku para monitorear y validar datos

---

## 📋 Cómo Crear un Dataclip en Heroku

1. Ir a **Heroku Dashboard** → Tu app → **Data** → **Dataclips**
2. Click en **Create Dataclip**
3. Nombre: Elegir nombre descriptivo (ej: "A. Conteos Globales")
4. SQL: Pegar el SQL correspondiente
5. **Reemplazar**: `:userId` con el userId real (o usar parámetros si Heroku los soporta)
6. Click **Save**

---

## A. Conteos Globales

**Nombre**: `A. Conteos Globales`

**SQL**:
```sql
SELECT 'users' AS table, COUNT(*) AS count FROM "User"
UNION ALL 
SELECT 'keys', COUNT(*) FROM "keys"
UNION ALL 
SELECT 'key_signatures', COUNT(*) FROM "key_signatures"
UNION ALL 
SELECT 'key_queries', COUNT(*) FROM "key_queries"
UNION ALL 
SELECT 'key_matchings', COUNT(*) FROM "key_matchings";
```

**Uso**: Verificar totales de todas las tablas

---

## B. Stats por Usuario (Inventario por Estado)

**Nombre**: `B. Stats por Usuario`

**SQL**:
```sql
SELECT
  u.id AS user_id,
  u.email AS user_email,
  SUM(CASE WHEN k."sigStatus" = 'pending'  THEN 1 ELSE 0 END) AS keys_pending,
  SUM(CASE WHEN k."sigStatus" = 'ready'    THEN 1 ELSE 0 END) AS keys_ready,
  SUM(CASE WHEN k."sigStatus" = 'failed'   THEN 1 ELSE 0 END) AS keys_failed,
  COUNT(k.*) AS keys_total
FROM "User" u
LEFT JOIN "keys" k ON k."userId" = u.id
WHERE u.id = :userId
GROUP BY u.id, u.email;
```

**Nota**: Reemplazar `:userId` con el userId real antes de ejecutar

**Ejemplo de uso**:
```sql
-- Para un usuario específico
WHERE u.id = 'clx1234567890abcdef'
```

---

## C. Queries y Matchings por Tipo

**Nombre**: `C. Queries y Matchings por Tipo`

**SQL**:
```sql
WITH q AS (
  SELECT COUNT(*) AS queries_total
  FROM "key_queries"
  WHERE "userId" = :userId
),
m AS (
  SELECT
    COUNT(*) AS matchings_total,
    SUM(CASE WHEN "matchType" = 'MATCH_FOUND'  THEN 1 ELSE 0 END) AS match_found,
    SUM(CASE WHEN "matchType" = 'POSSIBLE_KEYS' THEN 1 ELSE 0 END) AS possible_keys,
    SUM(CASE WHEN "matchType" = 'NO_MATCH'    THEN 1 ELSE 0 END) AS no_match
  FROM "key_matchings"
  WHERE "userId" = :userId
)
SELECT * FROM q, m;
```

**Nota**: Reemplazar `:userId` con el userId real

**Output esperado**:
```
queries_total | matchings_total | match_found | possible_keys | no_match
--------------+-----------------+-------------+---------------+----------
           10 |               10 |           3 |             1 |        6
```

---

## D. Historial Reciente (Queries + Matchings + Llave Encontrada)

**Nombre**: `D. Historial Reciente`

**SQL**:
```sql
SELECT
  q.id AS query_id,
  q."createdAt" AS query_at,
  q.result->>'timestamp' AS query_timestamp,
  m.id AS matching_id,
  m."matchType",
  m.similarity,
  m.confidence,
  mk.id AS matched_key_id,
  mk.name AS matched_key_name,
  mk.description AS matched_key_description
FROM "key_queries" q
LEFT JOIN "key_matchings" m ON m."keyQueryId" = q.id
LEFT JOIN "keys" mk ON mk.id = m."matchedKeyId"
WHERE q."userId" = :userId
ORDER BY q."createdAt" DESC
LIMIT 50;
```

**Nota**: Reemplazar `:userId` con el userId real

**Validaciones**:
- ✅ Ordenado por fecha (más reciente primero)
- ✅ Incluye query info
- ✅ Incluye matching info
- ✅ Incluye matched key (si existe)

---

## E. Chequeos de Integridad

### E1. XOR en key_signatures (Diagnóstico)

**Nombre**: `E1. XOR key_signatures`

**SQL**:
```sql
SELECT
  COUNT(*) AS total,
  SUM(CASE WHEN "keyId" IS NULL AND "keyQueryId" IS NULL THEN 1 ELSE 0 END) AS both_null,
  SUM(CASE WHEN "keyId" IS NOT NULL AND "keyQueryId" IS NOT NULL THEN 1 ELSE 0 END) AS both_set,
  SUM(CASE WHEN ("keyId" IS NULL) <> ("keyQueryId" IS NULL) THEN 1 ELSE 0 END) AS correct_xor
FROM "key_signatures";
```

**Esperado**: 
- `both_null` = 0 (no debería haber signatures sin ninguna referencia)
- `both_set` = 0 (no debería haber signatures con ambas referencias)
- `correct_xor` = `total` (todas deben cumplir XOR)

---

### E2. Consistencia matchType ↔ matchedKeyId

**Nombre**: `E2. Consistencia matchType`

**SQL**:
```sql
SELECT
  COUNT(*) AS total,
  SUM(CASE WHEN "matchType" = 'MATCH_FOUND' AND "matchedKeyId" IS NULL THEN 1 ELSE 0 END) AS mf_without_key,
  SUM(CASE WHEN "matchType" = 'NO_MATCH'     AND "matchedKeyId" IS NOT NULL THEN 1 ELSE 0 END) AS nm_with_key,
  SUM(CASE WHEN "matchType" = 'MATCH_FOUND' AND "matchedKeyId" IS NOT NULL THEN 1 ELSE 0 END) AS mf_correct,
  SUM(CASE WHEN "matchType" = 'NO_MATCH'     AND "matchedKeyId" IS NULL THEN 1 ELSE 0 END) AS nm_correct
FROM "key_matchings";
```

**Esperado**:
- `mf_without_key` = 0 (MATCH_FOUND debe tener matchedKeyId)
- `nm_with_key` = 0 (NO_MATCH no debe tener matchedKeyId)
- `mf_correct` + `nm_correct` = `total` (todos correctos)

---

### E3. Scores Fuera de Rango

**Nombre**: `E3. Scores Fuera de Rango`

**SQL**:
```sql
SELECT
  COUNT(*) AS total,
  SUM(CASE WHEN similarity < 0 OR similarity > 1 THEN 1 ELSE 0 END) AS similarity_out,
  SUM(CASE WHEN confidence < 0 OR confidence > 1 THEN 1 ELSE 0 END) AS confidence_out,
  SUM(CASE WHEN "confidenceScore" IS NOT NULL AND ("confidenceScore" < 0 OR "confidenceScore" > 1) THEN 1 ELSE 0 END) AS sig_confidence_out
FROM "key_matchings" m
LEFT JOIN "key_signatures" s ON s."keyId" = m."matchedKeyId";
```

**Esperado**:
- `similarity_out` = 0
- `confidence_out` = 0
- `sig_confidence_out` = 0

---

## F. Verificación de Índices

**Nombre**: `F. Índices Aplicados`

**SQL**:
```sql
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND (
    tablename = 'keys' OR
    tablename = 'key_signatures' OR
    tablename = 'key_queries' OR
    tablename = 'key_matchings'
  )
  AND indexname NOT LIKE '%_pkey'
ORDER BY tablename, indexname;
```

**Esperado**: Debe mostrar 7 índices:
- `keys(userId, sigStatus)`
- `keys(createdAt)`
- `key_signatures(keyId, createdAt DESC)`
- `key_queries(userId, createdAt DESC)`
- `key_queries(createdAt)`
- `key_matchings(userId, matchType)`
- `key_matchings(createdAt)`

---

## 📝 Notas de Uso

1. **Reemplazar `:userId`**: Antes de ejecutar, reemplazar `:userId` con el userId real
2. **Guardar Dataclips**: Cada SQL puede ser un Dataclip separado para fácil acceso
3. **Programar ejecución**: Algunos Dataclips pueden ejecutarse periódicamente
4. **Comparar resultados**: Usar Dataclips para comparar antes/después de cambios

---

**Última actualización**: 2025-01-11

