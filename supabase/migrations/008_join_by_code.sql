-- Look up a community by access code without listing private hubs.
-- Knowing the code is the capability; RLS still hides the row from Campus.

create unique index if not exists communities_access_code_uidx
  on public.communities (access_code)
  where access_code is not null;

create or replace function public.community_by_access_code(p_code text)
returns table (id uuid, requires_approval boolean)
language sql
stable
security definer
set search_path = public
as $$
  select c.id, c.requires_approval
  from public.communities c
  where c.access_code = upper(regexp_replace(trim(coalesce(p_code, '')), '[\s-]+', '', 'g'))
  limit 1;
$$;

revoke all on function public.community_by_access_code(text) from public;
revoke all on function public.community_by_access_code(text) from anon;
grant execute on function public.community_by_access_code(text) to authenticated;
