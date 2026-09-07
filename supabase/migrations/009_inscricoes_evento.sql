-- Inscrição opcional por evento. Controle: Dev, Tesouraria e Apóstolo.
-- Rode no SQL Editor do Supabase. Pode rodar mais de uma vez.

alter table public.eventos
  add column if not exists exige_inscricao boolean not null default false;

alter table public.eventos
  add column if not exists valor_centavos integer not null default 0;

create table if not exists public.inscricoes_evento (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references public.eventos (id) on delete cascade,
  nome text not null,
  idade integer not null check (idade between 1 and 120),
  status text not null default 'pendente'
    check (status in ('pendente', 'confirmada', 'cancelada')),
  forma_pagamento text
    check (forma_pagamento in ('pix', 'dinheiro', 'debito', 'credito')),
  valor_cobrado_centavos integer not null default 0,
  valor_pago_centavos integer not null default 0,
  comprovante_path text,
  aprovado_por uuid references auth.users (id),
  aprovado_em timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists inscricoes_evento_created_at_idx
  on public.inscricoes_evento (created_at desc);

create index if not exists inscricoes_evento_evento_id_idx
  on public.inscricoes_evento (evento_id);

alter table public.inscricoes_evento enable row level security;

grant select, insert on table public.inscricoes_evento to anon, authenticated;
grant update, delete on table public.inscricoes_evento to authenticated;

drop policy if exists "inscricao publica evento" on public.inscricoes_evento;
create policy "inscricao publica evento"
  on public.inscricoes_evento
  for insert
  to anon, authenticated
  with check (
    status = 'pendente'
    and valor_pago_centavos = 0
    and aprovado_por is null
    and aprovado_em is null
  );

drop policy if exists "leitura inscricoes evento master" on public.inscricoes_evento;
create policy "leitura inscricoes evento master"
  on public.inscricoes_evento
  for select
  to authenticated
  using (public.pode_aprovar_pagamento());

drop policy if exists "atualizacao inscricoes evento master" on public.inscricoes_evento;
create policy "atualizacao inscricoes evento master"
  on public.inscricoes_evento
  for update
  to authenticated
  using (public.pode_aprovar_pagamento())
  with check (public.pode_aprovar_pagamento());

drop policy if exists "exclusao inscricoes evento master" on public.inscricoes_evento;
create policy "exclusao inscricoes evento master"
  on public.inscricoes_evento
  for delete
  to authenticated
  using (public.pode_aprovar_pagamento());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'comprovantes-eventos',
  'comprovantes-eventos',
  false,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp', 'application/pdf']
)
on conflict (id) do update
  set public = false,
      file_size_limit = 5242880,
      allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp', 'application/pdf'];

drop policy if exists "envio de comprovante evento" on storage.objects;
create policy "envio de comprovante evento"
  on storage.objects
  for insert
  to anon, authenticated
  with check (bucket_id = 'comprovantes-eventos');

drop policy if exists "leitura de comprovante evento" on storage.objects;
create policy "leitura de comprovante evento"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'comprovantes-eventos'
    and public.pode_aprovar_pagamento()
  );

drop policy if exists "exclusao de comprovante evento" on storage.objects;
create policy "exclusao de comprovante evento"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'comprovantes-eventos'
    and public.pode_aprovar_pagamento()
  );
