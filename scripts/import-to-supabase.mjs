import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const dataDir = path.join(projectRoot, 'supabase', 'migration_data');

function readJson(name) {
  const file = path.join(dataDir, `${name}.json`);
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function toUuidFromTextId(textId) {
  // Deterministic UUID v5-like using sha1 namespace
  const hash = crypto.createHash('sha1').update(String(textId)).digest('hex');
  return [
    hash.substring(0, 8),
    hash.substring(8, 12),
    hash.substring(12, 16),
    hash.substring(16, 20),
    hash.substring(20, 32),
  ].join('-');
}

async function upsertProfiles(users) {
  const profiles = users.map((u) => ({
    id: toUuidFromTextId(u.id),
    email: u.email ?? null,
    display_name: u.full_name ?? u.username ?? null,
  }));
  if (profiles.length === 0) return;
  const { error } = await supabase.from('profiles').upsert(profiles, { onConflict: 'id' });
  if (error) throw error;
  console.log(`Upserted profiles: ${profiles.length}`);
}

async function insertReviews(reviews) {
  const mapped = reviews.map((r) => ({
    id: toUuidFromTextId(r.id),
    title: r.title,
    status: 'migrated',
    created_by: toUuidFromTextId(r.created_by),
    created_at: r.created_at ? new Date(r.created_at).toISOString() : undefined,
    updated_at: r.updated_at ? new Date(r.updated_at).toISOString() : undefined,
  }));
  if (mapped.length === 0) return;
  const { error } = await supabase.from('reviews').upsert(mapped, { onConflict: 'id' });
  if (error) throw error;
  console.log(`Upserted reviews: ${mapped.length}`);
}

async function insertStationsFromReviewRows(rows) {
  const names = Array.from(new Set(rows.map((r) => r.station).filter(Boolean)));
  if (names.length === 0) return {};
  const stationRecords = names.map((name) => ({
    id: toUuidFromTextId(`station:${name}`),
    name,
  }));
  const { error } = await supabase.from('stations').upsert(stationRecords, { onConflict: 'id' });
  if (error) throw error;
  console.log(`Upserted stations: ${stationRecords.length}`);
  return Object.fromEntries(stationRecords.map((s) => [s.name, s.id]));
}

async function insertWorkPoints(rows, stationNameToId) {
  const mapped = rows.map((row) => ({
    id: toUuidFromTextId(row.id),
    review_id: toUuidFromTextId(row.review_id),
    station_id: row.station ? stationNameToId[row.station] ?? null : null,
    lat: null,
    lng: null,
    notes: row.qa_comments ?? row.description ?? null,
    status: row.issue_type === 'OK' ? 'closed' : 'open',
    created_at: row.created_at ? new Date(row.created_at).toISOString() : undefined,
    updated_at: row.updated_at ? new Date(row.updated_at).toISOString() : undefined,
  }));
  if (mapped.length === 0) return;
  // Batch in chunks to avoid payload limits
  const chunkSize = 1000;
  for (let i = 0; i < mapped.length; i += chunkSize) {
    const chunk = mapped.slice(i, i + chunkSize);
    const { error } = await supabase.from('work_points').upsert(chunk, { onConflict: 'id' });
    if (error) throw error;
  }
  console.log(`Upserted work_points: ${mapped.length}`);
}

async function main() {
  const users = readJson('users');
  const reviews = readJson('reviews');
  const reviewRows = readJson('review_rows');

  await upsertProfiles(users);
  await insertReviews(reviews);
  const stationNameToId = await insertStationsFromReviewRows(reviewRows);
  await insertWorkPoints(reviewRows, stationNameToId);

  console.log('Import completed.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


