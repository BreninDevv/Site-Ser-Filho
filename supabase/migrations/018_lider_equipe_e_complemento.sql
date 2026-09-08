-- Líder só lê inscrições do pastor da equipe dele.
-- Complemento de pagamento (entrada) depois da tesouraria aprovar.
-- Rode no SQL Editor do Supabase. Pode rodar mais de uma vez.

create or replace function public.pastor_id_da_equipe_do_usuario()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select e.pastor_id
  from public.perfis p
  join public.equipes_pastorais e on e.id = p.equipe_id
  where p.id = auth.uid()
  limit 1;
$$;

drop policy if exists "leitura lider ou dev" on public.inscricoes_encontro;
drop policy if exists "leitura inscricoes encontro" on public.inscricoes_encontro;
create policy "leitura inscricoes encontro"
  on public.inscricoes_encontro
  for select
  to authenticated
  using (
    public.e_acesso_master()
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

alter table public.inscricoes_encontro
  add column if not exists complemento_pendente boolean not null default false;

alter table public.inscricoes_encontro
  add column if not exists complemento_forma text
    check (complemento_forma is null or complemento_forma in ('pix', 'dinheiro', 'debito', 'credito'));

alter table public.inscricoes_encontro
  add column if not exists complemento_valor_centavos integer not null default 0;

alter table public.inscricoes_encontro
  add column if not exists complemento_comprovante_path text;

alter table public.inscricoes_encontro
  add column if not exists complemento_enviado_em timestamptz;

alter table public.inscricoes_legado
  add column if not exists complemento_pendente boolean not null default false;

alter table public.inscricoes_legado
  add column if not exists complemento_forma text
    check (complemento_forma is null or complemento_forma in ('pix', 'dinheiro', 'debito', 'credito'));

alter table public.inscricoes_legado
  add column if not exists complemento_valor_centavos integer not null default 0;

alter table public.inscricoes_legado
  add column if not exists complemento_comprovante_path text;

alter table public.inscricoes_legado
  add column if not exists complemento_enviado_em timestamptz;

create or replace function public.detalhe_pagamento_encontro()
returns table (
  id uuid,
  status text,
  valor_devido_centavos integer,
  valor_pago_centavos integer,
  falta_centavos integer,
  complemento_pendente boolean
)
language sql
security definer
stable
set search_path = public
as $$
  select
    i.id,
    i.status,
    i.valor_devido_centavos,
    i.valor_pago_centavos,
    greatest(i.valor_devido_centavos - i.valor_pago_centavos, 0),
    i.complemento_pendente
  from public.inscricoes_encontro i
  where lower(trim(i.email)) = lower(trim(coalesce(auth.jwt() ->> 'email', '')))
  order by i.created_at desc
  limit 1;
$$;

create or replace function public.detalhe_pagamento_legado()
returns table (
  id uuid,
  status text,
  valor_devido_centavos integer,
  valor_pago_centavos integer,
  falta_centavos integer,
  complemento_pendente boolean
)
language sql
security definer
stable
set search_path = public
as $$
  select
    i.id,
    i.status,
    i.valor_devido_centavos,
    i.valor_pago_centavos,
    greatest(i.valor_devido_centavos - i.valor_pago_centavos, 0),
    i.complemento_pendente
  from public.inscricoes_legado i
  where lower(trim(i.email)) = lower(trim(coalesce(auth.jwt() ->> 'email', '')))
  order by i.created_at desc
  limit 1;
$$;

create or replace function public.enviar_complemento_encontro(
  p_forma text,
  p_comprovante text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_devido integer;
  v_pago integer;
begin
  if auth.uid() is null then
    raise exception 'nao autenticado';
  end if;

  if p_forma not in ('pix', 'dinheiro', 'debito', 'credito') then
    raise exception 'forma invalida';
  end if;

  if p_forma in ('pix', 'credito') and coalesce(trim(p_comprovante), '') = '' then
    raise exception 'comprovante obrigatorio';
  end if;

  select i.id, i.valor_devido_centavos, i.valor_pago_centavos
    into v_id, v_devido, v_pago
  from public.inscricoes_encontro i
  where lower(trim(i.email)) = lower(trim(coalesce(auth.jwt() ->> 'email', '')))
    and i.status = 'confirmada'
    and i.complemento_pendente = false
    and i.valor_devido_centavos > i.valor_pago_centavos
  order by i.created_at desc
  limit 1;

  if v_id is null then
    raise exception 'nao ha saldo para completar';
  end if;

  update public.inscricoes_encontro
  set
    complemento_pendente = true,
    complemento_forma = p_forma,
    complemento_valor_centavos = v_devido - v_pago,
    complemento_comprovante_path = nullif(trim(p_comprovante), ''),
    complemento_enviado_em = now()
  where id = v_id;

  return v_id;
end;
$$;

create or replace function public.enviar_complemento_legado(
  p_forma text,
  p_comprovante text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_devido integer;
  v_pago integer;
begin
  if auth.uid() is null then
    raise exception 'nao autenticado';
  end if;

  if p_forma not in ('pix', 'dinheiro', 'debito', 'credito') then
    raise exception 'forma invalida';
  end if;

  if p_forma in ('pix', 'credito') and coalesce(trim(p_comprovante), '') = '' then
    raise exception 'comprovante obrigatorio';
  end if;

  select i.id, i.valor_devido_centavos, i.valor_pago_centavos
    into v_id, v_devido, v_pago
  from public.inscricoes_legado i
  where lower(trim(i.email)) = lower(trim(coalesce(auth.jwt() ->> 'email', '')))
    and i.status = 'confirmada'
    and i.complemento_pendente = false
    and i.valor_devido_centavos > i.valor_pago_centavos
  order by i.created_at desc
  limit 1;

  if v_id is null then
    raise exception 'nao ha saldo para completar';
  end if;

  update public.inscricoes_legado
  set
    complemento_pendente = true,
    complemento_forma = p_forma,
    complemento_valor_centavos = v_devido - v_pago,
    complemento_comprovante_path = nullif(trim(p_comprovante), ''),
    complemento_enviado_em = now()
  where id = v_id;

  return v_id;
end;
$$;

revoke all on function public.pastor_id_da_equipe_do_usuario() from public, anon;
revoke all on function public.detalhe_pagamento_encontro() from public, anon;
revoke all on function public.detalhe_pagamento_legado() from public, anon;
revoke all on function public.enviar_complemento_encontro(text, text) from public, anon;
revoke all on function public.enviar_complemento_legado(text, text) from public, anon;

grant execute on function public.detalhe_pagamento_encontro() to authenticated;
grant execute on function public.detalhe_pagamento_legado() to authenticated;
grant execute on function public.enviar_complemento_encontro(text, text) to authenticated;
grant execute on function public.enviar_complemento_legado(text, text) to authenticated;

notify pgrst, 'reload schema';
