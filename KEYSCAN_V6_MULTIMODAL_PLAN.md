# KeyScan V6 - Plan Multimodal con IA

## 🎯 **Objetivo del Proyecto**

Implementar un nuevo sistema de análisis de llaves basado en **Inteligencia Artificial Multimodal** que reemplace el enfoque de visión por computadora clásica (KeyScan V1-V5) con un sistema que genere **firmas textuales** estructuradas para identificar y comparar llaves.

## 🔄 **Cambio de Enfoque**

### **Problema del Sistema Anterior:**
- KeyScan V1-V5 basado en visión por computadora clásica
- Extracción de parámetros numéricos inconsistentes
- Comparación de vectores con thresholds problemáticos
- Resultados insuficientes al comparar imágenes distintas de la misma llave
- Inconsistencias por condiciones de luz y ángulo

### **Nueva Solución:**
- **IA Multimodal**: GPT-4o analiza imágenes y genera descripciones textuales
- **Firmas Estructuradas**: JSON con propiedades cuantitativas y cualitativas
- **Comparación Textual**: Algoritmo de similitud semántica
- **Consistencia**: Descripciones estables independientes de condiciones de imagen

## 🧠 **Sistema de IA Seleccionado**

### **Modelo: GPT-4o (OpenAI)**
- **Costo**: ~$0.01-0.02 por análisis
- **Latencia**: 2-4 segundos
- **Calidad**: >95% accuracy en análisis de objetos
- **Integración**: SDK oficial para Node.js
- **Escalabilidad**: Sin límites de infraestructura

### **Alternativas Evaluadas:**
- **Open Source (LLaVA, MiniGPT-4, BakLLaVA)**: ❌ No viables (requieren GPU, alta latencia)
- **Claude 3.5 Sonnet**: ✅ Buena calidad pero más caro
- **Gemini Pro Vision**: ✅ Opción viable pero menos consistente en JSON

## 📊 **Dataset de Testing**

### **Dataset Optimizado Disponible:**
```
tests/keys-optimized/
├── heavy/ (1 llave)
├── lockbox/ (9 llaves) 
├── regular/ (23 llaves)
└── optimized-keys-images/ (imágenes procesadas)
```

**Total: 33 llaves únicas** con múltiples variaciones por llave.

### **Tipos de Testing:**
1. **Intra-key Consistency**: Misma llave, diferentes imágenes
2. **Inter-key Discrimination**: Llaves diferentes
3. **Cross-category Testing**: Heavy vs Regular vs Lockbox

## 🏗️ **Arquitectura Técnica**

### **Stack Actual:**
- **Backend**: Node.js 20 + Remix
- **Frontend**: React Router 7
- **Base de Datos**: PostgreSQL (Prisma)
- **Deploy**: Heroku
- **Storage**: Cloudinary

### **Nuevos Componentes:**
- **IA Service**: OpenAI GPT-4o
- **Prompt Engine**: Sistema de prompts optimizados
- **Signature Storage**: Nuevas tablas para firmas textuales
- **Comparison Algorithm**: Algoritmo de similitud textual

## 🗄️ **Esquema de Base de Datos**

### **Nuevas Tablas Propuestas:**

```prisma
// Tabla para llaves del inventario del usuario
model UserKey {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  
  // Datos básicos de la llave
  label       String?  // Nombre que le da el usuario
  description String?  // Descripción opcional
  
  // Firma textual generada por IA
  signature   Json     // JSON completo de GPT-4o
  
  // Metadatos
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relaciones
  signatures  KeySignature[]
  
  @@map("user_keys")
}

// Tabla para consultas de llaves (identificación)
model KeyQuery {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  
  // Resultado de la consulta
  queryType   String   // "identification", "comparison"
  result      Json     // Resultado del matching
  
  // Metadatos
  createdAt   DateTime @default(now())
  
  // Relaciones
  signatures  KeySignature[]
  
  @@map("key_queries")
}

// Tabla central para todas las firmas
model KeySignature {
  id          String   @id @default(cuid())
  
  // Relación con inventario o consulta
  userKeyId   String?
  userKey     UserKey? @relation(fields: [userKeyId], references: [id])
  
  keyQueryId  String?
  keyQuery    KeyQuery? @relation(fields: [keyQueryId], references: [id])
  
  // Datos de la firma
  signature   Json     // JSON estructurado de GPT-4o
  imageUrl    String?  // URL de la imagen en Cloudinary
  
  // Metadatos
  createdAt   DateTime @default(now())
  
  @@map("key_signatures")
}
```

## 🤖 **Prompt Universal Optimizado**

### **Estructura del Prompt:**
```javascript
const UNIVERSAL_KEY_PROMPT = `
Eres un experto en análisis de llaves. Analiza esta imagen de llave y extrae TODAS las propiedades visibles.

Devuelve un JSON con esta estructura exacta:

{
  "quantitative_properties": {
    "stamped_code": "código estampado si existe",
    "number_of_cuts": número_de_cortes,
    "length_estimate": "longitud estimada en cm",
    "width_estimate": "ancho estimado en cm", 
    "groove_count": número_de_ranuras,
    "cut_depths": [array_de_profundidades]
  },
  "qualitative_properties": {
    "material": "material principal",
    "color": "color dominante",
    "finish": "tipo de acabado",
    "manufacturing_process": "proceso de manufactura",
    "edge_profile": "perfil del borde",
    "purpose": "tipo de llave",
    "usage_context": "contexto de uso"
  },
  "structural_features": {
    "bow": {
      "shape": "forma del mango",
      "key_ring_hole": "tipo de agujero",
      "layers": número_de_capas,
      "text": ["textos_visibles"]
    },
    "shoulder_stop": "presente/ausente",
    "blade": {
      "profile": "perfil de la hoja",
      "grooves": número_de_ranuras,
      "cuts": "tipo de cortes"
    },
    "tip": "forma de la punta"
  },
  "unique_features": ["características_únicas"],
  "confidence_score": 0.95
}

Sé extremadamente detallado y preciso. Incluye TODO lo que veas.
`;
```

## 🔄 **Flujo de Usuario**

### **Flujo Actual (Mantener):**
1. **Usuario sube imagen** → Scan Review (take again/continue)
2. **Usuario hace click en continue** → Procesamiento IA (generación de firma)
3. **Matching automático** contra inventario
4. **Redirección** a pantalla correspondiente (match/possible/no match)

### **Nuevo Flujo Técnico:**
```
Usuario sube imagen → Validar imagen → Enviar a GPT-4o → 
Recibir JSON estructurado → Validar estructura → 
Guardar en DB como KeySignature → Buscar firmas similares → 
Calcular similitud textual → Determinar resultado → 
MATCH/POSSIBLE/NO MATCH
```

## 🧪 **Plan de Testing**

### **Fase 1: Extracción de Datos**
- **Objetivo**: Validar que GPT-4o extrae datos correctamente
- **Métricas**: Accuracy, completitud, consistencia
- **Dataset**: 33 llaves del dataset optimizado
- **Criterios**: >90% de extracciones exitosas

### **Fase 2: Consistencia Intra-llave**
- **Objetivo**: Misma llave, diferentes imágenes
- **Test Cases**: regular-01 (aligned vs generated vs optimized)
- **Métricas**: Consistency Score, Feature Overlap
- **Criterios**: >90% similitud entre imágenes de misma llave

### **Fase 3: Discriminación Inter-llave**
- **Objetivo**: Llaves diferentes
- **Test Cases**: regular-01 vs regular-02, lockbox-02 vs lockbox-03
- **Métricas**: Discrimination Score, False Positive Rate
- **Criterios**: <30% similitud entre llaves distintas

### **Fase 4: Flujo Completo**
- **Objetivo**: Validar flujo end-to-end
- **Test Cases**: Upload → Analysis → Storage → Comparison → Result
- **Métricas**: End-to-end accuracy, latency
- **Criterios**: >95% accuracy en flujo completo

## 📈 **Métricas de Evaluación**

### **Métricas Principales:**
- **Accuracy**: % de clasificaciones correctas
- **Precision**: % de matches correctos / total matches
- **Recall**: % de matches encontrados / total matches posibles
- **F1-Score**: Balance entre precision y recall

### **Métricas Específicas:**
- **Consistency Score**: Similitud entre imágenes de misma llave
- **Discrimination Score**: Diferenciación entre llaves distintas
- **False Positive Rate**: % de matches incorrectos
- **False Negative Rate**: % de matches perdidos

## 🚀 **Plan de Implementación**

### **Fase 1: MVP Básico (1-2 semanas)**
- ✅ Configurar OpenAI API
- ✅ Crear endpoint `/api/analyze-key`
- ✅ Implementar prompt universal
- ✅ Generar firmas textuales básicas
- ✅ Testing con dataset optimizado

### **Fase 2: Comparación (1 semana)**
- ✅ Algoritmo de similitud textual
- ✅ Sistema de scoring
- ✅ Integración con flujo existente
- ✅ Testing de matching

### **Fase 3: Optimización (1 semana)**
- ✅ Refinar prompts basado en resultados
- ✅ Mejorar algoritmo de comparación
- ✅ Testing exhaustivo
- ✅ Optimización de performance

### **Fase 4: Producción (1 semana)**
- ✅ Deploy a staging
- ✅ Testing con usuarios reales
- ✅ Monitoreo y métricas
- ✅ Deploy a producción

## 💰 **Análisis de Costos**

### **Costos por Análisis:**
- **GPT-4o con imagen**: ~$0.01-0.02 por análisis
- **Con $10 disponibles**: 500-1000 análisis posibles

### **Costos por Fase:**
- **Fase 1 (Desarrollo)**: ~$2-3
- **Fase 2 (Testing dataset)**: ~$3-4  
- **Fase 3 (Optimización)**: ~$2-3
- **Total estimado**: ~$7-10

### **Costos de Producción:**
- **1000 análisis/mes**: ~$10-20
- **Comparado con infraestructura propia**: $200-500/mes vs $10-20/mes

## 🔧 **Código Reutilizable Identificado**

### **Componentes que podemos reutilizar:**
1. **Estructura de Testing** (`scripts/keyscan/`):
   - Framework de testing existente
   - Generación de reportes HTML
   - Métricas y análisis estadístico

2. **Gestión de Imágenes** (`app/lib/vision/`):
   - Validación de calidad de imagen
   - Preprocesamiento básico
   - Almacenamiento en Cloudinary

3. **Base de Datos** (Prisma schema):
   - Estructura de Keys existente
   - Sistema de usuarios y sesiones
   - Relaciones y constraints

4. **Frontend Components**:
   - Upload de imágenes
   - Visualización de resultados
   - Sistema de navegación

## 🎯 **Criterios de Éxito**

### **Técnicos:**
- ✅ >95% accuracy en análisis de llaves
- ✅ <5 segundos de latencia por análisis
- ✅ >90% consistencia intra-llave
- ✅ <30% similitud inter-llave

### **Funcionales:**
- ✅ Flujo de usuario sin cambios
- ✅ Integración transparente con sistema actual
- ✅ Escalabilidad para producción
- ✅ Mantenibilidad del código

### **Económicos:**
- ✅ Costo <$20/mes para uso normal
- ✅ ROI positivo vs infraestructura propia
- ✅ Escalabilidad de costos predecible

## 📋 **Próximos Pasos Inmediatos**

1. **Diseñar prompt universal** optimizado
2. **Crear esquema de base de datos** 
3. **Implementar función de análisis** con GPT-4o
4. **Probar con imágenes del dataset** optimizado
5. **Desarrollar algoritmo de comparación** textual
6. **Testing exhaustivo** con métricas definidas
7. **Integración con flujo existente**
8. **Deploy y monitoreo**

---

**Fecha de creación**: $(date)
**Versión**: 1.0
**Estado**: Planificación completa, listo para implementación

