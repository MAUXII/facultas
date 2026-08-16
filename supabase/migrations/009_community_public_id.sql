-- Short public id for community URLs; uuid stays the PK.

alter table public.communities
  add column if not exists public_id text;

create or replace function public.gen_community_public_id()
returns text
language plpgsql
as $$
declare
  chars constant text := '23456789abcdefghjkmnpqrstuvwxyz';
  out text := '';
  i int;
begin
  for i in 1..8 loop
    out := out || substr(chars, 1 + floor(random() * 31)::int, 1);
  end loop;
  return out;
end;
$$;

do $$
declare
  r record;
  candidate text;
begin
  for r in select id from public.communities where public_id is null loop
    loop
      candidate := public.gen_community_public_id();
      exit when not exists (
        select 1 from public.communities c where c.public_id = candidate
      );
    end loop;
    update public.communities set public_id = candidate where id = r.id;
  end loop;
end;
$$;

alter table public.communities
  alter column public_id set not null;

create unique index if not exists communities_public_id_uidx
  on public.communities (public_id);

drop function if exists public.community_by_access_code(text);

create function public.community_by_access_code(p_code text)
returns table (id uuid, public_id text, requires_approval boolean)
language sql
stable
security definer
set search_path = public
as $$
  select c.id, c.public_id, c.requires_approval
  from public.communities c
  where c.access_code = upper(regexp_replace(trim(coalesce(p_code, '')), '[\s-]+', '', 'g'))
  limit 1;
$$;

revoke all on function public.community_by_access_code(text) from public;
revoke all on function public.community_by_access_code(text) from anon;
grant execute on function public.community_by_access_code(text) to authenticated;
