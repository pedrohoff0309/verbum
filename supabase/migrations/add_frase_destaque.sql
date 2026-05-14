-- Migration: add frase_destaque to leituras + update leitura_do_dia view
-- Run this in the Supabase SQL Editor

-- 1. Add column
ALTER TABLE public.leituras
  ADD COLUMN IF NOT EXISTS frase_destaque text;

-- 2. Recreate view to include the new field
CREATE OR REPLACE VIEW public.leitura_do_dia AS
SELECT
  l.id,
  l.data_leitura,
  l.titulo,
  l.tempo_liturgico,
  l.primeira_leitura,
  l.salmo,
  l.segunda_leitura,
  l.evangelho,
  l.referencias,
  l.frase_destaque,
  e.conteudo AS explicacao
FROM public.leituras l
LEFT JOIN public.explicacoes e ON e.leitura_id = l.id
WHERE l.data_leitura = CURRENT_DATE;
