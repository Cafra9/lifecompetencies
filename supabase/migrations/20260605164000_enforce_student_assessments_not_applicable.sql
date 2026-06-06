DO $$
DECLARE
  c record;
BEGIN
  FOR c IN
    SELECT conname
      FROM pg_constraint
     WHERE conrelid = 'public.student_assessments'::regclass
       AND contype = 'c'
       AND pg_get_constraintdef(oid) ILIKE '%nivel%'
  LOOP
    EXECUTE format('ALTER TABLE public.student_assessments DROP CONSTRAINT IF EXISTS %I', c.conname);
  END LOOP;
END $$;

UPDATE public.student_assessments
   SET nivel = 'not_applicable'
 WHERE nivel = 'nao_aplica';

ALTER TABLE public.student_assessments
  ADD CONSTRAINT student_assessments_nivel_check
  CHECK (nivel IN ('iniciando', 'desenvolvendo', 'dominando', 'not_applicable'));
