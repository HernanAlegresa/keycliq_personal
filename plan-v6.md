# 🚀 KeyScan V6 Development Plan

## 📋 **OBJETIVO PRINCIPAL**

Desarrollar y validar una lógica local optimizada para KeyScan que funcione idénticamente en staging y producción, utilizando el dataset optimizado para pruebas locales y asegurando consistencia total entre entornos.

---

## 🎯 **METAS ESPECÍFICAS**

- **Precisión**: Al menos 8 de 10 tests correctos según criterios definidos
- **Consistencia**: Lógica idéntica entre local, staging y producción
- **Validación**: Tests locales representativos del comportamiento real
- **Integración**: Implementación limpia sin duplicación de código
- **Optimización**: Parámetros y pesos refinados para máxima precisión

---

## 🏗️ **ARQUITECTURA PROPUESTA**

### **Estructura de Archivos**
```
tests/
├── v6-development/
│   ├── logic/
│   │   ├── parameter-extraction.js    # Lógica de extracción optimizada
│   │   ├── signature-comparison.js    # Lógica de comparación
│   │   ├── decision-making.js         # Lógica de decisión
│   │   └── weights-config.js          # Configuración de pesos
│   ├── prompts/
│   │   └── v6-optimized-prompt.js     # Prompt optimizado para GPT-4o
│   ├── tests/
│   │   ├── test-runner.js             # Ejecutor de tests
│   │   ├── test-validator.js          # Validador de resultados
│   │   └── test-reporter.js           # Generador de reportes HTML
│   └── results/
│       ├── test-reports/              # Reportes HTML generados
│       └── validation-data/           # Datos de validación
```

### **Flujo de Desarrollo**
1. **Desarrollo Local** → Tests con dataset optimizado
2. **Validación** → Comparación con resultados esperados
3. **Refinamiento** → Ajuste de parámetros y pesos
4. **Integración** → Implementación en staging
5. **Validación Final** → Confirmación de consistencia

---

## 🔧 **PARÁMETROS Y PESOS OPTIMIZADOS**

### **NIVEL 1 - MÁXIMA PRECISIÓN (55%)**
| Parámetro | Peso | Valores | Descripción |
|-----------|------|---------|-------------|
| `bowmark` | 20% | `true`, `false`, `null` | Marcas en mango (cinta, marcador, pintura) |
| `bowcode` | 20% | `true`, `false`, `null` | Código tallado (números, letras, combinaciones) |
| `key_color` | 20% | `"silver"`, `"brass"`, `null` | Color principal (gris-blanco = silver, dorado = brass) |

### **NIVEL 2 - PRECISIÓN MEDIA (35%)**
| Parámetro | Peso | Valores | Descripción |
|-----------|------|---------|-------------|
| `surface_finish` | 15% | `"good"`, `"damaged"`, `null` | Estado de desgaste |
| `bow_shape` | 15% | `"circular"`, `"rectangular"`, `"square"`, `"arrow"`, `null` | Forma del mango |

### **NIVEL 3 - PRECISIÓN BAJA (10%)**
| Parámetro | Peso | Valores | Descripción |
|-----------|------|---------|-------------|
| `groove_count` | 5% | `0-3`, `null` | Ranuras debajo de dientes |
| `blade_profile` | 5% | `"single-sided"`, `"double-sided"`, `null` | Perfil de hoja |
| `peak_count` | 5% | `0-10`, `null` | Picos en dientes (tolerancia ±1) |

### **PARÁMETRO ADICIONAL**
| Parámetro | Peso | Valores | Descripción |
|-----------|------|---------|-------------|
| `confidence_score` | 0% | `0.0-1.0` | Nivel de confianza de extracción |

---

## 📅 **FASES DE DESARROLLO**

### **FASE 1: PREPARACIÓN Y CONFIGURACIÓN** ⚙️
- [ ] Crear estructura de archivos V6
- [ ] Configurar entorno de desarrollo local
- [ ] Implementar sistema de configuración de pesos
- [ ] Crear prompt optimizado para GPT-4o
- [ ] Configurar sistema de logging y monitoreo

**Duración estimada**: 1-2 días

### **FASE 2: DESARROLLO DE LÓGICA CORE** 🔧
- [ ] Implementar lógica de extracción de parámetros
- [ ] Desarrollar sistema de comparación de firmas
- [ ] Crear lógica de decisión (MATCH_FOUND, POSSIBLE_KEYS, NO_MATCH)
- [ ] Implementar sistema de tolerancias y umbrales
- [ ] Crear sistema de validación de datos

**Duración estimada**: 2-3 días

### **FASE 3: SISTEMA DE TESTING** 🧪
- [ ] Desarrollar test runner para dataset optimizado
- [ ] Implementar generador de reportes HTML mejorado
- [ ] Crear sistema de validación de resultados
- [ ] Desarrollar métricas de precisión y confianza
- [ ] Implementar sistema de casos de prueba

**Duración estimada**: 2-3 días

### **FASE 4: OPTIMIZACIÓN Y REFINAMIENTO** 🎯
- [ ] Ejecutar tests con diferentes configuraciones
- [ ] Ajustar pesos y umbrales basado en resultados
- [ ] Optimizar prompt para máxima precisión
- [ ] Refinar lógica de decisión
- [ ] Validar casos límite y edge cases

**Duración estimada**: 3-4 días

### **FASE 5: VALIDACIÓN Y TESTING FINAL** ✅
- [ ] Ejecutar suite completa de tests (10+ tests)
- [ ] Validar precisión objetivo (8/10 correctos)
- [ ] Comparar resultados con lógica actual V5
- [ ] Documentar diferencias y mejoras
- [ ] Preparar reporte final de validación

**Duración estimada**: 2-3 días

### **FASE 6: INTEGRACIÓN Y DEPLOYMENT** 🚀
- [ ] Integrar lógica V6 en aplicación staging
- [ ] Validar funcionamiento en entorno real
- [ ] Comparar resultados con tests locales
- [ ] Ajustar configuración si es necesario
- [ ] Preparar deployment a producción

**Duración estimada**: 2-3 días

---

## 🧪 **CRITERIOS DE VALIDACIÓN**

### **Criterios de Precisión**
- **Perfect**: 100% de precisión en tests de llave en inventario
- **Good**: 95%+ de precisión con identificación correcta
- **Fail**: <95% de precisión o falsos positivos/negativos

### **Criterios de Consistencia**
- Resultados idénticos entre local y staging
- Misma lógica de extracción y comparación
- Configuración de pesos consistente
- Comportamiento predecible y estable

### **Criterios de Calidad**
- Extracción de parámetros confiable
- Manejo adecuado de casos límite
- Logging y debugging efectivos
- Documentación completa

---

## 🔄 **PROCESO DE ITERACIÓN**

### **Ciclo de Desarrollo**
1. **Desarrollo** → Implementar funcionalidad
2. **Testing** → Ejecutar tests locales
3. **Análisis** → Revisar resultados y métricas
4. **Ajuste** → Refinar parámetros y lógica
5. **Validación** → Confirmar mejoras
6. **Repetición** → Continuar hasta objetivo

### **Métricas de Seguimiento**
- Precisión por test individual
- Precisión promedio por fase
- Tiempo de procesamiento por imagen
- Tasa de extracción exitosa de parámetros
- Distribución de confidence scores

---

## 🚀 **PLAN DE INTEGRACIÓN**

### **Estrategia de Integración**
1. **Desarrollo Paralelo**: Mantener V5 activo mientras desarrollamos V6
2. **Testing A/B**: Comparar V5 vs V6 en staging
3. **Migración Gradual**: Implementar V6 con feature flag
4. **Validación Continua**: Monitorear resultados en producción
5. **Rollback Plan**: Plan de reversión si es necesario

### **Archivos de Integración**
- `app/lib/ai/v6/` → Nueva lógica V6
- `app/lib/keyscan-v6.server.js` → Wrapper para V6
- `app/routes/scan-v6.check.jsx` → Ruta de testing V6
- `config/v6-weights.json` → Configuración de pesos

---

## 📊 **CRONOGRAMA ESTIMADO**

| Fase | Duración | Dependencias | Entregables |
|------|----------|--------------|-------------|
| Fase 1 | 1-2 días | - | Estructura y configuración |
| Fase 2 | 2-3 días | Fase 1 | Lógica core funcional |
| Fase 3 | 2-3 días | Fase 2 | Sistema de testing |
| Fase 4 | 3-4 días | Fase 3 | Lógica optimizada |
| Fase 5 | 2-3 días | Fase 4 | Validación completa |
| Fase 6 | 2-3 días | Fase 5 | Integración y deployment |

**Duración total estimada**: 12-18 días

---

## 🎯 **PRÓXIMOS PASOS INMEDIATOS**

1. **Crear estructura de archivos V6**
2. **Implementar configuración de pesos optimizados**
3. **Desarrollar prompt optimizado para GPT-4o**
4. **Crear test runner básico**
5. **Ejecutar primer test de validación**

---

## 📝 **NOTAS Y CONSIDERACIONES**

- **Dataset**: Utilizar `tests/keys-optimized/` para todos los tests
- **API Key**: Requerirá `OPENAI_API_KEY` para tests reales
- **Versioning**: Mantener compatibilidad con V5 durante transición
- **Documentation**: Documentar todos los cambios y mejoras
- **Testing**: Ejecutar tests en múltiples escenarios y casos límite

---

**Fecha de creación**: $(date)
**Versión**: 1.0
**Estado**: En desarrollo
**Responsable**: Equipo de desarrollo KeyScan
