# KeyCliq · Knowledge Transfer

Bienvenido al hub de documentación técnica de KeyCliq. Este espacio reúne toda la información necesaria para entender cómo está construida la aplicación, cómo operan sus servicios y qué procedimientos seguir para mantenerla en marcha.

## Cómo usar esta carpeta

- Lee primero la sección **Panorama general** para tener contexto de alto nivel.
- Profundiza en la **base de datos**, la **lógica de escaneo** y la **app** según lo que necesites trabajar.
- Revisa los documentos de **operaciones**, **deploy** y **testing** antes de promover cambios a staging o producción.
- Usa los anexos existentes en `docs/` (por ejemplo `HEROKU_DATACLIPS.md`) como material de referencia complementaria.

## Mapa de documentos

- `ARCHITECTURE_OVERVIEW.md`: Tecnologías, módulos clave y flujo de datos extremo a extremo.
- `ENVIRONMENT_SETUP.md`: Requisitos, variables de entorno, comandos y rutina diaria de desarrollo.
- `DATABASE_OVERVIEW.md`: Modelado con Prisma, relaciones, índices y notas operativas sobre Postgres/Dataclips.
- `SCAN_LOGIC_OVERVIEW.md`: Cómo funciona KeyScan V6, prompts, parámetros y cómo se integran las comparaciones.
- `APP_ROUTES_AND_UI.md`: Rutas Remix, navegación principal y componentes UI que sostienen la experiencia.
- `AUTHENTICATION_AND_SECURITY.md`: Flujo de autenticación, sesiones, recuperación de contraseñas y consideraciones de seguridad.
- `EXTERNAL_INTEGRATIONS.md`: Servicios externos (OpenAI, Cloudinary, Resend, etc.) y cómo se conectan con la app.
- `TESTING_AND_QUALITY.md`: Suites automatizadas, datasets de pruebas y guías manuales de validación.
- `DEPLOYMENT_AND_OPERATIONS.md`: Pipelines, staging, monitoreo y checklist post-deploy.

Cada archivo está escrito en español, se enfoca en conceptos y decisiones clave, e incluye links internos para navegar rápidamente.

---

**Última actualización:** 2025-11-11

