-- Add additional metadata fields to reviews
ALTER TABLE public.reviews
ADD COLUMN IF NOT EXISTS wo_number text,
ADD COLUMN IF NOT EXISTS designer text,
ADD COLUMN IF NOT EXISTS qa_tech text,
ADD COLUMN IF NOT EXISTS project text;

-- Normalize existing status values and enforce allowed set
UPDATE public.reviews
SET status = 'Needs QA Review'
WHERE status IS NULL
   OR status = ''
   OR status = 'draft';

ALTER TABLE public.reviews
ALTER COLUMN status SET DEFAULT 'Needs QA Review';

-- Ensure status values adhere to the allowed list
ALTER TABLE public.reviews
DROP CONSTRAINT IF EXISTS reviews_status_check;

ALTER TABLE public.reviews
ADD CONSTRAINT reviews_status_check
CHECK (status IN (
  'Needs QA Review',
  'In Review',
  'Needs Corrections',
  'Corrections Completed',
  'Approved'
));

