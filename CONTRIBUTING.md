# Contribuir no Orbit

Obrigado por querer ajudar. A UI é **pt-BR**. Código, branch, commit e URL são em **inglês**. A marca na interface é **Orbit** (`APP_NAME` / `APP_MARK` em `src/lib/brand.ts`).

```text
issue / ideia  →  branch  →  PR pequeno  →  review  →  main
```

## Antes de mexer

| Documento | Para quê |
| --- | --- |
| [CONTEXT.md](CONTEXT.md) | Glossário (comunidade ≠ sessão ≠ calendário ≠ grade) |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Onde cada pasta / módulo mora |
| [docs/adr/](docs/adr) | Decisões que não voltam atrás fácil |
| [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md) | Como montar **o seu** Supabase |

Se a mudança for grande (nova área na nav, mudar domínio), abre uma **issue** antes.

## Setup local

O GitHub **não** tem banco, URL nem chave. Você cria o **próprio** projeto no [Supabase](https://supabase.com).

```bash
cp .env.example .env.local
npm install
npm run dev
```

No SQL Editor do **seu** projeto, rode `001` … `009` (a `000` só se ainda tiver tabela antiga em português). Receita completa: [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md).

## Branch e PR

```bash
git checkout main
git pull
git checkout -b feat/grade-overlap   # ou fix/…
```

- **Uma ideia por PR.** Pequeno o bastante para revisar numa sentada.
- Título do PR em inglês; descrição pode misturar pt-BR se ajudar o contexto.
- Commits: imperativo, foco no *porquê* (`fix grade overlap warning`, não `update stuff`).

### Checklist

- [ ] Paths via `src/lib/routes.ts` (nada de `/criar`, `/rooms`, paths em português)
- [ ] Copy nova em `src/messages/pt-BR.json` **e** `src/messages/en.json`
- [ ] Sem `.env.local`, service role, dump ou URL real de projeto
- [ ] `npx tsc --noEmit` · `npm run lint` · `npm test` passam
- [ ] Se mexeu no domínio: `CONTEXT.md` / ADR atualizados quando couber

## Combinado do domínio

- Tipos de comunidade: `turma` · `monitoria` · `grupo` · `evento`
- **Sessão** de presença **não** é comunidade. **Calendário** = agenda pessoal. `/create` cria comunidade. Nav: Comunidades · Calendário · **Descobrir**
- **Grade** e **aula** moram na turma (`src/lib/grade.ts`). UI e Postgres são adapters — teste o módulo, não o JSX
- Quem publica aviso/material: `src/lib/hub.ts` (padrão: representante; comunidade pode abrir para membros)
- Settings (kind, visibilidade, aprovação, writers): `src/lib/community-settings.ts`
- Create / update / delete: `src/lib/community-write.ts`
- Papel e permissões: `src/lib/access.ts` (representante na v1 = admin)
- Entrar por código: `src/lib/join.ts` + RPC (privada não aparece no Descobrir)
- URL pública: `public_id` curto (`a43qw5pq`); uuid fica no banco
- **Não** scrapear SIGA
- **Não** commitar segredo

## Onde o trabalho costuma cair

```text
src/lib/*.ts          ← domínio + testes (preferido)
src/components/…      ← UI
src/app/…             ← rotas
supabase/migrations/  ← schema / RLS (nova migration, não editar a antiga em produção)
src/messages/         ← copy
```

## Licença

Ao mandar código, você concorda em licenciar no **MIT**, igual ao resto do projeto.
