import fs from 'fs';
import path from 'path';
import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '..');
const sqlitePath = path.join(projectRoot, 'server', 'database', 'qa_tool.db');
const outDir = path.join(projectRoot, 'supabase', 'migration_data');

if (!fs.existsSync(sqlitePath)) {
  console.error(`SQLite file not found at ${sqlitePath}`);
  process.exit(1);
}
fs.mkdirSync(outDir, { recursive: true });

const db = new sqlite3.Database(sqlitePath);
const all = promisify(db.all.bind(db));

const TABLES = [
  'users',
  'reviews',
  'review_rows',
  'cu_lookup',
  'pdf_mappings',
  'pdf_files',
  'pdf_annotations',
  'work_point_notes',
  'kmz_placemarks',
];

async function exportTable(table) {
  const rows = await all(`SELECT * FROM ${table}`);
  const file = path.join(outDir, `${table}.json`);
  fs.writeFileSync(file, JSON.stringify(rows, null, 2), 'utf8');
  console.log(`Exported ${rows.length} rows from ${table} -> ${path.relative(projectRoot, file)}`);
}

async function main() {
  for (const table of TABLES) {
    try {
      await exportTable(table);
    } catch (err) {
      console.warn(`Skipped ${table}: ${err.message}`);
    }
  }
  db.close();
}

main().catch((e) => {
  console.error(e);
  db.close();
  process.exit(1);
});


