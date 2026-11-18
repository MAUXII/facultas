-- Papéis por sala: dono (autor) > admin > moderador > membro.
-- Moderador posta avisos/materiais sempre e revisa pedidos de entrada.
-- Mudança de papel, revisão e remoção passam por RPCs que checam hierarquia,
-- assim admin que não é o autor também consegue agir (antes a RLS só liberava o autor).

alter table public.community_members
  drop constraint if exists community_members_role_check;
alter table public.community_members
  add constraint community_members_role_check
  check (role in ('member', 'moderator', 'admin'));

-- 3 = dono, 2 = admin, 1 = moderador, 0 = membro, -1 = fora da sala
create or replace function public.community_rank(cid uuid, uid uuid)
returns int
language sql
stable
security definer
set search_path = public
as $$
  select case
    when exists (
      select 1 from public.communities c where c.id = cid and c.author_id = uid
    ) then 3
    else coalesce((
      select case m.role
        when 'admin' then 2
        when 'moderator' then 1
        else 0
      end
      from public.community_members m
      where m.community_id = cid
        and m.user_id = uid
        and m.status = 'active'
    ), -1)
  end;
$$;

revoke all on function public.community_rank(uuid, uuid) from public;
grant execute on function public.community_rank(uuid, uuid) to authenticated;

create or replace function public.is_community_moderator(cid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.community_rank(cid, auth.uid()) >= 1;
$$;

revoke all on function public.is_community_moderator(uuid) from public;
grant execute on function public.is_community_moderator(uuid) to authenticated;

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
      public.is_community_moderator(cid)
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
      public.is_community_moderator(cid)
      or exists (
        select 1
        from public.communities c
        where c.id = cid
          and c.materiais_writers = 'members'
      )
    );
$$;

-- Moderador também vê nome/avatar de quem pediu para entrar.
create or replace function public.can_review_member(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.community_members them
    where them.user_id = target
      and them.status = 'pending'
      and public.is_community_moderator(them.community_id)
  );
$$;

create or replace function public.set_member_role(
  p_community_id uuid,
  p_user_id uuid,
  p_role text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_rank int;
  target_rank int;
  next_rank int;
begin
  if not public.is_full_account() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_role not in ('member', 'moderator', 'admin') then
    raise exception 'invalid role' using errcode = '22023';
  end if;

  actor_rank := public.community_rank(p_community_id, auth.uid());
  target_rank := public.community_rank(p_community_id, p_user_id);
  next_rank := case p_role when 'admin' then 2 when 'moderator' then 1 else 0 end;

  if target_rank < 0 or target_rank = 3 then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if actor_rank < 2 or actor_rank <= target_rank or actor_rank <= next_rank then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  update public.community_members
  set role = p_role
  where community_id = p_community_id
    and user_id = p_user_id
    and status = 'active';
end;
$$;

revoke all on function public.set_member_role(uuid, uuid, text) from public;
grant execute on function public.set_member_role(uuid, uuid, text) to authenticated;

create or replace function public.review_member(
  p_community_id uuid,
  p_user_id uuid,
  p_approve boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_full_account()
     or public.community_rank(p_community_id, auth.uid()) < 1 then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if p_approve then
    update public.community_members
    set status = 'active', role = 'member'
    where community_id = p_community_id
      and user_id = p_user_id
      and status = 'pending';
  else
    delete from public.community_members
    where community_id = p_community_id
      and user_id = p_user_id
      and status = 'pending';
  end if;
end;
$$;

revoke all on function public.review_member(uuid, uuid, boolean) from public;
grant execute on function public.review_member(uuid, uuid, boolean) to authenticated;

create or replace function public.remove_member(
  p_community_id uuid,
  p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_rank int;
  target_rank int;
begin
  if not public.is_full_account() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  actor_rank := public.community_rank(p_community_id, auth.uid());
  target_rank := public.community_rank(p_community_id, p_user_id);

  if actor_rank < 2 or target_rank < 0 or actor_rank <= target_rank then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  delete from public.community_members
  where community_id = p_community_id
    and user_id = p_user_id
    and status = 'active';
end;
$$;

revoke all on function public.remove_member(uuid, uuid) from public;
grant execute on function public.remove_member(uuid, uuid) to authenticated;
