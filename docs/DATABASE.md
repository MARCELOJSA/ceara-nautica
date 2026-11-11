# Banco de dados — análise e decisão

_2026-11-10 · Site Ceará Náutica_

## 1. O projeto precisa de banco de dados?

**Sim.** O banco guarda duas coisas que o site não pode perder:

| Dado                                                        | Uso                                                                                                                                                               | Volume esperado                                                 |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| **Pedidos de orçamento e mensagens de contato** (leads)     | Cada envio de formulário vira um registro, com tipo de pedido, produto, origem da campanha (UTM) e consentimento LGPD. É o principal resultado comercial do site. | Dezenas a poucas centenas por mês; cerca de 1–2 KB por registro |
| **Catálogo** (categorias, produtos, fotos, fichas técnicas) | Lido em quase toda página, pela API.                                                                                                                              | 6 categorias e 11 produtos hoje; crescimento lento              |

Sem banco, os pedidos existiriam só no e-mail ou no webhook, sem histórico confiável, sem prova de consentimento e sem relatório de origem das campanhas. O site já funciona com banco: **PostgreSQL 16 + Prisma 6**, 7 tabelas, 3 migrações, testes de integração num banco separado e cerca de 8 MB de dados hoje.

**Perfil de uso:** muita leitura do catálogo e pouca escrita (leads), dados relacionais (produto → fotos → ficha técnica), consistência importante (um lead não pode se perder ou duplicar) e tráfego baixo e irregular, típico de site institucional em Manaus.

## 2. Mecanismo de banco × plataforma de hospedagem

São decisões diferentes:

- **Mecanismo** é o software do banco: PostgreSQL, MySQL, MongoDB, SQLite. Define o modelo de dados, a linguagem e a compatibilidade com o código.
- **Plataforma** é quem roda esse software em produção: Neon, Supabase, Render, Railway, MongoDB Atlas, Turso ou um servidor próprio. Define custo, backups, disponibilidade e limites.

Supabase e Neon **não são bancos diferentes**: os dois hospedam PostgreSQL. Por isso as duas tabelas abaixo são separadas.

## 3. Comparação dos mecanismos

Notas de 0 a 10 para **este projeto**: um mecanismo excelente em geral pode ter nota baixa aqui se exigir reescrever o que já funciona.

| Critério                                   | PostgreSQL | MySQL | MongoDB | SQLite |
| ------------------------------------------ | ---------- | ----- | ------- | ------ |
| 1. Compatibilidade com a arquitetura atual | **10**     | 6     | 3       | 6      |
| 2. Desempenho e confiabilidade             | **9**      | 9     | 8       | 7      |
| 3. Escalabilidade                          | **9**      | 9     | 9       | 4      |
| 4. Desenvolvimento e manutenção            | **9**      | 8     | 6       | 8      |
| 5. Custo-benefício                         | 9          | 9     | 8       | **10** |
| 6. Segurança                               | **9**      | 8     | 8       | 6      |
| 7. Local e produção                        | **9**      | 9     | 8       | 4      |
| **Total (de 70)**                          | **64**     | 58    | 50      | 45     |

**Justificativas**

- **PostgreSQL:** é o que o projeto já usa. Prisma, migrações, seed, testes de segurança e de integração estão prontos e passando. Transações e chaves estrangeiras garantem que produto, fotos e ficha fiquem consistentes. Suporta conexões criptografadas (SSL), papéis e permissões, e `pg_dump`/`pg_restore` para backup. Roda igual no Docker local e em qualquer nuvem.
- **MySQL:** tecnicamente adequado e com o mesmo nível de desempenho, mas trocar significaria refazer as migrações e testar tudo de novo sem nenhum ganho para este site. Perde em compatibilidade pelo custo da troca.
- **MongoDB:** os dados são relacionais (produto → fotos → ficha; lead → produto). Num banco de documentos, a integridade que o PostgreSQL garante teria de ser feita no código. O Prisma com MongoDB não tem migrações. Seria reescrever a camada de dados para resolver um problema que o projeto não tem.
- **SQLite:** muito simples e gratuito, mas é um arquivo no disco do servidor. Em hospedagens com disco temporário o arquivo (e os leads) se perde a cada nova publicação, e escritas simultâneas disputam o mesmo arquivo. Não tem usuários nem conexão de rede com senha. Serviria para protótipo, não para guardar leads em produção.

**Mecanismo escolhido: PostgreSQL**, o que já está em uso. Tem a maior nota e, mais importante, o menor risco: não exige nenhuma mudança na aplicação.

## 4. Comparação das plataformas para produção (PostgreSQL)

Dados dos planos gratuitos conferidos em novembro de 2026 (fontes no fim). Preços e limites mudam: confira a página oficial antes de contratar.

|                                             | **Neon (Free)**                                                                                    | Supabase (Free)                                                            | Render Postgres (Free)                                 | Railway                                          | Servidor próprio (VPS + Docker) |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------ | ------------------------------- |
| Custo inicial                               | R$ 0                                                                                               | R$ 0                                                                       | R$ 0                                                   | sem plano gratuito permanente (crédito de teste) | custo mensal do servidor        |
| Armazenamento grátis                        | 1 GB por projeto                                                                                   | 500 MB                                                                     | —                                                      | —                                                | conforme o servidor             |
| O que acontece sem uso                      | **desliga após 5 min e religa sozinho** na próxima requisição                                      | **projeto pausado após 1 semana** sem atividade; precisa religar no painel | **o banco expira em 30 dias** e é apagado após 14 dias | —                                                | fica ligado                     |
| Cobrança inesperada                         | **não cobra excedente** no plano gratuito (escritas acima do limite falham, nenhum dado é apagado) | não cobra no Free                                                          | —                                                      | cobrança por uso                                 | fixa                            |
| Ambientes separados (dev, testes, produção) | branches (10 por projeto)                                                                          | 2 projetos grátis                                                          | —                                                      | —                                                | manual                          |
| SSL / backups                               | SSL obrigatório; backups da plataforma                                                             | SSL; backups no plano pago                                                 | —                                                      | —                                                | tudo por conta própria          |
| Notas (custo · confiabilidade · manutenção) | **9 · 8 · 9**                                                                                      | 8 · 4 · 8                                                                  | 6 · 1 · 7                                              | 5 · 8 · 8                                        | 6 · 7 · 4                       |

- **Supabase:** a pausa após uma semana sem atividade é o problema central. Num site com poucos acessos, um cliente pode enviar um orçamento justamente quando o projeto está pausado, e o pedido falha até alguém religar no painel. O Supabase também traz autenticação, armazenamento de arquivos e APIs automáticas, que este site não usa (o escopo proíbe login e painel).
- **Render Free:** o banco é apagado depois de 30 dias. Inviável para dados que precisam ser guardados.
- **Railway:** sem plano gratuito permanente e com preços pouco claros nas fontes consultadas.
- **Servidor próprio:** controle total, mas a empresa passaria a cuidar de atualizações, segurança, backups e monitoramento do banco. É desproporcional para o tamanho do site.
- **MongoDB Atlas** (512 MB grátis) e **Turso** (SQLite na nuvem, 5 GB grátis) só fariam sentido com os mecanismos descartados na seção 3.

## 5. Decisão

> **PostgreSQL 16 com Prisma**, em **Docker no computador** para desenvolvimento e testes e no **Neon (plano gratuito)** em produção.

**Por que é a melhor escolha**

- Mantém tudo o que já funciona e foi testado: zero reescrita e zero risco de regressão.
- O Neon roda PostgreSQL padrão: a aplicação só troca a variável `DATABASE_URL`.
- Nunca pausa a ponto de perder um lead: depois de 5 minutos sem uso, o banco desliga e religa sozinho na próxima requisição.
- Não gera cobrança surpresa: o plano gratuito não cobra excedente.

**Vantagens sobre as alternativas:** mais espaço gratuito que Supabase e Atlas, sem pausa manual (Supabase) nem expiração (Render), ambientes separados por branch e nenhuma dependência de recursos proprietários. Se um dia precisar trocar de provedor, um `pg_dump` leva os dados para qualquer outro PostgreSQL.

**Limitações**

- **Primeiro acesso depois de um período parado é mais lento:** o banco precisa religar, o que leva de frações de segundo a poucos segundos. O site já mostra o catálogo de reserva se a API demorar, e a conexão de produção deve usar um tempo limite de conexão generoso (seção 6).
- **1 GB no plano gratuito:** com 1–2 KB por lead, isso comporta centenas de milhares de pedidos, muito além do previsto.
- **Plano gratuito sem garantia de disponibilidade (SLA)** e com janela curta de recuperação da plataforma. Por isso o projeto tem um **backup próprio** (`npm run -w apps/api db:backup`), além do da plataforma.

**Custo inicial:** **R$ 0** no banco. O custo da hospedagem da API e do site é uma decisão separada, ainda pendente (SEC-04).

**Como cresce com o projeto**

1. Hoje: Neon Free (1 GB).
2. Se o volume ou a exigência de disponibilidade crescer, o próximo passo é um plano pago do Neon, ou um PostgreSQL gerenciado em outra nuvem. Basta mudar a `DATABASE_URL` e rodar `npm run -w apps/api db:deploy`; o código não muda.
3. Se o catálogo crescer muito (milhares de produtos), a busca passa do filtro em memória para índices do próprio PostgreSQL. Isso está anotado no código da rota de produtos.

## 6. Como usar

| Ambiente             | Onde           | Banco                               | Como                                                                                                                                |
| -------------------- | -------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Desenvolvimento      | seu computador | `cearanautica` (Docker, porta 5433) | `npm run db:up` → `npm run -w apps/api db:migrate` → `npm run -w apps/api db:seed`                                                  |
| Testes automatizados | seu computador | `cearanautica_test` (mesmo Docker)  | criado, migrado e semeado sozinho pelo `npm test`                                                                                   |
| Produção             | Neon           | projeto no Neon, branch `main`      | `DATABASE_URL` do Neon com `sslmode=require` → `npm run -w apps/api db:deploy` → `npm run -w apps/api db:seed` (só na primeira vez) |

**Configurar a produção no Neon (passo a passo)**

1. Criar uma conta em neon.com e um projeto na região mais próxima disponível (ex.: São Paulo, se houver).
2. Copiar a connection string **direta** (sem `-pooler` no endereço). A API é um único servidor Node e não precisa do pooler.
3. Na hospedagem da API, definir `DATABASE_URL` com `sslmode=require&sslaccept=strict` (criptografa e valida o certificado) e `connect_timeout=15`, além de `NODE_ENV=production`, `WEB_ORIGIN`, `IP_HASH_SALT` e `TRUST_PROXY`. Os modelos estão em `apps/api/.env.example`.
4. Rodar `npm run -w apps/api db:deploy` (aplica as migrações) e, só na primeira vez, `npm run -w apps/api db:seed`.
5. Para testar mudanças com dados reais sem mexer na produção, usar uma branch do Neon.

**Segurança**

- Credenciais só em variáveis de ambiente, nunca no código (`.env` está no `.gitignore`).
- Em produção, a API não sobe se a `DATABASE_URL` apontar para um banco remoto sem `sslmode=require`. `verify-ca` e `verify-full` também são recusados: testamos que, no Prisma 6, esses valores conectam **sem** criptografia. Para validar o certificado, use `sslmode=require&sslaccept=strict`.
- A aplicação usa só o Prisma, sem SQL montado à mão. Os dados de entrada são validados antes de chegar ao banco. O IP do lead é gravado só como hash com salt.
- **Recomendação:** criar no Neon um papel próprio para a aplicação, com permissão só de leitura e escrita nas tabelas, separado do dono do banco, que fica para as migrações.

**Backup e restauração**

- Os comandos precisam do **Docker em execução**: eles usam `pg_dump`/`pg_restore` da imagem `postgres:17-alpine` (lê servidores 16 e 17), sem exigir PostgreSQL instalado no Windows. Um backup só restaura com `pg_restore` 17 ou mais novo.
- `npm run -s -w apps/api db:backup` gera uma cópia do banco da `DATABASE_URL` em `apps/api/backups/<banco>-<data_hora>.dump`. A pasta fica fora do git porque contém dados pessoais de leads.
- `npm run -s -w apps/api db:restore -- <arquivo>` restaura no banco da `DATABASE_URL`, substituindo as tabelas. Se o destino não for local, é preciso acrescentar `--yes`; sem isso o comando aborta (código 2) sem tocar em nada. Um arquivo corrompido falha antes de conectar no destino.
- Passe a URL pela variável `DATABASE_URL` (e use `npm run -s`), e não por `--url`, porque o npm mostra a linha de comando e a senha apareceria no terminal.
- Testado em 2026-11-10: backup e restauração do banco de testes com contagem e conteúdo idênticos nas 7 tabelas, inclusive leads com acentos e UTM. Ainda não foi testado contra um Neon real (sem credenciais).
- Sugestão: um backup semanal da produção, guardado fora do computador (ex.: Google Drive da empresa).

## Fontes (consultadas em 2026-11-10)

- Neon: [Neon plans](https://neon.com/docs/introduction/plans), [changelog de 02/10/2026](https://neon.com/docs/changelog/2026-10-02), [Neon vs Supabase Free](https://neon.com/guides/neon-vs-supabase-free-plan)
- Supabase: [Pricing](https://supabase.com/pricing), [Supabase Free Tier Limits 2026](https://nayankyada.com/blog/supabase-pricing-2026-free-tier-limits-compute-costs-when-to-upgrade)
- Render: [Deploy for Free](https://render.com/docs/free)
- Railway: [Railway vs Render (2026)](https://instapods.com/compare/railway-vs-render/), [Cheapest Way to Host a Node.js + Postgres App in 2026](https://dev.to/hwidal/cheapest-way-to-host-a-nodejs-postgres-app-in-2026-1ee5)
- MongoDB Atlas e Turso: [MongoDB Atlas Free Tier 2026](https://agentdeals.dev/vendor/mongodb-atlas), [The Best Free Database Tiers in 2026](https://freetier.co/articles/best-free-database-free-tiers-2026)
