
CREATE TABLE public.student_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  aluno_id text NOT NULL,
  competencia text NOT NULL,
  habilidade text NOT NULL,
  nivel text NOT NULL CHECK (nivel IN ('iniciando','desenvolvendo','dominando')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, aluno_id, competencia, habilidade)
);

CREATE INDEX idx_student_assessments_user_aluno
  ON public.student_assessments (user_id, aluno_id);

ALTER TABLE public.student_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "SA: own select" ON public.student_assessments
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "SA: own insert" ON public.student_assessments
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "SA: own update" ON public.student_assessments
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "SA: own delete" ON public.student_assessments
  FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TRIGGER trg_student_assessments_updated_at
  BEFORE UPDATE ON public.student_assessments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


CREATE TABLE public.student_assessment_meta (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  aluno_id text NOT NULL,
  observacao text NOT NULL DEFAULT '',
  fechado boolean NOT NULL DEFAULT false,
  fechado_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, aluno_id)
);

ALTER TABLE public.student_assessment_meta ENABLE ROW LEVEL SECURITY;

CREATE POLICY "SAM: own select" ON public.student_assessment_meta
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "SAM: own insert" ON public.student_assessment_meta
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "SAM: own update" ON public.student_assessment_meta
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "SAM: own delete" ON public.student_assessment_meta
  FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TRIGGER trg_student_assessment_meta_updated_at
  BEFORE UPDATE ON public.student_assessment_meta
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
