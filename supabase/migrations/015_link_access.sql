-- Acesso pelo link: quem conhece o public_id lê a sala e assina o
-- calendário dos avisos com data. Não vira membro e não escreve.
-- Não há policy "link_access = true" nas tabelas: isso listaria toda
-- sala com o link ligado para o anônimo, sem ele ter o endereço.
-- As funções exigem o public_id exato e ignoram auth.uid().

alter table public.communities
  add column if not exists link_access boolean not null default false;

create or replace function public.community_by_link(p_public_id text)
returns table (
  id uuid,
  public_id text,
  institution_id text,
  name text,
  description text,
  cover_url text,
  tags text[],
  kind text,
  visibility text,
  requires_approval boolean,
  avisos_writers text,
  materiais_writers text,
  author_id uuid,
  link_access boolean,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.id,
    c.public_id,
    c.institution_id,
    c.name,
    c.description,
    c.cover_url,
    c.tags,
    c.kind,
    c.visibility,
    c.requires_approval,
    c.avisos_writers,
    c.materiais_writers,
    c.author_id,
    c.link_access,
    c.created_at,
    c.updated_at
  from public.communities c
  where c.public_id = p_public_id
    and c.link_access = true
  limit 1;
$$;

create or replace function public.community_link_posts(p_public_id text)
returns table (
  id uuid,
  community_id uuid,
  author_id uuid,
  body text,
  created_at timestamptz,
  agenda_at timestamptz,
  push_to_calendar boolean,
  author_name text,
  author_avatar text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    p.community_id,
    p.author_id,
    p.body,
    p.created_at,
    p.agenda_at,
    p.push_to_calendar,
    coalesce(pr.name, 'Membro'),
    pr.avatar_url
  from public.community_posts p
  join public.communities c on c.id = p.community_id
  left join public.profiles pr on pr.id = p.author_id
  where c.public_id = p_public_id
    and c.link_access = true
  order by p.created_at desc;
$$;

create or replace function public.community_link_resources(p_public_id text)
returns table (
  id uuid,
  community_id uuid,
  author_id uuid,
  title text,
  url text,
  kind text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    r.id,
    r.community_id,
    r.author_id,
    r.title,
    r.url,
    r.kind,
    r.created_at
  from public.community_resources r
  join public.communities c on c.id = r.community_id
  where c.public_id = p_public_id
    and c.link_access = true
  order by r.created_at desc;
$$;

create or replace function public.community_link_aulas(p_public_id text)
returns table (
  id uuid,
  community_id uuid,
  subject text,
  teacher text,
  weekday text,
  starts_at time,
  ends_at time,
  room text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    a.id,
    a.community_id,
    a.subject,
    a.teacher,
    a.weekday,
    a.starts_at,
    a.ends_at,
    a.room
  from public.aulas a
  join public.communities c on c.id = a.community_id
  where c.public_id = p_public_id
    and c.link_access = true
    and c.kind = 'turma';
$$;

create or replace function public.community_link_members(p_public_id text)
returns table (
  user_id uuid,
  role text,
  status text,
  joined_at timestamptz,
  name text,
  username text,
  avatar_url text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    m.user_id,
    m.role,
    m.status,
    m.joined_at,
    coalesce(pr.name, 'Membro'),
    pr.username,
    pr.avatar_url
  from public.community_members m
  join public.communities c on c.id = m.community_id
  left join public.profiles pr on pr.id = m.user_id
  where c.public_id = p_public_id
    and c.link_access = true
    and m.status = 'active'
  order by m.joined_at;
$$;

-- Mesma janela de 1 hora do feed pessoal (AVISO_BLOCK_MS).
create or replace function public.community_link_feed(p_public_id text)
returns table (
  event_id uuid,
  title text,
  description text,
  starts_at timestamptz,
  ends_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    left(btrim(regexp_replace(p.body, '[\n\r]+', ' ', 'g')), 80),
    p.body,
    p.agenda_at,
    p.agenda_at + interval '1 hour',
    p.created_at
  from public.community_posts p
  join public.communities c on c.id = p.community_id
  where c.public_id = p_public_id
    and c.link_access = true
    and p.push_to_calendar
    and p.agenda_at is not null
  order by p.agenda_at;
$$;

revoke all on function public.community_by_link(text) from public;
revoke all on function public.community_link_posts(text) from public;
revoke all on function public.community_link_resources(text) from public;
revoke all on function public.community_link_aulas(text) from public;
revoke all on function public.community_link_members(text) from public;
revoke all on function public.community_link_feed(text) from public;

grant execute on function public.community_by_link(text) to anon, authenticated;
grant execute on function public.community_link_posts(text) to anon, authenticated;
grant execute on function public.community_link_resources(text) to anon, authenticated;
grant execute on function public.community_link_aulas(text) to anon, authenticated;
grant execute on function public.community_link_members(text) to anon, authenticated;
grant execute on function public.community_link_feed(text) to anon, authenticated;
