# KeyCliq - Deployment Guide

## 🚨 IMPORTANTE: Configuración para Producción

Para que KeyCliq funcione correctamente en producción con múltiples usuarios, necesitas configurar los siguientes servicios:

### 1. Base de Datos (OBLIGATORIO)

**❌ NO uses SQLite en producción** - No soporta múltiples usuarios simultáneos.

**✅ Usa PostgreSQL:**
- **Opción 1**: [Neon](https://neon.tech) (gratis hasta 3GB)
- **Opción 2**: [Supabase](https://supabase.com) (gratis hasta 500MB)
- **Opción 3**: [Railway](https://railway.app) (gratis hasta $5/mes)
- **Opción 4**: [AWS RDS](https://aws.amazon.com/rds/) (pago)

**Variables de entorno:**
```bash
DATABASE_URL="postgresql://username:password@host:5432/database_name"
```

### 2. Storage de Imágenes (OBLIGATORIO)

**❌ NO uses archivos locales en producción** - Se borran en cada deploy.

**✅ Opción 1: Cloudinary (Recomendado - Fácil)**
```bash
STORAGE_PROVIDER=cloudinary
CLOUDINARY_CLOUD_NAME=tu-cloud-name
CLOUDINARY_API_KEY=tu-api-key
CLOUDINARY_API_SECRET=tu-api-secret
```

**✅ Opción 2: AWS S3**
```bash
STORAGE_PROVIDER=s3
STORAGE_BUCKET=tu-bucket-name
STORAGE_ACCESS_KEY=tu-access-key
STORAGE_SECRET_KEY=tu-secret-key
STORAGE_REGION=us-east-1
```

### 3. Configuración Completa para Producción

```bash
# App
NODE_ENV=production
SESSION_SECRET=tu-super-secret-key-muy-largo-y-seguro

# Database
DATABASE_URL="postgresql://user:pass@host:5432/keycliq"

# Storage
STORAGE_PROVIDER=cloudinary
CLOUDINARY_CLOUD_NAME=tu-cloud-name
CLOUDINARY_API_KEY=tu-api-key
CLOUDINARY_API_SECRET=tu-api-secret
```

## 🚀 Pasos para Deploy

### 1. Configurar Base de Datos
1. Crear cuenta en Neon/Supabase/Railway
2. Crear base de datos PostgreSQL
3. Copiar la URL de conexión

### 2. Configurar Storage
1. **Cloudinary**: Crear cuenta gratis en cloudinary.com
2. **S3**: Crear bucket en AWS (más complejo)

### 3. Deploy en Vercel/Netlify
1. Conectar repositorio
2. Configurar variables de entorno
3. Deploy

### 4. Migrar Base de Datos
```bash
npm run db:push
```

## ✅ Verificación

Después del deploy, verifica que:
- ✅ Los usuarios pueden registrarse
- ✅ Las imágenes se guardan correctamente
- ✅ Las imágenes persisten entre sesiones
- ✅ Múltiples usuarios pueden usar la app simultáneamente

## 💰 Costos Estimados

- **Base de datos**: Gratis (Neon/Supabase)
- **Storage**: Gratis (Cloudinary hasta 25GB)
- **Hosting**: Gratis (Vercel/Netlify)
- **Total**: $0/mes para empezar

## 🆘 Si algo falla

1. Revisa los logs de la aplicación
2. Verifica las variables de entorno
3. Confirma que la base de datos está conectada
4. Verifica que el storage está configurado

---

**⚠️ IMPORTANTE**: Sin esta configuración, la app funcionará localmente pero fallará en producción con múltiples usuarios.
