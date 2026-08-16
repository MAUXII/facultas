-- Admins can correct or remove an aula. Members still only read.

drop policy if exists "aulas_update" on public.aulas;
create policy "aulas_update"
  on public.aulas for update
  to authenticated
  using (
    public.is_community_admin(community_id)
    and public.community_is_turma(community_id)
  )
  with check (
    public.is_community_admin(community_id)
    and public.community_is_turma(community_id)
  );

drop policy if exists "aulas_delete" on public.aulas;
create policy "aulas_delete"
  on public.aulas for delete
  to authenticated
  using (
    public.is_community_admin(community_id)
    and public.community_is_turma(community_id)
  );
