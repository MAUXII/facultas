-- Dados da capa, ao lado de cover_url:
--   { "kind": "gradient", "index": 0..5 }  capa de gradiente escolhida no create
--   { "kind": "stock", "source": "...", "author": "...", "authorUrl": "...",
--     "photoUrl": "...", "sourceLabel"?: "...", "license"?: { "label", "url" } }
--     foto/ilustração de banco (Wikimedia, Picsum, Cleveland, Pexels, Lummi,
--     Unsplash) usada pelo link da fonte; o crédito é exigido pelas licenças.
-- Nulo = capa enviada pela pessoa (ou sala antiga).
-- jsonb porque cada fonte manda campos um pouco diferentes e nada filtra por eles.

alter table public.communities
  add column if not exists cover_meta jsonb;

alter table public.communities
  drop constraint if exists communities_cover_meta_object;
alter table public.communities
  add constraint communities_cover_meta_object
  check (cover_meta is null or jsonb_typeof(cover_meta) = 'object');

-- Convite mostra a mesma capa de gradiente e o crédito da foto.
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
  guest_access text,
  cover_meta jsonb
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
    c.guest_access,
    c.cover_meta
  from public.communities c
  where c.access_code = upper(regexp_replace(trim(coalesce(p_code, '')), '[\s-]+', '', 'g'))
  limit 1;
$$;

revoke all on function public.community_invite_preview(text) from public;
grant execute on function public.community_invite_preview(text) to anon, authenticated;
