-- Update RLS policies to allow collaborative access to reviews and review rows

-- Reviews policies
DROP POLICY IF EXISTS "Users can read own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can create own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can update own reviews" ON public.reviews;

CREATE POLICY "Reviews read all authenticated" ON public.reviews
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Reviews insert authenticated" ON public.reviews
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Reviews update authenticated" ON public.reviews
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Reviews delete by creator" ON public.reviews
  FOR DELETE
  USING (created_by = auth.uid()::text);

-- Review rows policies
DROP POLICY IF EXISTS "Users can access own review rows" ON public.review_rows;

CREATE POLICY "Review rows read authenticated" ON public.review_rows
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Review rows insert authenticated" ON public.review_rows
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Review rows update authenticated" ON public.review_rows
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Review rows delete authenticated" ON public.review_rows
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- Ensure created_by is auto-populated from auth.uid()
CREATE OR REPLACE FUNCTION public.set_created_by_to_auth_uid()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid()::text;
  END IF;
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_reviews_set_created_by'
  ) THEN
    CREATE TRIGGER trg_reviews_set_created_by
    BEFORE INSERT ON public.reviews
    FOR EACH ROW
    EXECUTE PROCEDURE public.set_created_by_to_auth_uid();
  END IF;
END;
$$;

