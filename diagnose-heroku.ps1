# Heroku Diagnostic Script for keycliq app
# Run this script to gather diagnostic information

Write-Host "=== Heroku Diagnostics for keycliq ===" -ForegroundColor Cyan
Write-Host ""

# Check SSL certificates
Write-Host "1. Checking SSL certificates..." -ForegroundColor Yellow
heroku certs --app keycliq
Write-Host ""

# Check domains
Write-Host "2. Checking domains..." -ForegroundColor Yellow
heroku domains --app keycliq
Write-Host ""

# Check critical environment variables
Write-Host "3. Checking critical environment variables..." -ForegroundColor Yellow
heroku config --app keycliq | Select-String -Pattern "NODE_ENV|SESSION_SECRET|DATABASE_URL"
Write-Host ""

# Test HTTP redirect
Write-Host "4. Testing HTTP -> HTTPS redirect..." -ForegroundColor Yellow
$httpResponse = Invoke-WebRequest -Uri "http://app.keycliq.com/signin" -Method Head -MaximumRedirection 0 -ErrorAction SilentlyContinue
Write-Host "HTTP Status: $($httpResponse.StatusCode)"
Write-Host "Location: $($httpResponse.Headers.Location)"
Write-Host ""

# Test HTTPS directly
Write-Host "5. Testing HTTPS directly..." -ForegroundColor Yellow
try {
    $httpsResponse = Invoke-WebRequest -Uri "https://app.keycliq.com/signin" -Method Head
    Write-Host "HTTPS Status: $($httpsResponse.StatusCode)"
} catch {
    Write-Host "HTTPS Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Get recent logs
Write-Host "6. Getting last 50 log lines..." -ForegroundColor Yellow
Write-Host "(Note: You may need to authenticate with Heroku first)" -ForegroundColor Gray
heroku logs --tail --app keycliq --num 50
Write-Host ""

Write-Host "=== Diagnostics Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Review SSL certificate status above"
Write-Host "2. Verify app.keycliq.com is listed in domains"
Write-Host "3. Ensure NODE_ENV=production"
Write-Host "4. Check logs for any errors"
Write-Host "5. Test sign-in at https://app.keycliq.com/signin"

