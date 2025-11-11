# SQLite → Supabase schema mapping (reference)

## users → auth.users + public.profiles
- users.id → auth.users.id (UUID) and profiles.id
- users.username → profiles.display_name (text)
- users.email → auth.users.email and profiles.email
- users.password_hash → Supabase Auth manages credentials (not stored)
- users.full_name → profiles.display_name (or add a dedicated `full_name` column)
- users.role → consider Supabase `auth.users` app_metadata or a `role` column in `profiles`
- timestamps → profiles.created_at / updated_at

## reviews → public.reviews
- reviews.id (TEXT) → reviews.id (uuid) [convert via generated uuids; store original in a temp column if needed]
- title → title
- description → consider adding `description` to reviews (not in initial model)
- file_name / kmz_file_name / pdf_file_name → move to `files` table with `kind` = 'source' | 'kmz' | 'pdf'
- created_by → created_by (uuid) [join users.id→profiles.id/auth.users.id during migration]
- timestamps → created_at / updated_at

## review_rows → public.work_points
- id → id (uuid)
- review_id → review_id (uuid)
- station (TEXT) → station_id (uuid) with a `stations` row per unique station; store original name in `stations.name`
- work_set / designer_cu / qa_cu / description / designer_wf / qa_wf → move to `notes` and/or extend `work_points` columns as needed
- designer_qty / qa_qty → consider numeric columns in `work_points` or a JSONB `metadata`
- qa_comments / map_notes → notes
- cu_check / wf_check / qty_check / row_order → add JSONB `metadata` on `work_points` or extend schema if needed for querying
- timestamps → created_at / updated_at

## cu_lookup → consider public.files or a dedicated lookup table
- If used for pricing/codes, create `cu_codes (id, review_id, code, description)`

## pdf_mappings → consider a `pdf_mappings` table
- Structure: (id uuid, review_id uuid, station_id uuid, page_number int, spec_number text, edited_spec_number text)
- Add RLS tied to parent review owner

## pdf_files → storage + public.files
- Store binary in Supabase Storage bucket `pdfs`; create `public.files` row with path, size, kind='pdf'

## pdf_annotations → consider a `pdf_annotations` table
- Structure: (id uuid, review_id uuid, page_number int, annotation_data jsonb unique(review_id, page_number))

## work_point_notes → may fold into `work_points.notes`
- If multiple notes per work point are needed, create `work_point_notes (id, review_id, work_point_id, notes)`

## kmz_placemarks → consider `kmz_placemarks` table
- Structure: (id uuid, review_id uuid, placemark_data jsonb)

Notes:
- Where TEXT IDs exist, generate UUIDs on import and retain original ids in a temp column if cross-link resolution is required.
- Enforce RLS by checking ownership via `reviews.created_by = auth.uid()`.


