-- Inscrições do evento Únicas (somente mulheres).
-- Não altera Legado nem inscricoes_evento.
-- Rode no SQL Editor do Supabase. Pode rodar mais de uma vez.
--
-- SEGURANÇA EM PROFUNDIDADE: inserir só com sexo = 'feminino'.
-- O frontend também filtra; o banco é a garantia.

create table if not exists public.inscricoes_unicas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  email text not null,
  telefone text not null,
  idade integer not null check (idade between 1 and 120),
  sexo text not null default 'feminino'
    check (sexo = 'feminino'),
  status text not null default 'pendente'
    check (status in ('pendente', 'confirmada', 'cancelada')),
  created_at timestamptz not null default now()
);

create index if not exists inscricoes_unicas_created_at_idx
  on public.inscricoes_unicas (created_at desc);

alter table public.inscricoes_unicas enable row level security;

grant select, insert on table public.inscricoes_unicas to anon, authenticated;
grant update, delete on table public.inscricoes_unicas to authenticated;

drop policy if exists "inscricao publica unicas" on public.inscricoes_unicas;
create policy "inscricao publica unicas"
  on public.inscricoes_unicas
  for insert
  to anon, authenticated
  with check (
    status = 'pendente'
    and sexo = 'feminino'
  );

drop policy if exists "leitura inscricoes unicas equipe" on public.inscricoes_unicas;
create policy "leitura inscricoes unicas equipe"
  on public.inscricoes_unicas
  for select
  to authenticated
  using (public.pode_aprovar_pagamento() or public.e_equipe_midia());

drop policy if exists "atualizacao inscricoes unicas equipe" on public.inscricoes_unicas;
create policy "atualizacao inscricoes unicas equipe"
  on public.inscricoes_unicas
  for update
  to authenticated
  using (public.pode_aprovar_pagamento())
  with check (public.pode_aprovar_pagamento());

drop policy if exists "exclusao inscricoes unicas equipe" on public.inscricoes_unicas;
create policy "exclusao inscricoes unicas equipe"
  on public.inscricoes_unicas
  for delete
  to authenticated
  using (public.pode_aprovar_pagamento());
