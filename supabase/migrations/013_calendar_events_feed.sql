-- Personal calendar events + secret ICS subscription token.

alter table public.profiles
  add column if not exists calendar_feed_token text;

update public.profiles
set calendar_feed_token = encode(gen_random_bytes(24), 'hex')
where calendar_feed_token is null;

alter table public.profiles
  alter column calendar_feed_token set default encode(gen_random_bytes(24), 'hex'),
  alter column calendar_feed_token set not null;

create unique index if not exists profiles_calendar_feed_token_unique
  on public.profiles (calendar_feed_token);

create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text not null default '',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  color text not null default 'blue',
  category text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at >= starts_at)
);

create index if not exists idx_calendar_events_user_starts
  on public.calendar_events (user_id, starts_at);

alter table public.calendar_events enable row level security;

drop policy if exists "calendar_events_select_own" on public.calendar_events;
create policy "calendar_events_select_own"
  on public.calendar_events for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "calendar_events_insert_own" on public.calendar_events;
create policy "calendar_events_insert_own"
  on public.calendar_events for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "calendar_events_update_own" on public.calendar_events;
create policy "calendar_events_update_own"
  on public.calendar_events for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "calendar_events_delete_own" on public.calendar_events;
create policy "calendar_events_delete_own"
  on public.calendar_events for delete
  to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.calendar_events to authenticated;

-- Public feed lookup by secret token (calendar apps have no user session).
create or replace function public.resolve_calendar_feed_token(p_token text)
returns table (owner_id uuid, cal_name text)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if p_token is null or char_length(p_token) < 32 then
    return;
  end if;

  return query
  select
    p.id,
    coalesce(nullif(p.name, ''), 'Facultas')::text
  from public.profiles p
  where p.calendar_feed_token = p_token
  limit 1;
end;
$$;

create or replace function public.calendar_feed_by_token(p_token text)
returns table (
  event_id uuid,
  title text,
  description text,
  starts_at timestamptz,
  ends_at timestamptz,
  updated_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  uid uuid;
begin
  select r.owner_id into uid
  from public.resolve_calendar_feed_token(p_token) r;

  if uid is null then
    return;
  end if;

  return query
  select
    e.id,
    e.title,
    e.description,
    e.starts_at,
    e.ends_at,
    e.updated_at
  from public.calendar_events e
  where e.user_id = uid
  order by e.starts_at;
end;
$$;

revoke all on function public.resolve_calendar_feed_token(text) from public;
revoke all on function public.calendar_feed_by_token(text) from public;
grant execute on function public.resolve_calendar_feed_token(text) to anon, authenticated;
grant execute on function public.calendar_feed_by_token(text) to anon, authenticated;
