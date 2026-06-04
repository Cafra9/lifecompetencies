
-- 1. Colunas adicionais em classes
ALTER TABLE public.classes
  ADD COLUMN IF NOT EXISTS letra text,
  ADD COLUMN IF NOT EXISTS professor_regente_id uuid,
  ADD COLUMN IF NOT EXISTS arquivada boolean NOT NULL DEFAULT false;

UPDATE public.classes SET professor_regente_id = professor_id WHERE professor_regente_id IS NULL;

-- 2. Tabela de co-professores
CREATE TABLE IF NOT EXISTS public.class_teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  papel text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (class_id, user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.class_teachers TO authenticated;
GRANT ALL ON public.class_teachers TO service_role;
ALTER TABLE public.class_teachers ENABLE ROW LEVEL SECURITY;

-- 3. Helper: é professor (regente ou associado) da turma?
CREATE OR REPLACE FUNCTION public.is_class_teacher(_class_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.classes c
    WHERE c.id = _class_id AND (c.professor_id = _user_id OR c.professor_regente_id = _user_id)
  ) OR EXISTS (
    SELECT 1 FROM public.class_teachers ct WHERE ct.class_id = _class_id AND ct.user_id = _user_id
  )
$$;

-- 4. Policies em class_teachers
DROP POLICY IF EXISTS "CT: read" ON public.class_teachers;
CREATE POLICY "CT: read" ON public.class_teachers FOR SELECT TO authenticated
  USING (
    public.is_class_teacher(class_id, auth.uid())
    OR public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'diretora'::app_role])
    OR EXISTS (SELECT 1 FROM public.classes c WHERE c.id = class_teachers.class_id AND public.is_coordinator_of_segment(auth.uid(), c.segmento))
  );

DROP POLICY IF EXISTS "CT: write" ON public.class_teachers;
CREATE POLICY "CT: write" ON public.class_teachers FOR ALL TO authenticated
  USING (
    public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'diretora'::app_role])
    OR EXISTS (SELECT 1 FROM public.classes c WHERE c.id = class_teachers.class_id AND (c.professor_id = auth.uid() OR c.professor_regente_id = auth.uid()))
  )
  WITH CHECK (
    public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'diretora'::app_role])
    OR EXISTS (SELECT 1 FROM public.classes c WHERE c.id = class_teachers.class_id AND (c.professor_id = auth.uid() OR c.professor_regente_id = auth.uid()))
  );

-- 5. classes SELECT: regente, owner, admin, co-professor
DROP POLICY IF EXISTS "Classes: own select" ON public.classes;
CREATE POLICY "Classes: own select" ON public.classes FOR SELECT TO authenticated
  USING (
    professor_id = auth.uid()
    OR professor_regente_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (SELECT 1 FROM public.class_teachers ct WHERE ct.class_id = classes.id AND ct.user_id = auth.uid())
  );

-- 6. students SELECT/UPDATE/DELETE: estender a co-professores
DROP POLICY IF EXISTS "Students: own select" ON public.students;
CREATE POLICY "Students: own select" ON public.students FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = students.class_id AND (
        c.professor_id = auth.uid()
        OR c.professor_regente_id = auth.uid()
        OR public.has_role(auth.uid(), 'admin'::app_role)
        OR EXISTS (SELECT 1 FROM public.class_teachers ct WHERE ct.class_id = c.id AND ct.user_id = auth.uid())
      )
    )
  );

-- 7. student_evidences SELECT: co-professores podem ler evidências da turma
DROP POLICY IF EXISTS "SE: read" ON public.student_evidences;
CREATE POLICY "SE: read" ON public.student_evidences FOR SELECT TO authenticated
  USING (
    created_by = auth.uid()
    OR public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'diretora'::app_role])
    OR EXISTS (
      SELECT 1 FROM public.students s JOIN public.classes c ON c.id = s.class_id
      WHERE s.id = student_evidences.student_id AND (
        c.professor_id = auth.uid()
        OR c.professor_regente_id = auth.uid()
        OR public.is_coordinator_of_segment(auth.uid(), c.segmento)
        OR EXISTS (SELECT 1 FROM public.class_teachers ct WHERE ct.class_id = c.id AND ct.user_id = auth.uid())
      )
    )
  );

-- 8. student_evidences INSERT: co-professores podem registrar evidências
DROP POLICY IF EXISTS "SE: insert own" ON public.student_evidences;
CREATE POLICY "SE: insert own" ON public.student_evidences FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.students s JOIN public.classes c ON c.id = s.class_id
      WHERE s.id = student_evidences.student_id AND (
        c.professor_id = auth.uid()
        OR c.professor_regente_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.class_teachers ct WHERE ct.class_id = c.id AND ct.user_id = auth.uid())
      )
    )
  );

-- 9. assessments SELECT/INSERT: estender a co-professores
DROP POLICY IF EXISTS "Assessments: own select" ON public.assessments;
CREATE POLICY "Assessments: own select" ON public.assessments FOR SELECT TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.students s JOIN public.classes c ON c.id = s.class_id
      WHERE s.id = assessments.student_id AND (
        c.professor_id = auth.uid()
        OR c.professor_regente_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.class_teachers ct WHERE ct.class_id = c.id AND ct.user_id = auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS "Assessments: own insert" ON public.assessments;
CREATE POLICY "Assessments: own insert" ON public.assessments FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.students s JOIN public.classes c ON c.id = s.class_id
      WHERE s.id = assessments.student_id AND (
        c.professor_id = auth.uid()
        OR c.professor_regente_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.class_teachers ct WHERE ct.class_id = c.id AND ct.user_id = auth.uid())
      )
    )
  );
