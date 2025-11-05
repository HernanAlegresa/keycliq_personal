# Carpeta de Cuarentena - Archivos Dudosos

Esta carpeta contiene archivos que no están 100% confirmados como obsoletos y requieren validación adicional antes de eliminarse.

## Archivos en Cuarentena

### `app/routes/api.analyze-key.js`
- **Estado**: Endpoint API que usa V5 (no V6)
- **Riesgo**: Podría ser usado por integraciones externas
- **Ver**: `archive/_unsure/app/routes/api.analyze-key.md`

### `app/lib/ai/recognize.server.js`
- **Estado**: Solo usado en `_legacy/` (ya eliminado)
- **Riesgo**: Bajo - probablemente obsoleto
- **Ver**: `archive/_unsure/app/lib/ai/recognize.server.js.md`

## Proceso de Validación

Para cada archivo en cuarentena:
1. Revisar el `.md` correspondiente
2. Seguir los pasos de validación indicados
3. Si se confirma obsoleto → eliminar
4. Si se confirma en uso → restaurar y migrar a V6

## Nota Importante

Los archivos en esta carpeta **NO están en el código activo** y no afectan la compilación. Sin embargo, deben ser validados antes de eliminarse definitivamente.

