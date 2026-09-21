-- Eventos: leitura pública de todos os posts (no ar + programados).
-- Antes: anon/authenticated só viam publicar_em <= now(); mídia via todos.
-- Pode rodar mais de uma vez.

drop policy if exists "eventos publicos" on public.eventos;
create policy "eventos publicos"
  on public.eventos for select
  to anon, authenticated
  using (true);
