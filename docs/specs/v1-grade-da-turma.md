# Spec: v1 da grade da turma

Corte da primeira versão pública. Glossário: CONTEXT.md. Decisões: docs/adr/0001 e 0002. Comportamento testável no módulo Grade.

O FatecFlow é hub da **turma** mais o **calendário pessoal** de cada um. Não é feed de evento. Calendário fica, porque é a agenda de uma pessoa. **Descobrir** é onde se acha comunidade pública da faculdade. Evento é tipo de comunidade acadêmica, não card de agenda.

## Problem Statement

O representante da turma não tem um lugar estável para a semana letiva. WhatsApp some, o PDF da unidade muda de formato, o SIGA ninguém abre só para ver a sala. O FatecFlow já tem o hub da comunidade, mas a **grade** não existe. O calendário pessoal (o certo) ainda ensina o errado: um botão cria comunidade-evento. A nav precisa de um terceiro link com job claro (**Descobrir**), sem virar feed. Quem passa lista não é a pessoa que esta v1 precisa trazer de volta toda semana.

## Solution

Na comunidade do tipo turma, o representante monta uma **grade**: uma semana-tipo (segunda a sábado) que se repete o semestre. Cada **aula** tem disciplina, professor, dia, começa, termina e sala física, cadastrada à mão. Membro vê. Representante e admin editam. Se duas aulas batem no horário, o app avisa e deixa salvar.

O **calendário** continua com esse nome: é pessoal. Nesta v1 ele não agrega ainda sessão, evento inscrito nem aviso com data. Só deixa de mentir (sem criar comunidade, sem check-in na página do evento). A nav fica Comunidades, Calendário, **Descobrir**. O GitHub público espera a grade usável.

Visão depois da v1 (não este spec): sessão em que o QR te registrou, comunidade-evento em que você se inscreveu, aviso com data e config “manda para o calendário” (prova na quarta cai na agenda dos membros).

## User Stories

1. As a representante, I want to open the turma hub and find a Grade tab, so that the week lives with the turma, not in WhatsApp.
2. As a representante, I want to add one aula at a time (disciplina, professor, dia, começa, termina, sala física), so that I can type from the campus PDF without a parser.
3. As a representante, I want days from Monday through Saturday, so that Saturday morning classes fit.
4. As a representante, I want start and end as clock times (e.g. 19:00–20:40), so that I am not stuck with “1ª aula” that changes per Fatec.
5. As a representante, I want the week I typed to repeat for the whole semester, so that I do not refill every week by hand.
6. As a representante, I want a warning when two aulas overlap, so that I notice a mistake, without being blocked when turma A/B or two labs share a slot.
7. As a representante, I want to edit an aula I already saved, so that a room change does not mean deleting and recreating.
8. As a representante, I want to delete an aula, so that a cancelled slot leaves the grade.
9. As a membro of the turma, I want to see the grade without being able to edit it, so that I know where class is today.
10. As a visitor who did not join, I want the grade hidden, so that the week is for people in the turma.
11. As an admin of the turma (the person who created it, or another admin), I want the same edit rights as the representante, so that v1 does not invent a new database role.
12. As a membro of a grupo, monitoria or evento, I want no Grade tab, so that grade stays a turma object.
13. As any signed-in user, I want the nav to say Comunidades, Calendário and Descobrir, so that the third link is a public campus directory, not a personal feed.
14. As any signed-in user, I want the Calendário page without a button that creates a comunidade, so that sessão is not taught as evento.
15. As a member of an evento comunidade, I want no “Fazer check-in” on that page, so that check-in waits for sessão.
16. As a representante, I want overlap warn-and-save to work when I submit, so that the rule is in the Grade module, not only in the form UI.
17. As a representante, I want empty grade to look like “no aulas yet” plus a way to add the first one, so that I am not staring at a broken grid.
18. As a membro, I want aulas laid out by day (Mon–Sat), so that I can scan the week in one look.
19. As a representante, I want times stored as start and end, so that duration is explicit.
20. As a future contributor, I want this behaviour testable through the Grade module interface, so that we do not need a browser to know overlap and permissions are right.
21. As a maintainer, I want GitHub to stay unpublished until this grade is usable, so that the public repo is not an empty calendar shell.

## Implementation Decisions

- One new module: **Grade**. Interface: list aulas for a turma, add, update, delete, and a pure overlap check (warn, do not block). Postgres and the hub UI are adapters.
- Grade exists only when the comunidade `kind` is turma.
- Aula fields: disciplina (text), professor (text), dia (Mon–Sat), começa, termina, sala física (text). No campus catalog, no SIGA id.
- Week is a template, not dated weeks. No holiday table in this spec.
- Permission in v1: `admin` of the comunidade edits; `member` reads. Persona representante is that admin in the glossary, not a new enum.
- Overlap: same turma, same day, time ranges intersect → warning on save; save still succeeds.
- Visible names: **Calendário** (personal dates), **Descobrir** (public directory). Paths `/calendar` and `/discover` may stay; renaming paths is later expand–contract.
- Calendário page: no CTA that creates a comunidade. Evento page: no member check-in CTA.
- Schema: aulas owned by `community_id`, RLS: members select; admins insert/update/delete; only kind turma.
- i18n: both message files. No locale in the URL.
- Do not scrape SIGA. Do not parse PDF.
- Grade UI is a week of aulas, not a feed of event cards.

## Testing Decisions

- No tests in the repo today. First tests hit the Grade module interface, not React or SQL internals.
- A good test: given aulas and an actor (admin vs member vs outsider), assert list/add/update/delete/overlap. No JSX snapshot. No “did we call supabase.from”.
- Required cases: add as admin; add as member fails; list as member; list as outsider fails; overlap warns and still adds; kind grupo has no aulas; Saturday is valid; start and end required.
- Copy (Descobrir, Calendário sem CTA, evento sem check-in) is ticketable; it is not the Grade seam.

## Out of Scope

- Sessão (abrir, QR, fechar) e o calendário cheio (sessão registrada, evento inscrito, aviso com data no calendário dos membros). Isso é a visão; não esta v1.
- Grade on monitoria, grupo or evento.
- Import PDF, paste table, SIGA, campus period names (“1ª aula”).
- Per-week exceptions (holiday, makeup).
- Role `representante` in the database.
- Renaming `/calendar` and `/discover` paths.
- Publishing GitHub (waits until grade is usable).
- Configurable hub modules beyond adding Grade on turma.
- Rebuilding the visual system. Keep the dark, quiet layout. Change labels and objects, not the craft.

## Further Notes

- CONTEXT.md is the glossary. ADR 0001 is the v1 cut. ADR 0002 is calendário pessoal + Descobrir.
- No issue tracker. Tickets live under `.scratch/v1-grade/issues/`.
