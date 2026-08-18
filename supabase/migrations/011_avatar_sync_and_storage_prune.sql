-- Backfill profiles.avatar_url from auth metadata + latest storage avatar.
-- Also prune orphan avatar-* objects that are not the current profile URL.

-- 1) Auth metadata (avatar_url or picture)
update public.profiles p
set
  avatar_url = coalesce(
    nullif(trim(u.raw_user_meta_data->>'avatar_url'), ''),
    nullif(trim(u.raw_user_meta_data->>'picture'), '')
  ),
  updated_at = now()
from auth.users u
where u.id = p.id
  and (p.avatar_url is null or btrim(p.avatar_url) = '')
  and (
    nullif(trim(u.raw_user_meta_data->>'avatar_url'), '') is not null
    or nullif(trim(u.raw_user_meta_data->>'picture'), '') is not null
  );

-- 2) Latest avatar-* object in storage, when profile still has no URL
--    Builds public URL from an existing avatar_url in the table when possible.
with base as (
  select regexp_replace(
    avatar_url,
    '/storage/v1/object/public/covers/.*$',
    ''
  ) as root
  from public.profiles
  where avatar_url like '%/storage/v1/object/public/covers/%'
  limit 1
),
latest_avatar as (
  select distinct on ((storage.foldername(o.name))[1])
    (storage.foldername(o.name))[1]::uuid as user_id,
    o.name as object_path
  from storage.objects o
  where o.bucket_id = 'covers'
    and o.name ~ '/avatar'
  order by (storage.foldername(o.name))[1], o.created_at desc nulls last
)
update public.profiles p
set
  avatar_url = (select root from base) || '/storage/v1/object/public/covers/' || la.object_path,
  updated_at = now()
from latest_avatar la
where p.id = la.user_id
  and (p.avatar_url is null or btrim(p.avatar_url) = '')
  and exists (select 1 from base);

-- 3) Delete orphan avatar files that are not the current profiles.avatar_url
delete from storage.objects o
where o.bucket_id = 'covers'
  and o.name ~ '/avatar'
  and not exists (
    select 1
    from public.profiles p
    where p.avatar_url is not null
      and p.avatar_url like '%/storage/v1/object/public/covers/' || o.name
  );

-- 4) Keep signup trigger in sync with picture as well
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, username, avatar_url)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'User'),
    nullif(new.raw_user_meta_data->>'username', ''),
    coalesce(
      nullif(new.raw_user_meta_data->>'avatar_url', ''),
      nullif(new.raw_user_meta_data->>'picture', '')
    )
  )
  on conflict (id) do update
    set email = excluded.email,
        name = coalesce(nullif(excluded.name, ''), public.profiles.name),
        username = coalesce(excluded.username, public.profiles.username),
        avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
        updated_at = now(),
        last_login_at = now();
  return new;
end;
$$;
