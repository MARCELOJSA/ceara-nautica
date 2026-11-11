# STATUS — Site Ceará Náutica

_Atualizado: 2026-11-10 (fim do ciclo de testes)_

## Estado atual
- [x] Monorepo criado (npm workspaces), Docker Compose do Postgres (porta 5433)
- [x] `packages/shared`: categorias, tipos, schemas Zod (inclui `requestType`), catálogo
- [x] Skill `ceara-nautica` e agentes `cn-frontend`, `cn-backend`, `cn-security-qa`, `cn-ux-evaluator` (em `~/.claude`)
- [x] API (`apps/api`) — rotas, Prisma (3 migrações), seed, testes + testes de segurança
- [x] Site (`apps/web`) — todas as páginas, formulários, SEO, consentimento LGPD
- [x] Integração (formulários fazem POST real na API)
- [x] QA de segurança — testes em `apps/api/tests/security` e `apps/web/e2e/qa`; relatório em `docs/SECURITY-REPORT.md` (veredito: APROVADO)
- [x] Avaliação UX — `docs/UX-REPORT.md` (nota 7,0)
- [x] Correções do UX-REPORT aplicadas e conferidas no código: A1, A2, A3, A4, M1–M8, B1–B3, B5, B6, B8 (B4 fotos repetidas: a revisar na nova rodada de UX)
- [ ] B7 (manchete do hero) — aguardando decisão do cliente
- [x] SEC-01 corrigido (byte nulo `U+0000` em texto/UTM/busca → 400 em vez de 500); testes `it.fails` viraram regressão
- [x] Revalidação técnica com Docker ligado (09/11/2026): `typecheck` ok, `lint` ok, API 160/160, web 30/30, Playwright 50/50 (+6 pulados por viewport), QA Playwright contra API real 31/31 (+4 pulados: headers dependem da hospedagem)
- [x] SEC-05, SEC-07 (configuração de produção) e SEC-08 (controles/bidi) corrigidos
- [x] Dependências: Zod 4, React Router 7, Vitest 4, sharp 0.35 — `npm audit --omit=dev` só com a cadeia do Prisma CLI (SEC-13, risco aceito)
- [ ] SEC-04: headers de segurança na hospedagem (ver `docs/SECURITY-REPORT.md`) — ao definir a hospedagem
- [ ] Migrar para Prisma 7 (fecha SEC-13)
- [x] Ciclo autônomo dev → QA → UX (2026-11-10): UX aprovado com nota 9,0, QA aprovado tecnicamente; detalhes em `PROGRESS.md`, `docs/QA-REPORT.md` e `docs/UX-REPORT.md`
- [x] Banco de dados: análise e decisão em `docs/DATABASE.md` (PostgreSQL + Prisma; Neon em produção); SSL obrigatório em produção; `db:backup`/`db:restore`

## Pendências que dependem da empresa (não inventar)
| Item | Onde configurar |
|---|---|
| WhatsApp | Desativado a pedido do cliente. Para ativar: `VITE_WHATSAPP_NUMBER=55DDDNUMERO` em `apps/web/.env` |
| Fotos reais dos produtos | Instagram tem fotos, mas precisam ser enviadas pela empresa (download automático bloqueado) |
| Endereço completo | `VITE_ADDRESS` |
| Horário de atendimento | `VITE_BUSINESS_HOURS` |
| E-mail comercial | `VITE_CONTACT_EMAIL` |
| Fotos reais / catálogo oficial | `packages/shared/src/catalog.ts` + `apps/web/public/images` |
| IDs de GTM / GA4 / Meta Pixel | `VITE_GTM_ID`, `VITE_GA4_ID`, `VITE_META_PIXEL_ID` |
| Domínio de produção | `VITE_SITE_URL`, `WEB_ORIGIN` (API) |
| História da empresa | página Sobre |
