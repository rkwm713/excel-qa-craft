# Netlify Deployment

Your application is now configured to deploy on Netlify!

## Quick Start

### 1. Deploy to Netlify

**Option A: Via Netlify Dashboard**
1. Go to [app.netlify.com](https://app.netlify.com)
2. Click "Add new site" > "Import an existing project"
3. Connect your Git repository (GitHub, GitLab, or Bitbucket)
4. Build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
5. Click "Deploy site"

**Option B: Via Netlify CLI**
```bash
npm install -g netlify-cli
netlify login
netlify init
netlify deploy --prod
```

### 2. Set Environment Variables

In Netlify Dashboard → Site settings → Environment variables, add:

```
SUPABASE_URL=https://cwjedkoxvpndevuduhju.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3amVka294dnBuZGV2dWR1aGp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4MTI4NzAsImV4cCI6MjA3ODM4ODg3MH0.rMnJz3ysFave5QJAyS7fz3imMC0z8ZiWwHJDIJjEHHI
JWT_SECRET=your-very-secret-key-change-this-in-production
```

**Important**: Generate a strong random string for `JWT_SECRET`. You can use:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

See `SUPABASE_ENV.md` for detailed environment variable setup.

### 3. Test Your Deployment

After deployment, your site will be available at:
- `https://your-site-name.netlify.app`

The API endpoints will be at:
- `https://your-site-name.netlify.app/.netlify/functions/auth`
- `https://your-site-name.netlify.app/.netlify/functions/reviews`

## ✅ Supabase Integration Complete!

Your application is now fully integrated with **Supabase** (PostgreSQL database).

### Database Status

- ✅ All tables created and configured
- ✅ Foreign key relationships established
- ✅ Indexes created for performance
- ✅ Netlify Functions updated to use Supabase

See `SUPABASE_SETUP.md` for complete details.

## Local Development

To test Netlify Functions locally:

```bash
# Install Netlify CLI globally
npm install -g netlify-cli

# Run local development server
npm run netlify:dev
```

This will start:
- Frontend on `http://localhost:8888`
- Netlify Functions on `http://localhost:8888/.netlify/functions/`

## File Structure

```
excel-qa-craft/
├── netlify/
│   ├── functions/
│   │   ├── auth.js          # Authentication endpoints
│   │   ├── reviews.js       # Review CRUD endpoints
│   │   └── package.json     # Function dependencies
│   └── _redirects           # Netlify redirects
├── netlify.toml             # Netlify configuration
└── src/
    └── services/
        └── api.ts           # Frontend API client (auto-detects Netlify)
```

## Troubleshooting

### Functions not working?
- Check Netlify Function logs in the dashboard
- Verify environment variables are set
- Ensure `netlify.toml` is in the root directory

### CORS errors?
- CORS headers are configured in `netlify.toml`
- Functions include CORS headers in responses

### Data not persisting?
- This is expected with in-memory storage
- Integrate a database for persistence (see above)

## Next Steps

1. **Deploy to Netlify** (follow steps above)
2. **Set environment variables** (see `SUPABASE_ENV.md`)
3. **Test thoroughly** - Register a user and create a review
4. **Monitor** - Check Supabase dashboard for data

## Documentation

- `SUPABASE_SETUP.md` - Complete Supabase integration guide
- `SUPABASE_ENV.md` - Environment variables reference
- `NETLIFY_SETUP.md` - General Netlify setup details

