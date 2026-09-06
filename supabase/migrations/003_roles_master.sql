-- Tesouraria e Apóstolo(a): mesmo acesso master do Dev.
-- Líder continua vendo as inscrições, sem aprovar pagamento.
-- Rode no SQL Editor do Supabase. Pode rodar mais de uma vez.
-- Depois, em /painel/admin/usuarios, atribua Tesouraria ou Apóstolo(a).

create or replace function public.e_acesso_master()
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
      and perfis.role in ('dev', 'tesouraria', 'apostolo')
  );
$$;

create or replace function public.pode_ver_inscricoes()
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
      and perfis.role in ('dev', 'tesouraria', 'apostolo', 'lider')
  );
$$;

create or replace function public.pode_aprovar_pagamento()
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
      and perfis.role in ('dev', 'tesouraria', 'apostolo')
  );
$$;

-- Troca o CHECK antigo da coluna role, se existir, pela lista nova.
do $$
declare
  nome_check text;
begin
  select c.conname into nome_check
  from pg_constraint c
  where c.conrelid = 'public.perfis'::regclass
    and c.contype = 'c'
    and pg_get_constraintdef(c.oid) ilike '%role%';

  if nome_check is not null then
    execute format('alter table public.perfis drop constraint %I', nome_check);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.perfis'::regclass
      and conname = 'perfis_role_check'
  ) then
    alter table public.perfis
      add constraint perfis_role_check
      check (role in ('dev', 'lider', 'pendente', 'tesouraria', 'apostolo'));
  end if;
end $$;

alter table public.perfis enable row level security;

-- Masters precisam ler e atualizar qualquer perfil (admin de usuários).
-- Policies extras: no Postgres elas se somam (OR) às que já existem.
drop policy if exists "masters leem perfis" on public.perfis;
create policy "masters leem perfis"
  on public.perfis
  for select
  to authenticated
  using (public.e_acesso_master());

drop policy if exists "masters atualizam perfis" on public.perfis;
create policy "masters atualizam perfis"
  on public.perfis
  for update
  to authenticated
  using (public.e_acesso_master())
  with check (public.e_acesso_master());
