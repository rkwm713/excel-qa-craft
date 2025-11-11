-- Add status column to reviews table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'reviews' 
    AND column_name = 'status'
  ) THEN
    ALTER TABLE public.reviews 
    ADD COLUMN status text NOT NULL DEFAULT 'draft';
  END IF;
END $$;

