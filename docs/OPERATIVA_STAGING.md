# Operativa de Pruebas en Staging - Fase 1

**Objetivo**: Verificar que las nuevas funciones y mejoras funcionan correctamente en staging

---

## A. Preparación

### 1. Deploy de Branch a Staging

```bash
# Asegurarse de estar en la branch correcta
git checkout chore/db-fase1-clean

# Push a staging (Heroku)
git push heroku-staging chore/db-fase1-clean:main
# o según tu configuración de Heroku
```

### 2. Aplicar Índices

**Nota**: Si usas migraciones automáticas, los índices pueden aplicarse automáticamente. Verificar con:

```bash
# Conectar a staging
heroku run bash -a <nombre-app-staging>

# Verificar estado de migraciones
npx prisma migrate status

# Si es necesario, aplicar manualmente:
npx prisma db push
```

**Confirmar índices aplicados**:
```sql
-- Ejecutar en Heroku Dataclips o psql
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

---

## B. Pruebas Manuales

### 1. Crear Cuenta Limpia

1. Crear nueva cuenta de usuario en staging
2. Anotar el `userId` (necesario para pruebas)
3. Confirmar que no tiene llaves en inventario

### 2. Escaneos de Prueba

#### Caso 1: MATCH_FOUND
1. Escanear una llave
2. **Antes de crear la llave**: Agregar 1-2 llaves al inventario desde la app
3. Escanear la misma llave nuevamente
4. **Esperado**: 
   - Debe mostrar MATCH_FOUND
   - Debe aparecer la llave del inventario como match
   - Verificar en logs que se guardó correctamente

#### Caso 2: NO_MATCH
1. Escanear una llave completamente diferente
2. **Esperado**:
   - Debe mostrar NO_MATCH
   - No debe haber matchedKeyId
   - Verificar en logs que se guardó correctamente

#### Caso 3: POSSIBLE_KEYS (Opcional)
1. Agregar 2-3 llaves idénticas al inventario
2. Escanear una llave que coincida con todas
3. **Esperado**:
   - Debe mostrar POSSIBLE_KEYS
   - Múltiples matches perfectos

### 3. Crear Llaves en Inventario

1. Crear 1-2 llaves nuevas desde la app
2. **Verificar en consola**:
```sql
SELECT id, name, "sigStatus", "createdAt"
FROM "keys"
WHERE "userId" = :userId
ORDER BY "createdAt" DESC;
```
3. **Esperado**: `sigStatus = 'ready'` después de procesar
4. **Verificar signature**:
```sql
SELECT ks.id, ks."keyId", ks."confidenceScore", ks."createdAt"
FROM "key_signatures" ks
JOIN "keys" k ON k.id = ks."keyId"
WHERE k."userId" = :userId
ORDER BY ks."createdAt" DESC;
```
5. **Esperado**: Debe haber KeySignature para cada llave con `sigStatus = 'ready'`

### 4. Eliminar Llave con Imagen

1. Elegir una llave que tenga `imagePublicId` (verificar en DB)
2. Eliminar la llave desde la app
3. **Verificar en logs de Heroku**:
   - Debe aparecer: "Image deleted from Cloudinary: <publicId>"
   - Debe aparecer: "✅ Llave eliminada exitosamente"
4. **Verificar en DB**:
```sql
-- La llave debe estar eliminada
SELECT COUNT(*) FROM "keys" WHERE id = :keyId;
-- Debe ser 0

-- Las signatures deben estar eliminadas (CASCADE)
SELECT COUNT(*) FROM "key_signatures" WHERE "keyId" = :keyId;
-- Debe ser 0

-- Los matchings deben tener matchedKeyId = NULL (SET NULL)
SELECT id, "matchType", "matchedKeyId"
FROM "key_matchings"
WHERE "matchedKeyId" = :keyId;
-- No debe haber registros con ese matchedKeyId

-- Los matchings que referenciaban esa llave deben tener matchedKeyId = NULL
SELECT COUNT(*) FROM "key_matchings" 
WHERE "matchedKeyId" IS NULL 
  AND "matchType" = 'MATCH_FOUND';
-- Puede haber algunos (normal si se eliminó la llave)
```

---

## C. Consultas Internas (Funciones)

### 1. getUserStats(userId)

**Ejecutar desde consola de Heroku** o crear endpoint temporal:

```bash
heroku run node -e "
import('./app/lib/keys.server.js').then(m => {
  m.getUserStats('USER_ID_AQUI').then(stats => {
    console.log(JSON.stringify(stats, null, 2));
  });
});
" -a <nombre-app-staging>
```

**Output esperado**:
```json
{
  "keys": {
    "total": 5,
    "pending": 0,
    "ready": 4,
    "failed": 1
  },
  "queries": {
    "total": 8
  },
  "matchings": {
    "total": 8,
    "byType": {
      "MATCH_FOUND": 3,
      "POSSIBLE_KEYS": 1,
      "NO_MATCH": 4
    }
  }
}
```

### 2. getUserHistory(userId, 10)

**Ejecutar desde consola**:

```bash
heroku run node -e "
import('./app/lib/analytics.server.js').then(m => {
  m.getUserHistory('USER_ID_AQUI', 10).then(history => {
    console.log(JSON.stringify(history, null, 2));
  });
});
" -a <nombre-app-staging>
```

**Output esperado**:
```json
[
  {
    "query": {
      "id": "clx123...",
      "createdAt": "2025-01-11T10:30:00Z",
      "result": {
        "signature": {
          "number_of_cuts": 5,
          "blade_profile": "...",
          ...
        },
        "timestamp": "2025-01-11T10:30:00Z"
      }
    },
    "matchings": [
      {
        "id": "clx456...",
        "matchType": "MATCH_FOUND",
        "similarity": 1.0,
        "matchedKey": {
          "id": "clx789...",
          "name": "Front Door",
          "description": "123 Main St"
        },
        "createdAt": "2025-01-11T10:30:05Z"
      }
    ]
  }
]
```

**Validaciones**:
- ✅ Lista ordenada por fecha (más reciente primero)
- ✅ Cada elemento tiene `query` con `id`, `createdAt`, `result.signature`
- ✅ Cada elemento tiene `matchings` array
- ✅ Matchings tienen `matchType`, `similarity`, `matchedKey` (si existe)

---

## D. Verificación de Validaciones

### Test 1: MATCH_FOUND sin matchedKeyId (debe fallar)

**Desde consola de Heroku**:
```bash
heroku run node -e "
import('./app/lib/matching.server.js').then(m => {
  m.saveMatchingResult({
    userId: 'USER_ID',
    keyQueryId: 'QUERY_ID',
    matchedKeyId: null,  // ❌ Falta
    matchType: 'MATCH_FOUND',
    similarity: 1.0,
    confidence: 1.0,
    querySignature: {},
    matchedSignature: null,
    comparisonResult: null
  }).catch(err => {
    console.log('✅ Error esperado:', err.message);
    console.log('Código:', err.code);
  });
});
" -a <nombre-app-staging>
```

**Esperado**: Error con mensaje "MATCH_FOUND requires matchedKeyId" y código "VALIDATION_ERROR"

### Test 2: NO_MATCH con matchedKeyId (debe fallar)

```bash
heroku run node -e "
import('./app/lib/matching.server.js').then(m => {
  m.saveMatchingResult({
    userId: 'USER_ID',
    keyQueryId: 'QUERY_ID',
    matchedKeyId: 'KEY_ID',  // ❌ Tiene cuando no debería
    matchType: 'NO_MATCH',
    similarity: 0.5,
    confidence: 0.5,
    querySignature: {},
    matchedSignature: null,
    comparisonResult: null
  }).catch(err => {
    console.log('✅ Error esperado:', err.message);
    console.log('Código:', err.code);
  });
});
" -a <nombre-app-staging>
```

**Esperado**: Error con mensaje "NO_MATCH should not have matchedKeyId" y código "VALIDATION_ERROR"

---

## E. Checklist Final

- [ ] Índices aplicados correctamente (verificado con SQL)
- [ ] Cuenta limpia creada
- [ ] Escaneos realizados (MATCH_FOUND, NO_MATCH, opcional POSSIBLE_KEYS)
- [ ] Llaves creadas con `sigStatus = 'ready'`
- [ ] Eliminación de llave funciona (imagen en Cloudinary eliminada)
- [ ] `getUserStats()` devuelve datos correctos
- [ ] `getUserHistory()` devuelve estructura correcta
- [ ] Validaciones funcionan (errores lanzados correctamente)
- [ ] Dataclips ejecutados (ver `docs/HEROKU_DATACLIPS.md`)

---

## F. Problemas Comunes

### Si `getUserStats()` falla:
- Verificar que `getKeyStats()` existe y funciona
- Verificar conexión a base de datos

### Si `getUserHistory()` falla:
- Verificar que hay datos en `key_queries` y `key_matchings`
- Verificar que las relaciones están correctas

### Si validaciones no funcionan:
- Verificar que el código tiene las validaciones agregadas
- Revisar logs de Heroku para ver errores

---

**Última actualización**: 2025-01-11

