-- Fix function search_path security issue
-- The set_updated_at function needs to have a secure search_path set

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Also fix the set_created_by_to_auth_uid function to ensure it has secure search_path
-- (It already has it, but we'll ensure it's correct)
CREATE OR REPLACE FUNCTION public.set_created_by_to_auth_uid()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;
