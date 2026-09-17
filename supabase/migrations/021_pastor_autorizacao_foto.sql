-- Pastor nos fluxos de inscrição + foto da autorização de menor.
-- Rode no SQL Editor do Supabase. Pode rodar mais de uma vez.

alter table public.inscricoes_encontro
  add column if not exists autorizacao_path text;

alter table public.inscricoes_legado
  add column if not exists pastor_id uuid references auth.users (id) on delete set null;

alter table public.inscricoes_legado
  add column if not exists pastor_nome text;

alter table public.inscricoes_legado
  add column if not exists autorizacao_lider boolean not null default false;

alter table public.inscricoes_legado
  add column if not exists autorizacao_path text;

alter table public.inscricoes_evento
  add column if not exists pastor_id uuid references auth.users (id) on delete set null;

alter table public.inscricoes_evento
  add column if not exists pastor_nome text;

alter table public.inscricoes_evento
  add column if not exists autorizacao_path text;

notify pgrst, 'reload schema';
