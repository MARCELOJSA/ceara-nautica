# QA-REPORT — Site Ceará Náutica (Rodada 1, teste técnico funcional)

_Data: 2026-11-10 · Agente: AGENT 03 (QA técnico) · Escopo: `apps/web`, `apps/api`, integração e ambiente de desenvolvimento._

## Resumo

O site funciona de ponta a ponta. Todas as rotas abrem, os 11 produtos da API carregam com SEO correto, o catálogo filtra e busca com a URL sincronizada (inclusive voltar/avançar), e os formulários gravam leads reais na API. Os erros de rede, 429 e 500 aparecem com mensagens amigáveis e os dados digitados são preservados. Com a API fora, o site usa o catálogo local. Não há rolagem horizontal em 360, 390, 768, 1024, 1280 e 1920 px. No build de produção, o console fica limpo.

Foram encontrados **9 problemas, nenhum Crítico ou Alto**: 4 de gravidade Média e 5 Baixa.

- **QA-01** (Média): no lightbox, o foco pula para "Fechar" quando se troca de foto, então um segundo Enter fecha a galeria.
- **QA-04** (Média): o telefone escrito como "(92) 9 9999-9999", formato muito comum, é recusado.
- **QA-06** (Média): CLS de 0,18 a 0,36 no desktop em todas as páginas, porque o rodapé aparece durante o carregamento e depois é empurrado para baixo.
- **QA-09** (Média, só no ambiente de desenvolvimento): o Vite em `:5173` serve uma cópia antiga de React Router 6 e Zod 3 que ficou no cache. Por isso a suíte QA existente tem 2 falhas no dev.

Cada problema tem um teste `[QA-xx]` que o reproduz. O teste falha enquanto o problema estiver aberto.

## Ambiente

| Item | Valor |
|---|---|
| Site (dev) | `http://localhost:5173` (Vite, proxy `/api` → 3333) |
| Site (build) | `http://localhost:4175` (`vite preview` do `dist` gerado por `npm run build`; aberto e encerrado pelo QA) |
| API | `http://localhost:3333/api` (NODE_ENV=development, rate limit 5/min) |
| Banco | PostgreSQL 16 em Docker, porta 5433 (`ceara-nautica-db`) |
| Navegador | Chromium (Playwright 1.x), locale pt-BR |
| SO | Windows 11 |

Os leads de teste (nome com "QA-TEST") foram apagados ao final: 3 em `contact_messages` e 3 em `quote_requests`. A contagem depois da limpeza é 0.

## O que foi testado

- [x] **Rotas**: `/`, `/produtos`, `/produtos/:slug` dos 11 produtos da API, `/sobre`, `/servicos`, `/contato`, `/orcamento`, `/politica-de-privacidade`, 404 e produto inexistente (incluindo slug em maiúsculas).
- [x] **Catálogo**:
  - Filtro de cada categoria com a contagem igual à da API.
  - Chip ativo (`aria-pressed`) e `h1` da categoria.
  - Busca com debounce para `?q=`, sem acento.
  - Busca combinada com categoria.
  - Estado vazio, "Limpar filtros" e sugestão de serviços.
  - URL `?categoria=&q=` na abertura, voltar/avançar do navegador e categoria inválida.
- [x] **Detalhe do produto**:
  - Miniaturas iguais às fotos que existem.
  - Lightbox: abre, setas do teclado, foco preso, Esc fecha e devolve o foco, clique no fundo fecha, rolagem do body travada e liberada.
  - Relacionados: mesma categoria, sem o próprio produto, no máximo 4.
  - Navegação para relacionado volta ao topo e reinicia a galeria.
  - CTA `?produto=`.
- [x] **Serviços**: FAQ abre e fecha com clique, Enter e Espaço. Os 5 CTAs levam ao orçamento com tipo, categoria e mensagem pré-preenchidos.
- [x] **Orçamento**: `?produto=`, `?categoria=`, `?servico=`, produto inválido ignorado, botão "Remover produto selecionado".
- [x] **Formulários**:
  - Validação campo a campo, foco no primeiro erro, `aria-invalid`, erro some ao corrigir.
  - Limites de 120 e 2000 caracteres, formatos de telefone, labels acessíveis.
  - Botão desabilitado com "Enviando…" e sem duplo POST (clique e Enter durante o envio).
  - Mensagem de sucesso com foco e reset.
  - API fora do ar: mensagem amigável, dados preservados, reenvio funciona.
  - 429 amigável, 400 com `details` mapeado para o campo, resposta HTML 502.
  - Envio real com 201.
- [x] **Integração**: produtos da API idênticos ao catálogo de `@cn/shared` (11 × 11, campo a campo), contagem de categorias igual à lista de produtos, chips iguais às categorias da API, fallback com API recusando conexão e com API respondendo 500, imagens declaradas pela API, erros da API em JSON sem stack trace.
- [x] **Responsividade (360, 390, 768, 1024, 1280, 1920)**:
  - Sem rolagem horizontal.
  - Sem título ou botão cortado ou saindo da tela.
  - Menu móvel: abre, foco preso com Tab e Shift+Tab, Esc fecha e devolve o foco, cada link navega e fecha, fundo fecha, fechado fica inacessível.
  - Barra inferior não cobre o rodapé e muda para "Contato" no orçamento.
  - Banner de cookies clicável acima da barra e escolha persistida.
  - Alvos de toque.
- [x] **Console e rede**: todas as rotas e os 11 produtos em 1280 e 360 px, no dev e no build. Coletados erros, avisos, requisições falhas e HTTP ≥ 400.
- [x] **Acessibilidade básica**: skip link, `aria-current` no menu, foco visível, ordem de headings (sem saltos), um único `h1` por página, labels, `alt` (suíte existente).
- [x] **SEO técnico**: `<title>` e description únicos nas 7 páginas estáticas, canonical, JSON-LD válido (`Product`, `BreadcrumbList`, `FAQPage`, `LocalBusiness`), `noindex` no 404, `robots.txt` com `Sitemap:` e `sitemap.xml` com todos os produtos da API (build).
- [x] **Performance básica**:
  - Bundle: `react` 65 KB gz, chunk dos formulários 40 KB gz (Zod), `motion` 25 KB gz.
  - Nenhuma imagem acima de 250 KB.
  - CLS medido por página (ver QA-06).

## Problemas encontrados

| ID | Gravidade | Página / componente | Passos para reproduzir | Esperado × obtido | Evidência | Sugestão de correção | Arquivo provável |
|---|---|---|---|---|---|---|---|
| QA-01 | Média | Detalhe do produto / Lightbox | Abrir `/produtos/canoa-aluminio-7m` → "Ampliar" → Tab até "Próxima imagem" → Enter → Enter. | **Esperado:** cada Enter troca a foto e o foco continua em "Próxima imagem". **Obtido:** após o 1º Enter o foco vai para "Fechar", e o 2º Enter fecha o lightbox. O mesmo acontece com o clique do mouse: o foco também vai para "Fechar". | `functional.qa.ts` › `[QA-01]`. Script manual: `after 1st enter: 2 / 2 \| focus: Fechar` / `dialog visible after 2nd enter: false` | `onClose={() => setLightbox(null)}` cria uma função nova a cada render. Como `useFocusTrap` depende de `onClose`, o efeito é desmontado e montado de novo a cada troca de foto: devolve o foco ao botão "Ampliar" e depois foca o 1º elemento ("Fechar"). Corrigir com `useCallback` no `onClose`, ou guardar `onClose` em `useRef` dentro do hook para tirá-lo das dependências (esta segunda opção protege todos os usos do hook). | `apps/web/src/pages/ProductDetail.tsx`, `apps/web/src/hooks/useFocusTrap.ts` |
| QA-02 | Baixa | Orçamento / `QuoteForm` | Abrir `/orcamento?produto=bote-aluminio-6m` (o tipo é sugerido como "Nova embarcação") e trocar a Categoria para "Motores de popa". Também ocorre em `/orcamento`: escolher "Lanchas" e depois "Motores de popa". | **Esperado:** o tipo sugerido acompanha a categoria ("Motor de popa"). **Obtido:** continua "Nova embarcação" e o lead chega com `category=motores-de-popa` e `requestType=nova-embarcacao`. | `functional.qa.ts` › `[QA-02]` | Registrar se o tipo foi sugerido automaticamente (por exemplo, com `getFieldState('requestType').isDirty`) e, nesse caso, atualizá-lo junto com a categoria. Manter a escolha quando o usuário definiu o tipo manualmente. | `apps/web/src/components/forms/QuoteForm.tsx` |
| QA-03 | Baixa | Formulários (front) e API | Contato: e-mail com mais de 160 caracteres. Orçamento: cidade com mais de 120 caracteres. Enviar. | **Esperado:** mensagem em português. **Obtido:** `Too big: expected string to have <=160 characters` na tela e `"city":["Too big: expected string to have <=120 characters"]` na API. | `forms-functional.qa.ts` › `[QA-03]`; `curl POST /api/quotes` | Dar mensagem aos `.max()` sem texto em `schemas.ts` (`email.max(160)`, `city.max(120)`, `productSlug.max(160)`, UTM), ou configurar `z.config(z.locales.pt())` uma vez em `@cn/shared`. | `packages/shared/src/schemas.ts` (orquestrador) |
| QA-04 | Média | Formulários (contato e orçamento) e API | Digitar o telefone como `(92) 9 9999-9999`, `92 9 9999-9999` ou `+55 (92) 9 9999-9999`. | **Esperado:** aceito, porque é o formato que muitos clientes digitam (9 separado). **Obtido:** "Telefone inválido. Ex.: (92) 99999-9999" no front, e 400 na API pelo mesmo schema. Não há máscara no campo. | `forms-functional.qa.ts` › `[QA-04]` (`recusados: (92) 9 9999-9999 \| 92 9 9999-9999 \| +55 (92) 9 9999-9999`) | Aceitar espaço ou hífen opcional depois do 9 (`9?[\s-]?\d{4}`), ou validar só a quantidade de dígitos (10 ou 11, com 55 opcional) depois de remover pontuação. Opcional: máscara no input. | `packages/shared/src/schemas.ts` (`phoneRegex`) |
| QA-05 | Baixa | API `GET /api/products?q=` | `curl "localhost:3333/api/products?q=aluminio"` e comparar com `q=alumínio`. | **Esperado:** o mesmo resultado, como na busca do site, que remove acentos. **Obtido:** `aluminio` → 0 produtos e `alumínio` → 9. O site não é afetado hoje porque filtra no cliente, mas a API não se comporta como o front. | `functional.qa.ts` › `[QA-05]` | Busca sem acento: extensão `unaccent` com `$queryRaw` parametrizado, ou uma coluna `searchText` normalizada (NFD, sem diacríticos, minúsculas) preenchida no seed e no cadastro, com `contains` sobre ela. | `apps/api/src/routes/catalog.ts` (e `prisma/schema.prisma` e seed, se usar coluna) |
| QA-06 | Média | Todas as páginas / `Layout` (desktop) | Abrir qualquer página em 1280×800 e medir o CLS com `PerformanceObserver('layout-shift')`. | **Esperado:** CLS < 0,1. **Obtido (build):** `/` 0,337; `/produtos` 0,364; `/sobre` 0,337; `/servicos` 0,306; `/contato` 0,225; `/orcamento` 0,191; produto 0,193. A origem é sempre o `FOOTER` (e o botão flutuante): enquanto o chunk da página carrega, o `PageFallback` (`min-h-[60vh]`) deixa o rodapé dentro da tela, e depois ele é empurrado. No celular (390 px) o CLS é 0. | `responsive-functional.qa.ts` › `[QA-06]`; medição com fontes do shift | No fallback do `Suspense`, reservar a altura da tela (`min-h-screen`) ou não renderizar o rodapé até a página carregar. Opcional: pré-carregar o chunk da rota inicial. | `apps/web/src/components/layout/Layout.tsx` (`PageFallback`) |
| QA-07 | Baixa | Rodapé, breadcrumb, Contato, Política de Privacidade | Em 360, 390 ou 768 px, medir os elementos clicáveis. | **Esperado:** alvos ≥ 44 px (regra do projeto). **Obtido:** links do rodapé com 40 px (`min-h-10`), logo do rodapé com 36 px, botão "Preferências de cookies" do rodapé com 40 px, links do breadcrumb com 32 px (`min-h-8`), "Manaus no mapa" com 20 px e "abrir preferências de cookies" na Política com 28 px. Todos passam no mínimo do WCAG 2.5.8 (24 px), mas não na regra do projeto. | `responsive-functional.qa.ts` › `[QA-07]` | Usar `min-h-11` nesses links e botões. No breadcrumb, se a altura visual incomodar, aumentar só a área clicável com padding vertical. | `apps/web/src/components/layout/Footer.tsx`, `apps/web/src/components/ui/Breadcrumb.tsx`, `apps/web/src/pages/Contact.tsx`, `apps/web/src/pages/Privacy.tsx` |
| QA-08 | Baixa | API: dados do catálogo | `GET /api/products` e conferir cada `images[].src`. | **Esperado:** toda imagem declarada existe. **Obtido:** 4 caminhos inexistentes: `lancha-cargueira-iguaracu-9m-2.webp`, `lancha-aluminio-10m-2.webp`, `lancha-aluminio-7m-2.webp` e `motores-de-popa-2.webp`. O site esconde essas fotos com `product-images.json`, mas qualquer outro consumidor da API recebe links quebrados. | `functional.qa.ts` › `[QA-08]` | Remover essas entradas do catálogo e rodar o seed de novo, ou adicionar as fotos. Opcional: o seed avisar quando uma imagem não existir em `apps/web/public`. | `packages/shared/src/catalog.ts` (orquestrador) + `apps/api/prisma/seed.ts` |
| QA-09 | Média (só desenvolvimento) | Ambiente: Vite dev em `:5173` | Abrir `/contato` no dev e enviar vazio; olhar o console. | **Esperado:** o dev usa as mesmas bibliotecas do build. **Obtido:** o cache `apps/web/node_modules/.vite/deps` (de 09/11 02:33, anterior às migrações de 10/11) serve **React Router 6.30.6** e **Zod 3**, mas o instalado é 7.18.5 e Zod 4.6.7. Sintomas: o consentimento mostra `Invalid literal value, expected true` em vez de "É necessário autorizar o contato para enviar." e aparecem 2 avisos "React Router Future Flag Warning" por página. Por isso 2 testes da suíte QA existente falham no dev, e passam no build. | `npx playwright test -c e2e/qa/playwright.qa.config.ts` (2 falhas no dev, 31/31 no build); `grep "React Router v" .vite/deps/react-router-dom.js` → `v6.30.6` | Reiniciar o dev server com cache limpo (`npx vite --force` ou apagar `apps/web/node_modules/.vite`). Documentar no README ou na Skill: "após atualizar dependências, reiniciar o `dev:web` com `--force`". | Ambiente (nenhum arquivo de código) |

### Observações (sem defeito)

- `/produtos/nao-existe` gera no console a linha nativa "Failed to load resource: 404" da chamada `GET /api/products/nao-existe`. É o comportamento esperado do navegador para uma resposta 404 da API, e a tela de "não encontrado" aparece corretamente.
- O 404 da SPA responde HTTP 200, com `noindex`. Na hospedagem, vale configurar a resposta 404 real para rotas desconhecidas. Isso depende da hospedagem e não é defeito do código.
- No dev, `public/robots.txt` não tem a linha `Sitemap:`. O build gera `dist/robots.txt` e `dist/sitemap.xml` corretos.

## Resultado das suítes

| Suíte | Comando | Resultado |
|---|---|---|
| Unitários (API + site) | `npm test` (raiz) | **API 168/168 · site 30/30** (OK) |
| Playwright principal (build + API simulada) | `npx playwright test` (apps/web) | **50 passaram, 6 pulados** (por viewport) (OK) |
| QA existente (segurança) contra o **dev** `:5173` | `npx playwright test -c e2e/qa/playwright.qa.config.ts` | **29 passaram, 2 falharam, 4 pulados**. As 2 falhas vêm de QA-09 (mensagem do consentimento com Zod 3 do cache): `forms.qa.ts:19` e `forms.qa.ts:39`. |
| QA existente contra o **build** `:4175` | `QA_BASE_URL=http://localhost:4175 npx playwright test -c e2e/qa/playwright.qa.config.ts forms.qa links-console responsive.qa xss-consent headers` | **31/31, 4 pulados** (headers dependem de `QA_HEADERS_URL`) (OK) |
| **Nova** QA funcional (`functional`, `forms-functional`, `responsive-functional`) contra o build `:4175` | `QA_BASE_URL=http://localhost:4175 npx playwright test -c e2e/qa/playwright.qa.config.ts functional forms-functional responsive-functional` | **44 passaram, 10 falharam**. Todas as falhas são testes `[QA-xx]`: QA-01, 02, 03, 04, 05, 06, 07 (×3 larguras) e 08. |
| Nova QA funcional contra o dev `:5173` | mesmo comando sem `QA_BASE_URL` | **42 passaram, 11 falharam, 1 pulado** (sitemap só existe no build). A falha a mais vem de QA-09 (consentimento). |
| Lint e tipos dos testes novos | `npx eslint e2e/qa/` · `npx tsc --noEmit -p tsconfig.node.json` | (OK) |

### Arquivos de teste criados

- `apps/web/e2e/qa/functional.qa.ts`: rotas e SEO, catálogo, produto e lightbox, serviços e FAQ, orçamento por URL, fallback, integração front × API.
- `apps/web/e2e/qa/forms-functional.qa.ts`: validação, foco, estados de envio, erros de rede e API, envio real.
- `apps/web/e2e/qa/responsive-functional.qa.ts`: 6 larguras, menu móvel, barra inferior, banner de cookies, alvos de toque, foco visível, CLS.

Para rodar contra o build:

```
cd apps/web
npm run build
npx vite preview --port 4175 --strictPort   # em outro terminal
QA_BASE_URL=http://localhost:4175 npx playwright test -c e2e/qa/playwright.qa.config.ts functional forms-functional responsive-functional
```

Depois de rodar, apagar os leads de teste:

```
docker exec ceara-nautica-db sh -c 'psql -U "$POSTGRES_USER" -d cearanautica -c "delete from contact_messages where name like '"'"'%QA-TEST%'"'"'; delete from quote_requests where name like '"'"'%QA-TEST%'"'"';"'
```
