# Netlify Deployment Instructions

## Quick Deploy (Recommended)

Since you've already linked your project, the easiest way is to deploy via the Netlify Dashboard:

1. Go to https://app.netlify.com/projects/techservqatool
2. Click "Deploy settings"
3. Verify:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
4. Click "Trigger deploy" → "Deploy site"

## Environment Variables

**IMPORTANT**: Before deploying, set these environment variables in Netlify Dashboard:

1. Go to Site settings → Environment variables
2. Add these variables:

```
SUPABASE_URL=https://cwjedkoxvpndevuduhju.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3amVka294dnBuZGV2dWR1aGp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4MTI4NzAsImV4cCI6MjA3ODM4ODg3MH0.rMnJz3ysFave5QJAyS7fz3imMC0z8ZiWwHJDIJjEHHI
JWT_SECRET=<generate-a-secure-random-string>
```

To generate JWT_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Deploy via CLI (Alternative)

If you prefer CLI, run these commands:

```bash
# Make sure you're in the project root
cd C:\Users\TechServ\Desktop\excel-qa-craft

# Link to the project (if not already linked)
netlify link

# Install function dependencies
cd netlify\functions
npm install
cd ..\..

# Deploy
netlify deploy --prod
```

## After Deployment

1. Your site will be at: https://techservqatool.netlify.app
2. Test by:
   - Registering a new user
   - Creating a review
   - Checking Supabase dashboard to verify data is saved

## Troubleshooting

### Build fails
- Make sure you're in the root directory
- Verify `package.json` has a `build` script
- Check Netlify build logs

### Functions not working
- Verify environment variables are set
- Check Netlify Function logs
- Ensure `netlify/functions/package.json` has all dependencies

### Database errors
- Verify Supabase project is active
- Check environment variables match Supabase project
- Review Supabase logs in dashboard

