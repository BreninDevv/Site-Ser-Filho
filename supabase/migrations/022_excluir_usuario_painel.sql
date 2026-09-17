-- Excluir usuário pelo painel (pastor, tesouraria, apóstolo, dev).
-- Apaga perfil + conta Auth. Rode no SQL Editor. Pode rodar mais de uma vez.

create or replace function public.pode_excluir_usuarios()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.perfis p
    where p.id = auth.uid()
      and p.role in ('dev', 'tesouraria', 'apostolo', 'pastor')
  );
$$;

revoke all on function public.pode_excluir_usuarios() from public;
grant execute on function public.pode_excluir_usuarios() to authenticated;

create or replace function public.excluir_usuario_painel(alvo uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  meu_role text;
  alvo_role text;
begin
  if auth.uid() is null then
    raise exception 'nao autenticado';
  end if;

  if alvo is null or alvo = auth.uid() then
    raise exception 'nao pode excluir a si mesmo';
  end if;

  select role into meu_role
  from public.perfis
  where id = auth.uid();

  if meu_role is null
     or meu_role not in ('dev', 'tesouraria', 'apostolo', 'pastor') then
    raise exception 'sem permissao para excluir usuarios';
  end if;

  select role into alvo_role
  from public.perfis
  where id = alvo;

  if alvo_role is null then
    -- tenta apagar conta auth órfã mesmo assim
    delete from auth.users where id = alvo;
    return;
  end if;

  if alvo_role = 'dev' then
    raise exception 'nao e permitido excluir conta Dev';
  end if;

  -- Pastor nao remove acessos master
  if meu_role = 'pastor'
     and alvo_role in ('tesouraria', 'apostolo', 'pastor') then
    raise exception 'pastor so pode excluir discipulos, lideres, midia e pendentes';
  end if;

  delete from public.perfis where id = alvo;
  delete from auth.users where id = alvo;
end;
$$;

revoke all on function public.excluir_usuario_painel(uuid) from public;
grant execute on function public.excluir_usuario_painel(uuid) to authenticated;

notify pgrst, 'reload schema';
