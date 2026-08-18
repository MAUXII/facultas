# f.flow vs Ulife

Battlecard de produto. Pesquisa em 18 ago 2026.

**Não são o mesmo produto.** O slogan se parece — “tudo da faculdade num só lugar” / “sua faculdade, num só lugar”. O job to be done não.

| | Ulife | f.flow |
| --- | --- | --- |
| Categoria | SIS / LMS / AVA oficial | Hub de comunidades criado por alunos |
| Dono | Ânima Educação | A pessoa (open source MIT) |
| Quem entra | Aluno da rede, login `CPF@ulife.com.br` | Qualquer campus |
| Concorrente real | Portal do Aluno + Teams + obrigatório da IES | WhatsApp da turma, mural, Instagram |

Ulife é o sistema da faculdade. f.flow é o lugar da turma que o sistema não cobre.

---

## Perfis

### Ulife (Ânima Educação)

- Site: [ulife.com.br](https://www.ulife.com.br)
- Apps: [Play Store](https://play.google.com/store/apps/details?id=br.com.ulife) · [App Store](https://apps.apple.com/nz/app/ulife/id1448277927)
- Posicionamento público: “Já imaginou tudo o que você precisa de uma faculdade na palma da sua mão? O Ulife é o seu aplicativo de gestão acadêmica do sistema Ânima Educação.”
- Preço: incluso na mensalidade. Não há war de preço com o f.flow.
- Mercado: IES da rede Ânima. Fora da rede, o Ulife **não existe**.
- Identidade: `CPF@ulife.com.br` + senha do Portal do Aluno + Microsoft (Teams 2026.1).

**Portal do Aluno ≠ Ulife.** Boleto, histórico e requerimento ficam no portal; Ulife é a sala virtual + app. Na prática o aluno trata os dois como “o sistema da faculdade”.

### f.flow (este repo)

- Hub acadêmico: a pessoa organiza a faculdade em comunidades. Glossário em [`CONTEXT.md`](../../CONTEXT.md).
- v1: comunidades (turma / grupo / monitoria / evento) + grade da turma + Descobrir + calendário pessoal (ainda vazio).
- Auth: nome, e-mail, senha. Username aleatório. Sem IES dona do cadastro.
- Grade: o **representante** cadastra aula a aula. Não é o horário do SIGA.
- Preço: produto próprio, grátis no recorte atual.

---

## Matriz cabeça a cabeça

Legenda da coluna **Leitura**:

- **Eles** — Ulife na frente; f.flow não deve perseguir agora.
- **Nós** — f.flow na frente; Ulife não replica.
- **Overlap** — mesmo job, donos diferentes, ou Ulife mais maduro.
- **Dívida** — gap honesto da v1 do f.flow, não vantagem estrutural do Ulife.
- **Depois** — copiar experiência ou canal mais tarde, não o módulo.

| Capacidade | Ulife | f.flow v1 | Leitura |
| --- | --- | --- | --- |
| Sala virtual / AVA (conteúdo da UC) | Sim — módulo do curso, plano de ensino | Não | Eles. Job institucional. Não compete. |
| Aulas gravadas + live (Teams) | Sim — 2026.1 login `@ulife` obrigatório | Não | Eles. Infra Microsoft da IES. |
| Notas, atividades, provas oficiais | Sim | Não | Eles. SIGA/AVA. Evitar. |
| Histórico, boletos, requerimentos | Portal do Aluno (ligado ao Ulife) | Não | Eles. Contrato com a IES. |
| Carteirinha digital | Sim — atalho rápido após reformulação 2025 | QR pessoal (identidade social) | Eles. QR ≠ documento oficial. |
| Estágio + currículo | Sim | Não | Eles. Marketplace da IES. |
| Atendimento humano online | Pessoas online para dúvida | Não | Eles. Staff da IES. Não copiar. |
| Calendário acadêmico | Oficial, amarrado a grade e atividades | Página existe, vazia na v1 | Dívida. Fecha o slogan. |
| Quadro de horários | Institucional, no SIS | Grade na turma, o representante cadastra | Overlap. Mesmo job, donos diferentes. |
| Frequência | Automática no Teams (conta institucional) | Sessão + QR planejado; não é o produto da v1 | Overlap. Ulife no online; f.flow no presencial. |
| Avisos / materiais da turma | Professor no AVA | Representante publica aviso | Overlap social, não acadêmico oficial. |
| App nativo iOS/Android | Sim — Play ~4,9 / App Store ~4,5 pós-2025 | Web (Next.js) | Depois. Nativo quando houver hábito. |
| SSO / e-mail institucional | `CPF@ulife.com.br` + Microsoft | E-mail + senha, username aleatório | Depois. SSO só com parceria de campus. |
| IA de estudo (RECAP: resumo/transcrição) | Sim — 2º recurso mais usado | Não | Depois. Só faz sentido sobre aula gravada. |
| Comunidade criada pelo aluno | Não — a IES define a sala | Turma, grupo, monitoria, evento | Nós. Núcleo do f.flow. |
| Descobrir grupos do campus | Não | Sim — `/discover` + código privado | Nós. Onde o WhatsApp vive hoje. |
| Grupo sem instituição | Não — lock-in Ânima | Sim | Nós. Fatec, USP, particular fora da rede. |
| Representante opera a turma | Professor / coordenação no SIS | Primeira pessoa da v1 | Nós. Poder no aluno, não no admin. |
| Open source / qualquer IES | Produto fechado da Ânima | MIT | Nós. Não dá para “entrar no Ulife” fora da rede. |
| Preço | Incluso na mensalidade da Ânima | Grátis (produto próprio) | Fora de categoria. Não há war de preço. |

---

## O que o Ulife tem e o f.flow não tem

### Sala de aula no bolso (oficial)

Conteúdo da unidade curricular, material do professor, aulas gravadas e live no Microsoft Teams. A partir de 2026.1 a frequência online só conta com `@ulife.com.br`. Usuário em conta pessoal fica fora da lista de confirmação do docente.

f.flow não tem aula, gravação, chat de UC nem SSO Microsoft. Não deve ter.

### Vida administrativa (oficial)

No app: calendário institucional, atividades, carteirinha digital. No Portal do Aluno: boletos, requerimentos, histórico escolar.

f.flow tem calendário pessoal vazio e QR de identidade. Isso não substitui documento nem financeiro.

### Carreira e estudo (oficial)

Área de estágio (vagas + currículo). RECAP (IA) gera resumo e transcrição de vídeo educacional — segundo recurso mais usado na plataforma após a reformulação, com dezenas de milhares de eventos de uso reportados pela Ânima.

Sem acervo de aula, IA de estudo no f.flow não tem matéria-prima.

### Distribuição e identidade (canal)

App nativo iOS/Android. Login `CPF@ulife.com.br`. Staff online para dúvida. Rede Ânima inteira (várias IES).

Notas nas lojas (TI Inside, ago 2025): Play Store de ~1,4 para ~4,9; App Store de ~1,2 para ~4,5. Mudanças citadas: carteirinha no primeiro toque, menos load de recurso externo, layout para mais tamanhos de tela. Histórico de reclamação: login, lentidão, bug.

f.flow é web, e-mail/senha, sem IES dona do cadastro. Continua sendo escolha, não obrigação.

### Sentimento

O conceito vende (“faculdade no bolso”). Continua sistema **obrigatório**, não escolha. f.flow compete com o WhatsApp da turma, não com a mensalidade.

---

## Onde o f.flow ganha — e o Ulife não entra

### Comunidade é o produto

Turma, grupo, monitoria e evento são hubs que o aluno cria ou entra. Ulife só abre a sala que a IES provisionou. Não existe “grupo de TCC”, “monitoria de cálculo” ou “hackathon” como comunidade descoberta.

### Descobrir + código

Público no campus versus privado por código. Ulife não tem vitrine social. O aluno acha gente e grupo no WhatsApp, Instagram e mural — esse é o buraco.

### Qualquer campus

MIT, sem lock-in Ânima. Fatec, USP, particular fora da rede: Ulife simplesmente não existe. Comparar feature a feature esconde isso.

### Poder no representante

A grade da turma é operada por quem vive o semestre, não pelo SIS. Duas aulas no mesmo horário: o app avisa e deixa salvar. Ulife mostra o quadro oficial — se estiver errado, o aluno não conserta.

---

## Dívida honesta da v1

Isso **não** é vantagem estrutural do Ulife. É o f.flow ainda devendo o próprio slogan.

| Item | Estado no f.flow | Por que dói na conversa |
| --- | --- | --- |
| Calendário pessoal | Tela existe, sem sessão/aviso caindo nela | Ulife entrega “o que tenho essa semana”. Sem isso o slogan fica vazio. |
| Sessão + check-in QR | QR pessoal existe; sessão ainda não é o fluxo | Frequência presencial é o único job de presença que o Ulife não resolve bem. |
| Aviso com data → agenda | Modelo no `CONTEXT.md`, não na v1 | Prova na quarta sem cada um salvar no WhatsApp. |

---

## O que não copiar

Regra: tudo que exige contrato com a IES, dado oficial do aluno ou staff pago fica fora. Copiar a lista da Play Store transforma o f.flow num SIS incompleto que nenhuma faculdade vai homologar.

| Módulo Ulife | Por que não | Alternativa f.flow |
| --- | --- | --- |
| Notas / histórico / boleto / requerimento | Dado jurídico da IES. Sem API oficial é fraudulento ou inútil. | Não ter. No máximo link “abra o SIGA/portal”. |
| Carteirinha digital | Documento. QR social não substitui. | Manter QR de identidade da pessoa no campus. |
| Sala virtual + gravação + Teams | Conteúdo e licença da IES + Microsoft. | Material que o representante sobe na comunidade (não é AVA). |
| Frequência automática no Teams | SSO institucional. | Check-in presencial na sessão, quando existir. |
| Estágio + currículo da IES | Rede de empresas da Ânima. | Comunidade-evento e grupo de projeto, se o campus quiser. |
| RECAP (IA em vídeo de aula) | Precisa do acervo de aula. | Só faz sentido anos depois, se houver conteúdo próprio. |
| Atendimento humano 24h | Folha da IES. | Monitoria como comunidade, não helpdesk. |
| Login CPF + e-mail `@ulife` | Identidade da rede. | Conta própria. SSO só com piloto de campus. |

---

## O que vale puxar (experiência, não módulo)

1. **Calendário que responde.** “O que tenho essa semana” é a tela que o aluno abre todo dia. Encher o calendário pessoal (aviso com data, sessão) é o único gap que fecha o slogan.
2. **Atalho do que importa.** Em 2025 a Ânima ganhou nota nas lojas com carteirinha no primeiro toque e menos load. No f.flow o equivalente é: grade da turma e QR sem enterrar em menu.
3. **Nativo depois.** O app existe porque a IES obriga o aluno a abrir todo dia. f.flow só precisa de nativo quando houver hábito (calendário + sessão), não para parecer Ulife.

---

## Talk tracks

Quando alguém diz “isso é tipo Ulife”:

### Menção cedo

Ulife é o sistema da Ânima: aula, nota, boleto, carteirinha. f.flow é o lugar da turma que o Ulife não cobre — grupo, monitoria, evento, grade que o representante corrige, descobrir gente no campus. Os dois podem coexistir. O Ulife não deixa o aluno criar uma comunidade.

### Displacement — “já uso o Ulife, pra que outro app”

Não substitui. O WhatsApp da turma é o concorrente real. Se a grade do Ulife estiver certa e ninguém precisar de grupo extra, o f.flow não tem urgência — e isso é honesto. A urgência aparece quando a sala oficial não é o grupo de estudo, o evento ou a monitoria.

### Fora da Ânima

Ulife não existe. A comparação vira SIGA/AVA daquela IES + WhatsApp. f.flow ganha o mesmo recorte: camada social e operacional da turma, não o sistema acadêmico.

### Objeções

| O que a pessoa diz | Resposta |
| --- | --- |
| “Ulife já tem calendário e horário.” | O oficial. Se estiver errado, ninguém na turma conserta. A grade do f.flow é do representante. |
| “Ulife já tem a turma.” | Tem a sala da UC. Não tem grupo, monitoria nem evento que o aluno abre e o campus descobre. |
| “Vocês não têm nota / boleto / carteirinha.” | De propósito. Isso é da IES. Quem promete isso sem contrato está mentindo ou scrapeando. |
| “É mais um app.” | É o app da turma, não o da secretaria. Se o WhatsApp da turma já resolve tudo, não há urgência. |

---

## Landmines

Perguntas. Sem atacar o Ulife.

- Onde vocês combinam trabalho de grupo, monitoria e evento — no Ulife ou no WhatsApp?
- Se a grade oficial estiver errada, quem corrige: a coordenação ou o representante?
- Dá para um aluno de outra faculdade entrar na “comunidade” do Ulife?
- A carteirinha resolve presença na aula presencial, ou só na catraca e no benefício?

---

## Recomendação

Não competir no financeiro, nota, carteirinha, AVA.

Competir no WhatsApp da turma.

O overlap real é “vida acadêmica num lugar”. O gap que o f.flow ainda deve ao slogan é **calendário + sessão**, não virar SIS.

---

## Fontes

- Play Store — Ulife (Ânima Educação), ficha e “o que há de novo” (atualizado mai 2025).
- App Store — Ulife App, versão 4.8.20.
- Onboarding Ânima — [iniciograde2a.animaeducacao.com.br](https://iniciograde2a.animaeducacao.com.br/) (Portal do Aluno vs app, login `CPF@ulife.com.br`).
- Docs docentes Teams 2026.1 — autenticação `@ulife.com.br` obrigatória, frequência automática.
- TI Inside, 5 ago 2025 — reformulação do app, notas nas lojas, RECAP.

Refresh: se a Ânima anunciar módulo novo, ou antes de um piloto de campus na rede. Não tratar este arquivo como verdade eterna das lojas (notas mudam).
