# Testing y Calidad

## Introducción

KeyCliq combina suites automatizadas, datasets de regresión y guías manuales para asegurar la calidad de la lógica de escaneo y de la aplicación web. Este documento resume qué pruebas existen, cómo ejecutarlas y cuándo recurrir a validaciones manuales.

## Estrategia general

1. **Pruebas automatizadas de KeyScan**: scripts Node que ejercitan la lógica AI con datasets controlados.  
2. **Reportes HTML**: permiten comparar visualmente resultados de distintas versiones.  
3. **Pruebas manuales en staging**: checklist documentado para validar flujos críticos antes de cada deploy.  
4. **Consultas SQL/Dataclips**: aseguran la integridad de datos y detectan inconsistencias.

## Suites automatizadas

### Ubicación

- `tests/` → Contiene resultados de versiones anteriores (`v5`, `testv6clean`), datasets y scripts.  
- `tests-v6/` → Directorio principal para V6, con datasets finales, scripts y cache.

### Scripts clave

- `tests-v6/scripts/run-in-real.mjs`  
  - Ejecuta casos “IN” (llaves que deberían existir en inventario).  
  - Requiere acceso a OpenAI para generar firmas en tiempo real.

- `tests-v6/scripts/run-out-real.mjs`  
  - Casos “OUT” (llaves que no están en inventario).  
  - Confirma que la lógica retorna `NO_MATCH` correctamente.

- `tests-v6/scripts/render-html.mjs`  
  - Genera reportes HTML a partir de resultados JSON.

- `tests/results/testv6clean/`  
  - Reportes previos (HTML, JSON) que sirven de referencia para detectar regresiones.  
  - `RESULTS_SUMMARY.md` resume hallazgos de la suite V6 limpia.

- `scripts/run-optimized-test-suite.js`  
  - Ejecuta subconjuntos optimizados de pruebas (ver README dentro de `scripts/` para detalles).  

### Ejecución

1. Asegúrate de tener configuradas variables (`OPENAI_API_KEY`, `DATABASE_URL`).  
2. Corre el script deseado:  
   ```bash
   node tests-v6/scripts/run-in-real.mjs
   node tests-v6/scripts/run-out-real.mjs
   ```
3. Revisa los reportes resultantes (JSON/HTML).  
4. Compara contra `tests/results/testv6clean/` para confirmar que no cambió el comportamiento esperado.

### Cuándo ejecutarlas

- Modificaciones a `multimodal-keyscan.server.js` (prompt, pesos, lógica).  

- Cambios en procesos que afectan inventario/firma (`keys.server.js`, `keyscan.server.js`).  

- Antes de un release a producción cuando haya ajustes relevantes en AI o matching.  

- Mensualmente como smoke test preventivo.

## Pruebas manuales

`docs/OPERATIVA_STAGING.md` documenta un checklist detallado para staging, incluyendo:

- Deploy de branch y verificación de migraciones.  
- Escenarios de escaneo (`MATCH_FOUND`, `NO_MATCH`, `POSSIBLE_KEYS`).  
- Creación y eliminación de llaves (ver logs Cloudinary).  
- Validación de `getUserStats` y `getUserHistory`.  
- Verificación de validaciones (`saveMatchingResult`).  
- Confirmación de índices vía SQL.

Ejecuta este checklist antes de mover cambios a producción, especialmente si tocaste flujos de escaneo o manipulación de datos.

## Consultas de control (Dataclips)

`docs/HEROKU_DATACLIPS.md` ofrece SQL listos para monitorear:

- Conteos por tabla (`User`, `keys`, `key_signatures`, `key_queries`, `key_matchings`).  
- Distribución de `sigStatus`.  
- Consistencia `matchType ↔ matchedKeyId`.  
- Verificación de integridad (`both_null`, `both_set` en `key_signatures`).  
- Validación de índices aplicados.

Integra estas consultas en tu rutina de QA: ejecútalas tras migraciones, antes de releases y cuando se detecten bugs relacionados con datos.

## Herramientas adicionales

- `npx prisma studio` para inspeccionar y editar datos rápidamente.  
- `scripts/db-inspect.js` para imprimir un snapshot de la base.  
- `scripts/cost-monitor.js` para rastrear costos potenciales (personalizar según necesidades).  
- Logs detallados en `/scan/check` y `processKeyImageV6` permiten depurar decisiones de matching.

## Buenas prácticas

- Mantén los datasets de prueba sincronizados con los escenarios reales; documenta cualquier cambio en este archivo.  
- Si agregas nuevas métricas en `KeyMatching.comparisonResult`, actualiza scripts y reportes.  
- Asegura que staging tenga inventario con firmas `ready`; de lo contrario las pruebas de matching no serán concluyentes.  
- Registra resultados de suites largas (fecha, commit, outcome) para formar historial.  
- Considera automatizar la ejecución de scripts en CI si se dispone de un API key OpenAI de testing.

---

**Última actualización:** 2025-11-11

