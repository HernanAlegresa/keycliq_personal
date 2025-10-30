# Dataset Optimizado - Imágenes de Prueba

## ⚠️ IMPORTANTE

Las imágenes de este dataset han sido removidas del repositorio para reducir el tamaño del slug de Heroku (debe ser < 500MB).

## 📁 Ubicación del Dataset

El dataset completo está disponible localmente en los desarrolladores pero **NO** debe ser pusheado a GitHub.

### Estructura

```
tests/keys-optimized/
├── heavy/
│   └── heavy-01/
│       └── aligned-heavy-01.jpg
├── lockbox/
│   ├── lockbox-02/
│   │   ├── aligned-lockbox-02.jpg
│   │   └── generated-lockbox-02.png
│   ├── lockbox-14/
│   │   ├── aligned-lockbox-14.jpg
│   │   └── generated-lockbox-14.png
│   └── ... (más llaves lockbox)
└── regular/
    ├── regular-01/
    │   ├── aligned-regular-01.jpg
    │   └── generated-regular-01.png
    └── ... (más llaves regular)
```

## 🧪 Uso para Tests

Este dataset se usa para:
- Validar la lógica V6 localmente
- Ejecutar tests automatizados
- Preparar tests para staging

Para ver los tests válidos con este dataset, ver: `tests-v6/10-final-tests/`

## 📋 Plan de Pruebas en Staging

Ver `STAGING_TEST_PLAN.md` para las instrucciones de qué imágenes usar y qué resultados esperar.

---

**NOTA**: Si necesitas el dataset completo, contacta al equipo de desarrollo.

