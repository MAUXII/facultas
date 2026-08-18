# Supabase (o seu projeto)

Isto é para **o seu** projeto. O repositório não traz URL, chave nem dados de instância nenhuma. Anon key e `https://xxxx.supabase.co` abaixo são placeholder. Service role e senha do banco **não** entram aqui, nem no GitHub.

## 1. Criar o projeto

1. Abra [supabase.com](https://supabase.com)
2. **New project**

## 2. Rodar o schema

Se você já rodou tabelas antigas em português, rode primeiro:

`supabase/migrations/000_drop_pt_tables.sql`

Os arquivos estão no clone, em `supabase/migrations/`. Abra cada um, copie o SQL, cole no **SQL Editor** do seu projeto e dê **Run**, nesta ordem:

| # | Arquivo | O que faz |
| --- | --- | --- |
| 1 | `001_init.sql` | Tabelas base + RLS |
| 2 | `002_profiles_username.sql` | Username em `profiles` |
| 3 | `003_community_ecosystem.sql` | Ecossistema de comunidades (**obrigatória** — sem ela o RLS recurse) |
| 4 | `004_optional_institution.sql` | Instituição opcional em grupo/evento |
| 5 | `005_grade_aulas.sql` | Tabela da grade |
| 6 | `006_grade_aulas_update_delete.sql` | Admin edita/apaga aula |
| 7 | `007_community_writers.sql` | Quem publica aviso/material |
| 8 | `008_join_by_code.sql` | Entrar por código (privada fora do Descobrir) |
| 9 | `009_community_public_id.sql` | `public_id` curto na URL |
| 10 | `010_profiles_read_co_members.sql` | Ler nome/foto de quem compartilha comunidade |
| 11 | `011_avatar_sync_and_storage_prune.sql` | Preenche `avatar_url` + limpa avatars órfãos no bucket |

CLI, se você usa:

```bash
supabase db push
```

### Tabelas principais

```text
institutions ──┬── campuses
               └── communities ──┬── community_members ── profiles
                                 ├── community_posts / materials (hub)
                                 └── aulas (grade)
```

Bucket de Storage: `covers` (criado no SQL).

## 3. Env

No `.env.local` (a partir do `.env.example`):

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

Settings do projeto → **API** → Project URL + `anon` `public`.

## 4. Google Auth (depois)

Desativado na UI por enquanto. Quando for ligar: Authentication → Providers → Google + OAuth no Google Cloud.

## 5. Conferir

```bash
npm run dev
```

Crie uma conta, complete o onboarding, crie uma comunidade pública e veja se aparece no **Descobrir**.
