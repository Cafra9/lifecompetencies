
CREATE TABLE public.knowledge_bases (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo text NOT NULL,
  conteudo text NOT NULL,
  descricao text,
  ativo boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.knowledge_bases TO authenticated;
GRANT ALL ON public.knowledge_bases TO service_role;

ALTER TABLE public.knowledge_bases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "KB: read auth" ON public.knowledge_bases FOR SELECT TO authenticated USING (true);
CREATE POLICY "KB: write staff" ON public.knowledge_bases FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'diretora'::app_role]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'diretora'::app_role]));

CREATE TRIGGER kb_set_updated_at BEFORE UPDATE ON public.knowledge_bases
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.knowledge_base_years (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  knowledge_base_id uuid NOT NULL REFERENCES public.knowledge_bases(id) ON DELETE CASCADE,
  school_year_id uuid NOT NULL REFERENCES public.school_years(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (knowledge_base_id, school_year_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.knowledge_base_years TO authenticated;
GRANT ALL ON public.knowledge_base_years TO service_role;

ALTER TABLE public.knowledge_base_years ENABLE ROW LEVEL SECURITY;

CREATE POLICY "KBY: read auth" ON public.knowledge_base_years FOR SELECT TO authenticated USING (true);
CREATE POLICY "KBY: write staff" ON public.knowledge_base_years FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'diretora'::app_role]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'diretora'::app_role]));

CREATE INDEX idx_kby_kb ON public.knowledge_base_years(knowledge_base_id);
CREATE INDEX idx_kby_year ON public.knowledge_base_years(school_year_id);
