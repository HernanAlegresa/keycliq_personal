# Rutas de la App y UI

## Introducción

Esta guía describe las rutas principales de la aplicación Remix, los flujos de navegación y los componentes UI que dan soporte a la experiencia KeyCliq. El objetivo es identificar dónde agregar nuevas pantallas, cómo se estructuran loaders/actions y qué convenciones visuales seguir.

## Principios de diseño

- **Tipografías:** títulos con Raleway Bold, cuerpo con Open Sans Regular (ver memoria del proyecto).  
- **Paleta:** verde primario `#006209`, grises neutros, blanco y negro para contrastes.  
- **Componentes reutilizables:** en `app/components/ui/` (botones, cards, modales) con variantes para acciones primarias/secundarias.  
- **Layout global:** `app/components/layout/Header.jsx` y `FooterNav.jsx` controlan navegación superior e inferior; se pueden ocultar por ruta usando `handle.hideHeader`/`hideFooter`.

## Rutas públicas

| Ruta | Archivo | Descripción | Notas UI |
|------|---------|-------------|----------|
| `/welcome` | `app/routes/welcome.jsx` | Landing para usuarios no autenticados. | Oculta header/footer; muestra logo (`assets/KeyCliq_Wordmark...`) y CTAs a `/signin` y `/signup`. |
| `/signin` | `app/routes/signin.jsx` | Login. | Usa formularios estilizados con errores visibles. En producción fuerza HTTPS para cookies. |
| `/signup` | `app/routes/signup.jsx` | Registro. | Similar a login, crea usuario con `register()`. |
| `/forgot-password` / `/reset-password` | Rutas de recuperación. | `forgot` envía email (Resend); `reset` valida token (`validatePasswordResetToken`). |
| `/terms`, `/terms-of-use`, `/privacy`, `/privacy-policy` | Páginas legales. | Estilos en `styles/legal.css`. |

## Rutas autenticadas (dashboard)

Autenticación con `requireUserId` en loaders. La mayoría renderiza header con título y botón atrás configurable (`handle`).

### Inicio (`/`)
- **Archivo:** `app/routes/_index.jsx`  
- **Secciones:** acciones rápidas (`QuickAction`), llaves recientes (`RecentKeys`).  
- **Uso de datos:** loader trae las últimas llaves (`getRecentKeys`).

### Escaneo (`/scan` y subrutas)

1. **`/scan`**  
   - Captura o subida de imagen.  
   - Componentes: `ScanGuidelines`, `Button`, placeholders según dispositivo.  
   - Usa inputs ocultos y `sessionStorage` para persistencia temporal.

2. **`/scan/review`** (`scan_.review.jsx`)  
   - Permite validar la foto, mostrar preview (`ImagePreview`, `ImageModal`).  
   - Desde aquí se inicia el procesamiento (navega a `/scan/check`).  

3. **`/scan/check`** (`scan_.check.jsx`)  
   - Loader vacío (verifica sesión). Action hace todo el procesamiento (ver documento de lógica V6).  
   - Vista muestra animación de “Processing your key” con spinner CSS.

4. **Resultados**  
   - `/scan/match_yes`: muestra llave existente con detalles.  
   - `/scan/possible`: lista candidatos cuando hay múltiples matches perfectos.  
   - `/scan/new`: formulario para crear llave nueva (rellena firma al guardar).Este es el No Match  
   - `/scan/analysis`, `/scan/error`, `/scan/invalid`: flows auxiliares/legacy para manejo de errores.

### Inventario (`/keys`)

- **Listado:** `app/routes/keys._index.jsx`  
  - Loader obtiene llaves y estadísticas (`getUserKeys`, `getKeyStats`).  
  - UI incluye buscador, filtros por propiedad y cards con imagen optimizada (Cloudinary).  

- **Detalle:** `app/routes/keys.$id.jsx`  
  - Pantalla Key Details cuando haces click en una llave
  - Muestra metadatos, imagen ampliada (`ImageModal`), notas, historial.  
  - Loader asegura propiedad de la llave.  

- **Nuevo desde escaneo:** `/scan/new` (`scan_.new.jsx`)  
  - Form pre-populado con imagen y datos `sessionStorage`.  
  - Al guardar, llama `createKey` que sube a Cloudinary (si aplica) y genera firma.  

### Historial y análisis

- **`/analysis.v5.jsx`**: vista legacy para revisar comparativas V5 (aún en repo para referencia).  
- **`/scan/analysis.jsx`**: interfaz para revisar coincidencias y comparar firmas (usa componentes específicos si se activa).  
- **`/api.*` routes**: endpoints JSON para debugging y assets (`api.scan-guide-image`, `api.key-image.$id`, etc.).

### Configuración y cuenta

- **`/settings.jsx`**: opciones de cuenta, borrado, datos personales.  
- **`/logout.jsx`**: action que destruye sesión y redirige a `/welcome`.  
- **`/welcome.jsx`**: se reutiliza como home pública tras logout.

## Componentes UI destacados

- `Button.jsx`: soporta variantes (`primary`, `secondary`, `ghost`) y tamaños.  
- `QuickAction.jsx`: tarjetas CTA usadas en la home.  
- `ScanGuidelines.jsx`: recordatorios visuales para capturar fotos de calidad (alineado con prompt AI).  
- `ImageModal.jsx`, `ImagePreview.jsx`: visualización y zoom de imágenes.  
- `RecentKeys.jsx`: carrusel simple de llaves recientes.  
- `Header.jsx`, `FooterNav.jsx`: control de navegación; `FooterNav` muestra tabs (`Home`, `Scan`, `Keys`, `Settings`).  
- `DynamicBackButton.jsx`: decide el destino del botón atrás según `handle` y contexto.

## Estilos y temas

- Archivos en `app/styles/` agrupados por feature (`analysis.css`, `scan-guidelines.css`, `welcome.css`, etc.).  
- Para cambios globales, editar `globals.css` o `components.css`.  
- Tailwind (`tailwind.css`, `tailwind.config.js`) se usa principalmente para utilidades, combinado con clases BEM custom.  
- Mantén consistencia de fuentes y colores según el lineamiento (`Raleway`/`Open Sans`, verde `#006209`).  
- Para nuevos componentes, crea hoja específica o reutiliza utilidades existentes; evita mezclar estilos inline con CSS módulos para mantener orden.

## Patrón handle por ruta

Remix permite definir `export const handle = { ... }` para controlar encabezado/footer. Convenciones actuales:

- `hideHeader`, `hideFooter`: booleanos para ocultar navegación (útil en onboarding).  
- `title`: usado por el header para mostrar título de pantalla.  
- `showBackButton`, `backTo`: activan botón atrás con ruta específica.  
- `stepLabel`: texto adicional (ej. "1 of 2" en el flujo de escaneo).

Cuando agregues rutas nuevas, expón un `handle` consistente para integrarse con el layout central.

## Navegación y estado

- Los loaders suelen traer todo lo necesario para renderizar sin datos adicionales.  
- Para estados temporales (`scan`), se usa `sessionStorage` o `flash` session (`session.flash('scanMessage', ...)`).  
- Formularios usan `useNavigation`/`useFetcher` en algunos casos para mejorar UX.

## Recomendaciones

- Mantén rutas bajo `app/routes/` siguiendo la convención Remix (`.` para segmentos dinámicos, `_` para nested layouts).  
- Al crear nuevas rutas, define el CSS correspondiente y registra componentes en `root.jsx` si necesitas bundles específicos.  
- Usa componentes de `app/components/ui/` antes de crear nuevos para evitar duplicación.  
- Antes de modificar flows existentes (especialmente `/scan`), revisa `SCAN_LOGIC_OVERVIEW.md` y asegúrate de actualizar tests.  
- Para nuevas páginas legales o estáticas, reutiliza estructura de `privacy-policy.jsx`/`terms.jsx` + estilos en `legal.css`.

---

**Última actualización:** 2025-11-11

