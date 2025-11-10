# Supabase Environment Variables

## Netlify Environment Variables

Add these environment variables in your Netlify Dashboard:

**Site settings → Environment variables → Add variable**

### Required Variables

```
SUPABASE_URL=https://cwjedkoxvpndevuduhju.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3amVka294dnBuZGV2dWR1aGp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4MTI4NzAsImV4cCI6MjA3ODM4ODg3MH0.rMnJz3ysFave5QJAyS7fz3imMC0z8ZiWwHJDIJjEHHI
JWT_SECRET=your-very-secret-key-change-this-in-production
```

### Generate JWT_SECRET

Generate a secure random string for `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Or use an online generator: https://generate-secret.vercel.app/32

## Supabase Project Details

- **Project Name**: SRPQA
- **Project ID**: cwjedkoxvpndevuduhju
- **Region**: us-east-2
- **Status**: ACTIVE_HEALTHY
- **Database URL**: https://cwjedkoxvpndevuduhju.supabase.co

## Database Schema

All tables have been created:
- ✅ users
- ✅ reviews
- ✅ review_rows
- ✅ cu_lookup
- ✅ pdf_mappings
- ✅ pdf_files
- ✅ pdf_annotations
- ✅ work_point_notes
- ✅ kmz_placemarks

## Security Notes

1. **JWT_SECRET**: Keep this secret and never commit it to Git
2. **SUPABASE_ANON_KEY**: This is safe to expose in frontend code, but should be kept in environment variables for server-side functions
3. **Row Level Security (RLS)**: Consider enabling RLS policies in Supabase for additional security

## Testing

After setting environment variables, redeploy your Netlify site:

```bash
netlify deploy --prod
```

Or trigger a new deployment from the Netlify dashboard.

