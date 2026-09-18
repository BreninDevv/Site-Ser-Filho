-- Perfis fictícios para o Dev testar o painel sem erro.
-- Só role `dev` pode chamar. Rode no SQL Editor. Pode rodar mais de uma vez.

alter table public.perfis
  add column if not exists ficticio boolean not null default false;

create or replace function public.criar_perfil_ficticio(
  p_nome text,
  p_role text,
  p_email text default null,
  p_senha text default null,
  p_equipe_nome text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  meu_role text;
  v_id uuid := gen_random_uuid();
  v_email text;
  v_senha text;
  v_nome text;
  v_role text;
  v_equipe text;
  v_instance uuid;
begin
  if auth.uid() is null then
    raise exception 'nao autenticado';
  end if;

  select role into meu_role from public.perfis where id = auth.uid();
  if meu_role is distinct from 'dev' then
    raise exception 'somente Dev pode criar perfil ficticio';
  end if;

  v_role := lower(trim(coalesce(p_role, '')));
  if v_role not in (
    'discipulo',
    'pendente',
    'lider',
    'lider_tesouraria',
    'pastor',
    'midia',
    'tesouraria',
    'apostolo'
  ) then
    raise exception 'role invalida para perfil ficticio';
  end if;

  v_nome := left(trim(coalesce(p_nome, '')), 80);
  if length(v_nome) < 2 then
    raise exception 'nome obrigatorio';
  end if;
  if position('[TESTE]' in upper(v_nome)) = 0 then
    v_nome := left('[TESTE] ' || v_nome, 80);
  end if;

  v_senha := coalesce(nullif(trim(p_senha), ''), 'TesteSerFilho1!');
  if length(v_senha) < 8 then
    raise exception 'senha fraca';
  end if;

  v_email := lower(trim(coalesce(p_email, '')));
  if v_email = '' then
    v_email := format(
      'teste.%s.%s@example.com',
      replace(v_role, '_', ''),
      substr(replace(v_id::text, '-', ''), 1, 8)
    );
  end if;

  if v_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]{2,}$' then
    raise exception 'email invalido';
  end if;

  if exists (select 1 from auth.users where email = v_email) then
    raise exception 'email ja cadastrado';
  end if;

  v_equipe := left(trim(coalesce(p_equipe_nome, '')), 80);
  if v_role = 'pastor' and v_equipe = '' then
    v_equipe := 'Equipe Teste';
  end if;

  select i.id into v_instance from auth.instances i limit 1;
  if v_instance is null then
    v_instance := '00000000-0000-0000-0000-000000000000';
  end if;

  insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change
  ) values (
    v_instance,
    v_id,
    'authenticated',
    'authenticated',
    v_email,
    extensions.crypt(v_senha, extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object(
      'nome', v_nome,
      'role', v_role,
      'tempo_igreja', '1 a 3 anos',
      'equipe_nome', case when v_role = 'pastor' then v_equipe else '' end,
      'equipe_id', '',
      'ficticio', true
    ),
    now(),
    now(),
    '',
    '',
    '',
    ''
  );

  insert into auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  ) values (
    gen_random_uuid(),
    v_id,
    jsonb_build_object(
      'sub', v_id::text,
      'email', v_email,
      'email_verified', true,
      'phone_verified', false
    ),
    'email',
    v_id::text,
    now(),
    now(),
    now()
  );

  -- Garante role/nome/ficticio mesmo se o trigger já tiver criado o perfil
  insert into public.perfis (id, nome, role, tempo_igreja, ficticio)
  values (v_id, v_nome, v_role, '1 a 3 anos', true)
  on conflict (id) do update
    set nome = excluded.nome,
        role = excluded.role,
        tempo_igreja = coalesce(excluded.tempo_igreja, public.perfis.tempo_igreja),
        ficticio = true;

  if v_role = 'pastor' and v_equipe <> '' then
    insert into public.equipes_pastorais (nome, pastor_id)
    values (v_equipe, v_id)
    on conflict (nome_chave) do update
      set pastor_id = coalesce(public.equipes_pastorais.pastor_id, excluded.pastor_id);

    update public.perfis p
    set equipe_id = e.id
    from public.equipes_pastorais e
    where p.id = v_id
      and lower(trim(e.nome)) = lower(v_equipe);
  end if;

  return jsonb_build_object(
    'id', v_id,
    'email', v_email,
    'senha', v_senha,
    'nome', v_nome,
    'role', v_role
  );
end;
$$;

revoke all on function public.criar_perfil_ficticio(text, text, text, text, text) from public;
grant execute on function public.criar_perfil_ficticio(text, text, text, text, text) to authenticated;

notify pgrst, 'reload schema';
