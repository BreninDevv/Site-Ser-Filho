-- Campos extras do formulário Únicas (data nascimento + cidade).
-- Pode rodar mais de uma vez.

alter table public.inscricoes_unicas
  add column if not exists data_nascimento date,
  add column if not exists cidade text;

notify pgrst, 'reload schema';
