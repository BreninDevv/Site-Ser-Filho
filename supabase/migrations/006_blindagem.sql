-- Blindagem: valores de pagamento, role e uploads.
-- Rode no SQL Editor do Supabase. Pode rodar mais de uma vez.

-- Garantir midia no CHECK de role (caso o 005 tenha rodado antes do 003).
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
    check (role in ('dev', 'lider', 'pendente', 'tesouraria', 'apostolo', 'midia'));
end $$;

-- Ninguém muda a própria role. Ninguém vira dev por aqui. Dev não é rebaixado.
create or replace function public.trava_role_perfil()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    new.role := 'pendente';
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

drop trigger if exists trava_role_perfil on public.perfis;
create trigger trava_role_perfil
  before insert or update on public.perfis
  for each row
  execute procedure public.trava_role_perfil();

-- Recalcula o dinheiro no banco. Quem chama a API direto não escolhe o valor.
create or replace function public.trava_valores_encontro()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  encontro constant integer := 20000;
  entrada constant integer := 10000;
  crianca constant integer := 5000;
  devido integer;
  escolhido integer;
begin
  new.status := 'pendente';
  new.presente := false;
  new.valor_pago_centavos := 0;
  new.aprovado_por := null;
  new.aprovado_em := null;

  if new.qtd_criancas is null or new.qtd_criancas < 0 then
    new.qtd_criancas := 0;
  end if;
  if new.qtd_criancas > 10 then
    raise exception 'quantidade de criancas invalida';
  end if;
  if not coalesce(new.leva_crianca, false) then
    new.qtd_criancas := 0;
  end if;

  devido := encontro + crianca * new.qtd_criancas;
  new.valor_devido_centavos := devido;

  if coalesce(new.valor_escolhido_centavos, 0) >= devido then
    escolhido := devido;
  else
    escolhido := entrada;
  end if;
  new.valor_escolhido_centavos := escolhido;

  if new.forma_pagamento = 'credito' and coalesce(new.parcelas, 1) > 1 then
    new.valor_cobrado_centavos := round(escolhido * 1.09875);
  else
    new.valor_cobrado_centavos := escolhido;
  end if;

  if new.comprovante_path is not null
     and new.comprovante_path !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(png|jpe?g|webp|pdf)$' then
    new.comprovante_path := null;
  end if;

  return new;
end;
$$;

drop trigger if exists trava_valores_encontro on public.inscricoes_encontro;
create trigger trava_valores_encontro
  before insert on public.inscricoes_encontro
  for each row
  execute procedure public.trava_valores_encontro();

create or replace function public.trava_valores_legado()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  encontro constant integer := 20000;
  entrada constant integer := 10000;
  escolhido integer;
begin
  new.status := 'pendente';
  new.presente := false;
  new.valor_pago_centavos := 0;
  new.aprovado_por := null;
  new.aprovado_em := null;
  new.valor_devido_centavos := encontro;

  if coalesce(new.valor_escolhido_centavos, 0) >= encontro then
    escolhido := encontro;
  else
    escolhido := entrada;
  end if;
  new.valor_escolhido_centavos := escolhido;

  if new.forma_pagamento = 'credito' and coalesce(new.parcelas, 1) > 1 then
    new.valor_cobrado_centavos := round(escolhido * 1.09875);
  else
    new.valor_cobrado_centavos := escolhido;
  end if;

  if new.comprovante_path is not null
     and new.comprovante_path !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(png|jpe?g|webp|pdf)$' then
    new.comprovante_path := null;
  end if;

  return new;
end;
$$;

drop trigger if exists trava_valores_legado on public.inscricoes_legado;
create trigger trava_valores_legado
  before insert on public.inscricoes_legado
  for each row
  execute procedure public.trava_valores_legado();

-- Uploads só com nome UUID. Impede path traversal e overwrite aleatório.
drop policy if exists "envio de comprovante" on storage.objects;
create policy "envio de comprovante"
  on storage.objects
  for insert
  to anon, authenticated
  with check (
    bucket_id = 'comprovantes-encontro'
    and name ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(png|jpe?g|webp|pdf)$'
  );

drop policy if exists "envio de comprovante legado" on storage.objects;
create policy "envio de comprovante legado"
  on storage.objects
  for insert
  to anon, authenticated
  with check (
    bucket_id = 'comprovantes-legado'
    and name ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(png|jpe?g|webp|pdf)$'
  );

drop policy if exists "midia envia posts de eventos" on storage.objects;
create policy "midia envia posts de eventos"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'eventos-posts'
    and public.e_equipe_midia()
    and name ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(png|jpe?g|webp)$'
  );

revoke all on function public.e_acesso_master() from public;
grant execute on function public.e_acesso_master() to authenticated;

revoke all on function public.pode_ver_inscricoes() from public;
grant execute on function public.pode_ver_inscricoes() to authenticated;

revoke all on function public.pode_aprovar_pagamento() from public;
grant execute on function public.pode_aprovar_pagamento() to authenticated;

revoke all on function public.e_equipe_midia() from public;
grant execute on function public.e_equipe_midia() to authenticated;
