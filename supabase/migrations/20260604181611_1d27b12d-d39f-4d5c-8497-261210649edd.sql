
-- ENUMS
DO $$ BEGIN
  CREATE TYPE public.evidence_type AS ENUM ('rubrica','portfolio','notas','observacao_comportamento');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.school_year AS ENUM (
    'infantil_1','infantil_2','infantil_3',
    'ano_1','ano_2','ano_3','ano_4','ano_5',
    'ano_6','ano_7','ano_8','ano_9',
    'em_1','em_2','em_3'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- has_any_role (no table deps)
CREATE OR REPLACE FUNCTION public.has_any_role(_user_id uuid, _roles app_role[])
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = ANY(_roles))
$$;

-- coordinator_segments
CREATE TABLE IF NOT EXISTS public.coordinator_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  segmento school_segment NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, segmento)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coordinator_segments TO authenticated;
GRANT ALL ON public.coordinator_segments TO service_role;
ALTER TABLE public.coordinator_segments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "CS: read own or staff" ON public.coordinator_segments FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['admin','diretora']::app_role[]));
CREATE POLICY "CS: write staff" ON public.coordinator_segments FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','diretora']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','diretora']::app_role[]));

-- now safe to create this function
CREATE OR REPLACE FUNCTION public.is_coordinator_of_segment(_user_id uuid, _segmento school_segment)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.coordinator_segments WHERE user_id = _user_id AND segmento = _segmento)
$$;

-- invitations
CREATE TABLE IF NOT EXISTS public.invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  role app_role NOT NULL,
  segmento school_segment,
  anos school_year[],
  token uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '14 days'),
  accepted_at timestamptz,
  invited_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS invitations_email_idx ON public.invitations (lower(email));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invitations TO authenticated;
GRANT ALL ON public.invitations TO service_role;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Inv: staff manage" ON public.invitations FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','diretora']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','diretora']::app_role[]));

-- teacher_years
CREATE TABLE IF NOT EXISTS public.teacher_years (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  segmento school_segment NOT NULL,
  ano school_year NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, ano)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teacher_years TO authenticated;
GRANT ALL ON public.teacher_years TO service_role;
ALTER TABLE public.teacher_years ENABLE ROW LEVEL SECURITY;
CREATE POLICY "TY: read own or staff" ON public.teacher_years FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.has_any_role(auth.uid(), ARRAY['admin','diretora']::app_role[])
    OR public.is_coordinator_of_segment(auth.uid(), segmento)
  );
CREATE POLICY "TY: write staff" ON public.teacher_years FOR ALL TO authenticated
  USING (
    public.has_any_role(auth.uid(), ARRAY['admin','diretora']::app_role[])
    OR public.is_coordinator_of_segment(auth.uid(), segmento)
  )
  WITH CHECK (
    public.has_any_role(auth.uid(), ARRAY['admin','diretora']::app_role[])
    OR public.is_coordinator_of_segment(auth.uid(), segmento)
  );

-- year_evidence_requirements
CREATE TABLE IF NOT EXISTS public.year_evidence_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  segmento school_segment NOT NULL,
  ano school_year NOT NULL,
  evidence_type evidence_type NOT NULL,
  obrigatorio boolean NOT NULL DEFAULT true,
  descricao text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (segmento, ano, evidence_type)
);
CREATE TRIGGER yer_set_updated_at BEFORE UPDATE ON public.year_evidence_requirements
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
GRANT SELECT, INSERT, UPDATE, DELETE ON public.year_evidence_requirements TO authenticated;
GRANT ALL ON public.year_evidence_requirements TO service_role;
ALTER TABLE public.year_evidence_requirements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "YER: read auth" ON public.year_evidence_requirements FOR SELECT TO authenticated USING (true);
CREATE POLICY "YER: write staff" ON public.year_evidence_requirements FOR ALL TO authenticated
  USING (
    public.has_any_role(auth.uid(), ARRAY['admin','diretora']::app_role[])
    OR public.is_coordinator_of_segment(auth.uid(), segmento)
  )
  WITH CHECK (
    public.has_any_role(auth.uid(), ARRAY['admin','diretora']::app_role[])
    OR public.is_coordinator_of_segment(auth.uid(), segmento)
  );

-- student_evidences
CREATE TABLE IF NOT EXISTS public.student_evidences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  created_by uuid NOT NULL,
  evidence_type evidence_type NOT NULL,
  competency_id uuid REFERENCES public.competencies(id),
  skill_id uuid REFERENCES public.skills(id),
  titulo text NOT NULL,
  descricao text,
  arquivo_url text,
  nota numeric(5,2),
  periodo text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS se_student_idx ON public.student_evidences (student_id);
CREATE TRIGGER se_set_updated_at BEFORE UPDATE ON public.student_evidences
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_evidences TO authenticated;
GRANT ALL ON public.student_evidences TO service_role;
ALTER TABLE public.student_evidences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "SE: read" ON public.student_evidences FOR SELECT TO authenticated
  USING (
    created_by = auth.uid()
    OR public.has_any_role(auth.uid(), ARRAY['admin','diretora']::app_role[])
    OR EXISTS (
      SELECT 1 FROM public.students s
      JOIN public.classes c ON c.id = s.class_id
      WHERE s.id = student_evidences.student_id
        AND (c.professor_id = auth.uid() OR public.is_coordinator_of_segment(auth.uid(), c.segmento))
    )
  );
CREATE POLICY "SE: insert own" ON public.student_evidences FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.students s
      JOIN public.classes c ON c.id = s.class_id
      WHERE s.id = student_evidences.student_id AND c.professor_id = auth.uid()
    )
  );
CREATE POLICY "SE: update own" ON public.student_evidences FOR UPDATE TO authenticated
  USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());
CREATE POLICY "SE: delete own or admin" ON public.student_evidences FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['admin','diretora']::app_role[]));

-- Extended handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  inv RECORD;
  yr school_year;
BEGIN
  INSERT INTO public.profiles (id, nome, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)), NEW.email);

  SELECT * INTO inv FROM public.invitations
   WHERE lower(email) = lower(NEW.email) AND accepted_at IS NULL AND expires_at > now()
   ORDER BY created_at DESC LIMIT 1;

  IF inv.id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, inv.role)
      ON CONFLICT DO NOTHING;
    IF inv.role = 'coordenador' AND inv.segmento IS NOT NULL THEN
      INSERT INTO public.coordinator_segments (user_id, segmento) VALUES (NEW.id, inv.segmento)
        ON CONFLICT DO NOTHING;
    END IF;
    IF inv.role = 'professor' AND inv.segmento IS NOT NULL AND inv.anos IS NOT NULL THEN
      FOREACH yr IN ARRAY inv.anos LOOP
        INSERT INTO public.teacher_years (user_id, segmento, ano) VALUES (NEW.id, inv.segmento, yr)
          ON CONFLICT DO NOTHING;
      END LOOP;
    END IF;
    UPDATE public.invitations SET accepted_at = now() WHERE id = inv.id;
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'professor')
      ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
