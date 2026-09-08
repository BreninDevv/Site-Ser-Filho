-- Sexo na inscrição de eventos, para a planilha do painel.
-- Rode no SQL Editor do Supabase. Pode rodar mais de uma vez.

alter table public.inscricoes_evento
  add column if not exists sexo text
    check (sexo in ('feminino', 'masculino', 'outro'));
