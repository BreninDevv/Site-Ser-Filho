-- Galeria Únicas (fotos/vídeos) — líder e mídia gerem no painel.
-- Pode rodar mais de uma vez.

create or replace function public.pode_gerenciar_unicas_midia()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.perfis
    where id = auth.uid()
      and role in (
        'dev',
        'apostolo',
        'midia',
        'lider',
        'lider_tesouraria',
        'pastor'
      )
  );
$$;

create table if not exists public.midia_unicas (
  id uuid primary key default gen_random_uuid(),
  titulo text not null default '',
  subtitulo text not null default '',
  arquivo_path text not null,
  tipo text not null check (tipo in ('imagem', 'video')),
  ordem integer not null default 0,
  criado_por uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists midia_unicas_ordem_idx
  on public.midia_unicas (ordem asc, created_at desc);

alter table public.midia_unicas enable row level security;

grant select on table public.midia_unicas to anon, authenticated;
grant insert, update, delete on table public.midia_unicas to authenticated;

drop policy if exists "midia unicas leitura publica" on public.midia_unicas;
create policy "midia unicas leitura publica"
  on public.midia_unicas
  for select
  to anon, authenticated
  using (true);

drop policy if exists "midia unicas equipe insere" on public.midia_unicas;
create policy "midia unicas equipe insere"
  on public.midia_unicas
  for insert
  to authenticated
  with check (public.pode_gerenciar_unicas_midia());

drop policy if exists "midia unicas equipe atualiza" on public.midia_unicas;
create policy "midia unicas equipe atualiza"
  on public.midia_unicas
  for update
  to authenticated
  using (public.pode_gerenciar_unicas_midia())
  with check (public.pode_gerenciar_unicas_midia());

drop policy if exists "midia unicas equipe apaga" on public.midia_unicas;
create policy "midia unicas equipe apaga"
  on public.midia_unicas
  for delete
  to authenticated
  using (public.pode_gerenciar_unicas_midia());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'unicas-midia',
  'unicas-midia',
  true,
  52428800,
  array[
    'image/png',
    'image/jpeg',
    'image/webp',
    'video/mp4',
    'video/webm'
  ]
)
on conflict (id) do update
  set public = true,
      file_size_limit = 52428800,
      allowed_mime_types = array[
        'image/png',
        'image/jpeg',
        'image/webp',
        'video/mp4',
        'video/webm'
      ];

drop policy if exists "leitura publica unicas midia" on storage.objects;
create policy "leitura publica unicas midia"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'unicas-midia');

drop policy if exists "equipe envia unicas midia" on storage.objects;
create policy "equipe envia unicas midia"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'unicas-midia'
    and public.pode_gerenciar_unicas_midia()
  );

drop policy if exists "equipe apaga unicas midia" on storage.objects;
create policy "equipe apaga unicas midia"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'unicas-midia'
    and public.pode_gerenciar_unicas_midia()
  );

notify pgrst, 'reload schema';
