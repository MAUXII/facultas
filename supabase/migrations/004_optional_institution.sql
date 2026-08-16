-- Grupo e evento podem existir sem instituição.
-- Turma e monitoria continuam exigindo institution_id.

alter table public.communities
  alter column institution_id drop not null;

alter table public.communities
  drop constraint if exists communities_institution_by_kind;

alter table public.communities
  add constraint communities_institution_by_kind
  check (
    kind not in ('turma', 'monitoria')
    or institution_id is not null
  );
