# Domain Sync Troubleshooting Guide

## Problem: Custom Domain Showing Older Version

If `https://app.keycliq.com` is showing an older version than the Heroku staging URL, follow these steps:

## Quick Fixes

### 1. Verify Domain Configuration in Heroku

**Check if the custom domain points to the correct app:**

```bash
# List all domains for your app
heroku domains --app your-app-name

# Verify the domain is correctly configured
heroku domains:info app.keycliq.com --app your-app-name
```

**Both domains should point to the same Heroku app:**
- Staging URL: `https://your-app-name.herokuapp.com`
- Custom domain: `https://app.keycliq.com`

### 2. Force a New Deployment

After adding cache-control headers, trigger a fresh deployment:

```bash
# Option 1: Empty commit to trigger redeploy
git commit --allow-empty -m "Force redeploy for domain sync"
git push heroku main

# Option 2: Restart all dynos to clear any runtime cache
heroku restart --app your-app-name

# Option 3: Rebuild from scratch
heroku builds:cache:purge --app your-app-name
git push heroku main
```

### 3. Clear Browser/CDN Cache

**For Testing:**
- Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
- Incognito/Private window
- Clear browser cache completely

**For Production:**
- If using Cloudflare or another CDN, purge the cache from the CDN dashboard
- DNS cache can take up to 48 hours to propagate, but usually clears within minutes

### 4. Verify Headers Are Working

After deployment, check that cache-control headers are being set:

```bash
# Check headers on staging URL
curl -I https://your-app-name.herokuapp.com

# Check headers on custom domain
curl -I https://app.keycliq.com

# Both should show:
# Cache-Control: no-cache, no-store, must-revalidate, max-age=0
# Pragma: no-cache
# Expires: 0
```

### 5. DNS Propagation Check

Verify DNS is pointing to the correct Heroku app:

```bash
# Check DNS records
nslookup app.keycliq.com

# Should point to Heroku's DNS (usually *.herokuapp.com or *.herokudns.com)
# or a CNAME pointing to your app
```

### 6. Heroku Domain Configuration

**Ensure SSL certificate is active:**

```bash
# Check SSL status
heroku certs --app your-app-name

# If certificate is missing or expired, add it:
heroku certs:add --app your-app-name
```

**Verify domain is properly configured:**

1. Go to Heroku Dashboard → Your App → Settings
2. Under "Domains", verify `app.keycliq.com` is listed
3. Check that "SSL Certificate" shows "Automatically managed by Heroku"
4. Ensure DNS CNAME or ALIAS record points to Heroku's target

## Common Issues

### Issue 1: Different Heroku Apps
**Symptom:** Staging and custom domain point to different Heroku apps.

**Solution:** Ensure both URLs point to the same Heroku app:
1. Check the Heroku app name in both URLs
2. Add the custom domain to the correct app: `heroku domains:add app.keycliq.com --app your-app-name`

### Issue 2: CDN/Proxy Caching
**Symptom:** Custom domain goes through Cloudflare/CloudFront/CDN that caches aggressively.

**Solution:**
1. Purge CDN cache from provider dashboard
2. Configure CDN to respect `Cache-Control` headers from origin
3. Set CDN cache rules to bypass HTML files

### Issue 3: Browser Cache
**Symptom:** Your browser has cached the old version.

**Solution:**
- Test in incognito mode
- Clear browser cache completely
- Hard refresh (Ctrl+Shift+R / Cmd+Shift+R)

### Issue 4: Stale Build Cache
**Symptom:** Heroku is using cached build artifacts.

**Solution:**
```bash
# Clear build cache
heroku builds:cache:purge --app your-app-name

# Force fresh build
git commit --allow-empty -m "Clear build cache"
git push heroku main
```

## Verification Checklist

After deployment, verify:

- [ ] Both URLs show the same version
- [ ] Cache-Control headers are present (`curl -I` command)
- [ ] Latest features (V6 logic, Privacy Policy) are visible on both domains
- [ ] Test from different devices/networks
- [ ] Test from incognito/private browsing mode
- [ ] Team members can see the updated version

## Prevention

The cache-control headers added to `app/root.jsx` will prevent future caching issues:
- HTML responses will not be cached by browsers
- CDNs will be instructed not to cache HTML
- Users will always get the latest version

**Note:** Static assets (CSS, JS, images) are still cached with proper versioning via Remix's build process, which is desired for performance.

## Still Not Working?

1. **Check Heroku logs:**
   ```bash
   heroku logs --tail --app your-app-name
   ```

2. **Verify environment variables match:**
   ```bash
   heroku config --app your-app-name
   ```

3. **Check if domain DNS has propagated:**
   ```bash
   dig app.keycliq.com
   ```

4. **Contact Heroku support** if DNS/SSL issues persist

