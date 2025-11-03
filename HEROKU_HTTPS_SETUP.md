# Heroku HTTPS Configuration for Custom Domain

## Problem Summary

Sign-in POST requests to `http://app.keycliq.com` were returning 500 errors. The root cause is that:
1. Requests are coming over HTTP instead of HTTPS
2. Session cookies are set with `secure: true` in production
3. Browsers won't send/accept secure cookies over HTTP
4. This causes session creation to fail

## Solution: Force HTTPS at Multiple Levels

### 1. Application-Level Redirects (Implemented)
- ✅ Root loader redirects HTTP → HTTPS for GET requests
- ✅ Sign-in action redirects HTTP → HTTPS for POST requests  
- ✅ Sign-up action redirects HTTP → HTTPS for POST requests

### 2. Heroku-Level HTTPS (RECOMMENDED - Do This Now)

**Heroku automatically provisions SSL certificates**, but you should verify and potentially force HTTPS:

```bash
# Check SSL certificate status
heroku certs --app your-app-name

# If certificate shows "Automatically managed by Heroku", it's active
# If it shows as pending or missing, wait a few minutes for auto-provisioning
```

### 3. DNS Configuration

Ensure your DNS CNAME record points correctly:
```bash
# Verify domain is configured
heroku domains --app your-app-name

# Should show: app.keycliq.com
```

### 4. Browser-Level Prevention (Client-Side)

**Important**: Update any hardcoded HTTP links in your frontend to use HTTPS:

```javascript
// ❌ BAD - Don't hardcode HTTP
<Form action="http://app.keycliq.com/signin">

// ✅ GOOD - Use relative URLs or HTTPS
<Form action="/signin">
// or
<Form action="https://app.keycliq.com/signin">
```

## Verification Checklist

After deployment:

1. **Test HTTPS Redirect:**
   ```bash
   curl -I http://app.keycliq.com/signin
   # Should return: 301 or 307 redirect to https://
   ```

2. **Test Direct HTTPS:**
   ```bash
   curl -I https://app.keycliq.com/signin
   # Should return: 200 OK
   ```

3. **Check Headers:**
   ```bash
   curl -v https://app.keycliq.com/signin 2>&1 | grep -i "x-forwarded-proto"
   # Should show: X-Forwarded-Proto: https
   ```

4. **Test Sign-In:**
   - Open `https://app.keycliq.com/signin` (note: HTTPS, not HTTP)
   - Try signing in
   - Check browser DevTools → Network → Headers
   - Request URL should be `https://`
   - Response should have `Set-Cookie` with `Secure` flag

## If Still Failing

### Check Heroku Logs:
```bash
heroku logs --tail --app your-app-name
```

Look for:
- Stack traces during sign-in POST
- Any errors related to session creation
- Any errors related to database connections

### Common Issues:

1. **Certificate Not Provisioned Yet**
   - Wait 5-10 minutes after adding domain
   - Heroku auto-provisions certificates
   - Check with: `heroku certs --app your-app-name`

2. **DNS Not Propagated**
   ```bash
   dig app.keycliq.com
   # Should show CNAME pointing to Heroku
   ```

3. **Mixed Content Warnings**
   - Check browser console for mixed content errors
   - Ensure all resources (images, fonts, etc.) use HTTPS or relative URLs

4. **Cache Issues**
   - Clear browser cache
   - Test in incognito/private window
   - Hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)

## Next Steps

1. ✅ Code changes deployed (redirects in place)
2. ⏳ Verify Heroku SSL certificate is active
3. ⏳ Test sign-in on `https://app.keycliq.com` (not HTTP)
4. ⏳ If still failing, check Heroku logs and share stack trace

**Remember**: Always use `https://app.keycliq.com`, not `http://`. The redirect should handle this automatically, but it's best to link directly to HTTPS.

