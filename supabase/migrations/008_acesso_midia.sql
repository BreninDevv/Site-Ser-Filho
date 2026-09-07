-- Mídia: Dev, Apóstolo e Mídia. Tesouraria e Líder ficam de fora.
-- Dev continua passando em e_acesso_master (tudo).
-- Rode no SQL Editor do Supabase. Pode rodar mais de uma vez.

create or replace function public.e_dev()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.perfis
    where perfis.id = auth.uid()
      and perfis.role = 'dev'
  );
$$;

create or replace function public.e_equipe_midia()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.perfis
    where perfis.id = auth.uid()
      and perfis.role in ('dev', 'apostolo', 'midia')
  );
$$;

revoke all on function public.e_dev() from public;
grant execute on function public.e_dev() to authenticated, service_role;

revoke all on function public.e_equipe_midia() from public;
grant execute on function public.e_equipe_midia() to authenticated, service_role;
