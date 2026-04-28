# Vercel Deployment Setup Guide

## Step 1: Set Environment Variables in Vercel Dashboard

**Go to:** https://vercel.com/dashboard → Select your project → Settings → Environment Variables

### Required Variables

Add these environment variables for **Production** environment:

#### 1. Database URL (CRITICAL - Must be set)
```
Name: DATABASE_URL
Value: postgresql+psycopg2://postgres:Free%40Test%4012@db.flkckohuxiyqgccfwohd.supabase.co:5432/postgres?sslmode=require
Environment: Production
```

**Important Notes:**
- Replace `postgres:Free%40Test%4012` with your actual Supabase credentials
- The `%40` is URL-encoded `@` - if your password has special characters, URL-encode them
- Always include `?sslmode=require` at the end
- Use `postgresql+psycopg2://` as the dialect (not just `postgresql://`)

#### 2. Security Key
```
Name: SECRET_KEY
Value: your-super-secure-random-key-here
Environment: Production
```

Use a strong random string (at least 32 characters):
```bash
# Generate on Linux/Mac:
openssl rand -hex 32

# Generate on PowerShell:
[System.Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((Get-Random -Count 32)))
```

#### 3. CORS Origins (if using custom domain)
```
Name: CORS_ORIGINS
Value: https://your-frontend-domain.com,https://api.your-domain.com
Environment: Production
```

#### 4. Groq API (Optional - for AI features)
```
Name: GROQ_API_KEY
Value: your-groq-api-key
Environment: Production
```

#### 5. Debug Mode
```
Name: DEBUG
Value: False
Environment: Production
```

## Step 2: Database URL Format

Your Supabase connection string should look like:

```
postgresql+psycopg2://postgres:[YOUR_PASSWORD]@[YOUR_HOST]:5432/postgres?sslmode=require
```

**To get this from Supabase:**
1. Go to Supabase dashboard
2. Click "Connect" on your database
3. Copy the connection string
4. Replace `postgresql://` with `postgresql+psycopg2://`
5. Add `?sslmode=require` at the end

Example connection string from Supabase:
```
postgresql://postgres:Free@Test@12@db.flkckohuxiyqgccfwohd.supabase.co:5432/postgres
```

**Convert to:**
```
postgresql+psycopg2://postgres:Free%40Test%4012@db.flkckohuxiyqgccfwohd.supabase.co:5432/postgres?sslmode=require
```

**URL Encoding for Special Characters:**
- `@` → `%40`
- `:` → `%3A`
- `!` → `%21`
- `#` → `%23`
- etc.

## Step 3: Deploy

After setting environment variables:

1. **Option A - Automatic (Recommended):**
   - Just push to GitHub: `git push origin main`
   - Vercel will automatically redeploy with new env vars

2. **Option B - Manual:**
   - Go to Vercel dashboard → Deployments
   - Click the three dots (...) on latest deployment
   - Select "Redeploy"

## Step 4: Verify Deployment

After deployment completes:

1. Check the deployment logs in Vercel for errors
2. Test the signup endpoint:
   ```bash
   curl -X POST https://your-app.vercel.app/api/v1/auth/signup \
     -H "Content-Type: application/json" \
     -d '{
       "restaurant_name": "Test Restaurant",
       "admin_username": "admin",
       "admin_full_name": "Admin User",
       "admin_email": "admin@example.com",
       "password": "securepassword123"
     }'
   ```

3. If you get a 503 or 500 error, check Vercel logs to see if DATABASE_URL is being read

## Troubleshooting

### Error: "Cannot assign requested address"
- Supabase database is unreachable
- Check that `sslmode=require` is in the DATABASE_URL
- Verify the Supabase connection credentials
- Make sure your Supabase project allows connections from Vercel IPs

### Error: "Database service temporarily unavailable"
- DATABASE_URL is not set in Vercel environment variables
- The URL format is incorrect
- Check Vercel function logs (Runtime → Logs)

### Error: "connection refused"
- DATABASE_URL is missing or using localhost
- Make sure DATABASE_URL is set in Vercel dashboard, not just locally

### Checking Logs
In Vercel Dashboard:
1. Go to Deployments → Select latest deployment
2. Click "Runtime" tab
3. Scroll through logs for DATABASE_URL initialization messages
4. Look for "✓ Database engine created successfully" (good) or "✗ Database engine init failed" (bad)

## Environment Variables Summary

```
# Production (.env.production or Vercel dashboard)
DATABASE_URL=postgresql+psycopg2://postgres:Free%40Test%4012@db.flkckohuxiyqgccfwohd.supabase.co:5432/postgres?sslmode=require
SECRET_KEY=your-secure-key
CORS_ORIGINS=https://your-domain.com
DEBUG=False

# Local Development (.env)
DATABASE_URL=sqlite:///./restaurant.db
SECRET_KEY=dev-key-not-secure
DEBUG=True
```

## Need Help?

1. **Vercel Logs:** Check the Runtime section in Vercel dashboard for error messages
2. **Supabase Status:** Verify database is online at supabase.com/dashboard
3. **Connection Test:** Use psql to test connection locally:
   ```bash
   psql postgresql+psycopg2://postgres:Free%40Test%4012@db.flkckohuxiyqgccfwohd.supabase.co:5432/postgres
   ```
