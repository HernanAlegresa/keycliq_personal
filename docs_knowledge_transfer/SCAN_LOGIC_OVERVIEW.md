# Lógica de Escaneo (KeyScan V6)

## Introducción

KeyScan V6 es la sexta iteración del sistema de reconocimiento de llaves. Usa GPT-4o multimodal para extraer una firma balanceada (`Hybrid Balanced`) y una lógica determinista para comparar contra el inventario del usuario. Este documento resume el flujo completo, los archivos relevantes y los puntos donde intervenir si hay que ajustar prompts o umbrales.

## Objetivos de V6

- **Precisión 100% en dataset de validación** (`tests-v6/10-final-tests`).  
- **Consistencia**: sólo declara coincidencia (`MATCH_FOUND`) si la similitud es exactamente `1.0`.  
- **Tolerancia controlada**: parámetros con tolerancias específicas (ej. ±1 en `number_of_cuts`).  
- **Balance**: evitar falsos positivos a costa de marcar más `NO_MATCH` cuando hay duda.

## Archivos clave

- `app/lib/ai/active-logic/multimodal-keyscan.server.js`  
  - `HYBRID_BALANCED_PROMPT`: prompt textual enviado a GPT-4o.  
  - `HybridBalancedKeySignatureSchema`: esquema `zod` para validar la respuesta JSON.  
  - `analyzeKeyWithHybridBalancedAI()`: llama al API de OpenAI.  
  - `compareHybridBalancedKeySignatures()`: calcula similitud ponderada.

- `app/lib/keyscan.server.js`  
  - `processKeyImageV6()`: wrapper de alto nivel que convierte la imagen, llama a OpenAI, guarda resultados y decide el outcome.  
  - `extractSignatureV6()`: uso reutilizable para generar firmas al alta de llaves.  

- `app/routes/scan_.check.jsx`  
  - Loader/Action que arma el inventario con firmas listas y maneja las redirecciones (`/scan/match_yes`, `/scan/possible`, `/scan/new`).  
  - Guarda mensajes flash en sesión según resultado.

- `tests-v6/`  
  - Datasets `in/` y `out/`, scripts y reportes HTML para validar la lógica.  

## Flujo paso a paso

1. **Captura de imagen** (`/scan`, `/scan/review`)  
   - La imagen se guarda temporalmente en `sessionStorage` (`tempKeyImageDataURL`).  
   - El usuario confirma y se envía al endpoint `/scan/check`.

2. **Preparación de inventario** (`scan_.check.jsx`)  
   - Se obtienen todas las llaves del usuario (`getUserKeys`).  
   - Se filtran por `sigStatus === 'ready'`.  
   - Se toma la firma más reciente por llave (`prisma.keySignature.findMany` con `distinct: ['keyId']`).  

3. **Procesamiento AI** (`processKeyImageV6`)  
   - Convierte la imagen (data URL → buffer).  
   - Llama a `analyzeKeyWithHybridBalancedAI` → responde JSON con parámetros:  
     - `number_of_cuts`, `blade_profile`, `groove_count`, `key_color`, `bow_shape`, `has_bow_text`, `unique_mark`, `confidence_score`.  
   - La respuesta se valida con `zod`.  
   - Si hay usuario, se crea un registro en `KeyQuery` con la firma obtenida.

4. **Comparación** (`compareHybridBalancedKeySignatures`)  
   - Recorre cada firma del inventario aplicando pesos:  
     - `unique_mark` 30%, `key_color` 25%, `bow_shape` 20%, `number_of_cuts` 15%, `has_bow_text` 5%, `blade_profile` 3%, `groove_count` 2%.  
   - Maneja tolerancias:  
     - `number_of_cuts`: match si la diferencia ≤ 1.  
     - `bow_shape`: normaliza `hexagonal` → `rectangular`.  
   - `similarity` = `weightedMatches / totalWeight`.

5. **Decisión** (`processKeyImageV6`)  
   - Ordena los resultados por `similarity`.  
   - Si el mejor puntaje es `1.0` → `MATCH_FOUND`.  
     - Si hay varios `1.0`, retorna `POSSIBLE_KEYS` con lista de candidatos.  
   - Si ningún `1.0` → `NO_MATCH`.  
   - Se guarda un registro en `KeyMatching` con detalles (`comparisonResult`, `margin`, etc.).  

6. **Redirección** (`scan_.check.jsx`)  
   - `MATCH_FOUND` → `/scan/match_yes?keyId=...&confidence=...`.  
   - `POSSIBLE_KEYS` → `/scan/possible?...` con candidatos serializados.  
   - `NO_MATCH` → `/scan/new` para crear una nueva llave usando la firma generada.

## Prompt y respuesta AI

Características del prompt (`HYBRID_BALANCED_PROMPT`):

- Enumera reglas estrictas: utilizar `null` ante cualquier duda, no inventar valores, usar categorías generales.  
- Indica la plantilla JSON exacta que debe devolver.  
- Fija `confidence_score` en `0.95` por defecto (puede usarse para monitoreo).  
- Prioriza equilibrio entre especificidad y consistencia entre imágenes de la misma llave.

El parser extrae el bloque ```json ... ``` de la respuesta y lo valida con `zod`. Si el AI no devuelve JSON válido, la operación falla y se notifica al usuario.

## Persistencia de resultados

- **KeyQuery** (`processKeyImageV6`): registra cada escaneo con su firma (`result.signature`).  
- **KeySignature**: se crea para la consulta cuando sea relevante (particularmente al guardar un nuevo matching).  
- **KeyMatching**: almacena `similarity`, `confidence`, `matchType`, `comparisonResult` y referencias a la llave emparejada.  
- **Key**: cuando desde `/scan/new` se decide guardar la llave, se vuelve a extraer la firma (para garantizar consistencia) y se persiste en el campo `signature` + tabla `KeySignature`.

## Logs y métricas

- `processKeyImageV6` loguea tiempos (`processingTime`, `margin`), decisiones y resultados.  
- `scan_.check.jsx` imprime hitos (`inventory load`, `extract+match`) y trazas detalladas en caso de error.  
- Se recomienda conservar logs en staging/producción para auditar rendimiento y detectar recurrencias.

## Testing

- `tests-v6/10-final-tests/`: conjunto de 10 casos (IN/OUT) con resultados esperados (`report.html`, `results.json`).  
- Scripts en `tests-v6/scripts/` para ejecutar escenarios `run-in-real.mjs`, `run-out-real.mjs`.  
- Resultados históricos en `tests/results/testv6clean/`.  
- Antes de hacer cambios en el prompt o pesos, corre la suite (ver `TESTING_AND_QUALITY.md`).

## Ajustes y evolución

Si necesitas ajustar la lógica:

1. **Modificar parámetros**  
   - Cambia los pesos/tolerancias en `compareHybridBalancedKeySignatures`.  
   - Ajusta el prompt para capturar más/menos características (cuidado: afecta consistencia).  

2. **Introducir nuevos campos**  
   - Actualiza `HybridBalancedKeySignatureSchema` y la comparación.  
   - Migra la base si guardas campos adicionales en `KeySignature`.  
   - Reentrena tests para asegurar que siguen pasando.

3. **Cambiar el umbral**  
   - Actualmente `similarity === 1.0` es obligatorio. Si decides permitir `>= 0.9`, deberás actualizar la lógica de decisión y las guías operativas.

4. **Fallbacks**  
   - En caso de error con OpenAI, se devuelve `success: false`. El flujo redirige a `/scan/error`. Asegúrate de manejar tokens/creditos.

## Riesgos conocidos

- Dependencia directa de la API de OpenAI (latencia, costos, límites). Considera cachear firmas o introducir reintentos.  
- Inventario sin firmas (`sigStatus !== 'ready'`) → `scan_.check` redirige a `/scan/new` sin comparar. Mantén tus llaves con firmas actualizadas.  
- Cambios en el modelo GPT-4o podrían alterar ligeramente respuestas; monitorea `confidence_score` y crea tests de regresión manuales.

---

**Última actualización:** 2025-11-11

