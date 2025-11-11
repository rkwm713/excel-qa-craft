-- Ensure pdf-files bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('pdf-files', 'pdf-files', false)
ON CONFLICT (id) DO NOTHING;

-- Drop legacy policies if present
DROP POLICY IF EXISTS "Allow authenticated access to pdf-files" ON storage.objects;
DROP POLICY IF EXISTS "storage read authenticated" ON storage.objects;
DROP POLICY IF EXISTS "storage write authenticated" ON storage.objects;
DROP POLICY IF EXISTS "storage update authenticated" ON storage.objects;
DROP POLICY IF EXISTS "storage delete authenticated" ON storage.objects;

-- Allow authenticated users to read objects within pdf-files bucket
CREATE POLICY "pdf-files read authenticated" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'pdf-files' AND auth.role() = 'authenticated');

-- Allow authenticated users to upload new objects within pdf-files bucket
CREATE POLICY "pdf-files insert authenticated" ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'pdf-files' AND auth.role() = 'authenticated');

-- Allow authenticated users to update objects within pdf-files bucket
CREATE POLICY "pdf-files update authenticated" ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'pdf-files' AND auth.role() = 'authenticated')
  WITH CHECK (bucket_id = 'pdf-files' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete objects they uploaded in pdf-files bucket
CREATE POLICY "pdf-files delete authenticated" ON storage.objects
  FOR DELETE
  USING (bucket_id = 'pdf-files' AND auth.role() = 'authenticated');

