-- Consulta pública só do status do pagamento (nome + idade + evento).
-- Rode no SQL Editor do Supabase. Pode rodar mais de uma vez.

create or replace function public.status_pagamento_evento(
  p_evento_id uuid,
  p_nome text,
  p_idade integer
)
returns text
language sql
security definer
stable
set search_path = public
as $$
  select i.status
  from public.inscricoes_evento i
  where i.evento_id = p_evento_id
    and i.idade = p_idade
    and lower(trim(i.nome)) = lower(trim(p_nome))
  order by i.created_at desc
  limit 1;
$$;

revoke all on function public.status_pagamento_evento(uuid, text, integer) from public;
grant execute on function public.status_pagamento_evento(uuid, text, integer) to anon, authenticated;
