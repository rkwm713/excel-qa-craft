# QA Tool Backend API

Backend server for the QA Tool application.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

3. Initialize the database:
```bash
npm run init-db
```

This will create the database schema and a default admin user:
- Username: `admin`
- Password: `admin123`

## Running

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will run on `http://localhost:3001` by default.

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

Uses SQLite for simplicity. The database file is stored in `database/qa_tool.db`.

For production, consider migrating to PostgreSQL or MySQL.

