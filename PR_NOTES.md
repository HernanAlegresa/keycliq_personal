# PR: cleanup-v6-safe-pass

## 🎯 Objetivo

Limpieza segura del código legacy (Computer Vision V1-V5 y AI V2-V5) manteniendo solo la lógica V6 activa.

## ✅ Cambios Realizados

### Eliminaciones (100% Seguro)
- Carpetas completas: `vision/`, `computer-vision/`, `ai/v2-v5/`, `_legacy/`, `debug/`
- Archivos legacy: `keyscan-v5.server.js`, `keyscan-optimized.server.js`, scripts de testing
- Funciones legacy en `keyscan.server.js`: `processKeyImageV5*`, `extractFeaturesV5*`, etc.

### Archivos en Cuarentena
- `archive/_unsure/app/routes/api.analyze-key.js` - Requiere validación
- `archive/_unsure/app/lib/ai/recognize.server.js` - Requiere validación

### Limpieza de Código
- `keyscan.server.js` ahora solo contiene V6 (`processKeyImageV6`, `extractSignatureV6`)

## ⚠️ Checks Pendientes

**ANTES DE MERGE**, ejecutar:

1. `npm install` (si no está hecho)
2. `npm run build` - Verificar que compila sin errores
3. `npm run typecheck` - Si existe el script
4. **Smoke tests manuales**:
   - Escaneo con match_yes
   - Escaneo con possible  
   - Escaneo sin match → createKey exitoso

## 📋 Archivos Modificados

- `app/lib/keyscan.server.js` - Limpiado (solo V6)
- `app/lib/ai/README.md` - Actualizado para reflejar estructura V6

## 📋 Archivos Eliminados

~79 archivos eliminados (ver `git status` para lista completa)

## 📋 Archivos en Cuarentena

2 archivos movidos a `archive/_unsure/` con documentación

## 🚫 NO Incluido en Este PR

- ❌ Eliminación de dependencias npm (`canvas`, `sharp`, `seedrandom`) - PR siguiente
- ❌ Cambios en Base de Datos - No se tocó
- ❌ Variables de entorno - No se modificaron

## 🔗 Referencias

- Tag backup: `backup/pre-cleanup-v6-20250103`
- Análisis completo: `ANALISIS_PROFUNDO_BD_HEROKU.md`
- Resumen: `CLEANUP_SUMMARY.md`

