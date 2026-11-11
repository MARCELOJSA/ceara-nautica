# QA-REPORT — Site Ceará Náutica (teste técnico funcional)

_Atualizado: 2026-11-10 · Agente: AGENT 03 (QA técnico) · Escopo: `apps/web`, `apps/api`, `packages/shared`, integração e ambiente de desenvolvimento._

A [Rodada 2](#rodada-2--revalidação-após-as-correções) e a [Rodada final](#rodada-final--regressão-e-revisão-geral) (com o veredito) estão no fim do documento. A Rodada 1 vem a seguir, sem alterações.

# Rodada 1

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

---

# Rodada 2 — revalidação após as correções

_Data: 2026-11-10 · Commits revalidados: c31db77, 152373b, 139f01b, dcabc99, 9b84314, 5596f8f, effd2a0, 4f0eae1, a98e18e, 8fe033e, 74301ae, d5fb787, cebd515 e df1c451._

## Ambiente da rodada 2

| Item | Valor |
|---|---|
| Build principal testado | `http://localhost:4190`: `vite preview` do `apps/web/dist`, preparado pelo orquestrador. É anterior ao commit df1c451. |
| Build do código atual | `http://localhost:4180`: build do código em disco feito pelo QA numa pasta temporária, sem tocar no `dist` da 4190. Inclui df1c451 e as mudanças **não commitadas** em andamento no front (UX-24 e outras da rodada 3). Já foi encerrado. |
| API | `http://localhost:3333/api`, com a busca nova e o banco semeado de novo (fichas das canoas do df1c451). |
| Dev `:5173` | Não usado: o cache antigo continua (QA-09). |

**Concorrência:** durante a rodada, outro processo rodou `npx playwright test` na mesma pasta. Essa execução limpou `apps/web/test-results` no meio da suíte QA e gerou falhas `ENOENT` nos traces. Esses testes foram rodados de novo, isolados, e passaram. Os números abaixo descontam essas falhas, que não vêm do site.

## Status dos apontamentos da rodada 1

| ID | Gravidade | Status | Como foi verificado |
|---|---|---|---|
| QA-01 | Média | **Corrigido** | Enter repetido em "Próxima imagem" e em "Imagem anterior" navega e o foco fica no botão usado. Esc devolve o foco a "Ampliar". `functional.qa.ts` `[QA-01 corrigido]` e `regression-r2.qa.ts` "foco fica no botão usado". |
| QA-02 | Baixa | **Corrigido** | Sem produto: Lanchas → "Nova embarcação", Motores → "Comprar motor de popa" (`motor`), Estofamentos → "Estofamento". Uma escolha manual ("Outro") não é sobrescrita. Com `?produto=`, "Trocar" mostra a Categoria e o tipo acompanha. `functional.qa.ts` `[QA-02 corrigido]` (2 testes). |
| QA-03 | Baixa | **Corrigido** | E-mail acima de 160 e cidade acima de 120 caracteres mostram a mensagem em português no front e na API. `forms-functional.qa.ts` `[QA-03 corrigido]`. |
| QA-04 | Média | **Corrigido** | Aceitos: `(92) 9 9999-9999`, `92 9 9999-9999`, `+55 (92) 9 9999-9999`, `(92) 3234-5678` e outros. Mensagens específicas: vazio → "Informe seu telefone/WhatsApp.", curto → "Número incompleto…", sem DDD → "Inclua o DDD…", DDD 00 ou dígitos demais → "Telefone inválido…". `forms-functional.qa.ts` `[QA-04 corrigido]` e "mensagens específicas do telefone e do assunto". |
| QA-05 | Baixa | **Corrigido** | `GET /api/products?q=` usa a mesma regra do site. Em 14 buscas, a API e o site retornam exatamente os mesmos produtos, incluindo acentos e maiúsculas. `functional.qa.ts` `[QA-05 corrigido]` e `regression-r2.qa.ts` (busca). |
| QA-06 | Média | **Corrigido** | CLS máximo de **0,030** (era 0,364). Desktop 1280: `/` 0,002 · `/produtos` 0,029 · produto 0,001 · `/servicos` 0,001 · `/sobre` 0,001 · `/contato` 0,001–0,030 · `/orcamento` 0,029. Desktop 1920: no máximo 0,023. Celular 390: 0,000 em todas. `responsive-functional.qa.ts` `[QA-06 corrigido]` e `regression-r2.qa.ts` (CLS desktop e mobile). |
| QA-07 | Baixa | **Corrigido** | Nenhum botão, link-botão ou campo abaixo de 44 px em 360, 390 e 768 px, nas 9 rotas. `responsive-functional.qa.ts` `[QA-07 corrigido]`. |
| QA-08 | Baixa | **Corrigido** | Todas as imagens declaradas por `GET /api/products` existem (HTTP 200, `image/*`). `functional.qa.ts` `[QA-08 corrigido]`. |
| QA-09 | Média (ambiente) | **Pendente (ambiente)** | Não revalidado, por orientação do orquestrador. O dev `:5173` continua com o cache antigo do Vite. Ação: reiniciar `npm run dev:web` com `npx vite --force` ou apagar `apps/web/node_modules/.vite`. |

## Regressão das áreas alteradas (`regression-r2.qa.ts`, novo)

- [x] **Busca**: sem acento e em caixa alta; várias palavras em qualquer ordem ("canoa aluminio" = "aluminio canoa"); "canoa 6", "canoa 6 metros" e "bote 90"; erro de digitação ("motr", "lacnha"); sinônimo ("estofado"). Buscas sem sentido (`xyzw`, `asdf qwer`, `%`, `_`) retornam 0 com estado vazio. "concerto", "reparo" e "solda" mostram a dica de serviços. Em todos os casos a API e o site retornam os mesmos produtos. **Exceção: QA-10.**
- [x] **Orçamento**:
  - `?produto=` mostra o cartão com "Trocar", esconde Categoria e Modelo, e o envio leva `productSlug`, `category` e `requestType` corretos.
  - `?servico=motores` define "Comprar motor de popa" e a categoria Motores. A lista tem "Problema ou revisão no motor".
  - A API aceita `requestType: "motor-revisao"` (201) e recusa um tipo inexistente (400).
  - A tela de sucesso mostra o telefone formatado. "Corrigir o telefone" volta ao formulário com o foco no telefone e preserva nome, cidade, mensagem e produto. O reenvio mostra o novo número.
  - Contato: o mesmo fluxo de confirmação do telefone.
- [x] **Lightbox**: o foco fica no botão usado. No celular, arrastar para a esquerda ou para a direita troca a foto, e arrastar na vertical não troca nem fecha.
- [x] **Página de produto (11 produtos)**: todos têm "Preço e prazo: sob consulta" e "Dúvidas comuns" (FAQ abre) e JSON-LD `Product`. Todas as embarcações com medidas publicadas têm "Entenda a ficha". A semi-chata não tem o bloco porque não tem medidas publicadas, o que é coerente.
- [x] **/sobre**: a lista "projetos publicados" aponta só para produtos existentes na API.
- [x] **/contato**: um `h1`, link do Instagram, nota de localização e formulário.
- [x] **Botão flutuante**: ausente no desktop (1280 e 1920 px) em `/`, `/produtos` e `/contato`. A barra inferior fica oculta no desktop.
- [x] **Barra inferior a 360 px**: "Orçamento" e "Instagram" cabem na tela, cada um com 48 px de altura e uma linha só (conferido também por captura de tela).
- [x] **CLS < 0,1** no desktop e no celular, em todas as rotas e no 404.
- [x] **Console e rede**: zero erros, zero avisos, zero requisições falhas e zero imagens quebradas nas 7 páginas estáticas e nos 11 produtos, em 1280 e 360 px.
- [x] **Rolagem horizontal**: nenhuma em 360, 390, 768, 1024, 1280 e 1920 (`responsive-functional.qa.ts` e `responsive.qa.ts`).

## Problemas novos

| ID | Gravidade | Página / componente | Passos para reproduzir | Esperado × obtido | Evidência | Sugestão de correção | Arquivo provável |
|---|---|---|---|---|---|---|---|
| QA-10 | Baixa | Busca (site e API) | Buscar `chata` ou `semichata` em `/produtos` ou em `GET /api/products?q=`. | **Esperado:** só a "Semi-chata de Alumínio Sob Medida". **Obtido:** também a "Lancha Cargueira tipo Iguaraçu 9 m" e a "Canoa de Alumínio 6 m". A tolerância a 1 erro de digitação considera "chata" igual a "chapa", palavra que aparece nesses dois produtos ("chapa de 3 mm", "chapa de 2 mm"). `semichata` vira o sinônimo `chata` e cai no mesmo caso. Pelo mesmo motivo, buscar `chapa` traz a semi-chata. | `regression-r2.qa.ts` › `[QA-10]`. `GET /api/products?q=chata` → `lancha-cargueira-iguaracu-9m, canoa-aluminio-6m, semi-chata-aluminio-sob-medida` | Não aplicar a tolerância a erro quando a palavra buscada existe exatamente no índice de algum produto do catálogo. Alternativa: lista de pares proibidos (`chata`/`chapa`), ou exigir 5 letras ou mais para a tolerância. | `packages/shared/src/search.ts` (`termMatches` / `withinOneEdit`) (SHARED, orquestrador) |

Nenhum problema novo de gravidade Média, Alta ou Crítica.

## Testes atualizados nesta rodada

- `forms.qa.ts` (suíte de segurança): telefone `123<script>` agora aceita "Número incompleto", "Telefone inválido" ou "Use apenas números" (mudança intencional c31db77/df1c451).
- `forms-functional.qa.ts`:
  - "contato vazio" espera "Informe seu telefone/WhatsApp.";
  - novo teste com as mensagens específicas do telefone e do assunto ("Assunto muito curto (mín. 2 caracteres).");
  - QA-03 e QA-04 viraram `[QA-0x corrigido]`.
- `functional.qa.ts`:
  - QA-02 reescrito em 2 testes: sem produto, e com `?produto=` usando "Trocar" (UX-10). Na escolha manual usa "Outro", porque tipos de serviço agora escondem a Categoria (UX-24, em andamento);
  - QA-01, QA-05 e QA-08 viraram `[QA-0x corrigido]`.
- `responsive-functional.qa.ts`: menu "Catálogo" no lugar de "Embarcações"; QA-06 e QA-07 viraram `[QA-0x corrigido]`.
- `regression-r2.qa.ts` (novo): 34 testes de regressão da rodada 2, incluindo `[QA-10]`.

## Resultado das suítes (rodada 2)

| Suíte | Alvo | Resultado |
|---|---|---|
| `npm test` (raiz) | código atual | **API 203/203 · site 71/71** (OK) |
| `npx playwright test` (apps/web, API simulada) | build do código atual (4180, reaproveitado pelo `webServer`) | **59 passaram, 9 pulados, 0 falhas** (OK) |
| Suíte QA completa (`-c e2e/qa/playwright.qa.config.ts`, 125 testes) | **4190** (build do orquestrador) | **119 passaram, 1 falhou (`[QA-10]`), 5 pulados** (headers sem `QA_HEADERS_URL`). Os 2 testes com `ENOENT` por concorrência passaram quando rodados de novo. |
| Suíte QA completa | 4180 (código atual com mudanças em andamento) | **119 passaram, 1 falhou (`[QA-10]`), 4 pulados**. O teste do QA-02 foi ajustado à UX-24 e passou nos dois builds. |
| Lint e tipos dos testes | `npx eslint e2e/qa/` · `tsc -p tsconfig.node.json` | OK |

Leads QA-TEST apagados ao final: 8 em `contact_messages` e 12 em `quote_requests`. A contagem depois da limpeza é 0.

---

# Rodada final — regressão e revisão geral

_Data: 2026-11-10 · Build testado: `http://localhost:4190`, gerado do HEAD **2b149ae**, que tem o mesmo código de f5d9000 (depois dele só mudou documentação). API em `:3333`, iniciada de novo pelo orquestrador, e banco de dev semeado._

**Ambiente:**
- O build da 4190 foi gerado sem o passo do sitemap. A suíte principal (`npm run build`) regenerou o mesmo `dist` com `sitemap.xml` e `robots.txt`, a partir do mesmo commit.
- Durante a suíte QA, a API em `tsx watch` reiniciou várias vezes porque outro processo, fora do QA, rodou `prisma generate` e apagou `node_modules/.prisma/client`. Um `GET /api/products` respondeu 500 (proxy sem API) no meio de `responsive.qa.ts` (1280 px). O teste rodado de novo passou, e 60 requisições simultâneas a `/api/products` responderam 200. Não é defeito do produto.

## Veredito

**APROVADO TECNICAMENTE, com pendências de gravidade Baixa e Média sem bloqueio.**

- Não há problema Crítico ou Alto. Todos os apontamentos anteriores (QA-01 a QA-08 e QA-10) estão corrigidos e cobertos por testes de regressão.
- As suítes passam, exceto os 3 testes `[QA-11]`, `[QA-12]` e `[QA-13]`, que reproduzem as pendências novas abaixo.

**Pendências**

| ID | Gravidade | Bloqueia publicação? |
|---|---|---|
| QA-12 | Média | Não. É falha de acessibilidade WCAG 2.2 AA (2.4.11) em casos de navegação por teclado; recomendada antes de publicar, porque a correção é uma linha de CSS. |
| QA-11 | Baixa | Não |
| QA-13 | Baixa | Não |
| QA-09 | Média (ambiente) | Não. O dev `:5173` não está no ar e o cache `apps/web/node_modules/.vite/deps` em disco **ainda é o antigo** (09/11, React Router 6.30.6). Por isso não foi possível confirmar a resolução. O Vite deve invalidar o cache ao iniciar, porque o lockfile mudou; por segurança, subir o dev com `npx vite --force`. |
| SEC-04 | Média | Headers de segurança na hospedagem; condição para publicar, já registrada no SECURITY-REPORT. |

## Regressão das mudanças desde a rodada 2 (`final.qa.ts`, novo)

- [x] **QA-10 corrigido**: "chata" e "semichata" trazem só a semi-chata (`regression-r2.qa.ts` `[QA-10 corrigido]`, renomeado pelo orquestrador).
- [x] **UX-22, motor com defeito, ponta a ponta com envio real**:
  - "Problema no motor? Descreva aqui" aparece em `/servicos` e em `/produtos/motores-de-popa`, sempre com `href=/orcamento?servico=motor-revisao`.
  - No formulário, o tipo vem como "Problema ou revisão no motor", Categoria e Modelo ficam ocultos, e a mensagem e a dica são específicas de motor.
  - O POST leva `requestType: "motor-revisao"` e não leva `productSlug`. A API responde 201 e a tela de sucesso mostra o telefone.
  - **No banco** (`quote_requests`, via `docker exec`) ficou gravado `request_type=motor-revisao`, `category=motores-de-popa` e `product_slug` vazio.
- [x] **UX-24, campos por tipo**:
  - Reparo, Manutenção, Problema no motor e Estofamento escondem Categoria e Modelo. Nova embarcação, Comprar motor, Outro e vazio mostram os dois campos.
  - Um modelo escolhido antes de trocar para um tipo de serviço não vai no envio.
  - Escolher a categoria Estofamentos sugere o tipo sem esconder os campos sob o dedo.
- [x] **UX-21**: a tela de sucesso mostra "Número errado?" e "Corrigir o telefone" (`regression-r2.qa.ts`). Os dados ficam preservados e o foco vai para o telefone.
- [x] **UX-18**: em 1280 e 390 px, nenhuma foto dos destaques repete uma capa de categoria da Home (comparando o nome-base da foto, sem o sufixo de tamanho). Não há destaques repetidos e a Lancha 7 m saiu.
- [x] **UX-23**: os 9 cards de embarcação no catálogo, na Home e nos relacionados têm "Indicado para:", sem termos repetidos.
- [x] **UX-20**: no celular, a introdução de `/produtos` é curta (menos de 220 caracteres) e termina em frase completa.
- [x] **UX-26**: `/sobre` tem "Categorias em destaque", com links para `/produtos?categoria=`, e "Ver no Instagram" com `target=_blank` e `rel=noopener`.
- [x] **UX-12 e UX-25**: as duas canoas têm a mesma ficha (Comprimento, Boca / Pontal, Material do casco, Capota, Motorização). Telefone com letras mostra "Use apenas números".

## Revisão geral

- [x] **Rotas e produtos**: 7 páginas, 6 categorias, 11 produtos, 404 e produto inexistente abrem sem erro. O sitemap tem 24 URLs e todas abrem, sem 404, com título único e canonical igual à URL.
- [x] **Console, rede e imagens**: zero erros, avisos, requisições falhas e imagens quebradas em todas as páginas e produtos, em 1280 e 360 px (`regression-r2.qa.ts`). A suíte de segurança confere que todas as imagens existem e têm `alt`.
- [x] **Links**: nenhum link interno quebrado (crawl). Todo link externo abre em nova aba com `rel="noopener noreferrer"`.
- [x] **Teclado**: o orçamento pode ser preenchido e enviado só com Tab, digitação, Espaço e Enter. Menu móvel com foco preso e Esc, lightbox, FAQ e skip link funcionam. **Exceções: QA-11 e QA-12.**
- [x] **Acessibilidade estática**, nas 11 rotas em 1280 e 360 px:
  - nenhum `id` duplicado;
  - nenhum link ou botão sem nome acessível;
  - nenhuma imagem sem `alt`;
  - `lang="pt-BR"`;
  - um `h1` por página e headings sem saltos.
- [x] **Responsividade**: sem rolagem horizontal e sem texto ou botão cortado em 360, 390, 768, 1024, 1280 e 1920 px. Alvos de toque de pelo menos 44 px. Barra inferior em uma linha a 360 px. Sem botão flutuante no desktop.
- [x] **SEO**:
  - título e description únicos, canonical, JSON-LD válido (`Product`, `BreadcrumbList`, `FAQPage`, `LocalBusiness`);
  - `noindex` no 404;
  - `robots.txt` com `Sitemap:`, que só existe com `npm run build`; a 4190 tinha sido gerada só com `vite build`, e a suíte principal regenerou o `dist` com sitemap.
  - **Exceção: QA-13.** O domínio do sitemap vem de `VITE_SITE_URL`, que deve ser trocado pelo domínio final.
- [x] **CLS**: menor que 0,1 em todas as páginas, no desktop e no celular (máximo de 0,030 na rodada 2; mantido).

## Problemas novos

| ID | Gravidade | Área | Página / componente | Passos para reproduzir | Esperado × obtido | Evidência | Sugestão de correção | Arquivo provável |
|---|---|---|---|---|---|---|---|---|
| QA-11 | Baixa | FRONT | Todos os campos de formulário (`.field-input`): contato, orçamento, busca do catálogo | Focar um campo com Tab. | **Esperado:** o contorno laranja de 2 px definido em `focus-visible:outline-2 focus-visible:outline-orange`. **Obtido:** `outline-style: none`. Só a borda de 1 px escurece, de cinza claro para grafite. O foco ainda é perceptível, mas fraco e diferente do resto do site. Causa: no Tailwind v4, `focus:outline-none` define `--tw-outline-style: none`, e o `focus-visible:outline-2` herda esse valor. | `final.qa.ts` › `[QA-11]` (13 campos em `/contato` e `/orcamento`, mais a busca); estilo calculado `outline: none 2px` com `:focus-visible` ativo | Trocar `focus:outline-none` por `focus:outline-hidden` (equivalente do Tailwind v4) ou removê-lo da classe `.field-input`. | `apps/web/src/styles/index.css` (`.field-input`) |
| QA-12 | Média | FRONT | Layout: cabeçalho fixo (desktop) e barra inferior fixa (celular) | (a) 1280 px, `/servicos`: focar o 1º link do rodapé e voltar com Shift+Tab pelo FAQ. (b) 360 px, `/`: avançar com Tab pelos destaques. | **Esperado:** o elemento focado fica ao menos parcialmente visível (WCAG 2.2, 2.4.11). **Obtido:** (a) as perguntas "Vocês fazem a embarcação…" e "Posso escolher a cor…" ficam 100% sob o cabeçalho fixo (76 px); "Ver todas" na Home também. (b) o card "Lancha Cargueira tipo Iguaraçu" fica 100% sob a barra inferior. O navegador rola apenas o mínimo e não desconta as barras fixas. | `final.qa.ts` › `[QA-12]`; medição de 0 px visíveis entre a borda do cabeçalho e a da barra | `html { scroll-padding-top: <altura do cabeçalho + folga, ~88px>; }` e, abaixo de `lg`, `scroll-padding-bottom: <altura da barra + folga, ~5.5rem>`. | `apps/web/src/styles/index.css` (`@layer base html`) |
| QA-13 | Baixa | FRONT | SEO de `/`, `/servicos`, `/orcamento` e do produto semi-chata | Ver `<meta name="description">` e `<title>`. | **Esperado:** description de até ~160 caracteres e título de até ~70, para não serem cortados nos resultados de busca. **Obtido:** description da Home com 177. Títulos: `/servicos` 77, `/orcamento` 73, `/produtos/semi-chata-aluminio-sob-medida` 73. | `final.qa.ts` › `[QA-13]` | Encurtar os textos. Ex.: "Serviços náuticos em Manaus" e "Orçamento de embarcação em Manaus". No produto, evitar repetir a categoria quando o nome já a contém ("Semi-chata… — Semi-chatas em Manaus"). | `apps/web/src/pages/Home.tsx` (Seo `description`), `apps/web/src/pages/Services.tsx`, `apps/web/src/pages/Quote.tsx`, `apps/web/src/pages/ProductDetail.tsx` (template do título) |

Não há problema novo de BACK (apps/api) nem de SHARED (packages/shared).

## Resultado das suítes (rodada final)

| Suíte | Comando | Resultado |
|---|---|---|
| Unitários | `npm test` (raiz) | **API 203/203 · site 92/92** (OK) |
| Playwright principal (API simulada) | `E2E_PORT=4195 npx playwright test --output <pasta temporária fora do repo>` | **59 passaram, 9 pulados, 0 falhas** (OK) |
| QA completa contra 4190 (142 testes) | `QA_BASE_URL=http://localhost:4190 npx playwright test -c e2e/qa/playwright.qa.config.ts` | **135 passaram, 3 falharam, 4 pulados**. As falhas são `[QA-11]`, `[QA-12]` e `[QA-13]`, as pendências novas. Os 4 pulados são os headers, que dependem de `QA_HEADERS_URL`. Um teste de `responsive.qa.ts` falhou pelo reinício da API descrito acima e passou na nova execução. |

## Arquivos de teste

- `apps/web/e2e/qa/final.qa.ts` (novo, 17 testes): UX-22 ponta a ponta com conferência no banco, UX-24, UX-25, UX-18, UX-23, UX-26, UX-12, UX-20, teclado no orçamento, sitemap/canonical/títulos, links externos e `[QA-11]`, `[QA-12]`, `[QA-13]`.

Leads QA-TEST apagados ao final: 6 em `contact_messages` e 15 em `quote_requests`, dos quais 6 do fluxo motor-revisao, todos com `request_type=motor-revisao`. A contagem depois da limpeza é 0.
