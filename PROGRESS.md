# PROGRESS — Ciclo de desenvolvimento autônomo

Registro contínuo do trabalho da equipe: o que cada agente fez, o que foi testado e o que falta. Serve para retomar o trabalho se a sessão for interrompida. O estado geral do projeto fica em [docs/STATUS.md](docs/STATUS.md).

## Equipe

| Papel | Agente | Pode alterar |
|---|---|---|
| Desenvolvedor 1 — regras de negócio, API, integrações | `cn-backend` | `apps/api/**`, `docker-compose.yml` |
| Desenvolvedor 2 — interface, responsividade, componentes | `cn-frontend` | `apps/web/**` (exceto `e2e/qa`) |
| QA técnico | `cn-security-qa` | testes de QA e `docs/QA-REPORT.md`, `docs/SECURITY-REPORT.md` |
| Usuário final leigo (UX) | `cn-ux-evaluator` | `docs/UX-REPORT.md`, `docs/ux-screenshots/` |
| Orquestrador | sessão principal | `packages/shared`, `docs/STATUS.md`, este arquivo; commits |

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

### Rodada final — revalidação e revisão geral (em andamento)

Build de `f5d9000` em `http://localhost:4190`. O QA técnico faz a regressão e a revisão geral com veredito técnico; o usuário final revalida UX-04, 10, 12, 17, 18 e 20–26, refaz as oito situações reais e dá um veredito de experiência.

## Fila de tarefas (ordem obrigatória)

1. **Tarefa atual: ciclo dev → QA → UX → correções** até validar o site. Finalizar, testar e commitar tudo antes de passar à próxima.
2. **Depois: análise da necessidade de banco de dados** (pedido de 2026-11-10). Começar automaticamente, sem pedir confirmação:
   - Avaliar se o projeto precisa de banco e comparar PostgreSQL, MySQL, MongoDB, SQLite, Supabase e outras opções relevantes, separando o mecanismo de banco da plataforma de hospedagem.
   - Critérios: compatibilidade com a arquitetura atual, desempenho e confiabilidade, escalabilidade, desenvolvimento e manutenção, custo-benefício, segurança, execução local e em produção (ambientes separados de desenvolvimento, testes e produção).
   - Dar notas de 0 a 10 por critério, com justificativa. Não escolher automaticamente a maior nota geral.
   - Escolher uma solução principal e explicar: por que é a melhor escolha, vantagens, limitações, custo inicial, como cresce com o projeto e como funciona localmente e em produção.
   - Escolher, instalar, configurar e integrar, se necessário. Depois, testes finais e documentação dos resultados.
   - Ponto de partida: o projeto já usa PostgreSQL 16 (Docker, porta 5433) com Prisma 6, com 3 migrações e testes de integração. A análise precisa considerar o custo de trocar essa base.

## Pendências

- [x] Rodada 1 de testes
- [x] Rodada 1 de correções (desenvolvedores 1 e 2)
- [x] Rodada 2: revalidação do usuário final (8,6)
- [x] Rodada 2: revalidação do QA técnico (QA-01 a QA-08 corrigidos)
- [x] Rodada 2 de correções (UX-12, UX-18, UX-20 a UX-26, QA-10)
- [ ] Rodada 3: revalidação final (QA + usuário final) e revisão geral do site
- [ ] SEC-04: headers de segurança na hospedagem (depende da escolha da hospedagem)
- [ ] B7: manchete da página inicial (decisão do cliente)
- [ ] Migração para Prisma 7 (SEC-13). Bloqueada enquanto a API em execução trava a DLL do Prisma
- [x] Repositório no GitHub configurado: https://github.com/MARCELOJSA/ceara-nautica (privado)
