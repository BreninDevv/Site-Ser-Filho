-- Edição de perfil: sexo só homem/mulher + solicitações de equipe/função.
-- Pode rodar mais de uma vez.
-- Cria a coluna sexo se a migration 027 ainda não tiver rodado.

-- ——— Sexo: cria coluna, remove "outro" ———
alter table public.perfis
  add column if not exists sexo text;

update public.perfis
set sexo = null
where lower(trim(coalesce(sexo, ''))) = 'outro';

do $$
declare
  nome_check text;
begin
  select c.conname into nome_check
  from pg_constraint c
  where c.conrelid = 'public.perfis'::regclass
    and c.contype = 'c'
    and pg_get_constraintdef(c.oid) ilike '%sexo%';

  if nome_check is not null then
    execute format('alter table public.perfis drop constraint %I', nome_check);
  end if;

  alter table public.perfis
    add constraint perfis_sexo_check
    check (sexo is null or sexo in ('feminino', 'masculino', 'mulher'));
end $$;

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
  v_sexo text;
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
  v_sexo := lower(trim(coalesce(new.raw_user_meta_data->>'sexo', '')));
  if v_sexo = 'mulher' then
    v_sexo := 'feminino';
  end if;
  if v_sexo not in ('feminino', 'masculino') then
    v_sexo := null;
  end if;

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

  insert into public.perfis (id, nome, role, tempo_igreja, equipe_id, sexo)
  values (
    new.id,
    nullif(v_nome, ''),
    v_role,
    nullif(v_tempo, ''),
    v_equipe_id,
    v_sexo
  )
  on conflict (id) do update
    set nome = coalesce(excluded.nome, public.perfis.nome),
        role = excluded.role,
        tempo_igreja = coalesce(excluded.tempo_igreja, public.perfis.tempo_igreja),
        equipe_id = coalesce(excluded.equipe_id, public.perfis.equipe_id),
        sexo = coalesce(excluded.sexo, public.perfis.sexo);

  return new;
end;
$$;

-- Quem aprova pedidos de equipe/função (pastor, apóstolo, Dev).
create or replace function public.pode_aprovar_solicitacao_perfil()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.perfis
    where id = auth.uid()
      and role in ('dev', 'apostolo', 'pastor')
  );
$$;

revoke all on function public.pode_aprovar_solicitacao_perfil() from public;
grant execute on function public.pode_aprovar_solicitacao_perfil() to authenticated;

-- Usuário não muda a própria role/equipe; aprovadores (e masters) podem mudar role.
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

  -- Auto-edição: só nome / sexo / tempo_igreja.
  if new.id = auth.uid() then
    new.role := old.role;
    new.equipe_id := old.equipe_id;
    return new;
  end if;

  if new.role is distinct from old.role then
    if old.role = 'dev' then
      raise exception 'conta dev protegida';
    end if;
    if new.role = 'dev' then
      raise exception 'nao e permitido promover a dev';
    end if;
    if not (
      public.e_acesso_master()
      or public.pode_aprovar_solicitacao_perfil()
    ) then
      raise exception 'sem permissao para alterar role';
    end if;
  end if;

  return new;
end;
$$;

-- Políticas: ler/atualizar o próprio perfil.
drop policy if exists "usuario le o proprio perfil" on public.perfis;
create policy "usuario le o proprio perfil"
  on public.perfis
  for select
  to authenticated
  using (id = auth.uid());

drop policy if exists "usuario atualiza o proprio perfil" on public.perfis;
create policy "usuario atualiza o proprio perfil"
  on public.perfis
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ——— Solicitações de equipe / função ———
create table if not exists public.solicitacoes_perfil (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users (id) on delete cascade,
  equipe_id_nova uuid references public.equipes_pastorais (id) on delete set null,
  role_nova text
    check (
      role_nova is null
      or role_nova in (
        'discipulo',
        'lider',
        'lider_tesouraria',
        'pastor',
        'apostolo',
        'midia',
        'tesouraria'
      )
    ),
  status text not null default 'pendente'
    check (status in ('pendente', 'aprovada', 'recusada')),
  motivo text not null default '',
  revisado_por uuid references auth.users (id) on delete set null,
  revisado_em timestamptz,
  created_at timestamptz not null default now(),
  constraint solicitacoes_perfil_tem_pedido check (
    equipe_id_nova is not null or role_nova is not null
  )
);

create index if not exists solicitacoes_perfil_status_idx
  on public.solicitacoes_perfil (status, created_at desc);

create index if not exists solicitacoes_perfil_usuario_idx
  on public.solicitacoes_perfil (usuario_id, created_at desc);

-- No máximo 1 pendente por usuário.
create unique index if not exists solicitacoes_perfil_uma_pendente
  on public.solicitacoes_perfil (usuario_id)
  where status = 'pendente';

alter table public.solicitacoes_perfil enable row level security;

grant select, insert, update, delete on table public.solicitacoes_perfil to authenticated;

drop policy if exists "usuario le as proprias solicitacoes" on public.solicitacoes_perfil;
create policy "usuario le as proprias solicitacoes"
  on public.solicitacoes_perfil
  for select
  to authenticated
  using (
    usuario_id = auth.uid()
    or public.pode_aprovar_solicitacao_perfil()
  );

drop policy if exists "usuario cria solicitacao propria" on public.solicitacoes_perfil;
create policy "usuario cria solicitacao propria"
  on public.solicitacoes_perfil
  for insert
  to authenticated
  with check (
    usuario_id = auth.uid()
    and status = 'pendente'
  );

drop policy if exists "usuario cancela solicitacao pendente" on public.solicitacoes_perfil;
create policy "usuario cancela solicitacao pendente"
  on public.solicitacoes_perfil
  for delete
  to authenticated
  using (
    usuario_id = auth.uid()
    and status = 'pendente'
  );

drop policy if exists "aprovadores atualizam solicitacoes" on public.solicitacoes_perfil;
create policy "aprovadores atualizam solicitacoes"
  on public.solicitacoes_perfil
  for update
  to authenticated
  using (public.pode_aprovar_solicitacao_perfil())
  with check (public.pode_aprovar_solicitacao_perfil());

-- Aprovar / recusar em uma chamada (aplica equipe/role se aprovado).
create or replace function public.revisar_solicitacao_perfil(
  p_id uuid,
  p_aprovar boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sol public.solicitacoes_perfil%rowtype;
begin
  if not public.pode_aprovar_solicitacao_perfil() then
    raise exception 'sem permissao';
  end if;

  select *
    into v_sol
  from public.solicitacoes_perfil
  where id = p_id
  for update;

  if not found then
    raise exception 'solicitacao nao encontrada';
  end if;

  if v_sol.status <> 'pendente' then
    raise exception 'solicitacao ja revisada';
  end if;

  if p_aprovar then
    if v_sol.equipe_id_nova is not null or v_sol.role_nova is not null then
      update public.perfis
      set
        equipe_id = coalesce(v_sol.equipe_id_nova, equipe_id),
        role = coalesce(v_sol.role_nova, role)
      where id = v_sol.usuario_id;
    end if;

    update public.solicitacoes_perfil
    set
      status = 'aprovada',
      revisado_por = auth.uid(),
      revisado_em = now()
    where id = p_id;
  else
    update public.solicitacoes_perfil
    set
      status = 'recusada',
      revisado_por = auth.uid(),
      revisado_em = now()
    where id = p_id;
  end if;
end;
$$;

revoke all on function public.revisar_solicitacao_perfil(uuid, boolean) from public;
grant execute on function public.revisar_solicitacao_perfil(uuid, boolean) to authenticated;

-- Pastors/aprovadores precisam ler perfis dos solicitantes.
drop policy if exists "aprovadores leem perfis" on public.perfis;
create policy "aprovadores leem perfis"
  on public.perfis
  for select
  to authenticated
  using (public.pode_aprovar_solicitacao_perfil());

drop policy if exists "aprovadores atualizam perfis" on public.perfis;
create policy "aprovadores atualizam perfis"
  on public.perfis
  for update
  to authenticated
  using (public.pode_aprovar_solicitacao_perfil())
  with check (public.pode_aprovar_solicitacao_perfil());

notify pgrst, 'reload schema';
