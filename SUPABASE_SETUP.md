# Supabase Integration - Complete Setup

## ✅ Database Setup Complete

Your Supabase database has been fully configured with all required tables and indexes.

### Project Information

- **Project**: SRPQA
- **Project ID**: `cwjedkoxvpndevuduhju`
- **URL**: `https://cwjedkoxvpndevuduhju.supabase.co`
- **Status**: ACTIVE_HEALTHY

### Database Tables Created

All tables have been created with proper relationships and indexes:

1. **users** - User accounts and authentication
2. **reviews** - Main review sessions
3. **review_rows** - Individual QA review rows
4. **cu_lookup** - CU code lookup data
5. **pdf_mappings** - Station to page number and spec mappings
6. **pdf_files** - PDF file binary data
7. **pdf_annotations** - PDF annotations (JSONB)
8. **work_point_notes** - Work point notes
9. **kmz_placemarks** - KMZ placemark data (JSONB)

## Netlify Functions Updated

The Netlify Functions have been updated to use Supabase:

- ✅ `netlify/functions/auth.js` - Uses Supabase for user management
- ✅ `netlify/functions/reviews.js` - Uses Supabase for all review operations
- ✅ `netlify/functions/package.json` - Includes `@supabase/supabase-js` dependency

## Next Steps

### 1. Set Environment Variables in Netlify

Go to your Netlify Dashboard → Site settings → Environment variables and add:

```
SUPABASE_URL=https://cwjedkoxvpndevuduhju.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3amVka294dnBuZGV2dWR1aGp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4MTI4NzAsImV4cCI6MjA3ODM4ODg3MH0.rMnJz3ysFave5QJAyS7fz3imMC0z8ZiWwHJDIJjEHHI
JWT_SECRET=<generate-a-secure-random-string>
```

See `SUPABASE_ENV.md` for details.

### 2. Deploy to Netlify

```bash
# Install dependencies for functions
cd netlify/functions
npm install

# Deploy
cd ../..
netlify deploy --prod
```

### 3. Test the Integration

1. Register a new user
2. Create a review
3. Verify data persists in Supabase dashboard

## Database Access

You can view and manage your database:

1. Go to https://supabase.com/dashboard
2. Select the **SRPQA** project
3. Navigate to **Table Editor** to view data
4. Navigate to **SQL Editor** to run queries

## Optional: Row Level Security (RLS)

For additional security, consider enabling RLS policies:

```sql
-- Example: Users can only see their own reviews
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reviews"
  ON reviews FOR SELECT
  USING (auth.uid()::text = created_by);
```

## Migration History

All migrations have been applied successfully:
- ✅ create_users_table
- ✅ create_reviews_table
- ✅ create_review_rows_table
- ✅ create_cu_lookup_table
- ✅ create_pdf_mappings_table
- ✅ create_pdf_files_table
- ✅ create_pdf_annotations_table
- ✅ create_work_point_notes_table
- ✅ create_kmz_placemarks_table

## Support

If you encounter any issues:

1. Check Netlify Function logs
2. Check Supabase logs in the dashboard
3. Verify environment variables are set correctly
4. Ensure Supabase project is active

## Storage Bucket (Configured by me)

- Bucket: `pdf-files` (public)
- Policies:
  - insert: allowed for roles `anon` and `authenticated` in bucket `pdf-files`
  - select: allowed for roles `anon` and `authenticated` in bucket `pdf-files`
- Purpose: Store uploaded PDFs client-side without routing large files through Netlify Functions

Use public URL pattern to access:

```
${SUPABASE_URL}/storage/v1/object/public/pdf-files/<path>
```

Client uploads with supabase-js are enabled using the anon key.
