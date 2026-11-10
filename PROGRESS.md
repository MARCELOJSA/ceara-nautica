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

### Rodada 1 — testes (em andamento)

- QA técnico: teste funcional completo (fluxos, formulários, integração com a API, responsividade, console, links).
- Usuário final: navegação como visitante leigo, no computador e no celular.

## Pendências

- [ ] Rodada 1 de testes
- [ ] SEC-04: headers de segurança na hospedagem (depende da escolha da hospedagem)
- [ ] B7: manchete da página inicial (decisão do cliente)
- [ ] Migração para Prisma 7 (SEC-13). Bloqueada enquanto a API em execução trava a DLL do Prisma
- [ ] Enviar os commits ao GitHub (falta a URL do repositório)
