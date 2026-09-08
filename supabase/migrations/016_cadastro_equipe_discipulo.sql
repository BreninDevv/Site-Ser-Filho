-- Cadastro: função, equipe pastoral e tempo de igreja.
-- Membro passa a se chamar Discípulo.
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
      'discipulo',
      'membro',
      'pendente',
      'tesouraria',
      'apostolo',
      'midia'
    ));
end $$;

update public.perfis
set role = 'discipulo'
where role = 'membro';

create table if not exists public.equipes_pastorais (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  pastor_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.equipes_pastorais
  add column if not exists nome_chave text
  generated always as (lower(trim(nome))) stored;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.equipes_pastorais'::regclass
      and conname = 'equipes_pastorais_nome_chave_key'
  ) then
    alter table public.equipes_pastorais
      add constraint equipes_pastorais_nome_chave_key unique (nome_chave);
  end if;
end $$;

alter table public.perfis
  add column if not exists equipe_id uuid references public.equipes_pastorais (id) on delete set null;

alter table public.perfis
  add column if not exists tempo_igreja text;

alter table public.equipes_pastorais enable row level security;

grant select on table public.equipes_pastorais to anon, authenticated;
grant insert on table public.equipes_pastorais to authenticated;

drop policy if exists "equipes visiveis no cadastro" on public.equipes_pastorais;
create policy "equipes visiveis no cadastro"
  on public.equipes_pastorais
  for select
  to anon, authenticated
  using (true);

drop policy if exists "pastor cria equipe" on public.equipes_pastorais;
create policy "pastor cria equipe"
  on public.equipes_pastorais
  for insert
  to authenticated
  with check (pastor_id = auth.uid());

create or replace function public.trava_role_perfil()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.role is null
       or new.role not in ('lider', 'pastor', 'discipulo', 'apostolo', 'midia', 'tesouraria', 'pendente')
    then
      new.role := 'discipulo';
    end if;
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

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_nome text;
  v_tempo text;
  v_equipe_nome text;
  v_equipe_id uuid;
begin
  v_role := lower(trim(coalesce(new.raw_user_meta_data->>'role', 'discipulo')));
  if v_role not in ('lider', 'pastor', 'discipulo', 'apostolo', 'midia', 'tesouraria') then
    v_role := 'discipulo';
  end if;

  v_nome := left(trim(coalesce(new.raw_user_meta_data->>'nome', '')), 80);
  v_tempo := left(trim(coalesce(new.raw_user_meta_data->>'tempo_igreja', '')), 40);
  v_equipe_nome := left(trim(coalesce(new.raw_user_meta_data->>'equipe_nome', '')), 80);

  begin
    v_equipe_id := nullif(trim(coalesce(new.raw_user_meta_data->>'equipe_id', '')), '')::uuid;
  exception
    when others then
      v_equipe_id := null;
  end;

  if v_role = 'pastor' and v_equipe_nome <> '' then
    insert into public.equipes_pastorais (nome, pastor_id)
    values (v_equipe_nome, new.id)
    on conflict (nome_chave) do nothing;

    select e.id
      into v_equipe_id
    from public.equipes_pastorais e
    where lower(trim(e.nome)) = lower(v_equipe_nome)
    limit 1;
  elsif v_equipe_id is not null
        and not exists (
          select 1 from public.equipes_pastorais e where e.id = v_equipe_id
        )
  then
    v_equipe_id := null;
  end if;

  insert into public.perfis (id, nome, role, tempo_igreja, equipe_id)
  values (new.id, nullif(v_nome, ''), v_role, nullif(v_tempo, ''), v_equipe_id)
  on conflict (id) do update
    set nome = coalesce(excluded.nome, public.perfis.nome),
        role = excluded.role,
        tempo_igreja = coalesce(excluded.tempo_igreja, public.perfis.tempo_igreja),
        equipe_id = coalesce(excluded.equipe_id, public.perfis.equipe_id);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure public.handle_new_user();

notify pgrst, 'reload schema';
