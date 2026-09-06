-- Inscrições do Encontro com Deus.
-- Rode este arquivo no SQL Editor do Supabase (pode rodar mais de uma vez sem quebrar).

create table if not exists public.inscricoes_encontro (
  id uuid primary key default gen_random_uuid(),
  nome_completo text not null,
  email text not null,
  telefone text not null,
  data_nascimento date not null,
  sexo text check (sexo in ('feminino', 'masculino', 'outro')),
  cidade text,
  nome_contato_emergencia text,
  telefone_contato_emergencia text,
  observacoes text,
  como_soube text,
  status text not null default 'pendente'
    check (status in ('pendente', 'confirmada', 'cancelada')),
  presente boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists inscricoes_encontro_created_at_idx
  on public.inscricoes_encontro (created_at desc);

alter table public.inscricoes_encontro enable row level security;

-- Lê a role em `perfis` sem disparar o RLS de `perfis` (evita recursão nas policies).
create or replace function public.e_lider_ou_dev()
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

-- Visitante sem conta pode se inscrever, mas não pode chegar já confirmado
-- nem marcar presença: esses dois campos são só do painel.
drop policy if exists "inscricao publica" on public.inscricoes_encontro;
create policy "inscricao publica"
  on public.inscricoes_encontro
  for insert
  to anon, authenticated
  with check (status = 'pendente' and presente = false);

drop policy if exists "leitura lider ou dev" on public.inscricoes_encontro;
create policy "leitura lider ou dev"
  on public.inscricoes_encontro
  for select
  to authenticated
  using (public.e_lider_ou_dev());

drop policy if exists "atualizacao lider ou dev" on public.inscricoes_encontro;
create policy "atualizacao lider ou dev"
  on public.inscricoes_encontro
  for update
  to authenticated
  using (public.e_lider_ou_dev())
  with check (public.e_lider_ou_dev());

drop policy if exists "exclusao lider ou dev" on public.inscricoes_encontro;
create policy "exclusao lider ou dev"
  on public.inscricoes_encontro
  for delete
  to authenticated
  using (public.e_lider_ou_dev());
