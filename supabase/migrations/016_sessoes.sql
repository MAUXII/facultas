-- Sessão de presença na comunidade.
-- institution_id deixa de ser obrigatório: grupo e evento podem não ter instituição.
-- Quem abre é admin (host_id = auth.uid() e is_community_admin).
-- Check-in é linha própria em session_attendance. Não copia para calendar_events.
-- O feed ICS soma a sessão de quem marcou presença. O dono vem do token;
-- auth.uid() aqui é nulo. A janela de 1 hora acompanha SESSAO_BLOCK_MS.

alter table public.sessions
  alter column institution_id drop not null;

drop policy if exists "sessions_insert" on public.sessions;
create policy "sessions_insert"
  on public.sessions for insert
  to authenticated
  with check (
    host_id = auth.uid()
    and community_id is not null
    and public.is_community_admin(community_id)
  );

create table if not exists public.session_attendance (
  session_id uuid not null references public.sessions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  checked_in_at timestamptz not null default now(),
  primary key (session_id, user_id)
);

create index if not exists idx_attendance_user
  on public.session_attendance (user_id, checked_in_at desc);

alter table public.session_attendance enable row level security;

grant select, insert, delete on public.session_attendance to authenticated;

drop policy if exists "attendance_select" on public.session_attendance;
create policy "attendance_select"
  on public.session_attendance for select
  to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1
      from public.sessions s
      where s.id = session_id
        and (
          s.host_id = auth.uid()
          or public.is_community_admin(s.community_id)
        )
    )
  );

drop policy if exists "attendance_insert" on public.session_attendance;
create policy "attendance_insert"
  on public.session_attendance for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.sessions s
      where s.id = session_id
        and s.status = 'open'
        and s.community_id is not null
        and public.is_community_member(s.community_id)
    )
  );

drop policy if exists "attendance_delete" on public.session_attendance;
create policy "attendance_delete"
  on public.session_attendance for delete
  to authenticated
  using (
    user_id = auth.uid()
    and exists (
      select 1
      from public.sessions s
      where s.id = session_id
        and s.status = 'open'
    )
  );

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
    q.event_id,
    q.title,
    q.description,
    q.starts_at,
    q.ends_at,
    q.updated_at
  from (
    select
      e.id as event_id,
      e.title,
      e.description,
      e.starts_at,
      e.ends_at,
      e.updated_at
    from public.calendar_events e
    where e.user_id = uid

    union all

    select
      p.id,
      left(btrim(regexp_replace(p.body, '[\n\r]+', ' ', 'g')), 80),
      p.body,
      p.agenda_at,
      p.agenda_at + interval '1 hour',
      p.created_at
    from public.community_posts p
    join public.community_members m
      on m.community_id = p.community_id
     and m.user_id = uid
     and m.status = 'active'
    where p.push_to_calendar
      and p.agenda_at is not null

    union all

    select
      s.id,
      left(btrim(s.title), 80),
      case
        when s.location is not null and btrim(s.location) <> ''
          then 'Presença marcada · ' || left(btrim(s.location), 120)
        else 'Presença marcada'
      end,
      s.starts_at,
      coalesce(s.ends_at, s.starts_at + interval '1 hour'),
      a.checked_in_at
    from public.session_attendance a
    join public.sessions s on s.id = a.session_id
    where a.user_id = uid
  ) q
  order by q.starts_at;
end;
$$;

revoke all on function public.calendar_feed_by_token(text) from public;
grant execute on function public.calendar_feed_by_token(text) to anon, authenticated;
