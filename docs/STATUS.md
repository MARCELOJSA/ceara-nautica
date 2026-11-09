# STATUS — Site Ceará Náutica

_Atualizado: 2026-11-09_

## Estado atual
- [x] Monorepo criado (npm workspaces), Docker Compose do Postgres (porta 5433)
- [x] `packages/shared`: categorias, tipos, schemas Zod, catálogo demonstrativo
- [x] Skill `ceara-nautica` e agentes `cn-frontend`, `cn-backend`, `cn-security-qa`, `cn-ux-evaluator` (em `~/.claude`)
- [ ] API (`apps/api`) — em desenvolvimento pelo cn-backend
- [ ] Site (`apps/web`) — em desenvolvimento pelo cn-frontend
- [ ] Integração
- [ ] QA de segurança
- [ ] Avaliação UX
- [ ] Correções e revalidação

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
