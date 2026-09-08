-- Separa Líder e Pastor. Cria Membro (conta na base, sem painel).
-- Quem se cadastra no site entra como membro, não mais como pendente.
-- Rode no SQL Editor do Supabase. Pode rodar mais de uma vez.

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

  alter table public.perfis
    add constraint perfis_role_check
    check (role in (
      'dev',
      'lider',
      'pastor',
      'membro',
      'pendente',
      'tesouraria',
      'apostolo',
      'midia'
    ));
end $$;

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
      and perfis.role in ('dev', 'tesouraria', 'apostolo', 'lider', 'pastor')
  );
$$;

create or replace function public.trava_role_perfil()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    new.role := 'membro';
    return new;
  end if;

  if new.role is distinct from old.role then
    if new.id = auth.uid() then
      raise exception 'nao pode alterar a propria role';
    end if;
    if old.role = 'dev' then
      raise exception 'conta dev protegida';
    end if;
    if new.role = 'dev' then
      raise exception 'nao e permitido promover a dev';
    end if;
    if not public.e_acesso_master() then
      raise exception 'sem permissao para alterar role';
    end if;
  end if;

  return new;
end;
$$;

notify pgrst, 'reload schema';
