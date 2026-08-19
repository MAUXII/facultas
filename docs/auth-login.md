# Login no f.flow

Como o auth deve funcionar neste produto. Não é um SIS: a pessoa chega para ver turma e grupo, não para abrir boleto.

## Princípio

**Ver de graça. Agir com conta.**

Descobrir e comunidade pública abrem sem login. Criar, entrar, calendário, perfil e lista “minhas comunidades” pedem conta no momento da ação — e devolvem a pessoa para o lugar de onde ela veio (`?next=`).

Isso é o modelo Luma/Discord/GitHub: a vitrine é pública; a identidade entra quando o job precisa dela.

## O que não fazer

- Mandar `/` ou Descobrir para `/auth/login` só porque não há sessão.
- Tela de login como home.
- SSO institucional (`@ulife`, CPF) sem contrato com a IES.
- Scraping de SIGA para “já estar logado na faculdade”.

## Camadas

| Superfície | Visitante | Conta |
| --- | --- | --- |
| Descobrir | Lê comunidades `visibility = public` | Igual |
| Comunidade pública | Capa, nome, descrição, CTA | Entrar / pedir / hub se membro |
| Comunidade privada | Não acha (RLS) | Membro ou código |
| Criar, calendário, perfil, minhas comunidades | Login com `next` | Fluxo normal |
| QR, código, aviso, grade | — | Só autenticado |

RLS no Postgres continua sendo a trava real. A UI só deixa de empurrar o login cedo. Sem a policy `anon` de SELECT em comunidade pública, Descobrir vazio para visitante.

## Práticas

1. **Just-in-time.** Login no clique (Entrar na turma, Criar grupo), não no page load da vitrine.
2. **Volta para o `next`.** Só path interno (`/…`). Bloquear `//` e `://`.
3. **Sessão no cookie HttpOnly** (Supabase SSR + middleware `updateSession`). Não pôr JWT no `localStorage` na mão.
4. **RLS por papel.** `anon` lê o público. `authenticated` escreve o que é dela. Storage de capa já é bucket public para GET.
5. **Senha + e-mail na v1.** Passkey / magia / Google depois, se o campus pedir. Não misturar com Microsoft da Ânima.
6. **Rate limit e confirmação de e-mail** no projeto Supabase (Auth settings), não no Next.
7. **Logout volta para Descobrir**, não para a tela de senha.
8. **Não vazar membership** de comunidade privada no HTML. Se o SELECT falhar, é “não encontrada”.

## SSO de campus (depois)

Só com piloto: OAuth da IES ou magic link no e-mail institucional. Continua sendo conta f.flow, não o Ulife. O login institucional não substitui o hub do aluno.

## Checklist de implementação

- [ ] Migration `012_communities_select_anon.sql` rodada no Supabase.
- [ ] `/` sem sessão → Descobrir.
- [ ] Descobrir carrega públicas sem user.
- [ ] Nav visitante: Descobrir + Entrar; Comunidades/Calendário/Criar abrem login com `next`.
- [ ] CTA de entrar na comunidade / drawer manda para login e volta.
- [ ] Login e signup respeitam `?next=`.
- [ ] Logout → Descobrir.
