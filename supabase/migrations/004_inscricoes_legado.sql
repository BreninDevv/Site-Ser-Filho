-- Inscrições do Legado de Cristo.
-- Rode no SQL Editor do Supabase, depois do 003. Pode rodar mais de uma vez.

create table if not exists public.inscricoes_legado (
  id uuid primary key default gen_random_uuid(),
  nome_completo text not null,
  email text not null,
  telefone text not null,
  data_nascimento date not null,
  sexo text check (sexo in ('feminino', 'masculino', 'outro')),
  cidade text,
  nome_contato_emergencia text,
  telefone_contato_emergencia text,
  primeiro_legado boolean not null,
  status text not null default 'pendente'
    check (status in ('pendente', 'confirmada', 'cancelada')),
  presente boolean not null default false,
  forma_pagamento text
    check (forma_pagamento in ('pix', 'dinheiro', 'debito', 'credito')),
  parcelas smallint
    check (parcelas is null or parcelas between 1 and 3),
  valor_devido_centavos integer not null default 0,
  valor_escolhido_centavos integer not null default 0,
  valor_cobrado_centavos integer not null default 0,
  valor_pago_centavos integer not null default 0,
  comprovante_path text,
  pagamento_observacao text,
  aprovado_por uuid references auth.users (id),
  aprovado_em timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists inscricoes_legado_created_at_idx
  on public.inscricoes_legado (created_at desc);

alter table public.inscricoes_legado enable row level security;

drop policy if exists "inscricao publica legado" on public.inscricoes_legado;
create policy "inscricao publica legado"
  on public.inscricoes_legado
  for insert
  to anon, authenticated
  with check (
    status = 'pendente'
    and presente = false
    and valor_pago_centavos = 0
    and aprovado_por is null
    and aprovado_em is null
    and valor_escolhido_centavos > 0
  );

drop policy if exists "leitura legado lider ou master" on public.inscricoes_legado;
create policy "leitura legado lider ou master"
  on public.inscricoes_legado
  for select
  to authenticated
  using (public.pode_ver_inscricoes());

drop policy if exists "atualizacao legado master" on public.inscricoes_legado;
create policy "atualizacao legado master"
  on public.inscricoes_legado
  for update
  to authenticated
  using (public.pode_aprovar_pagamento())
  with check (public.pode_aprovar_pagamento());

drop policy if exists "exclusao legado master" on public.inscricoes_legado;
create policy "exclusao legado master"
  on public.inscricoes_legado
  for delete
  to authenticated
  using (public.pode_aprovar_pagamento());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'comprovantes-legado',
  'comprovantes-legado',
  false,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp', 'application/pdf']
)
on conflict (id) do update
  set public = false,
      file_size_limit = 5242880,
      allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp', 'application/pdf'];

drop policy if exists "envio de comprovante legado" on storage.objects;
create policy "envio de comprovante legado"
  on storage.objects
  for insert
  to anon, authenticated
  with check (bucket_id = 'comprovantes-legado');

drop policy if exists "leitura de comprovante legado" on storage.objects;
create policy "leitura de comprovante legado"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'comprovantes-legado'
    and public.pode_aprovar_pagamento()
  );

drop policy if exists "exclusao de comprovante legado" on storage.objects;
create policy "exclusao de comprovante legado"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'comprovantes-legado'
    and public.pode_aprovar_pagamento()
  );
