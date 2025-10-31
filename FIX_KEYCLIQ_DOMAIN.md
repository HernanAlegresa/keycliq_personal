# Fix: Agregar dominio app.keycliq.com a Heroku

## Problema Identificado

El dominio `app.keycliq.com` NO está configurado en Heroku. Solo `staging.keycliq.com` está configurado.

Por eso:
- ❌ No hay certificado SSL para `app.keycliq.com`
- ❌ Las requests no están llegando correctamente a Heroku
- ❌ Los redirects HTTPS no pueden funcionar sin el dominio configurado

## Solución: Configurar app.keycliq.com

### Paso 1: Agregar el dominio en Heroku

```powershell
heroku domains:add app.keycliq.com --app keycliq
```

### Paso 2: Verificar que se agregó

```powershell
heroku domains --app keycliq
```

**Debe mostrar:**
```
=== keycliq Custom Domains

 Domain Name         DNS Record Type DNS Target                                                  SNI Endpoint      
 ─────────────────── ─────────────── ─────────────────────────────────────────────────────────── ───────────────── 
 staging.keycliq.com CNAME           theoretical-dinosaur-8yruvav9xndtuhzxp0arlspj.herokudns.com carnotaurus-36597 
 app.keycliq.com     CNAME           [un nuevo target de Heroku]                                 [nuevo endpoint]
```

### Paso 3: Actualizar DNS

Heroku te dará un DNS target (algo como `xxx.herokudns.com`). Debes:

1. Ir a tu proveedor de DNS (donde está configurado keycliq.com)
2. Crear o actualizar el registro CNAME para `app.keycliq.com`
3. Apuntar a: el DNS target que Heroku te proporcionó

### Paso 4: Esperar certificado SSL

Heroku automáticamente provisionará un certificado SSL para `app.keycliq.com`:
- Tiempo estimado: 5-10 minutos
- Verifica con: `heroku certs --app keycliq`
- Debería aparecer un nuevo certificado para `app.keycliq.com`

### Paso 5: Configurar NODE_ENV=production

```powershell
heroku config:set NODE_ENV=production --app keycliq
```

### Paso 6: Verificar configuración completa

```powershell
heroku config --app keycliq | Select-String "NODE_ENV"
heroku domains --app keycliq
heroku certs --app keycliq
```

## Después de Configurar

1. Espera 10-15 minutos para propagación DNS y certificado SSL
2. Haz el merge y deploy de los cambios
3. Prueba `https://app.keycliq.com/signin` (usa HTTPS)
4. Debe funcionar correctamente

