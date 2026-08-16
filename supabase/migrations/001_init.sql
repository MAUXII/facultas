-- FatecFlow · initial schema (Supabase / Postgres)
-- Run in SQL Editor OR: supabase db push

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.institutions (
  id text primary key,
  name text not null,
  slug text not null unique,
  logo_url text,
  email_domains text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.campuses (
  id text primary key,
  institution_id text not null references public.institutions(id) on delete cascade,
  name text not null
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text not null,
  username text,
  avatar_url text,
  institution_id text references public.institutions(id),
  campus_id text references public.campuses(id),
  course text,
  qr_secret text not null default encode(gen_random_bytes(32), 'hex'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_login_at timestamptz
);

create table if not exists public.communities (
  id uuid primary key default gen_random_uuid(),
  institution_id text not null references public.institutions(id),
  name text not null,
  description text not null default '',
  cover_url text,
  tags text[] not null default '{}',
  visibility text not null default 'public'
    check (visibility in ('public', 'code', 'private')),
  access_code text,
  requires_approval boolean not null default false,
  author_id uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.community_members (
  community_id uuid not null references public.communities(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member'
    check (role in ('member', 'admin')),
  status text not null default 'active'
    check (status in ('active', 'pending', 'removed')),
  joined_at timestamptz not null default now(),
  primary key (community_id, user_id)
);

create index if not exists idx_communities_institution on public.communities(institution_id);
create index if not exists idx_communities_author on public.communities(author_id);
create index if not exists idx_community_members_user on public.community_members(user_id);
create index if not exists idx_campuses_institution on public.campuses(institution_id);
create unique index if not exists profiles_username_unique
  on public.profiles (lower(username))
  where username is not null;

-- ---------------------------------------------------------------------------
-- Trigger: create profile row when auth user is created
-- ---------------------------------------------------------------------------

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
    new.raw_user_meta_data->>'avatar_url'
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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.institutions enable row level security;
alter table public.campuses enable row level security;
alter table public.profiles enable row level security;
alter table public.communities enable row level security;
alter table public.community_members enable row level security;

drop policy if exists "institutions_read" on public.institutions;
create policy "institutions_read"
  on public.institutions for select
  to authenticated
  using (true);

drop policy if exists "campuses_read" on public.campuses;
create policy "campuses_read"
  on public.campuses for select
  to authenticated
  using (true);

drop policy if exists "profiles_read_own" on public.profiles;
create policy "profiles_read_own"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "communities_select" on public.communities;
create policy "communities_select"
  on public.communities for select
  to authenticated
  using (
    visibility = 'public'
    or author_id = auth.uid()
    or exists (
      select 1 from public.community_members m
      where m.community_id = id
        and m.user_id = auth.uid()
        and m.status = 'active'
    )
  );

drop policy if exists "communities_insert" on public.communities;
create policy "communities_insert"
  on public.communities for insert
  to authenticated
  with check (author_id = auth.uid());

drop policy if exists "communities_update" on public.communities;
create policy "communities_update"
  on public.communities for update
  to authenticated
  using (
    author_id = auth.uid()
    or exists (
      select 1 from public.community_members m
      where m.community_id = id
        and m.user_id = auth.uid()
        and m.role = 'admin'
        and m.status = 'active'
    )
  );

drop policy if exists "communities_delete" on public.communities;
create policy "communities_delete"
  on public.communities for delete
  to authenticated
  using (author_id = auth.uid());

drop policy if exists "community_members_select" on public.community_members;
create policy "community_members_select"
  on public.community_members for select
  to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.communities c
      where c.id = community_id
        and (
          c.visibility = 'public'
          or c.author_id = auth.uid()
          or exists (
            select 1 from public.community_members m2
            where m2.community_id = c.id
              and m2.user_id = auth.uid()
              and m2.status = 'active'
          )
        )
    )
  );

drop policy if exists "community_members_insert" on public.community_members;
create policy "community_members_insert"
  on public.community_members for insert
  to authenticated
  with check (
    user_id = auth.uid()
    or exists (
      select 1 from public.communities c
      where c.id = community_id
        and c.author_id = auth.uid()
    )
  );

drop policy if exists "community_members_update" on public.community_members;
create policy "community_members_update"
  on public.community_members for update
  to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.communities c
      where c.id = community_id
        and c.author_id = auth.uid()
    )
  );

drop policy if exists "community_members_delete" on public.community_members;
create policy "community_members_delete"
  on public.community_members for delete
  to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.communities c
      where c.id = community_id
        and c.author_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Storage: covers bucket
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('covers', 'covers', true)
on conflict (id) do nothing;

drop policy if exists "covers_read" on storage.objects;
create policy "covers_read"
  on storage.objects for select
  to public
  using (bucket_id = 'covers');

drop policy if exists "covers_upload" on storage.objects;
create policy "covers_upload"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'covers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "covers_update" on storage.objects;
create policy "covers_update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'covers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "covers_delete" on storage.objects;
create policy "covers_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'covers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------------------------------------------------------------------------
-- Seed
-- ---------------------------------------------------------------------------

insert into public.institutions (id, name, slug, email_domains) values
  ('fatec', 'FATEC', 'fatec', array['fatec.sp.gov.br']),
  ('fiap',  'FIAP',  'fiap',  array['fiap.com.br']),
  ('unip',  'UNIP',  'unip',  array['unip.br']),
  ('usp',   'USP',   'usp',   array['usp.br'])
on conflict (id) do update
  set name = excluded.name,
      slug = excluded.slug,
      email_domains = excluded.email_domains,
      updated_at = now();

insert into public.campuses (id, institution_id, name) values
  ('fatec-sp', 'fatec', 'Sao Paulo'),
  ('fatec-zl', 'fatec', 'Zona Leste'),
  ('fatec-outro', 'fatec', 'Other campus'),
  ('fiap-sp',  'fiap',  'Sao Paulo'),
  ('unip-sp',  'unip',  'Sao Paulo'),
  ('usp-sp',   'usp',   'Sao Paulo')
on conflict (id) do update
  set name = excluded.name,
      institution_id = excluded.institution_id;
