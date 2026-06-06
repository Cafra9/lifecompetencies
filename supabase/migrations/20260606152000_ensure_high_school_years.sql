INSERT INTO public.school_years (codigo, nome, segmento, ordem, ativo)
VALUES
  ('EM_1', '1ª série EM', 'medio', 31, true),
  ('EM_2', '2ª série EM', 'medio', 32, true),
  ('EM_3', '3ª série EM', 'medio', 33, true)
ON CONFLICT (codigo) DO UPDATE
SET
  nome = EXCLUDED.nome,
  segmento = EXCLUDED.segmento,
  ordem = EXCLUDED.ordem,
  ativo = true;
