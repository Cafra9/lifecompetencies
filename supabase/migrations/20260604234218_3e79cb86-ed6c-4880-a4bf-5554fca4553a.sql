
-- Expand evidence_type enum to cover all categories
ALTER TYPE public.evidence_type ADD VALUE IF NOT EXISTS 'relatorio_descritivo';
ALTER TYPE public.evidence_type ADD VALUE IF NOT EXISTS 'producoes_alunos';
ALTER TYPE public.evidence_type ADD VALUE IF NOT EXISTS 'evidencias_fotograficas';
ALTER TYPE public.evidence_type ADD VALUE IF NOT EXISTS 'video';
ALTER TYPE public.evidence_type ADD VALUE IF NOT EXISTS 'avaliacoes_academicas';
ALTER TYPE public.evidence_type ADD VALUE IF NOT EXISTS 'projetos';
ALTER TYPE public.evidence_type ADD VALUE IF NOT EXISTS 'outro';

-- Seed/ensure the 10 standard categories in evidence_requirements catalog
INSERT INTO public.evidence_requirements (slug, nome, descricao, ativo) VALUES
  ('portfolio', 'Portfólio', 'Coletânea de produções do aluno', true),
  ('rubrica', 'Rubrica', 'Rubrica avaliativa preenchida', true),
  ('relatorio_descritivo', 'Relatório Descritivo', 'Relatório descritivo do desenvolvimento', true),
  ('producoes_alunos', 'Produção do Aluno', 'Trabalho ou produção do aluno', true),
  ('evidencias_fotograficas', 'Foto', 'Registro fotográfico', true),
  ('video', 'Vídeo', 'Registro em vídeo', true),
  ('avaliacoes_academicas', 'Avaliação Acadêmica', 'Prova, teste ou avaliação formal', true),
  ('observacao_comportamento', 'Observação Comportamental', 'Observação registrada pelo professor', true),
  ('projetos', 'Projeto', 'Projeto realizado pelo aluno', true),
  ('outro', 'Outro', 'Outras evidências', true)
ON CONFLICT (slug) DO UPDATE SET nome = EXCLUDED.nome, ativo = true;
