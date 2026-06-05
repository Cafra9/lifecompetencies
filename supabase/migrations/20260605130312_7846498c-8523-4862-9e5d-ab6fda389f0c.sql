
ALTER TABLE public.evidence_requirements
  ADD COLUMN IF NOT EXISTS allowed_extensions text[] NOT NULL DEFAULT ARRAY['pdf','docx','pptx','xlsx','jpg','jpeg','png','webp','mp4','mov','zip']::text[],
  ADD COLUMN IF NOT EXISTS ordem integer NOT NULL DEFAULT 0;

UPDATE public.evidence_requirements SET allowed_extensions = ARRAY['mp4','mov','webm','m4v','jpg','jpeg','png','webp','heic','gif','mp3','m4a','wav','ogg','pdf','docx','pptx','txt','md','zip'] WHERE slug = 'portfolio';
UPDATE public.evidence_requirements SET allowed_extensions = ARRAY['jpg','jpeg','png','webp','heic','gif'] WHERE slug = 'evidencias_fotograficas';
UPDATE public.evidence_requirements SET allowed_extensions = ARRAY['mp4','mov','webm','m4v'] WHERE slug = 'video';
UPDATE public.evidence_requirements SET allowed_extensions = ARRAY['pdf','docx','xlsx'] WHERE slug = 'rubrica';
UPDATE public.evidence_requirements SET allowed_extensions = ARRAY['pdf','docx','txt','md'] WHERE slug IN ('relatorio_descritivo','observacao_comportamento','notas');
UPDATE public.evidence_requirements SET allowed_extensions = ARRAY['pdf','docx','xlsx','jpg','jpeg','png'] WHERE slug = 'avaliacoes_academicas';
UPDATE public.evidence_requirements SET allowed_extensions = ARRAY['pdf','docx','pptx','jpg','jpeg','png','mp4','mov','zip'] WHERE slug IN ('producoes_alunos','projetos');
