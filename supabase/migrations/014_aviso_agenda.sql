-- Aviso pode ter um instante. Se push_to_calendar, membros veem esse
-- instante na agenda pessoal e no feed ICS. Não copia a linha para
-- calendar_events: a policy de insert só deixa o dono gravar a própria agenda.
-- A janela de 1 hora acompanha AVISO_BLOCK_MS em src/lib/aviso-agenda.ts.

alter table public.community_posts
  add column if not exists agenda_at timestamptz,
  add column if not exists push_to_calendar boolean not null default false;

alter table public.community_posts
  drop constraint if exists community_posts_push_needs_agenda;

alter table public.community_posts
  add constraint community_posts_push_needs_agenda
  check (push_to_calendar = false or agenda_at is not null);

create index if not exists idx_posts_agenda
  on public.community_posts (agenda_at)
  where push_to_calendar and agenda_at is not null;

-- Feed sem sessão: o dono vem do token. auth.uid() aqui é nulo,
-- então o membro é filtrado pelo uid resolvido, não por is_community_member().
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
  ) q
  order by q.starts_at;
end;
$$;

revoke all on function public.calendar_feed_by_token(text) from public;
grant execute on function public.calendar_feed_by_token(text) to anon, authenticated;
