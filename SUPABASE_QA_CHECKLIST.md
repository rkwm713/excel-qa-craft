## Supabase QA Checklist

- Verify env:
  - VITE_SUPABASE_URL
  - VITE_SUPABASE_ANON_KEY or VITE_SUPABASE_PUBLISHABLE_KEY
  - SUPABASE_SERVICE_ROLE_KEY (scripts only)
- Apply migration SQL in `supabase/migrations/20251111_init.sql`.
- Create storage bucket `pdf-files` (public=false).
- Generate TS types from project and replace `src/integrations/supabase/types.ts` if desired.
- Flows:
  - Sign up, verify email, sign in.
  - Create review, add rows, see them listed.
  - Upload a PDF, confirm object exists in storage and row in `files`.
  - List reviews paginated.
  - Update and delete review (work_points cascade).
- RLS:
  - Ensure users can only read/write their own reviews/work_points.
- Advisors:
  - Run Security and Performance advisors from Supabase dashboard and address items.


