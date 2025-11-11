-- Fix reviews table: ensure id has default and status column exists
DO $$
BEGIN
  -- Check if id column has a default value
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'reviews' 
    AND column_name = 'id'
    AND column_default IS NOT NULL
  ) THEN
    -- Add default value to id column
    ALTER TABLE public.reviews 
    ALTER COLUMN id SET DEFAULT gen_random_uuid();
    
    RAISE NOTICE 'Added default value to id column';
  END IF;

  -- Check if status column exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'reviews' 
    AND column_name = 'status'
  ) THEN
    ALTER TABLE public.reviews 
    ADD COLUMN status text NOT NULL DEFAULT 'draft';
    
    RAISE NOTICE 'Added status column';
  END IF;
END $$;

