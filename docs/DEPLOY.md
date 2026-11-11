# Publicar o site — passo a passo

_2026-11-10 · decisão em [HOSTING.md](HOSTING.md) e [DATABASE.md](DATABASE.md)_

Tudo o que é técnico já está pronto no repositório. Falta só o que exige **a sua conta**: criar os cadastros no Neon (banco) e no Render (site e API) e colar um endereço de um no outro. Leva cerca de 15 minutos e é gratuito.

| Parte                   | Onde                | Custo                                                             |
| ----------------------- | ------------------- | ----------------------------------------------------------------- |
| Banco de dados          | Neon                | grátis                                                            |
| API (recebe os pedidos) | Render, plano Free  | grátis (dorme após 15 min sem uso; o site já sabe lidar com isso) |
| Site                    | Render, Static Site | grátis                                                            |

## 1. Banco de dados (Neon)

1. Entre em **neon.com** → **Sign up** → **Continue with GitHub** (use a conta `MARCELOJSA`).
2. Crie um projeto:
   - **Name:** `ceara-nautica`
   - **Postgres version:** 16
   - **Region:** AWS US East (N. Virginia), a mesma região da API
3. Na tela do projeto, clique em **Connect**. Desligue a opção **Connection pooling**: a conexão direta é a certa para a API. Copie a connection string. Ela começa com `postgresql://` e tem `neon.tech` no meio.
4. No fim do endereço, troque tudo o que vem depois de `?` por:
   ```
   sslmode=require&sslaccept=strict&connect_timeout=15
   ```
   Guarde esse endereço: ele é a **DATABASE_URL** e é a senha do banco. Não compartilhe.

## 2. Site e API (Render)

1. Entre em **render.com** → **Get Started** → **GitHub**, com a mesma conta. Autorize o acesso ao repositório `ceara-nautica`.
2. No painel: **New** → **Blueprint** → escolha o repositório `MARCELOJSA/ceara-nautica`. O Render lê o arquivo `render.yaml` e mostra os dois serviços:
   - `ceara-nautica-api`
   - `ceara-nautica-site`
3. Ele pede os valores que não ficam no código:
   - **DATABASE_URL:** cole o endereço do passo 1.
   - **LEAD_WEBHOOK_URL:** deixe em branco. É opcional e serve para avisar a equipe a cada pedido.
4. Clique em **Apply**. O primeiro deploy leva alguns minutos; as tabelas do banco são criadas sozinhas.
5. Confira os endereços que o Render deu:
   - site: `https://ceara-nautica-site.onrender.com`
   - API: `https://ceara-nautica-api.onrender.com`

   **Se algum endereço vier diferente** (o Render acrescenta letras quando o nome já existe), avise o desenvolvedor, ou o Claude, para ajustar o `render.yaml`. São três URLs e a CSP, e um teste confere a coerência entre elas.

## 3. Catálogo de produtos (só na primeira vez)

O deploy cria as tabelas vazias. Para carregar os produtos, rode uma vez, no computador, com o endereço do Neon:

```powershell
cd "C:\Users\Windows 10\Projetos\ceara-nautica"
$env:DATABASE_URL = "COLE_AQUI_A_DATABASE_URL"
npm run -s -w apps/api db:seed
Remove-Item Env:DATABASE_URL
```

O seed pode ser repetido sem problema: ele sincroniza o catálogo com o código.

## 4. Conferência depois de publicar

1. **API:** abra `https://ceara-nautica-api.onrender.com/api/health`. Deve mostrar `{"status":"ok","db":"ok"}`. Pode demorar cerca de 1 minuto se ela estiver dormindo.
2. **Site:** abra o site, navegue e envie um orçamento de teste com o nome "TESTE". Ele deve aparecer na tabela `quote_requests` do Neon (painel → **Tables**). Depois apague o registro.
3. **Cabeçalhos de segurança (SEC-04):** no computador, rode
   ```powershell
   cd apps/web
   $env:QA_HEADERS_URL = "https://ceara-nautica-site.onrender.com"
   npx playwright test -c e2e/qa/playwright.qa.config.ts headers
   ```
4. **Limite de envios e IP real (`TRUST_PROXY=3`):**
   - mande 6 envios seguidos do mesmo computador para `/api/contact`, cada um com um `X-Forwarded-For` falso diferente: o 6º precisa dar **429**;
   - um celular em outra rede (4G) precisa continuar conseguindo enviar.

   Se não for assim, o Render mudou a forma de repassar o IP: ajuste o `TRUST_PROXY` (ver `render.yaml`).

## 5. Depois

- **Domínio próprio** (ex.: `cearanautica.com.br`): registre no Registro.br e aponte para o Render (Settings → Custom Domains). Depois atualize no `render.yaml` as URLs (`WEB_ORIGIN`, `VITE_API_URL`, `VITE_SITE_URL`) e o `connect-src` da CSP.
- **API sempre ligada:** troque `plan: free` por `plan: starter` no serviço da API (US$ 7/mês).
- **Backup semanal:**
  ```powershell
  $env:DATABASE_URL = "..."
  npm run -s -w apps/api db:backup
  ```
  Guarde o arquivo gerado fora do computador.
- **Análise de visitas (GTM, GA4, Meta Pixel):** defina os IDs nas variáveis `VITE_*` do site e acrescente os domínios deles à CSP no `render.yaml`.
