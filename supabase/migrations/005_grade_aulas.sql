-- Grade: weekly aulas on comunidade turma.
-- Members read. Admins insert. Only kind turma.

create table if not exists public.aulas (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  subject text not null,
  teacher text not null,
  weekday text not null
    check (weekday in ('mon', 'tue', 'wed', 'thu', 'fri', 'sat')),
  starts_at time not null,
  ends_at time not null,
  room text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_aulas_community
  on public.aulas (community_id, weekday, starts_at);

alter table public.aulas enable row level security;

create or replace function public.community_is_turma(cid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.communities
    where id = cid
      and kind = 'turma'
  );
$$;

grant execute on function public.community_is_turma(uuid) to authenticated;

drop policy if exists "aulas_select" on public.aulas;
create policy "aulas_select"
  on public.aulas for select
  to authenticated
  using (public.is_community_member(community_id));

drop policy if exists "aulas_insert" on public.aulas;
create policy "aulas_insert"
  on public.aulas for insert
  to authenticated
  with check (
    public.is_community_admin(community_id)
    and public.community_is_turma(community_id)
  );
