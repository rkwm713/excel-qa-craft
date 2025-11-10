import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../../database/qa_tool.db');

// Ensure database directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath);

const run = promisify(db.run.bind(db));
const all = promisify(db.all.bind(db));
const get = promisify(db.get.bind(db));

async function initDatabase() {
  try {
    console.log('Initializing database...');

    // Users table
    await run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        full_name TEXT,
        role TEXT DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Reviews table - stores the main review session
    await run(`
      CREATE TABLE IF NOT EXISTS reviews (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        file_name TEXT,
        kmz_file_name TEXT,
        pdf_file_name TEXT,
        created_by TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);

    // Review rows table - stores individual QA review rows
    await run(`
      CREATE TABLE IF NOT EXISTS review_rows (
        id TEXT PRIMARY KEY,
        review_id TEXT NOT NULL,
        issue_type TEXT NOT NULL CHECK(issue_type IN ('OK', 'NEEDS REVISIONS')),
        station TEXT NOT NULL,
        work_set TEXT,
        designer_cu TEXT,
        qa_cu TEXT,
        description TEXT,
        designer_wf TEXT,
        qa_wf TEXT,
        designer_qty REAL,
        qa_qty REAL,
        qa_comments TEXT,
        map_notes TEXT,
        cu_check INTEGER DEFAULT 0,
        wf_check INTEGER DEFAULT 0,
        qty_check INTEGER DEFAULT 0,
        row_order INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE
      )
    `);

    // CU Lookup table
    await run(`
      CREATE TABLE IF NOT EXISTS cu_lookup (
        id TEXT PRIMARY KEY,
        review_id TEXT NOT NULL,
        code TEXT NOT NULL,
        description TEXT,
        FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE
      )
    `);

    // PDF mappings table
    await run(`
      CREATE TABLE IF NOT EXISTS pdf_mappings (
        id TEXT PRIMARY KEY,
        review_id TEXT NOT NULL,
        station TEXT NOT NULL,
        page_number INTEGER NOT NULL,
        spec_number TEXT,
        edited_spec_number TEXT,
        FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
        UNIQUE(review_id, station)
      )
    `);

    // PDF files table - stores the actual PDF file data
    await run(`
      CREATE TABLE IF NOT EXISTS pdf_files (
        id TEXT PRIMARY KEY,
        review_id TEXT NOT NULL UNIQUE,
        file_data BLOB NOT NULL,
        file_name TEXT NOT NULL,
        file_size INTEGER,
        mime_type TEXT DEFAULT 'application/pdf',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE
      )
    `);

    // PDF annotations table
    await run(`
      CREATE TABLE IF NOT EXISTS pdf_annotations (
        id TEXT PRIMARY KEY,
        review_id TEXT NOT NULL,
        page_number INTEGER NOT NULL,
        annotation_data TEXT NOT NULL,
        FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
        UNIQUE(review_id, page_number)
      )
    `);

    // Work point notes table
    await run(`
      CREATE TABLE IF NOT EXISTS work_point_notes (
        id TEXT PRIMARY KEY,
        review_id TEXT NOT NULL,
        work_point TEXT NOT NULL,
        notes TEXT,
        FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
        UNIQUE(review_id, work_point)
      )
    `);

    // KMZ placemarks table
    await run(`
      CREATE TABLE IF NOT EXISTS kmz_placemarks (
        id TEXT PRIMARY KEY,
        review_id TEXT NOT NULL,
        placemark_data TEXT NOT NULL,
        FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE
      )
    `);

    // Create indexes
    await run(`CREATE INDEX IF NOT EXISTS idx_reviews_created_by ON reviews(created_by)`);
    await run(`CREATE INDEX IF NOT EXISTS idx_review_rows_review_id ON review_rows(review_id)`);
    await run(`CREATE INDEX IF NOT EXISTS idx_review_rows_station ON review_rows(station)`);
    await run(`CREATE INDEX IF NOT EXISTS idx_pdf_mappings_review_id ON pdf_mappings(review_id)`);

    console.log('Database initialized successfully!');

    // Create default admin user if it doesn't exist
    const adminExists = await get('SELECT id FROM users WHERE username = ?', ['admin']);
    if (!adminExists) {
      const passwordHash = await bcrypt.hash('admin123', 10);
      await run(
        `INSERT INTO users (id, username, email, password_hash, full_name, role) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        ['admin-001', 'admin', 'admin@techserv.com', passwordHash, 'Administrator', 'admin']
      );
      console.log('Default admin user created: username=admin, password=admin123');
    }

    db.close();
  } catch (error) {
    console.error('Error initializing database:', error);
    db.close();
    process.exit(1);
  }
}

initDatabase();

