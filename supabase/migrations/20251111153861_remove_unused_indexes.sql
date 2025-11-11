-- Remove unused database indexes after verification
-- Note: These indexes should only be dropped if they are confirmed to be unused
-- Run EXPLAIN ANALYZE on common queries to verify before dropping

-- Drop unused indexes on spec_bill_of_materials (if table exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'spec_bill_of_materials' 
    AND indexname = 'idx_bom_spec_id'
  ) THEN
    DROP INDEX IF EXISTS public.idx_bom_spec_id;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'spec_bill_of_materials' 
    AND indexname = 'idx_bom_cu_code'
  ) THEN
    DROP INDEX IF EXISTS public.idx_bom_cu_code;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'spec_bill_of_materials' 
    AND indexname = 'idx_bom_tsn_ref'
  ) THEN
    DROP INDEX IF EXISTS public.idx_bom_tsn_ref;
  END IF;
END $$;

-- Drop idx_reviews_created_by only if it's truly unused
-- This index is likely used for RLS policies, so be cautious
-- Commented out by default - uncomment only after verification
-- DO $$
-- BEGIN
--   IF EXISTS (
--     SELECT 1 FROM pg_indexes 
--     WHERE schemaname = 'public' 
--     AND tablename = 'reviews' 
--     AND indexname = 'idx_reviews_created_by'
--   ) THEN
--     -- Verify this index is not used in RLS policies or common queries
--     -- DROP INDEX IF EXISTS public.idx_reviews_created_by;
--   END IF;
-- END $$;

-- Drop idx_review_rows_station only if it's truly unused
-- Commented out by default - uncomment only after verification
-- DO $$
-- BEGIN
--   IF EXISTS (
--     SELECT 1 FROM pg_indexes 
--     WHERE schemaname = 'public' 
--     AND tablename = 'review_rows' 
--     AND indexname = 'idx_review_rows_station'
--   ) THEN
--     -- Verify this index is not used in common queries
--     -- DROP INDEX IF EXISTS public.idx_review_rows_station;
--   END IF;
-- END $$;
