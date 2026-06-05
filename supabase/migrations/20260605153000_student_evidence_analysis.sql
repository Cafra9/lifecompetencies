ALTER TABLE public.student_evidences
  ADD COLUMN IF NOT EXISTS class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS school_year_id uuid REFERENCES public.school_years(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS arquivo_nome text,
  ADD COLUMN IF NOT EXISTS arquivo_mime text,
  ADD COLUMN IF NOT EXISTS arquivo_tamanho bigint,
  ADD COLUMN IF NOT EXISTS analysis_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS analysis_summary text,
  ADD COLUMN IF NOT EXISTS analysis_payload jsonb,
  ADD COLUMN IF NOT EXISTS analysis_error text,
  ADD COLUMN IF NOT EXISTS analyzed_at timestamptz;

DO $$ BEGIN
  ALTER TABLE public.student_evidences
    ADD CONSTRAINT student_evidences_analysis_status_check
    CHECK (analysis_status IN ('pending', 'analyzing', 'analyzed', 'error', 'skipped'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

UPDATE public.student_evidences
   SET arquivo_nome = regexp_replace(arquivo_url, '^.*/', '')
 WHERE arquivo_nome IS NULL
   AND arquivo_url IS NOT NULL;

UPDATE public.student_evidences se
   SET class_id = s.class_id,
       school_year_id = c.school_year_id
  FROM public.students s
  JOIN public.classes c ON c.id = s.class_id
 WHERE s.id = se.student_id
   AND (se.class_id IS NULL OR se.school_year_id IS NULL);

CREATE INDEX IF NOT EXISTS se_analysis_status_idx
  ON public.student_evidences (analysis_status);

CREATE INDEX IF NOT EXISTS se_student_analysis_status_idx
  ON public.student_evidences (student_id, analysis_status);

CREATE INDEX IF NOT EXISTS se_class_idx
  ON public.student_evidences (class_id);

CREATE INDEX IF NOT EXISTS se_school_year_idx
  ON public.student_evidences (school_year_id);
