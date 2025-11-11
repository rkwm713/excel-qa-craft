-- Enable Row Level Security (RLS) on all tables
-- This migration enables RLS and creates security policies for all tables

-- Enable RLS on all tables
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.review_rows ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.cu_lookup ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pdf_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pdf_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pdf_annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.work_point_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.kmz_placemarks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can read own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can create own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can update own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can delete own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can access own review rows" ON public.review_rows;
DROP POLICY IF EXISTS "Users can access own cu lookup" ON public.cu_lookup;
DROP POLICY IF EXISTS "Users can access own pdf mappings" ON public.pdf_mappings;
DROP POLICY IF EXISTS "Users can access own pdf files" ON public.pdf_files;
DROP POLICY IF EXISTS "Users can access own pdf annotations" ON public.pdf_annotations;
DROP POLICY IF EXISTS "Users can access own work point notes" ON public.work_point_notes;
DROP POLICY IF EXISTS "Users can access own kmz placemarks" ON public.kmz_placemarks;

-- Users table policies
-- Users can only read/update their own user record
CREATE POLICY "Users can read own profile" ON public.users
  FOR SELECT
  USING (auth.uid()::text = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE
  USING (auth.uid()::text = id)
  WITH CHECK (auth.uid()::text = id);

-- Reviews table policies
-- Users can only access reviews they created
CREATE POLICY "Users can read own reviews" ON public.reviews
  FOR SELECT
  USING (auth.uid()::text = created_by);

CREATE POLICY "Users can create own reviews" ON public.reviews
  FOR INSERT
  WITH CHECK (auth.uid()::text = created_by);

CREATE POLICY "Users can update own reviews" ON public.reviews
  FOR UPDATE
  USING (auth.uid()::text = created_by)
  WITH CHECK (auth.uid()::text = created_by);

CREATE POLICY "Users can delete own reviews" ON public.reviews
  FOR DELETE
  USING (auth.uid()::text = created_by);

-- Review rows table policies
-- Accessible only through parent review ownership
CREATE POLICY "Users can access own review rows" ON public.review_rows
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.reviews r
      WHERE r.id = review_rows.review_id
      AND r.created_by = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.reviews r
      WHERE r.id = review_rows.review_id
      AND r.created_by = auth.uid()::text
    )
  );

-- CU lookup table policies
-- Accessible only through parent review ownership
CREATE POLICY "Users can access own cu lookup" ON public.cu_lookup
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.reviews r
      WHERE r.id = cu_lookup.review_id
      AND r.created_by = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.reviews r
      WHERE r.id = cu_lookup.review_id
      AND r.created_by = auth.uid()::text
    )
  );

-- PDF mappings table policies
-- Accessible only through parent review ownership
CREATE POLICY "Users can access own pdf mappings" ON public.pdf_mappings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.reviews r
      WHERE r.id = pdf_mappings.review_id
      AND r.created_by = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.reviews r
      WHERE r.id = pdf_mappings.review_id
      AND r.created_by = auth.uid()::text
    )
  );

-- PDF files table policies
-- Accessible only through parent review ownership
CREATE POLICY "Users can access own pdf files" ON public.pdf_files
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.reviews r
      WHERE r.id = pdf_files.review_id
      AND r.created_by = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.reviews r
      WHERE r.id = pdf_files.review_id
      AND r.created_by = auth.uid()::text
    )
  );

-- PDF annotations table policies
-- Accessible only through parent review ownership
CREATE POLICY "Users can access own pdf annotations" ON public.pdf_annotations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.reviews r
      WHERE r.id = pdf_annotations.review_id
      AND r.created_by = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.reviews r
      WHERE r.id = pdf_annotations.review_id
      AND r.created_by = auth.uid()::text
    )
  );

-- Work point notes table policies
-- Accessible only through parent review ownership
CREATE POLICY "Users can access own work point notes" ON public.work_point_notes
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.reviews r
      WHERE r.id = work_point_notes.review_id
      AND r.created_by = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.reviews r
      WHERE r.id = work_point_notes.review_id
      AND r.created_by = auth.uid()::text
    )
  );

-- KMZ placemarks table policies
-- Accessible only through parent review ownership
CREATE POLICY "Users can access own kmz placemarks" ON public.kmz_placemarks
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.reviews r
      WHERE r.id = kmz_placemarks.review_id
      AND r.created_by = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.reviews r
      WHERE r.id = kmz_placemarks.review_id
      AND r.created_by = auth.uid()::text
    )
  );
