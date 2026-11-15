-- Arquivar sala (fim de semestre): continua existindo, só leitura, fora do
-- Descobrir e da lista principal. Desarquivar volta tudo como estava.
alter table public.communities
  add column if not exists archived_at timestamptz;

create index if not exists idx_communities_archived
  on public.communities (archived_at)
  where archived_at is not null;

-- Link de assinatura: aulas de sala arquivada saem do feed.
create or replace function public.calendar_feed_aulas_by_token(p_token text)
returns table (
  aula_id uuid,
  community_name text,
  subject text,
  teacher text,
  weekday text,
  starts_at time,
  ends_at time,
  room text,
  created_at timestamptz
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
    a.id,
    c.name,
    a.subject,
    a.teacher,
    a.weekday,
    a.starts_at,
    a.ends_at,
    a.room,
    a.created_at
  from public.aulas a
  join public.community_members m
    on m.community_id = a.community_id
   and m.user_id = uid
   and m.status = 'active'
  join public.communities c
    on c.id = a.community_id
   and c.archived_at is null
  order by a.weekday, a.starts_at;
end;
$$;

revoke all on function public.calendar_feed_aulas_by_token(text) from public;
grant execute on function public.calendar_feed_aulas_by_token(text) to anon, authenticated;
