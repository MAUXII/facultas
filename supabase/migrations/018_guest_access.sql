-- Visitante sem e-mail: guest_access por sala + profiles.is_guest.

alter table public.communities
  add column if not exists guest_access text not null default 'off';

alter table public.communities
  drop constraint if exists communities_guest_access_check;
alter table public.communities
  add constraint communities_guest_access_check
  check (guest_access in ('off', 'open', 'approval'));

alter table public.profiles
  add column if not exists is_guest boolean not null default false;

-- E-mail único continua; visitante usa placeholder estável por uid.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_guest boolean;
begin
  v_guest := coalesce(new.is_anonymous, false)
    or (new.email is null or nullif(trim(new.email), '') is null);
  v_email := nullif(trim(coalesce(new.email, '')), '');
  if v_email is null then
    v_email := 'guest-' || new.id::text || '@guest.facultas.internal';
  end if;

  insert into public.profiles (id, email, name, username, avatar_url, is_guest)
  values (
    new.id,
    v_email,
    coalesce(
      nullif(new.raw_user_meta_data->>'full_name', ''),
      nullif(new.raw_user_meta_data->>'name', ''),
      case when v_guest then 'Visitante' else 'User' end
    ),
    nullif(new.raw_user_meta_data->>'username', ''),
    new.raw_user_meta_data->>'avatar_url',
    v_guest
  )
  on conflict (id) do update
    set email = excluded.email,
        name = coalesce(nullif(excluded.name, ''), public.profiles.name),
        username = coalesce(excluded.username, public.profiles.username),
        avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
        is_guest = public.profiles.is_guest and excluded.is_guest,
        updated_at = now(),
        last_login_at = now();
  return new;
end;
$$;

create or replace function public.is_full_account()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.is_guest = false
  );
$$;

revoke all on function public.is_full_account() from public;
grant execute on function public.is_full_account() to authenticated;

create or replace function public.may_write_avisos(cid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_full_account()
    and public.is_community_member(cid)
    and (
      public.is_community_admin(cid)
      or exists (
        select 1
        from public.communities c
        where c.id = cid
          and c.avisos_writers = 'members'
      )
    );
$$;

create or replace function public.may_write_materiais(cid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_full_account()
    and public.is_community_member(cid)
    and (
      public.is_community_admin(cid)
      or exists (
        select 1
        from public.communities c
        where c.id = cid
          and c.materiais_writers = 'members'
      )
    );
$$;

-- Preview de convite inclui guest_access
drop function if exists public.community_invite_preview(text);

create function public.community_invite_preview(p_code text)
returns table (
  id uuid,
  public_id text,
  name text,
  cover_url text,
  kind text,
  institution_id text,
  requires_approval boolean,
  visibility text,
  guest_access text
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
    c.visibility,
    c.guest_access
  from public.communities c
  where c.access_code = upper(regexp_replace(trim(coalesce(p_code, '')), '[\s-]+', '', 'g'))
  limit 1;
$$;

revoke all on function public.community_invite_preview(text) from public;
grant execute on function public.community_invite_preview(text) to anon, authenticated;

-- Join por código também devolve guest_access
drop function if exists public.community_by_access_code(text);

create function public.community_by_access_code(p_code text)
returns table (
  id uuid,
  public_id text,
  requires_approval boolean,
  guest_access text
)
language sql
stable
security definer
set search_path = public
as $$
  select c.id, c.public_id, c.requires_approval, c.guest_access
  from public.communities c
  where c.access_code = upper(regexp_replace(trim(coalesce(p_code, '')), '[\s-]+', '', 'g'))
  limit 1;
$$;

revoke all on function public.community_by_access_code(text) from public;
revoke all on function public.community_by_access_code(text) from anon;
grant execute on function public.community_by_access_code(text) to authenticated;

-- Sessão: só conta completa abre
drop policy if exists "sessions_insert" on public.sessions;
create policy "sessions_insert"
  on public.sessions for insert
  to authenticated
  with check (
    host_id = auth.uid()
    and public.is_full_account()
    and community_id is not null
    and public.is_community_admin(community_id)
  );

drop policy if exists "communities_insert" on public.communities;
create policy "communities_insert"
  on public.communities for insert
  to authenticated
  with check (
    author_id = auth.uid()
    and public.is_full_account()
  );
