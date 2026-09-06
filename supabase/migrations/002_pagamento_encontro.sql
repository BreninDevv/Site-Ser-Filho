-- Pagamento das inscrições do Encontro com Deus.
-- Rode no SQL Editor do Supabase, depois da 001. Pode rodar mais de uma vez.

-- Dinheiro sempre em centavos (inteiro), para não haver erro de arredondamento.
alter table public.inscricoes_encontro
  add column if not exists forma_pagamento text
    check (forma_pagamento in ('pix', 'dinheiro', 'debito', 'credito')),
  add column if not exists parcelas smallint
    check (parcelas is null or parcelas between 1 and 3),
  add column if not exists leva_crianca boolean not null default false,
  add column if not exists qtd_criancas smallint not null default 0
    check (qtd_criancas >= 0 and qtd_criancas <= 10),
  -- Total da inscrição (encontro + crianças), congelado no momento do envio.
  add column if not exists valor_devido_centavos integer not null default 0,
  -- Parte do total que a pessoa escolheu quitar agora (entrada ou tudo).
  add column if not exists valor_escolhido_centavos integer not null default 0,
  -- O que sai no comprovante: igual ao escolhido, exceto crédito parcelado (tem taxa).
  add column if not exists valor_cobrado_centavos integer not null default 0,
  -- Só o dev preenche, ao confirmar que o dinheiro entrou.
  add column if not exists valor_pago_centavos integer not null default 0,
  add column if not exists comprovante_path text,
  add column if not exists pagamento_observacao text,
  add column if not exists aprovado_por uuid references auth.users (id),
  add column if not exists aprovado_em timestamptz;

-- Duas funções, dois níveis de acesso. Para liberar uma role nova no futuro
-- (ex.: 'tesoureiro'), basta acrescentar o nome na lista da função certa:
-- nenhuma policy nem código da aplicação precisa mudar.
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
      and perfis.role in ('dev', 'lider')
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
      and perfis.role in ('dev')
  );
$$;

-- A inscrição pública não pode chegar aprovada, paga, confirmada nem com
-- presença marcada. Os valores em si são recalculados no servidor e revisados
-- pelo dev antes da aprovação, por isso aqui só travamos o que é sensível.
drop policy if exists "inscricao publica" on public.inscricoes_encontro;
create policy "inscricao publica"
  on public.inscricoes_encontro
  for insert
  to anon, authenticated
  with check (
    status = 'pendente'
    and presente = false
    and valor_pago_centavos = 0
    and aprovado_por is null
    and aprovado_em is null
    and valor_escolhido_centavos > 0
    and (leva_crianca or qtd_criancas = 0)
  );

drop policy if exists "leitura lider ou dev" on public.inscricoes_encontro;
create policy "leitura lider ou dev"
  on public.inscricoes_encontro
  for select
  to authenticated
  using (public.pode_ver_inscricoes());

-- Aprovar, recusar, marcar presença e corrigir valores: só quem aprova pagamento.
drop policy if exists "atualizacao lider ou dev" on public.inscricoes_encontro;
drop policy if exists "atualizacao dev" on public.inscricoes_encontro;
create policy "atualizacao dev"
  on public.inscricoes_encontro
  for update
  to authenticated
  using (public.pode_aprovar_pagamento())
  with check (public.pode_aprovar_pagamento());

drop policy if exists "exclusao lider ou dev" on public.inscricoes_encontro;
drop policy if exists "exclusao dev" on public.inscricoes_encontro;
create policy "exclusao dev"
  on public.inscricoes_encontro
  for delete
  to authenticated
  using (public.pode_aprovar_pagamento());

drop function if exists public.e_lider_ou_dev();

-- Comprovante é documento financeiro: bucket privado, lido só por URL assinada.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'comprovantes-encontro',
  'comprovantes-encontro',
  false,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp', 'application/pdf']
)
on conflict (id) do update
  set public = false,
      file_size_limit = 5242880,
      allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp', 'application/pdf'];

drop policy if exists "envio de comprovante" on storage.objects;
create policy "envio de comprovante"
  on storage.objects
  for insert
  to anon, authenticated
  with check (bucket_id = 'comprovantes-encontro');

drop policy if exists "leitura de comprovante" on storage.objects;
create policy "leitura de comprovante"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'comprovantes-encontro'
    and public.pode_aprovar_pagamento()
  );

drop policy if exists "exclusao de comprovante" on storage.objects;
create policy "exclusao de comprovante"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'comprovantes-encontro'
    and public.pode_aprovar_pagamento()
  );
