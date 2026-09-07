-- Garante as colunas que o painel e a home usam.
-- Rode no SQL Editor do Supabase. Pode rodar mais de uma vez.

alter table public.testemunhos
  add column if not exists nome text;

alter table public.testemunhos
  add column if not exists video_url text;

alter table public.testemunhos
  add column if not exists descricao text;

alter table public.testemunhos
  add column if not exists previa_path text;
