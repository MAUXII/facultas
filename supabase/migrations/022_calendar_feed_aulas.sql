-- Aulas da grade no link de assinatura da agenda (ICS).
-- O feed é lido sem sessão (Google/Apple buscam pelo token), então a leitura
-- passa por esta função security definer, como calendar_feed_by_token.
-- Devolve as aulas das turmas em que o dono do token está ativo; o app
-- transforma cada uma num evento semanal (RRULE).

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
  join public.communities c on c.id = a.community_id
  order by a.weekday, a.starts_at;
end;
$$;

revoke all on function public.calendar_feed_aulas_by_token(text) from public;
grant execute on function public.calendar_feed_aulas_by_token(text) to anon, authenticated;
