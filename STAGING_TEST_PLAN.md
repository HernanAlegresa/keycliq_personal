# 🧪 Plan de Pruebas V6 en Staging

## 📋 Objetivo

Validar que la lógica V6 implementada en la app funciona correctamente usando las mismas imágenes del dataset optimizado que usamos en los tests locales.

---

## 🎯 Tests Recomendados

### **Test 1: MATCH (similarity === 1.0)** ✅

**Setup**:
1. Crear inventario con estas llaves (usando `aligned`):
   - `regular-12`
   - `regular-24`
   - `regular-09`
   - `regular-02`
   - `regular-08`
   - `lockbox-10`
   - `regular-25`
   - `regular-06`
   - `lockbox-04`
   - `lockbox-12`
   - `regular-17`
   - `regular-16`
   - `lockbox-06`
   - `regular-22`
   - `lockbox-14` (usar `generated-lockbox-14.png`)

2. Escanear como QUERY:
   - `lockbox-14` - usar imagen `aligned-lockbox-14.jpg`

**Resultado Esperado**:
- ✅ `MATCH_FOUND` (similarity = 1.0)
- ✅ Redirige a `/scan/match_yes`
- ✅ Muestra la llave `lockbox-14` del inventario

---

### **Test 2: MATCH (similarity === 1.0) - Test 3** ✅

**Setup**:
1. Crear inventario con estas llaves:
   - `regular-07`
   - `regular-09`
   - `regular-19`
   - `regular-17`
   - `lockbox-10`
   - `lockbox-08`
   - `regular-15`
   - `regular-05`
   - `regular-16`
   - `lockbox-12`
   - `lockbox-14`
   - `regular-06`
   - `regular-27`
   - `lockbox-06`
   - `lockbox-02` (usar `generated-lockbox-02.png`)

2. Escanear como QUERY:
   - `lockbox-02` - usar imagen `aligned-lockbox-02.jpg`

**Resultado Esperado**:
- ✅ `MATCH_FOUND` (similarity = 1.0)
- ✅ Redirige a `/scan/match_yes`
- ✅ Muestra la llave `lockbox-02` del inventario

---

### **Test 3: NO_MATCH** ✅

**Setup**:
1. Crear inventario con estas llaves:
   - `regular-25`
   - `lockbox-10`
   - `regular-21`
   - `regular-03`
   - `regular-08`
   - `regular-12`
   - `lockbox-06`
   - `regular-23`
   - `regular-02`
   - `lockbox-03`
   - `regular-22`
   - `regular-05`
   - `lockbox-14`
   - `regular-07`
   - `regular-19`

2. Escanear como QUERY:
   - `regular-16` - usar imagen `aligned-regular-16.jpg`

**Resultado Esperado**:
- ✅ `NO_MATCH` (similarity < 1.0)
- ✅ Redirige a `/scan/new`
- ✅ Permite agregar como nueva llave

---

## 📦 Setup Rápido de Inventarios

### Inventario Test 1
```
tests/keys-optimized/regular/regular-12/aligned-regular-12.jpg
tests/keys-optimized/regular/regular-24/aligned-regular-24.jpg
tests/keys-optimized/regular/regular-09/aligned-regular-09.jpg
tests/keys-optimized/regular/regular-02/aligned-regular-02.jpg
tests/keys-optimized/regular/regular-08/aligned-regular-08.jpg
tests/keys-optimized/lockbox/lockbox-10/aligned-lockbox-10.jpg
tests/keys-optimized/regular/regular-25/aligned-regular-25.jpg
tests/keys-optimized/regular/regular-06/aligned-regular-06.jpg
tests/keys-optimized/lockbox/lockbox-04/aligned-lockbox-04.jpg
tests/keys-optimized/lockbox/lockbox-12/aligned-lockbox-12.jpg
tests/keys-optimized/regular/regular-17/aligned-regular-17.jpg
tests/keys-optimized/regular/regular-16/aligned-regular-16.jpg
tests/keys-optimized/lockbox/lockbox-06/aligned-lockbox-06.jpg
tests/keys-optimized/regular/regular-22/aligned-regular-22.jpg
tests/keys-optimized/lockbox/lockbox-14/generated-lockbox-14.png
```

### Inventario Test 2
```
tests/keys-optimized/regular/regular-07/aligned-regular-07.jpg
tests/keys-optimized/regular/regular-09/aligned-regular-09.jpg
tests/keys-optimized/regular/regular-19/aligned-regular-19.jpg
tests/keys-optimized/regular/regular-17/aligned-regular-17.jpg
tests/keys-optimized/lockbox/lockbox-10/aligned-lockbox-10.jpg
tests/keys-optimized/lockbox/lockbox-08/aligned-lockbox-08.jpg
tests/keys-optimized/regular/regular-15/aligned-regular-15.jpg
tests/keys-optimized/regular/regular-05/aligned-regular-05.jpg
tests/keys-optimized/regular/regular-16/aligned-regular-16.jpg
tests/keys-optimized/lockbox/lockbox-12/aligned-lockbox-12.jpg
tests/keys-optimized/lockbox/lockbox-14/aligned-lockbox-14.jpg
tests/keys-optimized/regular/regular-06/aligned-regular-06.jpg
tests/keys-optimized/regular/regular-27/aligned-regular-27.jpg
tests/keys-optimized/lockbox/lockbox-06/aligned-lockbox-06.jpg
tests/keys-optimized/lockbox/lockbox-02/generated-lockbox-02.png
```

### Inventario Test 3
```
tests/keys-optimized/regular/regular-25/aligned-regular-25.jpg
tests/keys-optimized/lockbox/lockbox-10/aligned-lockbox-10.jpg
tests/keys-optimized/regular/regular-21/aligned-regular-21.jpg
tests/keys-optimized/regular/regular-03/aligned-regular-03.jpg
tests/keys-optimized/regular/regular-08/aligned-regular-08.jpg
tests/keys-optimized/regular/regular-12/aligned-regular-12.jpg
tests/keys-optimized/lockbox/lockbox-06/aligned-lockbox-06.jpg
tests/keys-optimized/regular/regular-23/aligned-regular-23.jpg
tests/keys-optimized/regular/regular-02/aligned-regular-02.jpg
tests/keys-optimized/lockbox/lockbox-03/aligned-lockbox-03.jpg
tests/keys-optimized/regular/regular-22/aligned-regular-22.jpg
tests/keys-optimized/regular/regular-05/aligned-regular-05.jpg
tests/keys-optimized/lockbox/lockbox-14/aligned-lockbox-14.jpg
tests/keys-optimized/regular/regular-07/aligned-regular-07.jpg
tests/keys-optimized/regular/regular-19/aligned-regular-19.jpg
```

---

## ✅ Checklist de Validación

Para cada test:

- [ ] Inventario creado correctamente
- [ ] Todas las llaves tienen signature ready
- [ ] Query escaneada sin errores
- [ ] Decisión correcta (MATCH/NO_MATCH)
- [ ] Redirección correcta
- [ ] Página de resultado se muestra correctamente

---

## 🔍 Qué Observar

1. **Logs en consola**: Verificar que digan "KEYSCAN V6"
2. **Confidence**: Debe ser 100% para MATCH (1.0 similarity)
3. **Performance**: Tiempo de procesamiento < 350ms p95
4. **Cache**: Segunda vez que escaneas la misma llave debe ser más rápido

---

## 📝 Notas

- Usar imágenes **aligned** para inventario (mejor calidad)
- Usar imágenes **aligned** para queries cuando sea posible
- Solo usar **generated** cuando el test lo requiera
- Todos los tests deben pasar según los resultados de `tests-v6/10-final-tests/`

---

**Fecha**: 2025  
**Versión**: V6 Hybrid Balanced  
**Branch**: `v6_logic-integration`

