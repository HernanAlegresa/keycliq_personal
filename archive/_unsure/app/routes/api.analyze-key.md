# api.analyze-key.js - Archivo en Cuarentena

## Motivo: Dudoso

Este archivo puede ser usado por integraciones externas o API calls que no están visibles en el código frontend.

## Evidencia

- ✅ Usa V5 AI (`analyzeKeyWithV5AI`) - NO es V6 activo
- ⚠️ No se encontraron referencias en el código frontend
- ⚠️ Es un endpoint API (`POST /api/analyze-key`) que podría ser llamado externamente
- ⚠️ Crea `KeyQuery` y `KeySignature` en BD, pero con tipo "identification" diferente a V6 ("scan")

## Callers Detectados

No se encontraron imports o llamadas directas en el código. Podría ser:
- Llamado desde frontend no detectado
- Llamado desde integraciones externas
- Endpoint de prueba/desarrollo

## Pasos para Validar

1. Buscar en logs de Heroku si hay requests a `/api/analyze-key`
2. Verificar si hay integraciones externas documentadas
3. Revisar si hay referencias en documentación o tests
4. Si no se usa, puede eliminarse completamente
5. Si se usa, migrar a V6 (usar `analyzeKeyWithHybridBalancedAI`)

## Sugerencia

**Migrar a V6** si se usa, o **deprecar/eliminar** si no se usa.

## Archivo Original

`app/routes/api.analyze-key.js`

