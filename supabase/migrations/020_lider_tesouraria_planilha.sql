-- Role Líder / Tesouraria: mesmo acesso de líder + planilha de chegada.
-- Marca presença (OK) e lê todas as inscrições para conferência na porta.
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
      'lider_tesouraria',
      'pastor',
      'discipulo',
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
      and perfis.role in (
        'dev',
        'tesouraria',
        'apostolo',
        'lider',
        'lider_tesouraria',
        'pastor'
      )
  );
$$;

create or replace function public.pode_conferir_planilha()
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
      and perfis.role in ('dev', 'tesouraria', 'apostolo', 'lider_tesouraria')
  );
$$;

revoke all on function public.pode_conferir_planilha() from public;
grant execute on function public.pode_conferir_planilha() to authenticated;

-- Presença também em eventos (OK na porta).
alter table public.inscricoes_evento
  add column if not exists presente boolean not null default false;

-- Leitura do Encontro: Líder/Tesouraria vê tudo (porta).
drop policy if exists "leitura inscricoes encontro" on public.inscricoes_encontro;
create policy "leitura inscricoes encontro"
  on public.inscricoes_encontro
  for select
  to authenticated
  using (
    public.e_acesso_master()
    or public.pode_conferir_planilha()
    or exists (
      select 1
      from public.perfis p
      where p.id = auth.uid()
        and p.role = 'pastor'
    )
    or (
      exists (
        select 1
        from public.perfis p
        where p.id = auth.uid()
          and p.role = 'lider'
      )
      and pastor_id is not null
      and pastor_id = public.pastor_id_da_equipe_do_usuario()
    )
  );

-- Eventos: quem confere a planilha também lê.
drop policy if exists "leitura inscricoes evento master" on public.inscricoes_evento;
drop policy if exists "leitura inscricoes evento" on public.inscricoes_evento;
create policy "leitura inscricoes evento"
  on public.inscricoes_evento
  for select
  to authenticated
  using (public.pode_conferir_planilha());

create or replace function public.marcar_chegada(
  p_fonte text,
  p_id uuid,
  p_presente boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'nao autenticado';
  end if;

  if not public.pode_conferir_planilha() then
    raise exception 'sem permissao para marcar chegada';
  end if;

  if p_fonte = 'encontro' then
    update public.inscricoes_encontro
      set presente = p_presente
    where id = p_id
      and status <> 'cancelada';
  elsif p_fonte = 'legado' then
    update public.inscricoes_legado
      set presente = p_presente
    where id = p_id
      and status <> 'cancelada';
  elsif p_fonte = 'evento' then
    update public.inscricoes_evento
      set presente = p_presente
    where id = p_id
      and status <> 'cancelada';
  else
    raise exception 'fonte invalida';
  end if;
end;
$$;

revoke all on function public.marcar_chegada(text, uuid, boolean) from public;
grant execute on function public.marcar_chegada(text, uuid, boolean) to authenticated;

create or replace function public.trava_role_perfil()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.role is null
       or new.role not in (
         'lider',
         'lider_tesouraria',
         'pastor',
         'discipulo',
         'apostolo',
         'midia',
         'tesouraria',
         'pendente'
       )
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
  if v_role not in (
    'lider',
    'lider_tesouraria',
    'pastor',
    'discipulo',
    'apostolo',
    'midia',
    'tesouraria'
  ) then
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

notify pgrst, 'reload schema';
