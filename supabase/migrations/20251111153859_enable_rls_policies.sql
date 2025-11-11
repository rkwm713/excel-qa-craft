-- Enable Row Level Security on all tables
-- Note: Some tables may already have RLS enabled, but we ensure all are covered

-- Enable RLS on users table (if it exists, separate from profiles)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Enable RLS on review_rows
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'review_rows') THEN
    ALTER TABLE public.review_rows ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Enable RLS on cu_lookup
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cu_lookup') THEN
    ALTER TABLE public.cu_lookup ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Enable RLS on pdf_mappings
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'pdf_mappings') THEN
    ALTER TABLE public.pdf_mappings ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Enable RLS on pdf_files
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'pdf_files') THEN
    ALTER TABLE public.pdf_files ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Enable RLS on pdf_annotations
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'pdf_annotations') THEN
    ALTER TABLE public.pdf_annotations ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Enable RLS on work_point_notes
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'work_point_notes') THEN
    ALTER TABLE public.work_point_notes ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Enable RLS on kmz_placemarks
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'kmz_placemarks') THEN
    ALTER TABLE public.kmz_placemarks ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Enable RLS on specifications (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'specifications') THEN
    ALTER TABLE public.specifications ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Enable RLS on spec_bill_of_materials (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'spec_bill_of_materials') THEN
    ALTER TABLE public.spec_bill_of_materials ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users self read" ON public.users;
DROP POLICY IF EXISTS "Users self update" ON public.users;
DROP POLICY IF EXISTS "Review rows by review owner" ON public.review_rows;
DROP POLICY IF EXISTS "CU lookup by review owner" ON public.cu_lookup;
DROP POLICY IF EXISTS "PDF mappings by review owner" ON public.pdf_mappings;
DROP POLICY IF EXISTS "PDF files by review owner" ON public.pdf_files;
DROP POLICY IF EXISTS "PDF annotations by review owner" ON public.pdf_annotations;
DROP POLICY IF EXISTS "Work point notes by review owner" ON public.work_point_notes;
DROP POLICY IF EXISTS "KMZ placemarks by review owner" ON public.kmz_placemarks;
DROP POLICY IF EXISTS "Specifications by review owner" ON public.specifications;
DROP POLICY IF EXISTS "Spec BOM by review owner" ON public.spec_bill_of_materials;

-- Users table policies (users can only read/update their own record)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    CREATE POLICY "Users self read" ON public.users
      FOR SELECT USING (auth.uid()::text = id);
    
    CREATE POLICY "Users self update" ON public.users
      FOR UPDATE USING (auth.uid()::text = id);
  END IF;
END $$;

-- Review rows policies (accessible only through parent review ownership)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'review_rows') THEN
    CREATE POLICY "Review rows by review owner" ON public.review_rows
      FOR ALL USING (
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
  END IF;
END $$;

-- CU lookup policies
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cu_lookup') THEN
    CREATE POLICY "CU lookup by review owner" ON public.cu_lookup
      FOR ALL USING (
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
  END IF;
END $$;

-- PDF mappings policies
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'pdf_mappings') THEN
    CREATE POLICY "PDF mappings by review owner" ON public.pdf_mappings
      FOR ALL USING (
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
  END IF;
END $$;

-- PDF files policies
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'pdf_files') THEN
    CREATE POLICY "PDF files by review owner" ON public.pdf_files
      FOR ALL USING (
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
  END IF;
END $$;

-- PDF annotations policies
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'pdf_annotations') THEN
    CREATE POLICY "PDF annotations by review owner" ON public.pdf_annotations
      FOR ALL USING (
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
  END IF;
END $$;

-- Work point notes policies
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'work_point_notes') THEN
    CREATE POLICY "Work point notes by review owner" ON public.work_point_notes
      FOR ALL USING (
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
  END IF;
END $$;

-- KMZ placemarks policies
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'kmz_placemarks') THEN
    CREATE POLICY "KMZ placemarks by review owner" ON public.kmz_placemarks
      FOR ALL USING (
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
  END IF;
END $$;

-- Specifications policies (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'specifications') THEN
    CREATE POLICY "Specifications by review owner" ON public.specifications
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.reviews r 
          WHERE r.id = specifications.review_id 
          AND r.created_by = auth.uid()::text
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.reviews r 
          WHERE r.id = specifications.review_id 
          AND r.created_by = auth.uid()::text
        )
      );
  END IF;
END $$;

-- Spec bill of materials policies (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'spec_bill_of_materials') THEN
    CREATE POLICY "Spec BOM by review owner" ON public.spec_bill_of_materials
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.reviews r 
          WHERE r.id = spec_bill_of_materials.review_id 
          AND r.created_by = auth.uid()::text
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.reviews r 
          WHERE r.id = spec_bill_of_materials.review_id 
          AND r.created_by = auth.uid()::text
        )
      );
  END IF;
END $$;
