# Netlify Deployment Guide

This guide will help you deploy the QA Tool to Netlify.

## Important Note

The current implementation uses in-memory storage for simplicity. **For production use, you should replace this with a proper database** such as:
- **Supabase** (PostgreSQL) - Recommended
- **FaunaDB** (Serverless database)
- **MongoDB Atlas** (NoSQL)
- **PlanetScale** (MySQL)

## Setup Steps

### 1. Install Netlify CLI (Optional, for local testing)

```bash
npm install -g netlify-cli
```

### 2. Environment Variables

In your Netlify dashboard, go to Site settings > Environment variables and add:

```
JWT_SECRET=your-very-secret-key-change-this-in-production
NODE_ENV=production
```

### 3. Deploy to Netlify

#### Option A: Using Netlify Dashboard

1. Go to [Netlify](https://app.netlify.com)
2. Click "Add new site" > "Import an existing project"
3. Connect your Git repository
4. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Add environment variables (see step 2)
6. Deploy!

#### Option B: Using Netlify CLI

```bash
# Login to Netlify
netlify login

# Initialize site
netlify init

# Deploy
netlify deploy --prod
```

### 4. Update API URL

After deployment, update your frontend `.env` file or Netlify environment variables:

```
VITE_API_URL=https://your-site.netlify.app/.netlify/functions
```

Or if using Netlify environment variables, the functions will be available at:
```
/.netlify/functions/auth
/.netlify/functions/reviews
```

## Current Limitations

1. **In-Memory Storage**: Data is lost on function restart. Replace with a database.
2. **File Storage**: PDF files are stored in memory. Consider using:
   - Netlify Blobs (for file storage)
   - AWS S3
   - Cloudinary
   - Supabase Storage

## Recommended Production Setup

### Using Supabase (Recommended)

1. Create a Supabase project at https://supabase.com
2. Run the SQL schema from `server/src/database/init.js` in Supabase SQL editor
3. Update Netlify Functions to use Supabase client
4. Add Supabase URL and key to Netlify environment variables

### Using Netlify Blobs for File Storage

1. Install `@netlify/blobs` package
2. Update functions to use Blobs API for PDF storage
3. Configure Blobs in `netlify.toml`

## Testing Locally

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Run local development server
npm run netlify:dev
```

This will start both the frontend and Netlify Functions locally.

## Migration from Express Server

The Netlify Functions are simplified versions. For full functionality:

1. Replace in-memory storage with a database
2. Add proper file upload handling for PDFs
3. Implement proper multipart form data parsing
4. Add error handling and logging
5. Consider using Netlify Edge Functions for better performance

