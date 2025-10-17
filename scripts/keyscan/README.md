# KeyScan V3 Testing

Sistema de testing completo para evaluar la precisión de KeyScan V3 con dataset real de llaves.

## 🎯 Objetivo

Medir la precisión real de la lógica KeyScan V3 que está actualmente en staging, usando el dataset de llaves reales del repositorio. El objetivo es alcanzar **≥80% de precisión promedio**.

## 📋 Características del Testing

### Configuración Exacta de Staging
- **T_match**: 0.82 (umbral para MATCH)
- **T_possible**: 0.70 (umbral para POSSIBLE)  
- **Delta**: 0.15 (margen mínimo entre top1 y top2)
- **Pesos**: bitting 0.80, edge 0.12, shape 0.08
- **ShapeVeto**: Deshabilitado

### Metodología
1. **Selección aleatoria** de inventario (20 llaves por defecto)
2. **Caso A**: Llave SÍ está en inventario, imagen diferente
3. **Caso B**: Llave NO está en inventario
4. **Comparación** usando lógica exacta de KeyScan V3
5. **Evaluación** de resultados vs esperados
6. **Repetición** N veces (200 por defecto) con seed reproducible

### Dataset
- **Total**: 42 llaves reales
- **Regular**: 27 llaves (~88 imágenes)
- **Lockbox**: 14 llaves (~44 imágenes)  
- **Heavy**: 1 llave (~2 imágenes)
- **Múltiples imágenes** por llave (2-6 imágenes)

## 🚀 Uso

### Ejecución Básica
```bash
node scripts/keyscan/run-v3-testing.js
```

### Ejecución con Parámetros
```bash
# 100 corridas, inventario de 15 llaves
node scripts/keyscan/run-v3-testing.js --runs 100 --inventory 15

# Seed diferente para reproducibilidad
node scripts/keyscan/run-v3-testing.js --seed 123

# Ver ayuda
node scripts/keyscan/run-v3-testing.js --help
```

### Parámetros Disponibles
- `--runs <número>`: Número de corridas (default: 200)
- `--inventory <número>`: Tamaño del inventario (default: 20)
- `--seed <número>`: Seed para reproducibilidad (default: 42)

## 📊 Métricas Evaluadas

### Precisión General
- **Accuracy**: Porcentaje total de resultados correctos
- **Meta**: ≥80% de precisión promedio

### Análisis por Caso
- **Caso A (In-Inventory)**: Precisión cuando la llave SÍ está en inventario
- **Caso B (Out-of-Inventory)**: Precisión cuando la llave NO está en inventario

### Distribución de Resultados
- **MATCH**: Resultados clasificados como match
- **POSSIBLE**: Resultados clasificados como posible match
- **NO_MATCH**: Resultados clasificados como no match

### Análisis de Scores
- **Score promedio**: Similitud promedio del mejor match
- **Score mediano**: Mediana de scores
- **Margen promedio**: Diferencia promedio entre top1 y top2

### Análisis por Categoría
- **Regular**: Precisión para llaves regulares
- **Lockbox**: Precisión para llaves de caja fuerte
- **Heavy**: Precisión para llaves pesadas

## 📄 Reportes Generados

### Reporte HTML (`v3-testing-report-{timestamp}.html`)
- Dashboard visual completo
- Métricas principales con indicadores de color
- Tablas detalladas por categoría
- Lista de casos fallidos
- Configuración utilizada

### Resultados Completos JSON (`v3-testing-results-{timestamp}.json`)
- Todos los resultados de cada corrida
- Detalles de cada comparación
- Features extraídos
- Scores y márgenes

### Resumen JSON (`v3-testing-summary-{timestamp}.json`)
- Métricas calculadas
- Configuración utilizada
- Estadísticas del dataset

## 📁 Estructura de Archivos

```
scripts/keyscan/
├── keyscan-v3-testing.js    # Clase principal de testing
├── run-v3-testing.js        # Script de ejecución
└── README.md                # Esta documentación

tests/
├── keys/                    # Dataset de llaves
│   ├── Regular/            # 27 llaves regulares
│   ├── Lockbox/            # 14 llaves de caja fuerte
│   └── Heavy/              # 1 llave pesada
└── results/                # Reportes generados
    ├── v3-testing-report-*.html
    ├── v3-testing-results-*.json
    └── v3-testing-summary-*.json
```

## 🔍 Interpretación de Resultados

### Casos Exitosos
- **Caso A**: Query key match con inventario → MATCH ✅
- **Caso B**: Query key no match con inventario → NO_MATCH ✅

### Casos Fallidos
- **Falso Positivo**: Caso B clasificado como MATCH ❌
- **Falso Negativo**: Caso A clasificado como NO_MATCH ❌
- **Ambiguo**: Caso A clasificado como POSSIBLE ⚠️

### Indicadores de Calidad
- **Margen alto**: Diferencia clara entre top1 y top2
- **Margen bajo**: Posibles ambigüedades en matching
- **Score consistente**: Variabilidad controlada en resultados

## 🛠️ Troubleshooting

### Error: "Dataset insuficiente"
- Verifica que existan al menos `inventorySize + 1` llaves en el dataset
- Revisa la estructura de carpetas en `/tests/keys/`

### Error: "No se pudieron extraer features"
- Verifica que las imágenes estén en formato válido (JPG, JPEG, PNG)
- Revisa que las imágenes no estén corruptas
- Asegúrate de que las rutas sean correctas

### Baja precisión
- Revisa los casos fallidos en el reporte HTML
- Analiza si hay patrones por tipo de llave
- Considera ajustar los umbrales si es necesario

## 📈 Roadmap de Testings

### T0 - Testing Actual (Sin filtro de imagen)
- ✅ Usar cualquier imagen disponible por llave
- ✅ Objetivo: medir performance general

### T1 - Filtrado por tipo de imagen (Futuro)
- Filtrar por front/back/ángulos
- Crear subtests específicos

### T2 - Testing con consignas de captura (Futuro)
- Definir instrucciones de captura
- Medir impacto en precisión

### T3 - Escalabilidad del inventario (Futuro)
- Probar con 10, 20, 40 llaves
- Medir variación del FPR

## 🤝 Contribución

Para agregar nuevas métricas o funcionalidades:

1. Modifica `KeyScanV3Tester` en `keyscan-v3-testing.js`
2. Actualiza `calculateMetrics()` para nuevas métricas
3. Extiende `generateHTMLReport()` para visualización
4. Actualiza esta documentación

---

*Sistema de testing desarrollado para validar la precisión de KeyScan V3 con dataset real*

