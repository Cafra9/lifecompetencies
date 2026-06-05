ALTER TABLE public.student_assessments
  DROP CONSTRAINT IF EXISTS student_assessments_nivel_check;

UPDATE public.student_assessments
   SET nivel = 'not_applicable'
 WHERE nivel = 'nao_aplica';

ALTER TABLE public.student_assessments
  ADD CONSTRAINT student_assessments_nivel_check
  CHECK (nivel IN ('iniciando', 'desenvolvendo', 'dominando', 'not_applicable'));
