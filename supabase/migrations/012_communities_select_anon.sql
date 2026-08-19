drop policy if exists "communities_select_public_anon" on public.communities;
create policy "communities_select_public_anon"
  on public.communities for select
  to anon
  using (visibility = 'public');
