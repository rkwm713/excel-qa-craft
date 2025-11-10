# Backend Setup Guide

This guide will help you set up the backend server for the QA Tool application.

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn

## Setup Steps

### 1. Install Backend Dependencies

Navigate to the server directory and install dependencies:

```bash
cd server
npm install
```

### 2. Configure Environment

Create a `.env` file in the `server` directory:

```bash
cp .env.example .env
```

Edit `.env` and set your configuration:
- `PORT`: Server port (default: 3001)
- `JWT_SECRET`: Secret key for JWT tokens (change this in production!)
- `NODE_ENV`: Environment (development/production)
- `DATABASE_PATH`: Path to SQLite database file

### 3. Initialize Database

Run the database initialization script:

```bash
npm run init-db
```

This will:
- Create the database schema
- Create a default admin user:
  - Username: `admin`
  - Password: `admin123`

**Important**: Change the default admin password in production!

### 4. Start the Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will run on `http://localhost:3001` by default.

## Frontend Configuration

In the frontend `.env` file (or `.env.local`), set:

```
VITE_API_URL=http://localhost:3001/api
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Reviews
- `GET /api/reviews` - List all reviews
- `GET /api/reviews/:id` - Get single review with all data
- `POST /api/reviews` - Create new review (requires auth)
- `PUT /api/reviews/:id` - Update review (requires auth)
- `DELETE /api/reviews/:id` - Delete review (requires auth)

## Database

The application uses SQLite for simplicity. The database file is stored in `server/database/qa_tool.db`.

### Database Schema

- **users**: User accounts
- **reviews**: Review sessions
- **review_rows**: Individual QA review rows
- **cu_lookup**: CU code lookup data
- **pdf_mappings**: PDF page and spec number mappings
- **pdf_annotations**: PDF annotations
- **work_point_notes**: Work point notes
- **kmz_placemarks**: KMZ placemark data

## Production Considerations

1. **Database**: Consider migrating to PostgreSQL or MySQL for production
2. **Security**: 
   - Change JWT_SECRET to a strong random string
   - Use HTTPS in production
   - Implement rate limiting
   - Add input validation and sanitization
3. **File Storage**: Currently PDF/KMZ files are not stored. Consider adding file storage (S3, local storage, etc.)
4. **Backups**: Set up regular database backups

## Troubleshooting

### Database errors
- Make sure the database directory exists and is writable
- Run `npm run init-db` again to recreate the schema

### Port already in use
- Change the PORT in `.env` file
- Or stop the process using port 3001

### CORS errors
- Make sure the frontend URL is allowed in CORS settings
- Check that VITE_API_URL matches the backend URL

