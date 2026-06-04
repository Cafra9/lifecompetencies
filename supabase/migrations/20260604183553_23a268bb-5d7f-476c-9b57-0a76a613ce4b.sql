
-- ============================================================
-- Dynamic school years + evidence requirements
-- ============================================================

-- 1. school_years
CREATE TABLE public.school_years (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text NOT NULL UNIQUE,
  nome text NOT NULL,
  segmento school_segment NOT NULL,
  ordem int NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.school_years TO authenticated;
GRANT ALL ON public.school_years TO service_role;
ALTER TABLE public.school_years ENABLE ROW LEVEL SECURITY;
CREATE POLICY "SY: read auth" ON public.school_years FOR SELECT TO authenticated USING (true);
CREATE POLICY "SY: write staff" ON public.school_years FOR ALL TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'diretora'::app_role]))
  WITH CHECK (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'diretora'::app_role]));
CREATE TRIGGER set_updated_at_school_years BEFORE UPDATE ON public.school_years
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. evidence_requirements (catálogo)
CREATE TABLE public.evidence_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  nome text NOT NULL,
  descricao text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.evidence_requirements TO authenticated;
GRANT ALL ON public.evidence_requirements TO service_role;
ALTER TABLE public.evidence_requirements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ER: read auth" ON public.evidence_requirements FOR SELECT TO authenticated USING (true);
CREATE POLICY "ER: write staff" ON public.evidence_requirements FOR ALL TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'diretora'::app_role]))
  WITH CHECK (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'diretora'::app_role]));
CREATE TRIGGER set_updated_at_evidence_requirements BEFORE UPDATE ON public.evidence_requirements
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. year_requirements (junção)
CREATE TABLE public.year_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_year_id uuid NOT NULL REFERENCES public.school_years(id) ON DELETE CASCADE,
  requirement_id uuid NOT NULL REFERENCES public.evidence_requirements(id) ON DELETE CASCADE,
  obrigatorio boolean NOT NULL DEFAULT true,
  orientacao text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (school_year_id, requirement_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.year_requirements TO authenticated;
GRANT ALL ON public.year_requirements TO service_role;
ALTER TABLE public.year_requirements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "YR: read auth" ON public.year_requirements FOR SELECT TO authenticated USING (true);
CREATE POLICY "YR: write staff" ON public.year_requirements FOR ALL TO authenticated
  USING (
    has_any_role(auth.uid(), ARRAY['admin'::app_role, 'diretora'::app_role])
    OR EXISTS (
      SELECT 1 FROM public.school_years sy
      WHERE sy.id = year_requirements.school_year_id
        AND is_coordinator_of_segment(auth.uid(), sy.segmento)
    )
  )
  WITH CHECK (
    has_any_role(auth.uid(), ARRAY['admin'::app_role, 'diretora'::app_role])
    OR EXISTS (
      SELECT 1 FROM public.school_years sy
      WHERE sy.id = year_requirements.school_year_id
        AND is_coordinator_of_segment(auth.uid(), sy.segmento)
    )
  );
CREATE TRIGGER set_updated_at_year_requirements BEFORE UPDATE ON public.year_requirements
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. Alterações em tabelas existentes
ALTER TABLE public.teacher_years ADD COLUMN school_year_id uuid REFERENCES public.school_years(id) ON DELETE CASCADE;
ALTER TABLE public.student_evidences ADD COLUMN requirement_id uuid REFERENCES public.evidence_requirements(id) ON DELETE SET NULL;
ALTER TABLE public.classes ADD COLUMN school_year_id uuid REFERENCES public.school_years(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cargo text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ativo boolean NOT NULL DEFAULT true;

-- 5. Seed school_years
INSERT INTO public.school_years (codigo, nome, segmento, ordem) VALUES
  ('K1', 'K1', 'infantil', 1),
  ('K2', 'K2', 'infantil', 2),
  ('K3', 'K3', 'infantil', 3),
  ('K4', 'K4', 'infantil', 4),
  ('K5', 'K5', 'infantil', 5),
  ('ANO_1', '1º ano', 'fundamental_1', 11),
  ('ANO_2', '2º ano', 'fundamental_1', 12),
  ('ANO_3', '3º ano', 'fundamental_1', 13),
  ('ANO_4', '4º ano', 'fundamental_1', 14),
  ('ANO_5', '5º ano', 'fundamental_1', 15),
  ('ANO_6', '6º ano', 'fundamental_2', 21),
  ('ANO_7', '7º ano', 'fundamental_2', 22),
  ('ANO_8', '8º ano', 'fundamental_2', 23),
  ('ANO_9', '9º ano', 'fundamental_2', 24),
  ('EM_1', '1ª série EM', 'medio', 31),
  ('EM_2', '2ª série EM', 'medio', 32),
  ('EM_3', '3ª série EM', 'medio', 33);

-- 6. Seed evidence_requirements
INSERT INTO public.evidence_requirements (slug, nome, descricao) VALUES
  ('rubrica', 'Rubricas', 'Avaliação por nível (iniciando, desenvolvendo, dominando) das habilidades das competências.'),
  ('portfolio', 'Portfólio', 'Coleção de produções e trabalhos do aluno.'),
  ('relatorio_descritivo', 'Relatório descritivo', 'Relatório qualitativo sobre o desenvolvimento do aluno.'),
  ('evidencias_fotograficas', 'Evidências fotográficas', 'Registros visuais (fotos/vídeos) de atividades e produções.'),
  ('avaliacoes_academicas', 'Avaliações acadêmicas', 'Notas e provas formais por disciplina e período.'),
  ('observacao_comportamento', 'Observações comportamentais', 'Registros qualitativos sobre comportamento e socialização.'),
  ('producoes_alunos', 'Produções dos alunos', 'Textos, desenhos, atividades autorais do aluno.'),
  ('projetos', 'Projetos realizados', 'Projetos pedagógicos desenvolvidos pelo aluno.'),
  ('notas', 'Notas', 'Notas numéricas avulsas.');

-- 7. Migrar teacher_years.ano -> school_year_id (mapeando enum existente para codigo)
UPDATE public.teacher_years ty SET school_year_id = sy.id
  FROM public.school_years sy
 WHERE sy.codigo = upper(ty.ano::text)
   AND ty.school_year_id IS NULL;

-- 8. Migrar year_evidence_requirements -> year_requirements
INSERT INTO public.year_requirements (school_year_id, requirement_id, obrigatorio, orientacao, created_by)
SELECT sy.id, er.id, yer.obrigatorio, yer.descricao, yer.created_by
  FROM public.year_evidence_requirements yer
  JOIN public.school_years sy ON sy.codigo = upper(yer.ano::text)
  JOIN public.evidence_requirements er ON er.slug = yer.evidence_type::text
ON CONFLICT (school_year_id, requirement_id) DO NOTHING;

-- 9. Migrar student_evidences.evidence_type -> requirement_id
UPDATE public.student_evidences se SET requirement_id = er.id
  FROM public.evidence_requirements er
 WHERE er.slug = se.evidence_type::text
   AND se.requirement_id IS NULL;
