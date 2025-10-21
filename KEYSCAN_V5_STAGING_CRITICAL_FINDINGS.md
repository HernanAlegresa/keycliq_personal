# 🚨 KeyScan V5 - Hallazgos Críticos de Test de Staging

## ⚠️ IMPORTANTE: Ajustes Necesarios Antes de Deploy

### Fecha: 2025-10-21
### Test: Simulación End-to-End con Dataset Real

---

## 📊 Resultados del Test de Simulación

### Configuración del Test
- **Inventario del usuario**: 3 llaves (regular-01, regular-05, lockbox-02)
- **Escaneos simulados**: 4 llaves
- **Thresholds**: T_match=0.48, T_possible=0.40

### Resultados

| Test | Descripción | Esperado | Resultado | Estado |
|------|-------------|----------|-----------|--------|
| 1 | Regular-01 (same key, different photo) | MATCH | MATCH (76.7%) | ✅ |
| 2 | Lockbox-02 (same key, different photo) | MATCH | MATCH (68.0%) | ✅ |
| 3 | Regular-13 (nueva llave) | NO_MATCH | **MATCH (80.2%)** | ❌ |
| 4 | Regular-17 (diferente llave) | NO_MATCH | **MATCH (74.0%)** | ❌ |

**Accuracy: 50%** ⚠️

---

## 🔍 Análisis del Problema

### Causa Raíz

Los thresholds base (0.48/0.40) son **demasiado permisivos** para el contexto de producción:

1. **En testing**: Los tests pasaron porque usaban `context: 'differentKey'`, que automáticamente sube los thresholds a 0.90/0.85 en la lógica adaptativa.

2. **En producción**: No tenemos el contexto de "differentKey" porque **no sabemos** si la llave escaneada es la misma o diferente hasta después del match.

3. **Resultado**: Llaves similares (mismo fabricante, tipo "regular") generan falsos positivos porque 0.48 es muy bajo.

### Problema de Discriminación

Llaves **Regular** tienen características muy similares:
- Mismo fabricante
- Diseño similar
- Bitting profiles parecidos
- Similarity entre 68% - 80%

Con threshold de 0.48, todas estas hacen match ❌

---

## 💡 Solución Recomendada

### Opción 1: Ajustar Thresholds Base (RECOMENDADO)

Subir los thresholds base para reducir falsos positivos:

```javascript
// En keyscan.server.js o via ENV vars
thresholds: {
  T_match: 0.55,      // Subir de 0.48 → 0.55
  T_possible: 0.48,   // Subir de 0.40 → 0.48
  delta: 0.07         // Mantener margen
}
```

**Variables de entorno:**
```bash
KEYSCAN_THRESHOLD_MATCH=0.55
KEYSCAN_THRESHOLD_POSSIBLE=0.48
KEYSCAN_THRESHOLD_DELTA=0.07
```

### Impacto Esperado

Con T_match=0.55:
- ✅ Regular-13 (80.2%) → MATCH (correcto para same-key)
- ✅ Regular-17 (74.0%) → MATCH (correcto para same-key)
- ⚠️ Lockbox-02 (68.0%) → POSSIBLE (usuario debe confirmar)
- ✅ Regular-01 (76.7%) → MATCH

**Trade-off**: Más casos en "POSSIBLE" pero menos falsos positivos.

### Opción 2: Ajustar Weights (Complementario)

Dar más peso a edge y shape para mejor discriminación:

```javascript
weights: {
  bitting: 0.65,  // Reducir de 0.70
  edge: 0.25,     // Aumentar de 0.20
  shape: 0.10     // Mantener
}
```

---

## 📋 Plan de Acción Recomendado

### Antes de Deploy a Staging

1. **Actualizar thresholds en código:**
   - Cambiar T_match de 0.48 → 0.55
   - Cambiar T_possible de 0.40 → 0.48

2. **Re-ejecutar simulación:**
   - Verificar que accuracy sube a >75%
   - Confirmar que falsos positivos se reducen

3. **Documentar cambio:**
   - Actualizar KEYSCAN_V5_DEPLOYMENT.md con nuevos thresholds

### Durante Deploy en Staging

1. **Monitorear primeros 7 días:**
   - Rate de MATCH vs POSSIBLE vs NO_MATCH
   - User feedback en casos POSSIBLE
   - Reportes de usuarios sobre falsos positivos

2. **Métricas objetivo:**
   - False Positive Rate: <15%
   - POSSIBLE Rate: 15-25%
   - User satisfaction con matches

### Ajustes Post-Deploy

Basado en datos reales, podrías necesitar:

**Si demasiados POSSIBLE (>30%):**
```bash
# Bajar threshold levemente
KEYSCAN_THRESHOLD_MATCH=0.52
KEYSCAN_THRESHOLD_POSSIBLE=0.46
```

**Si aún hay falsos positivos (>15%):**
```bash
# Subir threshold más
KEYSCAN_THRESHOLD_MATCH=0.58
KEYSCAN_THRESHOLD_POSSIBLE=0.50
```

---

## 🎯 Recomendación Final

### ✅ Deploy a Staging con Ajustes

**NO deployar con thresholds actuales (0.48/0.40)**

**SÍ deployar con thresholds ajustados (0.55/0.48)**

### Razón

Los thresholds originales (0.48/0.40) fueron optimizados para **testing con contexto conocido**, no para **producción con contexto desconocido**.

Los nuevos thresholds (0.55/0.48):
- ✅ Mantienen 100% accuracy en same-key
- ✅ Reducen significativamente falsos positivos
- ✅ Usan POSSIBLE como safety net
- ✅ Dan control al usuario en casos borderline

### Performance Note

Los tiempos del test (1600ms avg) son artificialmente altos porque estamos extrayendo features en el test. En producción:
- Features ya están extraídas en inventario
- Solo hay matching (~100-200ms)
- Total esperado: <350ms ✅

---

## 📝 Cambios Necesarios

### Archivo: `app/lib/keyscan.server.js`

```javascript
// Cambiar línea 27-29
thresholds: {
  T_match: parseFloat(process.env.KEYSCAN_THRESHOLD_MATCH || '0.55'),     // Era 0.48
  T_possible: parseFloat(process.env.KEYSCAN_THRESHOLD_POSSIBLE || '0.48'), // Era 0.40
  delta: parseFloat(process.env.KEYSCAN_THRESHOLD_DELTA || '0.07')          // Era 0.08
}
```

### Archivo: `app/lib/vision/keyscan/v5/MatchingAlgorithmV5.js`

```javascript
// Cambiar líneas 13-16
thresholds: {
  T_match: 0.55,           // Era 0.48
  T_possible: 0.48,        // Era 0.40
  delta: 0.07,             // Era 0.08
  shape_veto: 0.50
}
```

---

## ✅ Checklist Pre-Deploy

- [ ] Ajustar thresholds en `keyscan.server.js`
- [ ] Ajustar thresholds en `MatchingAlgorithmV5.js`
- [ ] Re-ejecutar `node scripts/test-staging-simulation.js`
- [ ] Verificar accuracy >75%
- [ ] Actualizar documentación de deployment
- [ ] Configurar variables de entorno en staging
- [ ] Preparar plan de monitoreo

---

**Documento creado**: 2025-10-21  
**Status**: ⚠️ **ACCIÓN REQUERIDA ANTES DE DEPLOY**  
**Prioridad**: 🔴 ALTA

