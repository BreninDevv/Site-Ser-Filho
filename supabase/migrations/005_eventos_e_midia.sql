-- Role mídia: cuida de eventos e testemunhos.
-- Rode no SQL Editor do Supabase. Pode rodar mais de uma vez.

create or replace function public.e_equipe_midia()
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
      and perfis.role in ('dev', 'tesouraria', 'apostolo', 'midia')
  );
$$;

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

create table if not exists public.eventos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  imagem_path text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.testemunhos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  video_url text not null,
  created_at timestamptz not null default now()
);

alter table public.eventos enable row level security;
alter table public.testemunhos enable row level security;

drop policy if exists "eventos publicos" on public.eventos;
create policy "eventos publicos"
  on public.eventos for select
  to anon, authenticated
  using (true);

drop policy if exists "eventos midia inserem" on public.eventos;
create policy "eventos midia inserem"
  on public.eventos for insert
  to authenticated
  with check (public.e_equipe_midia());

drop policy if exists "eventos midia apagam" on public.eventos;
create policy "eventos midia apagam"
  on public.eventos for delete
  to authenticated
  using (public.e_equipe_midia());

drop policy if exists "testemunhos publicos" on public.testemunhos;
create policy "testemunhos publicos"
  on public.testemunhos for select
  to anon, authenticated
  using (true);

drop policy if exists "testemunhos midia inserem" on public.testemunhos;
create policy "testemunhos midia inserem"
  on public.testemunhos for insert
  to authenticated
  with check (public.e_equipe_midia());

drop policy if exists "testemunhos midia apagam" on public.testemunhos;
create policy "testemunhos midia apagam"
  on public.testemunhos for delete
  to authenticated
  using (public.e_equipe_midia());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'eventos-posts',
  'eventos-posts',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
  set public = true,
      file_size_limit = 5242880,
      allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp'];

drop policy if exists "leitura publica de posts de eventos" on storage.objects;
create policy "leitura publica de posts de eventos"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'eventos-posts');

drop policy if exists "midia envia posts de eventos" on storage.objects;
create policy "midia envia posts de eventos"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'eventos-posts'
    and public.e_equipe_midia()
  );

drop policy if exists "midia apaga posts de eventos" on storage.objects;
create policy "midia apaga posts de eventos"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'eventos-posts'
    and public.e_equipe_midia()
  );
