-- RPC to create a review and associated rows atomically
CREATE OR REPLACE FUNCTION public.create_review_with_rows(
  p_title text,
  p_description text DEFAULT NULL,
  p_status text DEFAULT 'Needs QA Review',
  p_file_name text DEFAULT NULL,
  p_kmz_file_name text DEFAULT NULL,
  p_pdf_file_name text DEFAULT NULL,
  p_wo_number text DEFAULT NULL,
  p_designer text DEFAULT NULL,
  p_qa_tech text DEFAULT NULL,
  p_project text DEFAULT NULL,
  p_rows jsonb DEFAULT '[]'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_review_id uuid;
BEGIN
  INSERT INTO public.reviews (
    title,
    description,
    status,
    file_name,
    kmz_file_name,
    pdf_file_name,
    wo_number,
    designer,
    qa_tech,
    project
  )
  VALUES (
    p_title,
    p_description,
    COALESCE(NULLIF(p_status, ''), 'Needs QA Review'),
    p_file_name,
    p_kmz_file_name,
    p_pdf_file_name,
    NULLIF(p_wo_number, ''),
    NULLIF(p_designer, ''),
    NULLIF(p_qa_tech, ''),
    NULLIF(p_project, '')
  )
  RETURNING id INTO v_review_id;

  IF p_rows IS NOT NULL AND jsonb_typeof(p_rows) = 'array' THEN
    INSERT INTO public.review_rows (
      id,
      review_id,
      station,
      issue_type,
      qa_comments,
      description,
      qa_cu,
      qa_qty,
      qa_wf,
      designer_cu,
      designer_qty,
      designer_wf,
      qty_check,
      wf_check,
      row_order,
      map_notes,
      work_set
    )
    SELECT
      COALESCE(NULLIF(row->>'id', '')::uuid, gen_random_uuid()),
      v_review_id,
      row->>'station',
      row->>'issue_type',
      row->>'qa_comments',
      row->>'description',
      row->>'qa_cu',
      NULLIF(row->>'qa_qty', '')::numeric,
      row->>'qa_wf',
      row->>'designer_cu',
      NULLIF(row->>'designer_qty', '')::numeric,
      row->>'designer_wf',
      NULLIF(row->>'qty_check', '')::numeric,
      NULLIF(row->>'wf_check', '')::numeric,
      NULLIF(row->>'row_order', '')::integer,
      row->>'map_notes',
      row->>'work_set'
    FROM jsonb_array_elements(p_rows) AS row;
  END IF;

  RETURN v_review_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_review_with_rows(
  p_title text,
  p_description text,
  p_status text,
  p_file_name text,
  p_kmz_file_name text,
  p_pdf_file_name text,
  p_wo_number text,
  p_designer text,
  p_qa_tech text,
  p_project text,
  p_rows jsonb
) TO authenticated;

GRANT EXECUTE ON FUNCTION public.update_review_rows(
  p_review_id uuid,
  p_rows jsonb
) TO authenticated;

-- RPC to replace review rows in a single transaction
CREATE OR REPLACE FUNCTION public.update_review_rows(
  p_review_id uuid,
  p_rows jsonb
)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.review_rows
  WHERE review_id = p_review_id;

  IF p_rows IS NOT NULL AND jsonb_typeof(p_rows) = 'array' THEN
    INSERT INTO public.review_rows (
      id,
      review_id,
      station,
      issue_type,
      qa_comments,
      description,
      qa_cu,
      qa_qty,
      qa_wf,
      designer_cu,
      designer_qty,
      designer_wf,
      qty_check,
      wf_check,
      row_order,
      map_notes,
      work_set
    )
    SELECT
      COALESCE(NULLIF(row->>'id', '')::uuid, gen_random_uuid()),
      p_review_id,
      row->>'station',
      row->>'issue_type',
      row->>'qa_comments',
      row->>'description',
      row->>'qa_cu',
      NULLIF(row->>'qa_qty', '')::numeric,
      row->>'qa_wf',
      row->>'designer_cu',
      NULLIF(row->>'designer_qty', '')::numeric,
      row->>'designer_wf',
      NULLIF(row->>'qty_check', '')::numeric,
      NULLIF(row->>'wf_check', '')::numeric,
      NULLIF(row->>'row_order', '')::integer,
      row->>'map_notes',
      row->>'work_set'
    FROM jsonb_array_elements(p_rows) AS row;
  END IF;
END;
$$;

