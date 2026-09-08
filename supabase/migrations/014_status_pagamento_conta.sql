-- Status do pagamento só para quem tem conta no site.
-- Rode no SQL Editor do Supabase. Pode rodar mais de uma vez.

revoke all on function public.status_pagamento_evento(uuid, text, integer) from public;
revoke all on function public.status_pagamento_evento(uuid, text, integer) from anon;
grant execute on function public.status_pagamento_evento(uuid, text, integer) to authenticated;

create or replace function public.status_pagamento_encontro()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select i.status
  from public.inscricoes_encontro i
  where lower(trim(i.email)) = lower(trim(coalesce(auth.jwt() ->> 'email', '')))
  order by i.created_at desc
  limit 1;
$$;

revoke all on function public.status_pagamento_encontro() from public;
grant execute on function public.status_pagamento_encontro() to authenticated;

create or replace function public.status_pagamento_legado()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select i.status
  from public.inscricoes_legado i
  where lower(trim(i.email)) = lower(trim(coalesce(auth.jwt() ->> 'email', '')))
  order by i.created_at desc
  limit 1;
$$;

revoke all on function public.status_pagamento_legado() from public;
grant execute on function public.status_pagamento_legado() to authenticated;

notify pgrst, 'reload schema';
