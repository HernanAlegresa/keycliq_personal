# Diagnóstico para App keycliq en Heroku

## 🔍 Comandos para Ejecutar (en PowerShell o Terminal)

### 1. Verificar Certificado SSL
```powershell
heroku certs --app keycliq
```
**Qué buscar:**
- ✅ Debe mostrar "Automatically managed by Heroku" 
- ✅ Estado debe ser "Active" o "OK"
- ❌ Si dice "Pending" o "Missing", espera 5-10 minutos y vuelve a verificar

### 2. Verificar Dominios Configurados
```powershell
heroku domains --app keycliq
```
**Qué buscar:**
- ✅ Debe listar `app.keycliq.com`
- ✅ También debería listar `keycliq.herokuapp.com` (URL de staging)
- ❌ Si `app.keycliq.com` no aparece, necesitas agregarlo: `heroku domains:add app.keycliq.com --app keycliq`

### 3. Verificar Variables de Entorno Críticas
```powershell
heroku config --app keycliq
```
**Qué buscar:**
- ✅ `NODE_ENV=production` (debe estar configurado)
- ✅ `SESSION_SECRET` debe existir (no compartas el valor, solo verifica que existe)
- ✅ `DATABASE_URL` debe estar configurado
- ❌ Si falta alguna, necesitas configurarla

### 4. Ver Logs Recientes (IMPORTANTE)
```powershell
heroku logs --tail --app keycliq --num 100
```
**O si quieres ver logs en tiempo real:**
```powershell
heroku logs --tail --app keycliq
```

**Qué buscar después de intentar sign-in:**
- ❌ Stack traces completos
- ❌ Errores relacionados con "session", "cookie", "secure"
- ❌ Errores de base de datos
- ❌ Cualquier mensaje que mencione "500" o "Internal Server Error"

### 5. Test de Redirect HTTP → HTTPS
En PowerShell, usa:
```powershell
$response = Invoke-WebRequest -Uri "http://app.keycliq.com/signin" -Method Head -MaximumRedirection 0 -ErrorAction SilentlyContinue
Write-Host "Status: $($response.StatusCode)"
Write-Host "Location: $($response.Headers.Location)"
```

**O usa tu navegador:**
1. Abre `http://app.keycliq.com/signin` (sin la 's' de https)
2. Debería redirigir automáticamente a `https://app.keycliq.com/signin`
3. Si no redirige, hay un problema con el código o con Heroku

### 6. Test Directo HTTPS
```powershell
Invoke-WebRequest -Uri "https://app.keycliq.com/signin" -Method Head
```
**Qué buscar:**
- ✅ Status code: 200
- ❌ Si da error SSL, el certificado no está activo

## 📋 Checklist Pre-Deploy

Antes de hacer merge y deploy, verifica:

- [ ] Certificado SSL está activo en Heroku
- [ ] `app.keycliq.com` está configurado como dominio
- [ ] `NODE_ENV=production` está configurado
- [ ] `SESSION_SECRET` existe y está configurado
- [ ] `DATABASE_URL` está configurado

## 🚀 Después del Deploy

1. **Reinicia los dynos:**
   ```powershell
   heroku restart --app keycliq
   ```

2. **Monitorea los logs mientras pruebas:**
   ```powershell
   heroku logs --tail --app keycliq
   ```

3. **Test manual:**
   - Ve a `https://app.keycliq.com/signin` (con HTTPS)
   - Intenta iniciar sesión
   - Observa los logs en tiempo real

## 📤 Qué Enviarme Después

Después de hacer deploy, comparte conmigo:

1. **Output completo de:** `heroku certs --app keycliq`
2. **Output completo de:** `heroku domains --app keycliq`
3. **Confirmación de:** `NODE_ENV=production` existe
4. **Logs de Heroku** (últimas 50-100 líneas) durante un intento de sign-in fallido
5. **Resultado del test de redirect** (¿redirige HTTP a HTTPS?)
6. **¿Qué error exacto ves?** (500? otro código? mensaje específico?)

Con esta información podré identificar la causa exacta del problema.

