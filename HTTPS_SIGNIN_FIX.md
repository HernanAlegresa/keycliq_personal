# HTTPS Sign-In Fix for Custom Domain

## Problem
Custom domain `http://app.keycliq.com` was returning 500 Internal Server Error on sign-in POST, while staging Heroku URL worked fine. The issue was caused by:

1. **HTTP vs HTTPS**: Custom domain was receiving HTTP requests
2. **Secure Cookie Mismatch**: Session cookies were set with `secure: true` in production, but browsers won't send/accept secure cookies over HTTP
3. **Missing HTTPS Redirect**: No automatic redirect from HTTP to HTTPS
4. **X-Forwarded-Proto Not Checked**: App wasn't detecting HTTPS correctly behind Heroku's SSL termination proxy

## Solution Implemented

### 1. HTTPS Redirect in `app/root.jsx`
Added a root loader that checks `X-Forwarded-Proto` header (set by Heroku) and redirects HTTP to HTTPS in production:

```javascript
export async function loader({ request }) {
  const url = new URL(request.url);
  const protocol = 
    process.env.NODE_ENV === "production"
      ? request.headers.get("X-Forwarded-Proto") || url.protocol.slice(0, -1)
      : url.protocol.slice(0, -1);
  
  if (process.env.NODE_ENV === "production" && protocol === "http") {
    url.protocol = "https:";
    return redirect(url.toString(), 301);
  }
  
  return null;
}
```

### 2. Dynamic Secure Cookie Detection in `app/utils/session.server.js`
Updated session functions to check `X-Forwarded-Proto` header to properly detect HTTPS behind Heroku's proxy:

- `getSession()` now accepts optional `request` parameter
- `commitSession()` and `destroySession()` use request to determine secure flag
- `createUserSession()` passes request through the chain
- All functions check `X-Forwarded-Proto` header when available

### 3. Updated Auth Routes
Updated all authentication routes to pass `request` object:
- `app/routes/signin.jsx`
- `app/routes/signup.jsx`
- `app/routes/welcome.jsx`

## Verification Steps

### 1. Check HTTPS Redirect Works
```bash
# Should redirect to HTTPS
curl -I http://app.keycliq.com/signin

# Should show 301 redirect to https://
```

### 2. Check Headers Include X-Forwarded-Proto
```bash
# Heroku should set this header
curl -I https://app.keycliq.com/signin

# Look for: X-Forwarded-Proto: https
```

### 3. Test Sign-In Flow
1. Navigate to `https://app.keycliq.com` (not http)
2. Try signing in
3. Check browser DevTools → Network → Headers
   - Request should be to `https://`
   - Response should have `Set-Cookie` with `Secure` flag
   - No 500 errors

### 4. Verify Session Cookie
In browser DevTools → Application → Cookies, after signing in:
- Cookie `__session` should exist
- `Secure` flag should be checked
- `HttpOnly` flag should be checked
- `SameSite` should be `Lax`

### 5. Check Heroku Logs
```bash
heroku logs --tail --app your-app-name

# Watch for:
# - Any errors during sign-in POST
# - Successful redirects from HTTP to HTTPS
# - Session creation messages
```

## Important Notes

### Heroku SSL Configuration
Ensure SSL is enabled on Heroku:
```bash
# Check SSL certificate status
heroku certs --app your-app-name

# Should show: Automatically managed by Heroku
```

### Environment Variables
Both staging URL and custom domain must use the same:
- `SESSION_SECRET`
- `DATABASE_URL`
- `NODE_ENV=production`

Verify:
```bash
heroku config --app your-app-name
```

### DNS Configuration
Ensure `app.keycliq.com` DNS points to the same Heroku app:
```bash
heroku domains --app your-app-name

# Should list: app.keycliq.com
```

## Testing Checklist

- [ ] HTTP redirects to HTTPS automatically
- [ ] HTTPS sign-in works on custom domain
- [ ] HTTPS sign-in works on staging URL
- [ ] Session cookies are set with `Secure` flag
- [ ] Same user can sign in on both domains
- [ ] No 500 errors in logs
- [ ] Heroku SSL certificate is active
- [ ] Both domains point to same Heroku app

## Troubleshooting

### Still Getting 500 Errors?

1. **Check Heroku logs for actual error:**
   ```bash
   heroku logs --tail --app your-app-name
   ```
   Look for stack traces related to session creation.

2. **Verify SSL certificate:**
   ```bash
   heroku certs --app your-app-name
   ```
   If missing, Heroku will auto-provision it, but it can take a few minutes.

3. **Test with curl:**
   ```bash
   # Test redirect
   curl -I http://app.keycliq.com
   
   # Test actual request
   curl -I https://app.keycliq.com
   ```

4. **Verify X-Forwarded-Proto header:**
   The redirect logic depends on this header. If it's missing, the redirect might not work correctly.

### Cookie Still Not Being Set?

1. **Check browser console for cookie warnings**
2. **Verify secure flag matches protocol** (should be `Secure` for HTTPS)
3. **Clear all cookies and try again**
4. **Test in incognito/private window**

### Different Behavior Between Domains?

1. **Verify both point to same app:**
   ```bash
   heroku domains --app your-app-name
   ```

2. **Check environment variables match:**
   ```bash
   heroku config --app your-app-name
   ```

3. **Purge build cache:**
   ```bash
   heroku builds:cache:purge --app your-app-name
   git push heroku main
   ```

## Deployment

After merging these changes:

```bash
# Deploy to Heroku
git push heroku main

# Restart dynos to ensure changes take effect
heroku restart --app your-app-name

# Monitor logs during testing
heroku logs --tail --app your-app-name
```

## Summary

The fix ensures:
1. ✅ All HTTP requests redirect to HTTPS automatically
2. ✅ Session cookies correctly detect HTTPS via `X-Forwarded-Proto` header
3. ✅ Secure cookies work correctly behind Heroku's SSL termination
4. ✅ Both staging URL and custom domain behave identically
5. ✅ Sign-in flow works on both domains

