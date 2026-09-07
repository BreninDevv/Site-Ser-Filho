-- Testemunhos em formato Reel: prévia, descrição e link para YouTube/Instagram.
-- Rode no SQL Editor do Supabase. Pode rodar mais de uma vez.

alter table public.testemunhos
  add column if not exists nome text;

alter table public.testemunhos
  add column if not exists video_url text;

alter table public.testemunhos
  add column if not exists descricao text;

alter table public.testemunhos
  add column if not exists previa_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'testemunhos-previas',
  'testemunhos-previas',
  true,
  12582912,
  array['image/png', 'image/jpeg', 'image/webp', 'video/mp4', 'video/webm']
)
on conflict (id) do update
  set public = true,
      file_size_limit = 12582912,
      allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp', 'video/mp4', 'video/webm'];

drop policy if exists "leitura publica de previas de testemunhos" on storage.objects;
create policy "leitura publica de previas de testemunhos"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'testemunhos-previas');

drop policy if exists "midia envia previas de testemunhos" on storage.objects;
create policy "midia envia previas de testemunhos"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'testemunhos-previas'
    and public.e_equipe_midia()
  );

drop policy if exists "midia apaga previas de testemunhos" on storage.objects;
create policy "midia apaga previas de testemunhos"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'testemunhos-previas'
    and public.e_equipe_midia()
  );
