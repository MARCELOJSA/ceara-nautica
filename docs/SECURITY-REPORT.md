# SECURITY-REPORT — Site Ceará Náutica

_Atualizado: 2026-11-10 · Escopo: API (`apps/api`), site (`apps/web`), schemas compartilhados (`packages/shared`) e dependências npm._

Relatório consolidado a partir da suíte de QA de segurança (AGENT 03) e das correções feitas em seguida. Cada achado tem um teste que o reproduz ou que impede a regressão.

## Veredito

**APROVADO**: não há achado Crítico ou Alto aberto no código nem nas dependências usadas em produção.

Fica uma condição para publicar o site: configurar os **headers de segurança na hospedagem** (SEC-04). Sem isso o site sobe sem CSP e sem HSTS. O teste `e2e/qa/headers.qa.ts` confere esses headers contra o domínio real.

## Achados

| ID | Gravidade | Área | Descrição | Evidência | Recomendação | Status |
|---|---|---|---|---|---|---|
| SEC-01 | Média | API / validação | Texto com byte nulo (U+0000) em nome, UTM ou na busca `q` chegava ao PostgreSQL, que recusa o caractere. Resultado: erro 500, e em desenvolvimento a resposta expunha a consulta do Prisma. | `input-validation.test.ts` (`[SEC-01 corrigido]`) | Recusar o caractere na validação. | **Corrigido** (`de2e820`) |
| SEC-02, SEC-03 | — | — | Números não usados: não há registro desses IDs nos testes nem em documentos. | — | — | — |
| SEC-04 | Média | Hospedagem do site | O build estático não define headers HTTP. CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `frame-ancestors` e cache dependem da hospedagem, ainda não escolhida. | `headers.qa.ts` (falha esperada contra `localhost`) | Configurar os headers listados em [Headers da hospedagem](#headers-da-hospedagem-sec-04) e rodar `QA_HEADERS_URL=https://<domínio> npx playwright test -c e2e/qa/playwright.qa.config.ts headers`. | **Aberto**: depende da hospedagem |
| SEC-05 | Média | API / rate limit | Com `TRUST_PROXY=true`, o Express usa o primeiro IP do `X-Forwarded-For`, que o próprio cliente define. Bastava forjar o header para contornar o limite de 5 envios por minuto dos formulários. | `ratelimit-errors-config.test.ts` (`[SEC-05 corrigido]`) | Recusar `true` e usar o número de proxies (ex.: `TRUST_PROXY=1`). | **Corrigido** (`0aa6902`) |
| SEC-06 | Baixa | API / disponibilidade | Os GET (`/api/products`, `/api/categories`, `/api/health`) não têm limite de requisições. | `[SEC-06]` no mesmo arquivo | Limitar na borda (CDN/proxy). Um limite por IP na API bloquearia visitantes reais se todos chegassem com o IP do proxy. | **Risco aceito** |
| SEC-07 | Média | API / configuração | Em produção, a API subia com `IP_HASH_SALT` de 1 caractere, com `RATE_LIMIT_DISABLED=true` e, sem `WEB_ORIGIN`, liberava o CORS para `localhost`. | `[SEC-07 corrigido]` | Recusar a inicialização em produção nesses casos. | **Corrigido** (`0aa6902`) |
| SEC-08 | Baixa | API / validação | Nome, assunto e cidade aceitavam caracteres de controle e de direção bidi (ex.: U+202E), que disfarçam o texto exibido em e-mails e planilhas de leads. | `[SEC-08 corrigido]` | Recusar controles C0/C1 e bidi. A mensagem continua aceitando quebra de linha e tab. | **Corrigido** (`aa134d7`) |
| SEC-09 | Alta | Dependência (produção) | `zod` < 4.6.6: esgotamento de memória ao validar coleções grandes (GHSA-mrhx-c7xc-m3w5). O limite de 20 kb no corpo da requisição já reduzia o risco. | `npm audit` | Migrar para Zod 4. | **Corrigido** (`7397a09`) |
| SEC-10 | Média | Dependência (produção) | `react-router` 6: open redirect via barra invertida em `<Link>`/`useNavigate` e injeção de construtor em `deserializeErrors`. | `npm audit` | Atualizar para React Router 7. | **Corrigido** (`13bb459`) |
| SEC-11 | Crítica (só desenvolvimento) | Dependência de teste | `tinypool` (via Vitest 2/3): prototype pollution que leva a execução de código. Afeta apenas quem roda os testes. | `npm audit` | Atualizar para Vitest 4. | **Corrigido** (`bfc1b05`) |
| SEC-12 | Alta (só desenvolvimento) | Dependência de script | `sharp` 0.33, usado apenas por `scripts/process-images.mjs` com fotos de origem conhecida. | `npm audit` | Atualizar para sharp 0.35. | **Corrigido** (`6b27562`) |
| SEC-13 | Baixa | Dependência (ferramenta do Prisma) | `deepmerge-ts` < 8 (via `@prisma/config`): estouro de pilha ao mesclar objetos recursivos. Só a linha de comando do Prisma usa esse código, para ler a própria configuração; nenhum dado de visitante passa por ele. | `npm audit` (3 avisos "high": `prisma`, `@prisma/config`, `deepmerge-ts`) | Migrar para o Prisma 7 quando for viável (novo `prisma.config.ts` e adaptador de driver). | **Risco aceito** até a migração |
| SEC-14 | Info | Ferramentas de desenvolvimento | `minimatch` 10 (via `typescript-eslint`, só no lint) e `esbuild` 0.27 (via `tsx`, só no servidor de desenvolvimento). | `npm audit` | Atualizar quando as dependências que os trazem publicarem versão corrigida. | **Risco aceito** |

## Controles verificados (passando)

**API** (`apps/api/tests/security`, Vitest + Supertest)
- Headers via helmet (CSP `default-src 'none'`, `frame-ancestors 'none'`), sem `X-Powered-By`.
- CORS restrito a `WEB_ORIGIN` (comparação exata, sem curinga); preflight de origem desconhecida negado. POST como `text/plain` ou formulário (CSRF) não é aceito; PUT, DELETE, PATCH e TRACE respondem 404.
- Rate limit dos POST (5 por minuto por IP), aplicado antes do parser de JSON. Variações de caminho e `X-Forwarded-For` falso não contornam o limite.
- Corpo limitado a 20 kb; JSON malformado responde 400 sem detalhes.
- Validação Zod em toda entrada. Mass assignment e prototype pollution (`__proto__`, `constructor`) sem efeito.
- Busca sem injeção SQL ou LIKE (curingas escapados, Prisma sem SQL cru); regex sem ReDoS.
- Honeypot `website` responde 201 sem gravar.
- XSS armazenado: o dado é guardado literal e devolvido só como JSON.
- Erros 404 e 500 em produção são genéricos, sem stack trace, caminho, SQL ou string de conexão.
- `/api/health` não expõe versão nem host. O IP do lead é gravado só como hash com salt e os logs não registram IP, headers nem corpo.

**Site** (`apps/web/e2e/qa`, Playwright contra a API real)
- Validação no cliente impede o envio de dados inválidos; erro 500 da API aparece como mensagem amigável.
- XSS refletido por `?q=`, `?categoria=`, `?produto=`, `?assunto=`, UTM e hash não executa; `javascript:` não vira `href`.
- Produto com `<script>` vindo do banco não executa nem quebra o JSON-LD.
- LGPD: nenhum cookie nem requisição a terceiros antes do aceite. Recusar mantém tudo bloqueado, e a escolha pode ser revista na Política de Privacidade.
- Sem erro de console nem link interno quebrado; todas as imagens existem e têm `alt`.
- Sem rolagem horizontal em 360, 768, 1280 e 1920 px.
- Build de produção (`vite preview`, com `QA_HEADERS_URL`): arquivos sensíveis (`.env`, `.git`, `package.json`...) e sourcemaps não são servidos.

**Última execução (2026-11-10):** API 168/168 · site (unitários) 30/30 · Playwright 50/50 (+6 pulados por viewport) · QA contra API real 31/31 (+4 pulados sem `QA_HEADERS_URL`) · `headers.qa.ts` contra o build local 4/4 (headers HTTP como falha esperada até haver hospedagem).

## Headers da hospedagem (SEC-04)

Valores esperados pelo `headers.qa.ts` para o domínio de produção:

```
Content-Security-Policy: default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self' https://www.googletagmanager.com https://connect.facebook.net; connect-src 'self' <URL da API> https://www.google-analytics.com https://*.google-analytics.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Cache-Control (index.html): no-cache
Cache-Control (/assets/*): public, max-age=31536000, immutable
```

Ajustar `script-src` e `connect-src` aos IDs de GTM, GA4 e Meta Pixel que forem de fato configurados. Sem esses IDs, os domínios do Google e do Facebook podem sair da política.

## Como reproduzir

```
npm run db:up
npm test                                                   # inclui apps/api/tests/security
npm run dev:api & npm run dev:web
cd apps/web && npx playwright test -c e2e/qa/playwright.qa.config.ts
npm audit --omit=dev
```

Os testes de QA gravam leads com "QA-TEST" no nome. Depois de rodar contra um banco que não seja o de testes, apague esses registros.
