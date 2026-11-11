# PROGRESS — Ciclo de desenvolvimento autônomo

Registro contínuo do trabalho da equipe: o que cada agente fez, o que foi testado e o que falta. Serve para retomar o trabalho se a sessão for interrompida. O estado geral do projeto fica em [docs/STATUS.md](docs/STATUS.md).

## Equipe

| Papel                                                    | Agente            | Pode alterar                                                  |
| -------------------------------------------------------- | ----------------- | ------------------------------------------------------------- |
| Desenvolvedor 1 — regras de negócio, API, integrações    | `cn-backend`      | `apps/api/**`, `docker-compose.yml`                           |
| Desenvolvedor 2 — interface, responsividade, componentes | `cn-frontend`     | `apps/web/**` (exceto `e2e/qa`)                               |
| QA técnico                                               | `cn-security-qa`  | testes de QA e `docs/QA-REPORT.md`, `docs/SECURITY-REPORT.md` |
| Usuário final leigo (UX)                                 | `cn-ux-evaluator` | `docs/UX-REPORT.md`, `docs/ux-screenshots/`                   |
| Orquestrador                                             | sessão principal  | `packages/shared`, `docs/STATUS.md`, este arquivo; commits    |

Fluxo: desenvolvimento → QA técnico → usuário final → correções → novo teste. Uma funcionalidade só é aprovada depois de passar pelos dois testes.

## Ponto de partida (2026-11-10)

- Último commit antes do ciclo: `2dcd197`. Typecheck e lint limpos; API 168/168, testes do site 30/30, Playwright 50/50.
- Segurança: veredito APROVADO ([docs/SECURITY-REPORT.md](docs/SECURITY-REPORT.md)). SEC-04 depende da hospedagem.
- UX rodada anterior: nota 7,0 ([docs/UX-REPORT.md](docs/UX-REPORT.md)); correções aplicadas, falta revalidar.
- Repositório remoto: https://github.com/MARCELOJSA/ceara-nautica (configurado em 2026-11-10).

## Rodadas

### Rodada 1 — testes (concluída)

- **QA técnico** ([docs/QA-REPORT.md](docs/QA-REPORT.md), commit `4b6ff4a`): 9 problemas, nenhum Crítico ou Alto (4 Médios, 5 Baixos). Suítes: API 168/168, site 30/30, Playwright 50/50, QA existente 31/31 contra o build. Novos testes `[QA-xx]` falham enquanto o problema existir.
- **Usuário final** ([docs/UX-REPORT.md](docs/UX-REPORT.md), commit `4acfc8a`): nota **7,8** (antes 7,0). 19 apontamentos (UX-01 a UX-19). Itens da rodada anterior: A1, A2, A3, M1–M6, B1–B3, B5, B6 e B8 resolvidos; A4, M7 e M8 parciais; B4 ainda incomoda.
- **Achado comum aos dois (QA-09 = UX-01):** o servidor de desenvolvimento aberto desde 09/11 serve um cache antigo (Zod 3, React Router 6), e por isso aparece "Invalid literal value". O código e o build de produção estão corretos. Solução: reiniciar o Vite com `--force`. A revalidação usa um servidor novo, com cache próprio.

### Rodada 1 — correções

**Orquestrador (`packages/shared`)**

- `c31db77`: QA-04/UX-02 (telefone validado pelos dígitos; aceita "(92) 9 9999-9999"; mensagem para número sem DDD ou incompleto). QA-03 (limites de tamanho com mensagem em português). UX-16 (mensagens diferentes para vazio e curto, sem duplicar).
- `152373b`: QA-08 (removidas do catálogo 4 fotos inexistentes).
- `139f01b`: `lib/search.ts` com `looksLikeService`, contrato entre os dois desenvolvedores.

**Desenvolvedor 1 (`cn-backend`), concluído**

- `dcabc99`: QA-05 + UX-03. Busca única (`packages/shared/src/search.ts`) usada pela API e pelo site: sem acento, todas as palavras em qualquer ordem, 6m/6 m/6 metros, plural, sinônimos e 1 erro de digitação. `looksLikeService` reconhece "concerto", "arrumar" e outros.
- `9b84314`: QA-08 (seed avisa sobre foto inexistente; banco de dev semeado de novo).
- `5596f8f`: QA-02, UX-10 (orçamento com cartão do produto e "Trocar"), UX-19 (tela de sucesso confirma o telefone).
- `effd2a0`: UX-04 (motor de popa sem promessa), UX-07/UX-18 (fotos coerentes, sem repetição na galeria).

**Desenvolvedor 2 (`cn-frontend`), concluído**

- `4f0eae1`: QA-01 + UX-13 (foco do lightbox e arrastar no celular), QA-06 (CLS no desktop de 0,19–0,36 para ≤ 0,03), QA-07 (alvos de 44px).
- `a98e18e`: UX-05/11/12 (preço e prazo, dúvidas comuns e glossário no produto; ficha em ordem fixa), UX-06 (cards), UX-09 (catálogo compacto no celular), UX-17 (trilha "Catálogo").
- `8fe033e`: UX-08 (/sobre com etapas, projetos publicados e destaques; /contato sem parecer endereço).
- `74301ae`: UX-14/15 (sem botão flutuante no desktop; barra móvel sem quebra de linha).

**Orquestrador, ajustes pedidos pelos desenvolvedores**

- `cebd515`: novo tipo "Problema ou revisão no motor"; alt da canoa 6 m.
- `d5fb787`: menu "Catálogo" (UX-17); foto da página Sobre sem placas estrangeiras.

**Verificação após as correções:** typecheck e lint limpos; API 203/203; site 71/71; Playwright 52/52 (+8 pulados por viewport). Cada commit foi conferido compilando sozinho.

### Rodada 2 — revalidação

Ambiente limpo: build de produção em `http://localhost:4190`, com proxy para a API.

- **Usuário final, rodada 3** (`c0632cf`): nota **8,6** (antes 7,8). Dos UX-01 a UX-19: 14 resolvidos, 4 parciais (UX-04, UX-10, UX-17, UX-18) e 1 persistente de baixa prioridade (UX-12). Novos: UX-20 a UX-26, com só o UX-22 de prioridade média (quem tem motor com defeito não acha o caminho certo).
- **QA técnico:** interrompido pelo limite de uso da conta (reinicia às 4h50 de Manaus) e retomado depois. As alterações de teste em `apps/web/e2e/qa/` ainda não foram commitadas.

### Rodada 2 — correções (concluída)

**Orquestrador**

- `df1c451`: UX-12 (fichas das canoas iguais) e UX-25 ("Use apenas números"). O caso "sem DDD aceito" não se confirmou: o formulário recusa com "Inclua o DDD".
- `f5d9000`: QA-10 (a tolerância a erro de digitação só vale para palavras que não existem no catálogo; "chata" não traz mais produtos com "chapa").

**Desenvolvedor 1**

- `7ef9285`: UX-22 (botão "Problema no motor?" em Serviços; `/orcamento?servico=motor-revisao`), UX-24 (sem Categoria e Modelo em pedidos de serviço), UX-21 (tela de sucesso).
- `6e97ebe`: UX-18 (Home sem foto repetida; a Lancha 7 m saiu dos destaques da Home, decisão a confirmar com o cliente).

**Desenvolvedor 2**

- `c6245dd`: UX-22 (link e pergunta frequente na página Motores de popa), UX-23 ("Indicado para" em todos os cards, termo único "Lazer").
- `d2d68e8`: UX-20 (introdução curta no catálogo do celular). `c0efccd`: UX-26 (/sobre).

**QA técnico, rodada 2** (`1b244c3`): QA-01 a QA-08 **corrigidos**, com testes de regressão. QA-10 encontrado e corrigido em seguida.

**Verificação:** API 203/203, site 92/92, Playwright 59/59 (duas rodadas), regressão de QA 34/34. Tudo enviado ao GitHub (`origin/main`).

### Rodada final — revalidação e revisão geral (concluída)

- **Usuário final** (`2b149ae`): **APROVADO, nota 9,0**. As oito situações reais funcionam no PC e no celular sem a pessoa se perder. Novos detalhes de prioridade baixa: UX-27 a UX-30.
- **QA técnico** (`176f224`): **APROVADO tecnicamente**, sem problema Crítico ou Alto. Regressão completa e revisão geral (rotas, 11 produtos, sitemap, console, links, teclado, 360–1920 px, CLS). Novos: QA-11, QA-12 (Média, foco escondido sob as barras fixas) e QA-13.

### Rodada 3 — correções finais (concluída)

- **Desenvolvedor 1:** `0c81c89` UX-27 (busca por sintoma, como "motor falhando", sugere serviço e conserto de motor). `34db8c0` UX-28 (roteiro como texto de exemplo), UX-30 (/orcamento adaptado ao tipo de pedido), QA-13 (títulos de /servicos e /orcamento).
- **Desenvolvedor 2:** `40e6d33` QA-11 e QA-12 (foco visível e não escondido). `e8e4975` QA-13 (`lib/seo.ts`: limites de título e descrição). `a2de15f` UX-29 (linha do tempo da /sobre clicável).
- **Orquestrador:** capa de Lanchas com a foto da lancha 10 m, o que devolve a lancha de lazer (7 m) aos destaques sem repetir foto (pedido do desenvolvedor 2). `2286409` testes de QA ajustados. `f9ce1f6` formatação Prettier de 21 arquivos antigos.
- **Verificação final:** typecheck, lint e Prettier limpos; API 203/203; site 151/151; Playwright 61/61 (duas rodadas); QA completa contra o build **138 passaram, 0 falharam** (4 pulados: cabeçalhos HTTP dependem da hospedagem).

**Resultado do ciclo:** UX de 7,0 para **9,0**; QA técnico com 13 problemas encontrados e todos corrigidos (QA-09, de ambiente, deixou de existir com o reinício do PC). Pendências que dependem da empresa: fotos reais, endereço, horário, manchete da Home (B7), WhatsApp e hospedagem (SEC-04).

## Fila de tarefas (ordem obrigatória)

1. ~~Ciclo dev → QA → UX → correções~~ **concluído em 2026-11-10** (`f9ce1f6`).
2. ~~Análise da necessidade de banco de dados~~ **concluída em 2026-11-10** (`a4415bd`, `fa2263c`, `4076b78`; ver [docs/DATABASE.md](docs/DATABASE.md)). Pedido original: (pedido de 2026-11-10). Começar automaticamente, sem pedir confirmação:
   - Avaliar se o projeto precisa de banco e comparar PostgreSQL, MySQL, MongoDB, SQLite, Supabase e outras opções relevantes, separando o mecanismo de banco da plataforma de hospedagem.
   - Critérios: compatibilidade com a arquitetura atual, desempenho e confiabilidade, escalabilidade, desenvolvimento e manutenção, custo-benefício, segurança, execução local e em produção (ambientes separados de desenvolvimento, testes e produção).
   - Dar notas de 0 a 10 por critério, com justificativa. Não escolher automaticamente a maior nota geral.
   - Escolher uma solução principal e explicar: por que é a melhor escolha, vantagens, limitações, custo inicial, como cresce com o projeto e como funciona localmente e em produção.
   - Escolher, instalar, configurar e integrar, se necessário. Depois, testes finais e documentação dos resultados.
   - Ponto de partida: o projeto já usa PostgreSQL 16 (Docker, porta 5433) com Prisma 6, com 3 migrações e testes de integração. A análise precisa considerar o custo de trocar essa base.

## Banco de dados (tarefa 2, concluída)

- **Análise:** [docs/DATABASE.md](docs/DATABASE.md). O banco é necessário (leads e catálogo). Mecanismos com nota de 0 a 70: PostgreSQL 64, MySQL 58, MongoDB 50, SQLite 45. As plataformas foram comparadas à parte.
- **Decisão:** PostgreSQL 16 + Prisma (o que já estava em uso, sem reescrita); Docker no desenvolvimento e nos testes; **Neon, plano gratuito**, em produção (R$ 0, não cobra excedente, religa sozinho). Supabase foi descartado porque pausa após 1 semana sem uso; Render, porque o banco gratuito é apagado em 30 dias.
- **Desenvolvedor 1:** `a4415bd` SSL obrigatório para banco remoto em produção (achado: no Prisma 6, `verify-full`/`verify-ca` conectam **sem** TLS, por isso são recusados). `fa2263c` `db:backup`/`db:restore` via Docker (postgres:17-alpine), com confirmação `--yes` para destino remoto.
- **Verificação:** backup e restauração reais do banco de testes com contagens e conteúdo idênticos (pelo desenvolvedor e conferido pelo orquestrador); destino remoto sem `--yes` recusado; API 221/221, site 151/151.
- **Pendente (depende da empresa):** criar a conta no Neon e definir a hospedagem da API e do site. Nada foi testado contra um Neon real.

## Publicação (tarefa 3, concluída; falta só criar as contas)

- **Hospedagem** ([docs/HOSTING.md](docs/HOSTING.md)): Render para o site (estático, grátis) e para a API (grátis no começo; Starter a US$ 7/mês para não dormir) + Neon para o banco. Descartados: Vercel (o plano grátis proíbe uso comercial), Netlify (créditos curtos), Koyeb (exige cartão).
- **Prisma 7 (SEC-13): adiado.** Exige Node 20.19+; a máquina tem 20.18, e trocar o Node do sistema pede UAC. A gravidade é baixa.
- **Node 22.23.4 LTS** instalado em `%APPDATA%
vm22.23.4` (checksum oficial conferido), sem trocar o Node do sistema. O projeto passou nele. Para adotar no PC: `nvm use 22.23.4` (pede aprovação do Windows uma vez).
- **Desenvolvedor 2:** `807a0bd` zod sem `eval` (compatível com a CSP); `b0ca31c` site funciona com a API dormindo (acorda a API ao abrir o formulário, envio espera até 90 s com aviso, sem reenvio duplicado).
- **Desenvolvedor 1:** `933dad9` `render.yaml` (site + API, cabeçalhos SEC-04, cache, `TRUST_PROXY=3`, encerramento gracioso), com 15 testes.
- **QA, simulação de produção:** **aprovado para publicar**. 0 violações de CSP, CORS correto, nenhum pedido perdido com a API dormindo (25 s). Achou o QA-14 (o despertar deixava a requisição aberta e a página nunca ficava com a rede ociosa), corrigido pelo orquestrador: páginas ociosas em ~0,6 s; QA completa 135/135 sem contorno.
- **Guia:** [docs/DEPLOY.md](docs/DEPLOY.md), passo a passo de ~15 min para o dono criar as contas no Neon e no Render, carregar o catálogo e conferir.

## Pendências

- [x] Rodada 1 de testes
- [x] Rodada 1 de correções (desenvolvedores 1 e 2)
- [x] Rodada 2: revalidação do usuário final (8,6)
- [x] Rodada 2: revalidação do QA técnico (QA-01 a QA-08 corrigidos)
- [x] Rodada 2 de correções (UX-12, UX-18, UX-20 a UX-26, QA-10)
- [x] Rodada final: QA aprovado; usuário final aprovado (9,0); correções da rodada 3 aplicadas e verificadas
- [x] SEC-04: headers configurados no render.yaml e validados na simulação (conferir no domínio publicado)
- [ ] B7: manchete da página inicial (decisão do cliente)
- [ ] Migração para Prisma 7 (SEC-13). Não está mais bloqueada pelo ambiente (o `npm run typecheck` completo passa desde o reinício)
- [ ] Produção: o dono cria as contas no Neon e no Render e segue o docs/DEPLOY.md (tudo técnico pronto)
- [x] Repositório no GitHub configurado: https://github.com/MARCELOJSA/ceara-nautica (privado)
