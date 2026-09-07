-- Eventos: descrição, programação e edição pela mídia.
-- Rode no SQL Editor do Supabase. Pode rodar mais de uma vez.

grant execute on function public.e_equipe_midia() to authenticated, service_role;

alter table public.eventos
  add column if not exists descricao text;

alter table public.eventos
  add column if not exists publicar_em timestamptz;

update public.eventos
  set publicar_em = created_at
  where publicar_em is null;

alter table public.eventos
  alter column publicar_em set default now();

alter table public.eventos
  alter column publicar_em set not null;

create index if not exists eventos_publicar_em_idx
  on public.eventos (publicar_em desc);

drop policy if exists "eventos publicos" on public.eventos;
create policy "eventos publicos"
  on public.eventos for select
  to anon, authenticated
  using (publicar_em <= now());

drop policy if exists "eventos midia leem todos" on public.eventos;
create policy "eventos midia leem todos"
  on public.eventos for select
  to authenticated
  using (public.e_equipe_midia());

drop policy if exists "eventos midia atualizam" on public.eventos;
create policy "eventos midia atualizam"
  on public.eventos for update
  to authenticated
  using (public.e_equipe_midia())
  with check (public.e_equipe_midia());
