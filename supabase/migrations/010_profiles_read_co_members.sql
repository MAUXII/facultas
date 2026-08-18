-- Allow reading profiles of people you share an active community with.
-- Fixes member lists showing "Membro" when institution_id differs or is null.

create or replace function public.shares_active_community_with(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.community_members me
    join public.community_members them
      on them.community_id = me.community_id
     and them.status = 'active'
    where me.user_id = auth.uid()
      and me.status = 'active'
      and them.user_id = target
  );
$$;

grant execute on function public.shares_active_community_with(uuid) to authenticated;

drop policy if exists "profiles_read_co_members" on public.profiles;
create policy "profiles_read_co_members"
  on public.profiles for select
  to authenticated
  using (public.shares_active_community_with(id));
