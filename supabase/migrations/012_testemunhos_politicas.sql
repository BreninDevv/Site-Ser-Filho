-- Recria as policies de testemunhos (select/insert/delete) e recarrega o schema.
-- Rode no SQL Editor do Supabase. Pode rodar mais de uma vez.

alter table public.testemunhos
  add column if not exists nome text;

alter table public.testemunhos
  add column if not exists video_url text;

alter table public.testemunhos
  add column if not exists descricao text;

alter table public.testemunhos
  add column if not exists previa_path text;

alter table public.testemunhos enable row level security;

grant select on table public.testemunhos to anon, authenticated;
grant insert, delete on table public.testemunhos to authenticated;

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

notify pgrst, 'reload schema';
