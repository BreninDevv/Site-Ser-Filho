-- Inscrição do Encontro: trabalhador/encontrista, pastor e autorização de menor.
-- Rode no SQL Editor do Supabase. Pode rodar mais de uma vez.

alter table public.inscricoes_encontro
  add column if not exists papel_encontro text
    check (papel_encontro in ('trabalhador', 'encontrista'));

alter table public.inscricoes_encontro
  add column if not exists pastor_id uuid references auth.users (id) on delete set null;

alter table public.inscricoes_encontro
  add column if not exists pastor_nome text;

alter table public.inscricoes_encontro
  add column if not exists autorizacao_lider boolean not null default false;

create or replace function public.pastores_para_inscricao()
returns table (id uuid, nome text)
language sql
security definer
stable
set search_path = public
as $$
  select p.id, p.nome
  from public.perfis p
  where p.role = 'pastor'
    and p.nome is not null
    and trim(p.nome) <> ''
  order by p.nome;
$$;

revoke all on function public.pastores_para_inscricao() from public;
grant execute on function public.pastores_para_inscricao() to anon, authenticated;

notify pgrst, 'reload schema';
