# Despliegue y Operaciones

## Introducción

Este documento centraliza las prácticas y pasos recomendados para desplegar KeyCliq en staging/producción (Heroku) y mantener el sistema en operación. Complementa la guía detallada `docs/OPERATIVA_STAGING.md` y las consultas de `docs/HEROKU_DATACLIPS.md`.

## Environments objetivo

- **Staging (Heroku)**: entorno para validar funcionalidades con datos reales controlados. Usa credenciales separadas (OpenAI, Cloudinary, Resend).  
- **Producción (Heroku)**: entorno en vivo. Replica configuración de staging una vez validada.

## Variables en Heroku

Configura todos los valores descritos en `ENVIRONMENT_SETUP.md` como Config Vars en cada app de Heroku. Especial atención a:

- `DATABASE_URL` (usar Heroku Postgres).  
- `SESSION_SECRET` único por ambiente.  
- `OPENAI_API_KEY` (puede variar por entorno).  
- `APP_URL` → `https://<app>.herokuapp.com` o dominio custom.  
- `CLOUDINARY_*` y `RESEND_API_KEY`.  
- `NODE_ENV=production` (Heroku lo setea por defecto).

## Pipeline de deploy (Heroku)

1. Asegúrate de estar en la branch correcta (`git checkout main` o branch release).  
2. Ejecuta tests locales (ver `TESTING_AND_QUALITY.md`).  
3. Deploy a staging:  
   ```bash
   git push heroku-staging <branch>:main
   ```
4. Verifica migraciones:  
   ```bash
   heroku run npx prisma migrate deploy -a <app-staging>
   ```
   - Si usas `db push`, ejecuta `heroku run npm run db:push` (sólo si no llevas historial).  
5. Corre checklist manual (`docs/OPERATIVA_STAGING.md`).  
6. Ejecuta Dataclips críticos (conteos, integridad).  
7. Si todo es correcto, promueve a producción:  
   ```bash
   heroku pipelines:promote -a <app-staging>
   ```
8. Repite validaciones rápidas en producción (al menos Dataclips A y C, prueba de escaneo liviana).

## Monitoreo post-deploy

- **Logs**:  
  ```bash
  heroku logs --tail -a <app>
  ```
  Busca mensajes de `processKeyImageV6`, errores de OpenAI, Cloudinary o Resend.

- **Dataclips**: ejecuta periódicamente para detectar desbalances en `matchType`, llaves sin firmas o problemas de integridad.  
- **Alertas**: configurar notificaciones en OpenAI, Cloudinary y Resend para detectar límites o errores.  
- **Sesiones**: programar job para limpiar tokens expirados si el volumen crece (`cleanupExpiredTokens`).

## Mantenimiento recurrente

- **Índices**: revalidar tras cambios de schema (`docs/HEROKU_DATACLIPS.md`, consulta F).  
- **Backups**: usar capacidades de Heroku Postgres (snapshots automáticos).  
- **Rotación de secretos**: actualizar `SESSION_SECRET`, `SENDGRID/RESEND` y claves API según política de seguridad.  
- **Actualizaciones de dependencias**: seguir releases de Remix, Prisma y OpenAI SDK. Probar en staging antes de actualizar producción.  
- **Control de costos**:  
  - OpenAI: monitorea consumo por escaneos; considera scripts como `scripts/cost-monitor.js`.  
  - Cloudinary: revisa uso de almacenamiento/ancho de banda.  
  - Resend/Sendgrid: verifica límites mensuales.

## Respuesta ante incidentes

1. **Falla en escaneo (errores de OpenAI)**:  
   - Revisa logs para `Hybrid Balanced AI analysis failed`.  
   - Confirma estado de la API.  
   - Considera fallback temporal (permitir carga manual de firma/exención).  

2. **Errores en matching o datos corruptos**:  
   - Ejecuta Dataclips E1/E2 (`docs/HEROKU_DATACLIPS.md`).  
   - Revisa `KeyMatching` recientes para detectar inconsistencias.  
   - Si hay migración incorrecta, prepara script de corrección y documenta.  

3. **Problemas con emails**:  
   - Checa logs de Resend/Sendgrid.  
   - Verifica que `MAIL_FROM_*` y dominios estén correctos.  
   - Considera habilitar webhooks para detectar rebotes.  

4. **Imágenes faltantes**:  
   - Verifica credenciales Cloudinary.  
  - Revisa logs por `Error uploading to Cloudinary`.  
   - Si hay llaves sin imagen, permitir re-upload desde `/keys/<id>`.  

## Documentación y trazabilidad

- Registra cada deploy (fecha, commit, responsable, resultado del checklist).  
- Documenta cambios relevantes en esta carpeta (`docs_knowledge_transfer`) y en issues internos.  
- Para auditorías, conserva reportes generados en `tests/results/` junto con la versión del código.

## Próximos pasos sugeridos

- Automatizar ejecución de pruebas V6 en CI (requiere clave OpenAI dedicada).  
- Integrar herramientas de monitoreo como Sentry/LogDNA para capturar excepciones.  
- Programar Dataclips como reportes programados para obtener tendencias.  
- Documentar playbooks más específicos (ej. rotación de claves, rollback rápido).

---

**Última actualización:** 2025-11-11

