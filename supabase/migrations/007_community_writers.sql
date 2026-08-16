-- Who may publish avisos / add materiais. Default: admins (representante) only.

alter table public.communities
  add column if not exists avisos_writers text not null default 'admins';

alter table public.communities
  add column if not exists materiais_writers text not null default 'admins';

alter table public.communities
  drop constraint if exists communities_avisos_writers_check;
alter table public.communities
  add constraint communities_avisos_writers_check
  check (avisos_writers in ('admins', 'members'));

alter table public.communities
  drop constraint if exists communities_materiais_writers_check;
alter table public.communities
  add constraint communities_materiais_writers_check
  check (materiais_writers in ('admins', 'members'));

create or replace function public.may_write_avisos(cid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_community_member(cid)
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
    public.is_community_member(cid)
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

grant execute on function public.may_write_avisos(uuid) to authenticated;
grant execute on function public.may_write_materiais(uuid) to authenticated;

drop policy if exists "posts_insert" on public.community_posts;
create policy "posts_insert"
  on public.community_posts for insert
  to authenticated
  with check (
    author_id = auth.uid()
    and public.may_write_avisos(community_id)
  );

drop policy if exists "resources_insert" on public.community_resources;
create policy "resources_insert"
  on public.community_resources for insert
  to authenticated
  with check (
    author_id = auth.uid()
    and public.may_write_materiais(community_id)
  );
