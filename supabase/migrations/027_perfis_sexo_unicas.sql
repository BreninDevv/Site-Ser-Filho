-- Sexo no perfil (acesso Únicas só para feminino/mulher logadas).
-- Atualiza handle_new_user para gravar sexo do metadata do cadastro.
-- Pode rodar mais de uma vez.

alter table public.perfis
  add column if not exists sexo text
    check (sexo is null or sexo in ('feminino', 'masculino', 'outro', 'mulher'));

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
  if v_sexo not in ('feminino', 'masculino', 'outro', 'mulher') then
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

-- Inscrição Únicas: só autenticada com perfil feminino/mulher (não mais anon/cookie).
drop policy if exists "inscricao publica unicas" on public.inscricoes_unicas;
drop policy if exists "inscricao autenticada unicas feminino" on public.inscricoes_unicas;
create policy "inscricao autenticada unicas feminino"
  on public.inscricoes_unicas
  for insert
  to authenticated
  with check (
    status = 'pendente'
    and sexo = 'feminino'
    and exists (
      select 1
      from public.perfis p
      where p.id = auth.uid()
        and (
          lower(trim(coalesce(p.sexo, ''))) in ('feminino', 'mulher')
          or p.role = 'dev'
        )
    )
  );

revoke insert on table public.inscricoes_unicas from anon;

notify pgrst, 'reload schema';
