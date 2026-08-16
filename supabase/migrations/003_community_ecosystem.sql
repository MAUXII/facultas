        -- Community ecosystem + RLS without recursive policies.
        -- Run after 001_init.sql (and 002 if needed).

        -- ---------------------------------------------------------------------------
        -- Helpers (bypass RLS, avoid infinite recursion)
        -- ---------------------------------------------------------------------------

        create or replace function public.is_community_member(cid uuid)
        returns boolean
        language sql
        stable
        security definer
        set search_path = public
        as $$
          select exists (
            select 1
            from public.community_members
            where community_id = cid
              and user_id = auth.uid()
              and status = 'active'
          );
        $$;

        create or replace function public.is_community_admin(cid uuid)
        returns boolean
        language sql
        stable
        security definer
        set search_path = public
        as $$
          select exists (
            select 1
            from public.community_members
            where community_id = cid
              and user_id = auth.uid()
              and role = 'admin'
              and status = 'active'
          )
          or exists (
            select 1
            from public.communities
            where id = cid
              and author_id = auth.uid()
          );
        $$;

        create or replace function public.my_institution_id()
        returns text
        language sql
        stable
        security definer
        set search_path = public
        as $$
          select institution_id from public.profiles where id = auth.uid();
        $$;

        grant execute on function public.is_community_member(uuid) to authenticated;
        grant execute on function public.is_community_admin(uuid) to authenticated;
        grant execute on function public.my_institution_id() to authenticated;

        -- Author becomes admin automatically
        create or replace function public.add_community_author()
        returns trigger
        language plpgsql
        security definer
        set search_path = public
        as $$
        begin
          insert into public.community_members (community_id, user_id, role, status)
          values (new.id, new.author_id, 'admin', 'active')
          on conflict (community_id, user_id) do nothing;
          return new;
        end;
        $$;

        drop trigger if exists on_community_created on public.communities;
        create trigger on_community_created
          after insert on public.communities
          for each row execute function public.add_community_author();

        -- ---------------------------------------------------------------------------
        -- Community kind
        -- ---------------------------------------------------------------------------

        alter table public.communities
          add column if not exists kind text not null default 'grupo';

        alter table public.communities
          drop constraint if exists communities_kind_check;

        alter table public.communities
          add constraint communities_kind_check
          check (kind in ('turma', 'monitoria', 'grupo', 'evento'));

        -- ---------------------------------------------------------------------------
        -- Posts, materials, sessions
        -- ---------------------------------------------------------------------------

        create table if not exists public.community_posts (
          id uuid primary key default gen_random_uuid(),
          community_id uuid not null references public.communities(id) on delete cascade,
          author_id uuid not null references public.profiles(id),
          body text not null,
          created_at timestamptz not null default now()
        );

        create table if not exists public.community_resources (
          id uuid primary key default gen_random_uuid(),
          community_id uuid not null references public.communities(id) on delete cascade,
          author_id uuid not null references public.profiles(id),
          title text not null,
          url text not null,
          kind text not null default 'link'
            check (kind in ('link', 'file')),
          created_at timestamptz not null default now()
        );

        create table if not exists public.sessions (
          id uuid primary key default gen_random_uuid(),
          host_id uuid not null references public.profiles(id),
          community_id uuid references public.communities(id) on delete set null,
          institution_id text not null references public.institutions(id),
          title text not null,
          location text,
          starts_at timestamptz not null,
          ends_at timestamptz,
          status text not null default 'scheduled'
            check (status in ('scheduled', 'open', 'closed')),
          created_at timestamptz not null default now(),
          updated_at timestamptz not null default now()
        );

        create index if not exists idx_posts_community on public.community_posts(community_id, created_at desc);
        create index if not exists idx_resources_community on public.community_resources(community_id, created_at desc);
        create index if not exists idx_sessions_community on public.sessions(community_id, starts_at desc);
        create index if not exists idx_sessions_host on public.sessions(host_id, starts_at desc);

        alter table public.community_posts enable row level security;
        alter table public.community_resources enable row level security;
        alter table public.sessions enable row level security;

        -- ---------------------------------------------------------------------------
        -- Recreate community policies (no nested RLS)
        -- ---------------------------------------------------------------------------

        drop policy if exists "communities_select" on public.communities;
        create policy "communities_select"
          on public.communities for select
          to authenticated
          using (
            visibility = 'public'
            or author_id = auth.uid()
            or public.is_community_member(id)
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
          using (public.is_community_admin(id));

        drop policy if exists "community_members_select" on public.community_members;
        create policy "community_members_select"
          on public.community_members for select
          to authenticated
          using (
            user_id = auth.uid()
            or public.is_community_member(community_id)
            or exists (
              select 1 from public.communities c
              where c.id = community_id
                and (c.visibility = 'public' or c.author_id = auth.uid())
            )
          );

        drop policy if exists "community_members_insert" on public.community_members;
        create policy "community_members_insert"
          on public.community_members for insert
          to authenticated
          with check (
            user_id = auth.uid()
            or public.is_community_admin(community_id)
          );

        -- Profiles: same institution (needed for members list / discover)
        drop policy if exists "profiles_read_institution" on public.profiles;
        create policy "profiles_read_institution"
          on public.profiles for select
          to authenticated
          using (
            id = auth.uid()
            or (
              institution_id is not null
              and institution_id = public.my_institution_id()
            )
          );

        -- Posts
        drop policy if exists "posts_select" on public.community_posts;
        create policy "posts_select"
          on public.community_posts for select
          to authenticated
          using (public.is_community_member(community_id));

        drop policy if exists "posts_insert" on public.community_posts;
        create policy "posts_insert"
          on public.community_posts for insert
          to authenticated
          with check (
            author_id = auth.uid()
            and public.is_community_member(community_id)
          );

        drop policy if exists "posts_delete" on public.community_posts;
        create policy "posts_delete"
          on public.community_posts for delete
          to authenticated
          using (
            author_id = auth.uid()
            or public.is_community_admin(community_id)
          );

        -- Resources
        drop policy if exists "resources_select" on public.community_resources;
        create policy "resources_select"
          on public.community_resources for select
          to authenticated
          using (public.is_community_member(community_id));

        drop policy if exists "resources_insert" on public.community_resources;
        create policy "resources_insert"
          on public.community_resources for insert
          to authenticated
          with check (
            author_id = auth.uid()
            and public.is_community_member(community_id)
          );

        drop policy if exists "resources_delete" on public.community_resources;
        create policy "resources_delete"
          on public.community_resources for delete
          to authenticated
          using (
            author_id = auth.uid()
            or public.is_community_admin(community_id)
          );

        -- Sessions
        drop policy if exists "sessions_select" on public.sessions;
        create policy "sessions_select"
          on public.sessions for select
          to authenticated
          using (
            host_id = auth.uid()
            or (
              community_id is not null
              and public.is_community_member(community_id)
            )
          );

        drop policy if exists "sessions_insert" on public.sessions;
        create policy "sessions_insert"
          on public.sessions for insert
          to authenticated
          with check (host_id = auth.uid());

        drop policy if exists "sessions_update" on public.sessions;
        create policy "sessions_update"
          on public.sessions for update
          to authenticated
          using (host_id = auth.uid() or public.is_community_admin(community_id));
