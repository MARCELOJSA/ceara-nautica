# Hospedagem — decisão

_2026-11-10 · complementa [DATABASE.md](DATABASE.md)_

O projeto tem três partes para publicar: o **site** (arquivos estáticos gerados pelo Vite), a **API** (servidor Node/Express que grava os pedidos) e o **banco** (PostgreSQL, já decidido: Neon).

## Opções avaliadas (planos gratuitos conferidos em novembro de 2026)

| Plataforma       | Site estático                                    | API Node sempre ligada                                                                                  | Observação decisiva                                                                   |
| ---------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| **Render**       | grátis, CDN, não dorme; cabeçalhos configuráveis | grátis **dorme após 15 min** sem acesso e leva ~1 min para acordar; plano Starter (US$ 7/mês) não dorme | site e API no mesmo lugar, configurados por um arquivo no repositório (`render.yaml`) |
| Cloudflare Pages | grátis, CDN, cabeçalhos por arquivo `_headers`   | não roda Express; exigiria reescrever a API                                                             | ótimo só para o site                                                                  |
| Vercel           | grátis                                           | Express como função                                                                                     | **plano gratuito proíbe uso comercial**                                               |
| Netlify          | 300 créditos/mês; cada publicação gasta 15       | —                                                                                                       | créditos acabam rápido                                                                |
| Koyeb            | —                                                | instância pequena que dorme                                                                             | gratuito agora exige cartão e conta paga                                              |
| Railway / Fly.io | —                                                | pago por uso                                                                                            | sem plano gratuito permanente                                                         |

## Decisão

> **Render** para o site (Static Site, grátis) e para a API (Web Service), com o banco no **Neon**. Tudo descrito no `render.yaml` do repositório.

- **Site:** grátis e sem espera. Os cabeçalhos de segurança (CSP, HSTS e outros, pendência SEC-04) e o redirecionamento das rotas do React ficam versionados no `render.yaml`.
- **API, para começar: plano grátis (R$ 0).** Para o "sono" de 15 minutos não fazer o cliente perder o pedido:
  - o site "acorda" a API assim que a pessoa abre o formulário de orçamento ou de contato; enquanto ela digita, a API religa;
  - o envio do formulário espera até 90 segundos, com aviso de "conectando, pode levar alguns segundos";
  - o catálogo continua aparecendo com os dados de reserva do próprio site, se a API demorar.
- **Quando houver orçamento:** trocar a API para o plano Starter (US$ 7/mês, cerca de R$ 40), que não dorme. É uma linha no `render.yaml`, ou um clique no painel.

**Por que não dividir entre provedores** (ex.: site no Cloudflare e API no Render): funcionaria, mas seria uma conta e um painel a mais para a empresa cuidar, sem ganho real para o tamanho do site.

**Custo inicial:** R$ 0 (Render grátis + Neon grátis). Domínio próprio, se quiserem: o registro de `.com.br` é feito no Registro.br e cobrado à parte.

## Fontes

- Render: [Static site headers](https://render.com/docs/static-site-headers), [Free vs Starter 2026](https://actualdatabase.com/render-free-vs-starter-pricing/), [Render Pricing 2026](https://temps.sh/blog/render-pricing-2026)
- Vercel: [Hobby: non-commercial use only](https://convika.com/compare/vercel-hobby-commercial-use/), [Vercel Pricing 2026](https://flexprice.io/blog/vercel-pricing-breakdown)
- Cloudflare Pages: [Free plan terms in 2026 (comunidade)](https://community.cloudflare.com/t/free-plan-terms-in-2026-static-brochure-site-for-a-small-business-on-pages/973141), [Pages limits 2026](https://convika.com/compare/cloudflare-pages-limits/)
- Netlify: [Free plan's 300 credits](https://convika.com/compare/netlify-free-plan/)
- Koyeb: [Koyeb Pricing 2026](https://agentdeals.dev/vendor/koyeb)
