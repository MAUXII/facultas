-- Visitante anônimo usa role authenticated. RLS precisa olhar JWT + is_guest.
-- Policies AS RESTRICTIVE: AND com as permissivas (docs Supabase anonymous auth).

create or replace function public.is_anonymous_jwt()
returns boolean
language sql
stable
as $$
  select coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false);
$$;

revoke all on function public.is_anonymous_jwt() from public;
grant execute on function public.is_anonymous_jwt() to authenticated;

create or replace function public.is_full_account()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    not public.is_anonymous_jwt()
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.is_guest = false
    );
$$;

-- Visitante não se promove via update no client
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and (
      (public.is_anonymous_jwt() and is_guest = true)
      or (not public.is_anonymous_jwt())
    )
  );

-- Self-join: só member; visitante só em sala com guest_access
drop policy if exists "community_members_insert" on public.community_members;
create policy "community_members_insert"
  on public.community_members for insert
  to authenticated
  with check (
    (
      user_id = auth.uid()
      and role = 'member'
      and (
        public.is_full_account()
        or exists (
          select 1
          from public.communities c
          where c.id = community_id
            and (
              (c.guest_access = 'open' and status = 'active')
              or (c.guest_access = 'approval' and status = 'pending')
            )
        )
      )
    )
    or exists (
      select 1
      from public.communities c
      where c.id = community_id
        and c.author_id = auth.uid()
        and public.is_full_account()
    )
  );

-- Não virar admin sozinho; admin da sala precisa de conta completa
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
        and public.is_full_account()
    )
  )
  with check (
    (
      user_id = auth.uid()
      and role = 'member'
    )
    or exists (
      select 1 from public.communities c
      where c.id = community_id
        and c.author_id = auth.uid()
        and public.is_full_account()
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
        and public.is_full_account()
    )
  );

-- Restrictive: writes privilegiados exigem conta completa
drop policy if exists "full_account_communities_insert" on public.communities;
create policy "full_account_communities_insert"
  on public.communities as restrictive for insert to authenticated
  with check (public.is_full_account());

drop policy if exists "full_account_communities_update" on public.communities;
create policy "full_account_communities_update"
  on public.communities as restrictive for update to authenticated
  using (public.is_full_account())
  with check (public.is_full_account());

drop policy if exists "full_account_communities_delete" on public.communities;
create policy "full_account_communities_delete"
  on public.communities as restrictive for delete to authenticated
  using (public.is_full_account());

drop policy if exists "full_account_posts_insert" on public.community_posts;
create policy "full_account_posts_insert"
  on public.community_posts as restrictive for insert to authenticated
  with check (public.is_full_account());

drop policy if exists "full_account_resources_insert" on public.community_resources;
create policy "full_account_resources_insert"
  on public.community_resources as restrictive for insert to authenticated
  with check (public.is_full_account());

drop policy if exists "full_account_sessions_insert" on public.sessions;
create policy "full_account_sessions_insert"
  on public.sessions as restrictive for insert to authenticated
  with check (public.is_full_account());

drop policy if exists "full_account_sessions_update" on public.sessions;
create policy "full_account_sessions_update"
  on public.sessions as restrictive for update to authenticated
  using (public.is_full_account())
  with check (public.is_full_account());

drop policy if exists "full_account_aulas_insert" on public.aulas;
create policy "full_account_aulas_insert"
  on public.aulas as restrictive for insert to authenticated
  with check (public.is_full_account());

drop policy if exists "full_account_aulas_update" on public.aulas;
create policy "full_account_aulas_update"
  on public.aulas as restrictive for update to authenticated
  using (public.is_full_account())
  with check (public.is_full_account());

drop policy if exists "full_account_aulas_delete" on public.aulas;
create policy "full_account_aulas_delete"
  on public.aulas as restrictive for delete to authenticated
  using (public.is_full_account());

-- Storage covers: visitante não sobe capa/avatar custom
drop policy if exists "full_account_covers_upload" on storage.objects;
create policy "full_account_covers_upload"
  on storage.objects as restrictive for insert to authenticated
  with check (bucket_id <> 'covers' or public.is_full_account());

drop policy if exists "full_account_covers_update" on storage.objects;
create policy "full_account_covers_update"
  on storage.objects as restrictive for update to authenticated
  using (bucket_id <> 'covers' or public.is_full_account())
  with check (bucket_id <> 'covers' or public.is_full_account());

drop policy if exists "full_account_covers_delete" on storage.objects;
create policy "full_account_covers_delete"
  on storage.objects as restrictive for delete to authenticated
  using (bucket_id <> 'covers' or public.is_full_account());
