-- Chave Pix configurável + Líder/Tesouraria aprova pagamento.
-- Comprovante obrigatório também no cartão (débito/crédito) no complemento.
-- Rode no SQL Editor. Pode rodar mais de uma vez.

create table if not exists public.configuracoes_igreja (
  id int primary key default 1 check (id = 1),
  chave_pix text not null default 'aefa7931-3830-4fc9-a99b-656b0db25d05',
  atualizado_em timestamptz not null default now(),
  atualizado_por uuid references auth.users (id) on delete set null
);

insert into public.configuracoes_igreja (id, chave_pix)
values (1, 'aefa7931-3830-4fc9-a99b-656b0db25d05')
on conflict (id) do nothing;

alter table public.configuracoes_igreja enable row level security;

drop policy if exists "config igreja leitura" on public.configuracoes_igreja;
create policy "config igreja leitura"
  on public.configuracoes_igreja
  for select
  to anon, authenticated
  using (true);

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
      and perfis.role in ('dev', 'tesouraria', 'apostolo', 'lider_tesouraria')
  );
$$;

create or replace function public.pode_editar_chave_pix()
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

create or replace function public.obter_chave_pix()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    (select nullif(trim(c.chave_pix), '') from public.configuracoes_igreja c where c.id = 1),
    'aefa7931-3830-4fc9-a99b-656b0db25d05'
  );
$$;

create or replace function public.salvar_chave_pix(p_chave text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_chave text;
begin
  if auth.uid() is null then
    raise exception 'nao autenticado';
  end if;

  if not public.pode_editar_chave_pix() then
    raise exception 'sem permissao para editar chave pix';
  end if;

  v_chave := left(trim(coalesce(p_chave, '')), 200);
  if length(v_chave) < 5 then
    raise exception 'chave pix invalida';
  end if;

  insert into public.configuracoes_igreja (id, chave_pix, atualizado_em, atualizado_por)
  values (1, v_chave, now(), auth.uid())
  on conflict (id) do update
    set chave_pix = excluded.chave_pix,
        atualizado_em = now(),
        atualizado_por = auth.uid();

  return v_chave;
end;
$$;

revoke all on function public.pode_aprovar_pagamento() from public;
grant execute on function public.pode_aprovar_pagamento() to authenticated;

revoke all on function public.pode_editar_chave_pix() from public;
grant execute on function public.pode_editar_chave_pix() to authenticated;

revoke all on function public.obter_chave_pix() from public;
grant execute on function public.obter_chave_pix() to anon, authenticated;

revoke all on function public.salvar_chave_pix(text) from public;
grant execute on function public.salvar_chave_pix(text) to authenticated;

-- Complemento: cartão (débito/crédito) e Pix exigem comprovante
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

  if p_forma in ('pix', 'credito', 'debito') and coalesce(trim(p_comprovante), '') = '' then
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

  if p_forma in ('pix', 'credito', 'debito') and coalesce(trim(p_comprovante), '') = '' then
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

notify pgrst, 'reload schema';
