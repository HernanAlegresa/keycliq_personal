# KeyScan Testing Fixtures

Este directorio contiene el dataset de testing para el desarrollo y validación del algoritmo KeyScan.

## 📁 Estructura del Dataset

```
Tests/Fixtures/
├── Regular/           # Llaves regulares (27 llaves)
│   ├── regular-01/   # Todas las imágenes de la llave 1
│   ├── regular-02/   # Todas las imágenes de la llave 2
│   ├── ...
│   └── regular-27/   # Todas las imágenes de la llave 27
├── Lockbox/          # Llaves de caja fuerte (14 llaves)
│   ├── lockbox-01/   # Todas las imágenes de la llave 1
│   ├── lockbox-02/   # Todas las imágenes de la llave 2
│   ├── ...
│   └── lockbox-14/   # Todas las imágenes de la llave 14
└── Heavy/            # Llaves pesadas (1 llave)
    └── heavy-01/     # Todas las imágenes de la llave 1
```

## 🎯 Objetivo del Testing

El objetivo es que **cualquier imagen de una llave sea reconocida como match** contra todas las demás imágenes de la misma llave, independientemente del ángulo, iluminación o posición.

### Ejemplo de Testing:
- **Input**: `regular-01/IMG_1234.jpg`
- **Expected**: Match con todas las imágenes en `regular-01/`
- **Result**: ✅ Reconocimiento exitoso

## 📊 Estadísticas del Dataset

| Categoría | Cantidad | Total Imágenes |
|-----------|----------|----------------|
| Regular   | 27 llaves| ~88 imágenes    |
| Lockbox   | 14 llaves| ~44 imágenes    |
| Heavy     | 1 llave  | ~2 imágenes     |
| **Total** | **42 llaves** | **~134 imágenes** |

## 🔧 Convenciones de Nombres

### Carpetas de Llaves
- **Formato**: `{tipo}-{número}`
- **Ejemplos**: `regular-01`, `lockbox-05`, `heavy-01`
- **Rango**: 01-27 (Regular), 01-14 (Lockbox), 01-01 (Heavy)

### Archivos de Imagen
- **Formato**: Cualquier nombre válido
- **Extensiones**: `.jpg`, `.jpeg`, `.png`
- **Sin restricciones**: Los nombres originales se mantienen para trazabilidad

## 🚀 Scripts de Utilidad

### Normalización
```bash
node scripts/normalize-fixtures.js
```
Renombra automáticamente las carpetas al formato estándar.

### Verificación
```bash
npm run fixtures:check
```
Verifica que todas las carpetas tengan al menos una imagen.

## 📝 Notas Importantes

1. **Múltiples imágenes por llave**: Cada llave puede tener 2-6 imágenes para testing robusto
2. **Nombres originales**: Se mantienen los nombres originales de archivos para trazabilidad
3. **Formatos compatibles**: Solo JPG, JPEG, PNG (sin HEIC)
4. **Testing realista**: Simula el escenario real donde una llave tiene múltiples fotos

## 🔍 Casos de Testing

### Casos Positivos (Match)
- Imagen de `regular-01` vs todas las imágenes de `regular-01` → ✅ Match
- Imagen de `lockbox-05` vs todas las imágenes de `lockbox-05` → ✅ Match

### Casos Negativos (No Match)
- Imagen de `regular-01` vs imágenes de `regular-02` → ❌ No Match
- Imagen de `regular-01` vs imágenes de `lockbox-01` → ❌ No Match

## 📈 Métricas de Éxito

- **Precisión**: >95% de matches correctos
- **Recall**: >90% de imágenes reconocidas
- **Falsos Positivos**: <5% de matches incorrectos
- **Tiempo de Procesamiento**: <2 segundos por imagen

---

*Dataset preparado para el desarrollo y testing del algoritmo KeyScan*
