-- Preview de convite por código (anon + auth) + inbox in-app.

create or replace function public.community_invite_preview(p_code text)
returns table (
  id uuid,
  public_id text,
  name text,
  cover_url text,
  kind text,
  institution_id text,
  requires_approval boolean,
  visibility text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.id,
    c.public_id,
    c.name,
    c.cover_url,
    c.kind,
    c.institution_id,
    c.requires_approval,
    c.visibility
  from public.communities c
  where c.access_code = upper(regexp_replace(trim(coalesce(p_code, '')), '[\s-]+', '', 'g'))
  limit 1;
$$;

revoke all on function public.community_invite_preview(text) from public;
grant execute on function public.community_invite_preview(text) to anon, authenticated;

-- Inbox

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  community_id uuid not null references public.communities (id) on delete cascade,
  kind text not null check (kind in ('aviso', 'sessao')),
  title text not null,
  body text,
  href text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

create index if not exists notifications_user_unread_idx
  on public.notifications (user_id)
  where read_at is null;

alter table public.notifications enable row level security;

grant select, update on public.notifications to authenticated;

drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own"
  on public.notifications for select
  using (auth.uid() = user_id);

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own"
  on public.notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.notify_community_members(
  p_community_id uuid,
  p_author_id uuid,
  p_kind text,
  p_title text,
  p_body text,
  p_href text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, community_id, kind, title, body, href)
  select
    m.user_id,
    p_community_id,
    p_kind,
    p_title,
    p_body,
    p_href
  from public.community_members m
  where m.community_id = p_community_id
    and m.status = 'active'
    and m.user_id is distinct from p_author_id;
end;
$$;

revoke all on function public.notify_community_members(uuid, uuid, text, text, text, text) from public;

create or replace function public.trg_notify_aviso()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_public_id text;
  v_title text;
begin
  select public_id into v_public_id from public.communities where id = new.community_id;
  v_title := left(regexp_replace(coalesce(new.body, ''), '\s+', ' ', 'g'), 80);
  if v_title = '' then
    v_title := 'Novo aviso';
  end if;
  perform public.notify_community_members(
    new.community_id,
    new.author_id,
    'aviso',
    v_title,
    left(coalesce(new.body, ''), 200),
    '/communities/' || coalesce(v_public_id, new.community_id::text)
  );
  return new;
end;
$$;

drop trigger if exists community_posts_notify on public.community_posts;
create trigger community_posts_notify
  after insert on public.community_posts
  for each row execute function public.trg_notify_aviso();

create or replace function public.trg_notify_sessao()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_public_id text;
begin
  if new.community_id is null then
    return new;
  end if;
  select public_id into v_public_id from public.communities where id = new.community_id;
  perform public.notify_community_members(
    new.community_id,
    new.host_id,
    'sessao',
    coalesce(nullif(trim(new.title), ''), 'Nova sessão'),
    case
      when new.starts_at is not null then to_char(new.starts_at at time zone 'UTC', 'DD/MM HH24:MI') || ' UTC'
      else null
    end,
    '/communities/' || coalesce(v_public_id, new.community_id::text)
  );
  return new;
end;
$$;

drop trigger if exists sessions_notify on public.sessions;
create trigger sessions_notify
  after insert on public.sessions
  for each row execute function public.trg_notify_sessao();
