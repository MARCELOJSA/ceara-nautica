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
- Sem repositório remoto: os commits ficam locais até o dono do projeto informar a URL do GitHub.

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

**Desenvolvedor 1 (`cn-backend`), em andamento:** QA-05 + UX-03 (busca única em `packages/shared/src/search.ts` para API e site: sem acento, várias palavras, sinônimos e pequenos erros de digitação), QA-08 (reseed), QA-02, UX-10, UX-19 (formulários), UX-04 (texto sobre motores sem inventar), UX-07/UX-18 (fotos).

**Desenvolvedor 2 (`cn-frontend`), em andamento:** QA-01 + UX-13 (lightbox), QA-06 (salto de layout no carregamento), QA-07 (alvos de toque), UX-05/11/12 (preço e prazo, glossário e ficha técnica no produto), UX-06 (cards), UX-08 (Sobre e Contato), UX-09 (catálogo no celular), UX-14/15 (botão flutuante e barra inferior), UX-17 (trilha "Catálogo").

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
- [ ] Rodada 1 de correções (desenvolvedores 1 e 2)
- [ ] Rodada 2: revalidação do QA e do usuário final
- [ ] SEC-04: headers de segurança na hospedagem (depende da escolha da hospedagem)
- [ ] B7: manchete da página inicial (decisão do cliente)
- [ ] Migração para Prisma 7 (SEC-13). Bloqueada enquanto a API em execução trava a DLL do Prisma
- [ ] Enviar os commits ao GitHub (falta a URL do repositório)
