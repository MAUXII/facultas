-- Admin da sala precisa ver quem pediu para entrar (nome e avatar).
-- A 010 só libera perfis de quem já é membro ATIVO em comum; o pedido pendente
-- ficava como "Membro" sem foto e o admin não sabia quem estava aprovando.
--
-- Libera só o necessário: o perfil de um usuário com pedido PENDENTE numa sala
-- que eu administro (autor ou admin ativo, via is_community_admin).

create or replace function public.can_review_member(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.community_members them
    where them.user_id = target
      and them.status = 'pending'
      and public.is_community_admin(them.community_id)
  );
$$;

revoke all on function public.can_review_member(uuid) from public;
grant execute on function public.can_review_member(uuid) to authenticated;

drop policy if exists "profiles_read_pending_requests" on public.profiles;
create policy "profiles_read_pending_requests"
  on public.profiles for select
  to authenticated
  using (public.can_review_member(id));
