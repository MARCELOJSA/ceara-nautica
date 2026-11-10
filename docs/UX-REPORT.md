# UX-REPORT — Site Ceará Náutica

> **Rodada final** (mais recente) logo abaixo, seguida da Rodada 3 e da Rodada 2, mantidas como estavam. A Rodada 1 (nota 7,0) está no histórico do git.
> Notas: R1 7,0 → R2 7,8 → R3 8,6 → **Final 9,0**.

# Rodada final — 10/11/2026

_AGENT 04 (cn-ux-evaluator) · http://localhost:4190 (build do commit f5d9000) com API real (3333)_

## Veredito de experiência
**APROVADO.** Uma pessoa comum de Manaus, entrando pela primeira vez pelo PC ou pelo celular, consegue fazer as oito tarefas sem se perder e sem saber nada de tecnologia:
- encontrar uma embarcação;
- entender que preço e prazo vêm no orçamento;
- pedir manutenção, reparo, estofamento ou ajuda com o motor;
- conferir o que a empresa já fez;
- falar com a equipe.

O formulário orienta em português claro e confirma para qual número a equipe vai ligar. Nenhuma tarefa travou.

**O que ainda falta:**
1. **No site** (pequeno, não bloqueia): quem digita o sintoma na busca ("motor falhando") não recebe a dica de serviço (UX-27). Os textos que já vêm escritos no pedido deixam enviar sem descrever nada (UX-28). Os projetos da página Sobre são links que não parecem clicáveis (UX-29). O topo do orçamento continua falando de "embarcação feita sob medida" mesmo em pedidos de conserto (UX-30).
2. **Da empresa** (não é defeito do site): fotos reais, endereço, horário, manchete do topo da Home (B7) e, quando quiserem, o WhatsApp. Isso é o que separa o 9 de um 9,5+. A pessoa desconfiada ainda só tem o Instagram e as datas dos projetos como prova.

## Método
- Revisão geral de ponta a ponta das oito situações, como quem nunca viu o site, em **PC 1366×768 e 1920×1080** e **celular 390×844 e 360×740** (isMobile, hasTouch). Olhei todas as capturas.
- Roteiros: `apps/web/e2e/ux/r2-tour.mjs`, `r2-widgets.mjs`, `r2-search.mjs`, `r2-forms.mjs`, `r2-extra.mjs` e `r3-quote-flow.mjs`, com `BASE_URL=http://localhost:4190`. Fiz ainda verificações pontuais: telefone sem DDD ao sair do campo e ao enviar, buscas com sintomas e imagens repetidas na Home.
- Envios reais: 2 orçamentos ("João QA-TEST" e "Carlos UX QA-TEST") e 1 contato ("Maria QA-TEST"), todos com **201**. No teste "enviar só com o texto já preenchido", interceptei a resposta e nada foi gravado. Ao final, apaguei **só os meus 3 leads**. Os leads do QA técnico, que estava criando registros naquele momento, ficaram no banco.
- Console do navegador: **0 erros** em todas as páginas e viewports. Nenhuma rolagem horizontal.
- Capturas: `docs/ux-screenshots/final/` (13 PNG, ~0,9 MB).

## Status dos itens pendentes

| ID | Status | Do ponto de vista de quem usa |
|---|---|---|
| UX-04 Conserto de motor | **Resolvido** | Serviços, o FAQ e a página do produto Motores de popa dizem honestamente "descreva o problema e a equipe confirma se atende". Há a dúvida "Vocês fazem revisão ou conserto de motor?" e o link **"Problema no motor? Descreva aqui"** (`01-d1920-motores-problema-no-motor.png`, `13-m390-motores-duvidas.png`). |
| UX-10 Campos repetidos no orçamento | **Resolvido** | Com produto, só aparece o cartão com "Trocar". Em reparo, manutenção e motor, os campos "Categoria" e "Modelo" somem (`03-m390-orcamento-reparo.png`). |
| UX-12 Fichas diferentes entre canoas | **Resolvido** | As duas canoas agora têm as mesmas linhas: Comprimento, Boca / Pontal, Material, Capota e Motorização (`07-…`, `08-…ficha.png`). |
| UX-17 Estofamento | **Resolvido** | A trilha diz "Catálogo › Estofamentos", e "Dúvidas comuns" inclui **"Preciso levar a embarcação?"** (`09-m390-estofamento-duvidas.png`). |
| UX-18 Fotos repetidas | **Resolvido** | Os destaques da Home não repetem as capas das categorias (`06-m390-home-destaques.png`). Sobra uma repetição distante e aceitável: a capa de Semi-chatas é a mesma foto "Passeio" da galeria, ~7 telas abaixo. |
| UX-20 Texto cortado no catálogo | **Resolvido** | Frase curta e completa no celular, inclusive a 360 px (`05-m360-catalogo-topo.png`). |
| UX-21 Frase da tela de sucesso | **Resolvido** | "Número errado? **Corrigir o telefone**", com o link em linha própria. Volta ao formulário preenchido com o cursor no telefone (`04-m390-sucesso.png`). |
| UX-22 Caminho para "motor falhando" | **Resolvido** | O link "Problema no motor? Descreva aqui", em Serviços e no produto, abre o orçamento com **"Problema ou revisão no motor"** e um roteiro na mensagem: "Modelo/potência do motor e o que está acontecendo:" (`02-d1366-orcamento-motor-revisao.png`). Resíduo: UX-27 e UX-28. |
| UX-23 "Indicado para" | **Resolvido** | Aparece em todos os cards de embarcação, com "sob consulta" quando não foi publicado e "Lazer" como termo único. |
| UX-24 Campos sem sentido em conserto | **Resolvido** | Sem Categoria e Modelo, e sem buraco na grade do PC (`02-…`). |
| UX-25 Telefone sem DDD ou com letras | **Resolvido** | "99999-0000" mostra **"Inclua o DDD. Ex.: (92) 99999-9999"** ao sair do campo e ao enviar (`11-m390-telefone-sem-ddd.png`). "abc" mostra "Use apenas números. Ex.: (92) 99999-9999". |
| UX-26 "Destaques do perfil" | **Resolvido** | Agora são "Categorias em destaque", com botões "Lanchas no catálogo do site →" etc., e um botão separado "Ver no Instagram" (`10-m390-sobre-categorias-projetos.png`). |

Os demais itens da Rodada 3 (UX-01 a 03, 05 a 09, 11, 13 a 16 e 19) continuam funcionando como descrito lá. Confirmei de novo nesta revisão: erros em português, telefone flexível, busca tolerante, quadro de preço e prazo, galeria com arrastar, PC sem botão flutuante e barra inferior em uma linha a 360 px.

## Revisão geral — as oito situações
1. **Canoa ~6 m:**
   - **Encontrar:** a busca "canoa 6" acha a canoa direto, e o chip Canoas também funciona.
   - **Produto:** preço e prazo "sob consulta" com explicação, ficha igual à da canoa de 7 m e "Entenda a ficha".
   - **Pedido:** o orçamento mostra só o cartão do produto, e o envio funcionou. Nenhuma dificuldade.
2. **Lancha para a família:**
   - **Escolher:** os cards mostram uso e capacidade, e "lancha familia" ou "barco familia" trazem resultados.
   - **Detalhe:** na Home, os três destaques agora são a cargueira (trabalho), a lancha 10 m ("Indicado para: sob consulta") e a canoa 7 m. Quem quer passear com a família não vê nos destaques uma lancha de lazer (a 7 m saiu para evitar a foto repetida). Pelo catálogo ou pelo chip Lanchas, a lancha de 7 m "Lazer · 11 passageiros" aparece na hora. Não é um bloqueio, só uma oportunidade (sem ID).
3. **Motor falhando:**
   - **Pelos menus:** Serviços ou o produto Motores de popa → "Problema no motor? Descreva aqui" → formulário já preenchido. Ficou claro.
   - **Pela busca:** quem digita **"motor falhando"** recebe 0 resultados e **nenhuma** dica de serviço (`12-m390-busca-motor-falhando.png`). "conserto motor" e "revisao motor" mostram a dica (UX-27).
4. **Estofamento:** Catálogo › Estofamentos ou Serviços › "Orçar estofamento". As dúvidas comuns respondem preço e prazo, se é preciso levar a embarcação e a escolha de cor e material. Claro.
5. **Pessoa desconfiada:**
   - **Sobre:** etapas "Do pedido à entrega" e linha do tempo de 2022 a 2026 com os projetos publicados.
   - **Contato:** "Endereço a confirmar com a equipe", e o link do mapa avisa que não indica o endereço. É o máximo que o site pode fazer sem os dados da empresa.
   - **Detalhe:** os nomes dos projetos são links, mas parecem texto comum (UX-29).
6. **Busca com erros, filtros e voltar (celular):** "repraro" e "concerto" mostram a dica de serviços no topo, "motr" acha os motores e "estofado" acha o estofamento. O botão voltar mantém o filtro e a rolagem, e o chip ativo aparece centralizado. Ótimo.
7. **Formulários com erros:** todas as mensagens em português e específicas: nome, telefone (vazio, incompleto, sem DDD, com letras), e-mail, assunto curto, mensagem curta e autorização. O cursor vai para o primeiro erro. A confirmação repete o número e permite corrigir sem redigitar.
8. **Menu, cookies, barra, FAQ e galeria:**
   - **Menu:** gaveta de altura total com "Catálogo".
   - **Cookies:** banner compacto, e "Preferências" explica cada categoria.
   - **Barra inferior:** "Orçamento" e "Instagram" em uma linha a 360 px; na página de orçamento, troca para "Contato".
   - **FAQ:** em Serviços e nos produtos.
   - **Galeria:** aceita arrastar e mostra a posição (1 / 8).

## Problemas novos (Rodada final)

| ID | Prioridade | Onde (página + elemento) | O que eu tentava | Problema | Como melhorar | Arquivo provável |
|---|---|---|---|---|---|---|
| UX-27 | Baixa | /produtos, busca e estado vazio | Buscar pelo sintoma: "motor falhando" | 0 resultados **sem** a dica "Procura reparo…?" e sem o link "Problema no motor?". "conserto motor" e "revisao motor" funcionam, mas sintomas como "falhando", "não liga", "quebrou" e "vazando" não. | Incluir esses sintomas nos termos de serviço. Quando a busca tiver "motor" e der 0, mostrar o link "Problema no motor? Descreva aqui" (`/orcamento?servico=motor-revisao`). | `apps/web/src/pages/Products.tsx` (SERVICE_TERMS e estado vazio) |
| UX-28 | Baixa | /orcamento?servico=…, campo "Conte o que você precisa" | Enviar sem descrever o problema | O texto que já vem escrito ("Modelo/potência do motor e o que está acontecendo:" ou "Tenho interesse no serviço: …") conta como descrição. Dá para enviar sem escrever nada, e o vendedor recebe um pedido vazio. | Usar o roteiro como texto de exemplo apagado (placeholder) ou dica abaixo do campo, ou exigir texto além do que já vem escrito ("Conte com suas palavras o que está acontecendo"). | `apps/web/src/components/forms/QuoteForm.tsx` |
| UX-29 | Baixa | /sobre, linha do tempo "O que já saiu do estaleiro" | Ver um projeto da lista | Os nomes dos projetos levam ao produto, mas não parecem clicáveis: não há sublinhado, seta nem mudança de cor. Muita gente nem tenta tocar. | Acrescentar uma seta "→" ou sublinhado laranja, como nos outros links do site. | `apps/web/src/pages/About.tsx` |
| UX-30 | Baixa | /orcamento em pedidos de conserto (reparo, manutenção, motor) | Pedir conserto | O topo diz "Cada embarcação é feita sob medida…", e "Como funciona" fala em "Tipo de embarcação, uso, tamanho, motorização e cor". São textos de compra de barco novo, não de conserto. | Ajustar o subtítulo e o passo 01 conforme o tipo, por exemplo "Conte o problema, a embarcação ou motor e onde ela está". | `apps/web/src/pages/Quote.tsx` |

_Observações sem ID:_ o botão do topo da Home ainda diz "Ver embarcações" enquanto o menu diz "Catálogo"; a manchete (B7) continua aguardando o cliente.

## Pontos fortes (visão geral)
- **Nenhuma tarefa travou** em nenhum dos quatro tamanhos de tela. O caminho até falar com a empresa leva 2 a 4 toques em qualquer situação.
- **Formulário exemplar para leigos:** mensagens específicas em português, telefone flexível, tipo de pedido já preenchido, confirmação com o número e correção sem redigitar.
- **Honestidade que gera confiança:** "sob consulta", "fotos ilustrativas", "endereço a confirmar", "a equipe confirma se atende" e as datas reais das publicações.
- **Busca tolerante** (sem acento, erros de digitação, várias palavras, sinônimos) e o botão voltar que preserva filtro e rolagem.
- **Visual consistente e profissional** no PC e no celular, sem nada quebrado.

## Nota final

| Critério | R2 | R3 | Final |
|---|---|---|---|
| Navegação no PC | 8,5 | 9,0 | 9,2 |
| Navegação no celular | 8,0 | 8,8 | 9,2 |
| Clareza / conteúdo | 7,5 | 8,5 | 9,0 |
| Encontrar produto ou serviço | 7,5 | 8,7 | 9,0 |
| Qualidade visual | 8,0 | 8,5 | 8,7 (fotos ainda ilustrativas) |
| Formulários / contato | 7,0 | 8,8 | 9,3 |
| Confiança (visitante desconfiado) | 6,5 | 7,5 | 7,8 (depende da empresa) |
| **Geral** | **7,8** | **8,6** | **9,0 / 10** |

---

# Rodada 3 — 10/11/2026

_AGENT 04 (cn-ux-evaluator) · versão nova e limpa em http://localhost:4190 com API real (3333)_

## Método
- Refiz as oito situações da Rodada 2 como visitante leigo de Manaus, em **PC 1366×768 e 1920×1080** e **celular 390×844 e 360×740** (isMobile, hasTouch). Olhei todas as capturas.
- Roteiros: os mesmos `apps/web/e2e/ux/r2-*.mjs` (agora com `BASE_URL=http://localhost:4190`) e um novo, `apps/web/e2e/ux/r3-quote-flow.mjs`, que testa o "Trocar" do produto, os tipos de solicitação e o "Corrigir o telefone" depois do envio.
- Envios reais: 2 orçamentos ("João QA-TEST", canoa 6 m; "Carlos UX QA-TEST", motor falhando) e 1 contato ("Maria QA-TEST"). Todos deram **201**. No fim, apaguei **só os meus 3 leads**. Os leads do QA técnico, criados em paralelo, ficaram no banco para não atrapalhar o teste dele.
- Console do navegador: **0 erros** em todas as páginas e viewports. Nenhuma rolagem horizontal.
- Capturas: `docs/ux-screenshots/r3/` (19 PNG, ~1,8 MB).

## Resumo
A equipe corrigiu **o que mais atrapalhava**, e conferi na prática que funciona:
- O formulário fala português claro em todos os erros.
- O telefone "(92) 9 9999-0000" é aceito.
- A busca entende como um leigo escreve: "canoa 6", "canoa aluminio", "motr", "estofado", "lancha familia" e "bote 6m" trazem o produto certo, e "concerto" e "repraro" levam a Serviços.
- A tela de sucesso mostra o número digitado, e "Corrigir o telefone" volta ao formulário com tudo preenchido e o cursor no telefone.
- O produto agora tem "Preço e prazo: sob consulta", "Entenda a ficha" e "Dúvidas comuns".
- A página Sobre ganhou etapas e uma linha do tempo com os projetos publicados, cada um levando ao produto.
- As fotos ficaram coerentes, a galeria aceita arrastar no celular e o botão flutuante saiu do PC.

O que sobrou é pequeno, com uma exceção média: **quem tem o motor falhando ainda precisa adivinhar o caminho**. Os botões levam a "Comprar motor de popa" ou "Manutenção", e o novo tipo "Problema ou revisão no motor" só aparece se a pessoa abrir o menu e escolher sozinha (UX-22). O resto são detalhes de texto e consistência.

**Nota geral: 8,6 / 10** (R2: 7,8).

## Situações refeitas (o que mudou para quem usa)
1. **Canoa ~6 m (celular):**
   - **Encontrar:** a busca "canoa 6" acha a canoa direto. Pelo chip Canoas também funciona.
   - **Página do produto:** a foto agora é um barco na água, sem lago de outono. Logo abaixo do botão aparece "Preço e prazo: sob consulta" com a explicação. "Entenda a ficha" explica boca, pontal e chapa (`02-m390-canoa6-preco-ficha.png`). "Dúvidas comuns" responde preço, capacidade, mudanças e entrega (`03-m390-canoa6-duvidas.png`).
   - **Comparar:** ainda é difícil, porque as fichas das duas canoas têm linhas diferentes (UX-12).
2. **Lancha para a família (PC e celular):**
   - **Escolher:** os cards mostram "Indicado para" e a capacidade quando existe, por exemplo "7 m · 11 passageiros · Passeio · Pesca · Trabalho" (`13-d1366-catalogo.png`). A busca "lancha familia" ou "lancha passeio" leva à lancha de 7 m.
   - **Fotos:** a lancha de 10 m agora aparece como uma lancha de alumínio de verdade.
   - **Orçamento:** a partir do produto, o formulário mostra só o cartão do produto com "Trocar". "Trocar" remove o produto e mantém a categoria. Funciona e é fácil de entender.
   - **Falha:** alguns cards não têm "Indicado para" (UX-23).
3. **Motor falhando:**
   - **Informação:** Serviços e FAQ agora dizem honestamente "descreva o problema e a equipe confirma se atende" (`17-m390-servicos-motores.png`).
   - **Caminho:** o botão da seção de motores é "Consultar motores", que abre o formulário como **"Comprar motor de popa"**. A página do produto Motores de popa só tem dúvidas sobre preço, marcas e potência (`16-m390-motores-duvidas.png`). O tipo certo, "Problema ou revisão no motor", existe, mas a pessoa precisa achar sozinha no menu do formulário (UX-22).
   - **Pedido:** escolhendo esse tipo, o pedido foi enviado sem problema.
4. **Estofamento:**
   - **Caminho:** a trilha agora diz "Início › Catálogo › Estofamentos", o que faz sentido. Pelo Serviços, "Orçar estofamento" preenche o tipo e a mensagem.
   - **Falta:** continua sem dizer se é preciso levar o barco ou só as almofadas (resíduo de UX-17).
5. **Pessoa desconfiada:**
   - **Sobre:** a página está bem mais convincente. Mostra "Do pedido à entrega" em quatro etapas e "O que já saiu do estaleiro", uma linha do tempo de 2022 a 2026 com data, categoria e link para cada projeto (`09-m390-sobre-projetos.png`). A lista repetida da Home saiu.
   - **Contato:** diz "Endereço a confirmar com a equipe", e o link do mapa avisa "Ver a cidade de Manaus no mapa (não indica o endereço)" (`10-m390-contato.png`). Honesto.
   - **Estranhamento novo:** os botões "Destaques do perfil" têm o nome dos destaques do Instagram, mas levam ao catálogo do site (UX-26).
6. **Busca com erros, filtros e voltar (celular):**
   - **Catálogo compacto:** chips e busca aparecem na primeira tela (`01-m390-catalogo-compacto.png`).
   - **Busca:** "repraro" e "concerto" mostram a caixa "Procura reparo, manutenção ou outro serviço? Veja nossos serviços" **acima** do "Nenhum produto encontrado", visível sem rolar (`04-m390-busca-repraro.png`). "motr" acha os motores (`05-m390-busca-motr.png`).
   - **Voltar:** o botão voltar mantém o filtro e a rolagem.
   - **Detalhe:** a descrição do catálogo aparece cortada no meio da palavra, "além d…" (UX-20).
7. **Formulários com erros:**
   - **Mensagens:** todas em português: "Informe seu telefone/WhatsApp.", "Número incompleto. Ex.: (92) 99999-9999", "E-mail inválido. Ex.: nome@provedor.com.br", "Assunto muito curto (mín. 2 caracteres).", "É necessário autorizar o contato para enviar." (`06-m390-orcamento-erros-pt.png`).
   - **Telefone:** "(92) 9 9999-0000", "92 9 9999 0000" e "+55 92 99999-0000" são aceitos.
   - **Sucesso:** a tela mostra "Vamos retornar no (92) 99999-0000" e "O que acontece agora" em três passos (`07-m390-sucesso-corrigir.png`). "Corrigir o telefone" volta ao formulário preenchido com o telefone selecionado (`08-m390-corrigir-telefone.png`).
   - **Detalhes:** a frase "Número errado? Corrigir o telefone e envie de novo." soa truncada (UX-21). Um número sem DDD é aceito sem aviso (UX-25). Pedidos de conserto ainda mostram "Categoria" e "Modelo de referência" (UX-24, `14-d1920-orcamento-manutencao.png`).
8. **Menu, cookies, barra, FAQ e galeria:**
   - **Menu:** diz "Catálogo" e funciona bem.
   - **Cookies:** igual à R2 (bom).
   - **Barra inferior a 360 px:** "Orçamento" cabe em uma linha (`12-m360-barra-inferior.png`).
   - **Galeria:** aceita arrastar no celular, com a dica "Arraste para o lado para ver as outras fotos" (`11-m390-lightbox-arrastar.png`). As oito fotos agora combinam com "A vida no rio".
   - **FAQ:** também aparece no produto.
   - **PC:** sem o botão flutuante, os cards ficaram limpos (`18-d1366-produto-lancha7.png`).

## Status dos problemas da Rodada 2

| ID | Status | Do ponto de vista de quem usa |
|---|---|---|
| UX-01 Erro de autorização em inglês | **Resolvido** | "É necessário autorizar o contato para enviar." |
| UX-02 Telefone "(92) 9 9999-0000" recusado | **Resolvido** | Os formatos comuns são aceitos e as mensagens explicam o que falta. Sobrou o caso sem DDD (UX-25). |
| UX-03 Busca rígida | **Resolvido** | Funciona sem acento, com várias palavras, "canoa 6", "bote 6m", erros de digitação e sinônimos. "concerto" e "repraro" levam a Serviços. |
| UX-04 Não diz se conserta motor | **Parcial** | O texto agora é honesto ("descreva e a equipe confirma"), mas o caminho até o pedido certo não é óbvio → UX-22 |
| UX-05 Sem preço e prazo no produto | **Resolvido** | Quadro "Preço e prazo: sob consulta" logo abaixo dos botões, mais "Dúvidas comuns". |
| UX-06 Escolher lancha para a família | **Resolvido** | Os cards têm uso indicado e capacidade, e a busca "lancha familia" funciona. Ver a inconsistência em UX-23. |
| UX-07 Fotos contraditórias | **Resolvido** | Lancha 10 m, canoa 6 m e galeria coerentes. Continuam ilustrativas e sinalizadas. |
| UX-08 Sobre fraco e "Manaus no mapa" | **Resolvido** | Etapas e projetos publicados com datas. O mapa avisa que não mostra o endereço. |
| UX-09 Catálogo ocupa a 1ª tela | **Resolvido** | Cabeçalho compacto e dica de serviço acima do "Nenhum produto". |
| UX-10 Campos repetidos no orçamento | **Parcial** | Com produto, fica só o cartão com "Trocar". Sem produto (conserto, motor) ainda aparecem Categoria e Modelo → UX-24 |
| UX-11 Termos técnicos | **Resolvido** | "Entenda a ficha" explica boca, pontal, chapa e hp. |
| UX-12 Fichas diferentes entre canoas | **Persiste** (baixa) | 6 m: Dimensões, Chapa, Capota. 7 m: Comprimento, Material, Boca / Pontal. |
| UX-13 Galeria sem arrastar | **Resolvido** | Arrastar funciona e há uma dica escrita. |
| UX-14 Botão flutuante no PC | **Resolvido** | Removido. O botão do cabeçalho basta. |
| UX-15 Barra quebrando a 360 px | **Resolvido** | "Orçamento" em uma linha. |
| UX-16 "Informe o assunto" para assunto curto | **Resolvido** | "Assunto muito curto (mín. 2 caracteres)." |
| UX-17 Estofamento como "Embarcações" | **Parcial** | A trilha e o menu dizem "Catálogo". Ainda não explica se é preciso levar o barco ou só as almofadas. |
| UX-18 Fotos repetidas | **Parcial** | Na Home, as fotos da lancha 7 m e da semi-chata aparecem duas vezes (capa da categoria e destaque). |
| UX-19 Sucesso sem o telefone | **Resolvido** | Mostra o número e o botão "Corrigir o telefone", que funciona bem. |

## Problemas novos (Rodada 3)

| ID | Prioridade | Onde (página + elemento) | O que eu tentava | Problema | Como melhorar | Arquivo provável |
|---|---|---|---|---|---|---|
| UX-20 | Baixa | /produtos no celular, texto do cabeçalho | Ler do que se trata o catálogo | O texto é cortado no meio da palavra: "…além d…". Parece erro. | No celular, usar uma frase curta completa ("Lanchas, canoas, botes e semi-chatas em alumínio, além de motores e estofamentos.") em vez de cortar com reticências. | `apps/web/src/pages/Products.tsx`, `apps/web/src/components/layout/PageHeader.tsx` |
| UX-21 | Baixa | Tela de sucesso (orçamento e contato) | Corrigir o número | "Número errado? **Corrigir o telefone** e envie de novo." mistura dois tempos verbais, e no celular o "e envie de novo." cai sozinho em outra linha com espaço estranho (`07-m390-sucesso-corrigir.png`). | "Número errado? **Corrija o telefone** e envie de novo." ou só o botão "Corrigir o telefone" em linha própria. | `apps/web/src/components/forms/QuoteForm.tsx`, `ContactForm.tsx` (FormSuccess) |
| UX-22 | Média | /servicos (Motores e Manutenção), /produtos/motores-de-popa | Pedir ajuda para o motor falhando | O texto manda "descrever o problema", mas os botões levam a "Comprar motor de popa" (Consultar motores) ou "Manutenção". O tipo "Problema ou revisão no motor" só aparece se a pessoa abrir o menu e escolher sozinha. As "Dúvidas comuns" do produto não falam de defeito. | Botão próprio "Problema no motor? Descreva aqui" → `/orcamento?servico=motor-revisao`, com o tipo e a mensagem já preenchidos ("Modelo do motor e o que está acontecendo:"). Na página do produto, acrescentar a dúvida "Vocês fazem revisão de motor?". | `apps/web/src/data/content.ts` (SERVICES, SERVICE_TO_REQUEST_TYPE, FAQ), `apps/web/src/pages/ProductDetail.tsx` |
| UX-23 | Baixa | /produtos, cards | Comparar o uso das embarcações | "Indicado para" aparece em alguns cards e falta em outros (lancha 10 m, canoa 6 m, bote 6 m, bote 6 m – 90 hp). Também mistura "Passeio" e "Lazer" (`15-m390-cards-indicado-para.png`). | Preencher em todos, com "Uso: sob consulta" quando o dado não estiver confirmado, e padronizar os termos. | `packages/shared/src/catalog.ts` (orquestrador), `apps/web/src/components/product/ProductCard.tsx` |
| UX-24 | Baixa | /orcamento sem produto (manutenção, reparo, motor) | Pedir conserto | Aparecem "Categoria" e "Modelo de referência: Nenhum / projeto sob medida", que não fazem sentido para quem quer consertar. No PC, o campo Cidade fica sozinho com um buraco ao lado (`14-d1920-orcamento-manutencao.png`). | Mostrar Categoria e Modelo só para "Nova embarcação" ou "Comprar motor". Para conserto, trocar por "Que embarcação ou motor você tem? (opcional)". Reorganizar a grade. | `apps/web/src/components/forms/QuoteForm.tsx` |
| UX-25 | Baixa | Campo Telefone | Digitar sem DDD ou com letras | "99999-0000" (sem DDD) é aceito sem aviso, e o vendedor pode não conseguir ligar. "abc" mostra "Número incompleto", mensagem estranha para letras. | Sem DDD, assumir 92 e mostrar "(92) 99999-0000" para a pessoa confirmar, ou pedir "Inclua o DDD". Com letras, dizer "Use apenas números". | `packages/shared/src/schemas.ts`, `apps/web/src/components/forms/fields.tsx` |
| UX-26 | Baixa | /sobre, botões "Destaques do perfil" | Ver os destaques do Instagram | O nome promete os destaques do Instagram, mas os botões abrem o catálogo do site. | Renomear para "Veja no catálogo" ou levar cada botão ao Instagram, indicando que abre em nova aba. | `apps/web/src/pages/About.tsx` |

_Nota de consistência (sem ID):_ no topo da Home o botão diz "Ver embarcações", enquanto o menu e a trilha dizem "Catálogo". Não atrapalha, mas "Ver catálogo" ficaria uniforme. A manchete (B7) continua aguardando o cliente.

## Pontos fortes (novos)
- O formulário ficou **à prova de leigo**: erros claros em português, telefone flexível, número repetido na confirmação e correção sem redigitar nada.
- A busca agora é **tolerante**, como as pessoas realmente digitam.
- A página do produto responde às três primeiras perguntas (quanto custa, quanto demora, quantas pessoas leva) sem prometer nada que não esteja confirmado.
- A página Sobre ganhou **provas verificáveis**: datas e links de projetos publicados.
- O PC ficou mais limpo sem o botão flutuante. No celular, a barra inferior não quebra mais.

## Nota — Rodada 3

| Critério | R2 | R3 |
|---|---|---|
| Navegação no PC | 8,5 | 9,0 |
| Navegação no celular | 8,0 | 8,8 |
| Clareza / conteúdo | 7,5 | 8,5 |
| Encontrar produto ou serviço | 7,5 | 8,7 (motor com defeito ainda pede adivinhar) |
| Qualidade visual | 8,0 | 8,5 |
| Formulários / contato | 7,0 | 8,8 |
| Confiança (visitante desconfiado) | 6,5 | 7,5 (falta o que depende da empresa) |
| **Geral** | **7,8** | **8,6 / 10** |

Com UX-22 resolvido e os itens Baixa ajustados, a nota fica em ≈ 8,8. Chegar a 9+ depende da empresa: fotos reais, endereço, horário, manchete (B7) e, quando quiser, o WhatsApp.

---

# Rodada 2 — 10/11/2026 (mantida)

> A rodada anterior (09/11/2026) deu **nota 7,0** e está no histórico do git (versão anterior deste arquivo, com as capturas em `docs/ux-screenshots/`). Esta rodada confere as correções na prática e procura novos problemas.

_AGENT 04 (cn-ux-evaluator) · 10/11/2026 · site em http://localhost:5173 com API real (3333)_

## Método
- Usei o site como uma pessoa leiga de Manaus que chega pela primeira vez. Naveguei com Playwright (Chromium) em **computador 1366×768 e 1920×1080** e **celular 390×844 e 360×740** (isMobile, hasTouch), e olhei todas as capturas.
- Roteiros reutilizáveis salvos em `apps/web/e2e/ux/` (só navegação, não fazem parte da suíte):
  `r2-tour.mjs` (páginas inteiras), `r2-widgets.mjs` (menu, cookies, barra inferior, FAQ, galeria), `r2-search.mjs` (busca com erro de digitação, filtros, botão voltar), `r2-forms.mjs` (formulários com erros de propósito e envio real), `r2-extra.mjs` (galeria/lightbox, estado vazio).
- Envios reais: **1 orçamento** (canoa 6 m, "João QA-TEST") e **1 mensagem de contato** ("Maria QA-TEST", motor falhando). Os dois retornaram **201** com a tela de sucesso. No fim, apaguei do banco todos os leads com "QA-TEST" (3 em `quote_requests` e 3 em `contact_messages`, contando sobras de rodadas anteriores).
- Console do navegador: **0 erros** em todas as páginas e viewports.
- Capturas citadas: `docs/ux-screenshots/r2/` (21 PNG, ~1,6 MB).

## Resumo
O site está **bem melhor que na rodada 1**. O defeito grave do celular (menu quebrado) foi resolvido. A barra inferior "Pedir orçamento + Instagram" ficou clara e honesta, e o site agora diz em vários lugares como o cliente recebe a resposta ("pelo telefone informado, ligação ou WhatsApp"). Também ganhou FAQ, textos certos para motores e estofamento, Home mais curta no celular e chips de categoria que aparecem na tela. Passa a impressão de empresa organizada.

O que ainda atrapalha o visitante comum está **no formulário**, que hoje é o único canal de contato além do Instagram:
1. Quem não marca a autorização vê **"Invalid literal value, expected true"**, em inglês e técnico. A causa provável é o ambiente de desenvolvimento (ver UX-01), mas foi o que a pessoa viu.
2. O telefone escrito do jeito comum em Manaus, **"(92) 9 9999-0000"**, é **recusado** como "Telefone inválido".

Fora isso: a busca só acha o texto exato ("canoa aluminio", "canoa 6m", "estofado" e "motr" dão 0 resultados). Quem tem **motor de popa com defeito** não descobre se a empresa conserta motor. A página do produto não diz nada sobre **preço**, nem que é "sob consulta". E para a **pessoa desconfiada** só há o Instagram como prova de que a empresa existe; esta parte depende em grande parte de dados que a empresa ainda não enviou.

**Nota geral: 7,8 / 10** (era 7,0). Com UX-01 e UX-02 resolvidos, chega a ≈ 8,3.

---

## Avaliação por situação

### 1. Pescador que quer canoa de alumínio de ~6 m (celular 390)
- **Caminho:** Home → ☰ → Embarcações → chip **Canoas** → 2 canoas → "Canoa de Alumínio 6 m" → **Solicitar orçamento**. São 5 toques. Pela Home também dá: as categorias aparecem logo depois do topo (`02-m390-home-barra-inferior.png`).
- **Comparar:** as duas canoas usam **linhas de especificação diferentes**. A de 6 m mostra Dimensões, Chapa, Capota e Motorização. A de 7 m mostra Comprimento, Material, "Boca / Pontal: sob consulta" e Motorização. Não dá para comparar lado a lado, e nenhuma informa **quantas pessoas ou quanto peso** leva, que é o que o pescador quer saber. "Boca / Pontal" não é explicado (UX-11, UX-12).
- **Preço/prazo:** a página do produto não fala de preço em lugar nenhum. A resposta "dependem do projeto e são informados no orçamento" só existe no FAQ da página **Serviços**, e o pescador não passa por lá (UX-05).
- **Foto:** a canoa de 6 m aparece com um lago de outono e floresta de clima temperado (`08-m390-canoa-6m.png`). Para quem é de Manaus, a foto não combina com o rio daqui (UX-07).
- **Orçamento:** chegou com o produto, a categoria e o tipo "Nova embarcação" já preenchidos. Ótimo. Errei de propósito e travei em duas mensagens (UX-01, UX-02), ver a situação 7. Depois de corrigir, o envio funcionou e a confirmação ficou clara (`12-m390-orcamento-sucesso.png`).
- **Voltar:** o botão voltar do celular depois do envio levou de volta à canoa. Natural.

### 2. Família que quer uma lancha para passear (PC 1366/1920 e celular)
- **Caminho:** "Ver embarcações" → chip Lanchas → 3 lanchas. Fácil.
- **Decidir:** nada no card indica **para que serve** cada lancha. Uma se chama "cargueira", a outra "10 m" sem uso definido e a terceira "7 m – 11 passageiros". Só a de 7 m informa a capacidade, e a de 10 m diz "Capacidade: sob consulta". Uma família não sabe qual serve para passeio sem abrir as três. Buscar "lancha familia" dá 0 resultados (UX-06, UX-03).
- **Fotos:** a de 7 m (lancha com motor no rio azul) e a cargueira (barco regional coberto) ficaram coerentes. A de **10 m é a silhueta de uma canoa no pôr do sol** (`09-d1366-lancha-10m.png`). O selo de "fotos ilustrativas" está sempre visível. O botão "Ampliar" e a galeria funcionam.
- **Página do produto no PC:** muito boa (`14-d1366-produto-lancha-7m.png`). Tem tabela clara, características, "Sobre este projeto", a fonte com a data da publicação no Instagram, e os botões **Solicitar orçamento** e **Perguntar no Instagram**, que agora são ações diferentes. Falta só uma linha sobre preço e prazo (UX-05).
- **Orçamento no PC (1920):** o produto escolhido aparece com miniatura. Mas o formulário repete a mesma informação em três lugares: "Produto selecionado", "Categoria: Lanchas" e "Modelo de referência: Lancha de Alumínio 7 m" (`20-d1920-orcamento-lancha.png`, UX-10).

### 3. Dono de barco com motor de popa falhando
- **O que tentei:** descobrir se fazem conserto ou revisão de motor. A Home fala em "Revenda de motores de popa". A página **Serviços** tem "Manutenção náutica", que cita "casco, equipamentos e acabamento" (`18-m390-servicos-manutencao.png`), e "Revenda de motores de popa". A página do produto "Motores de popa" só fala de revenda (`10-m390-motores-produto.png`). No FAQ, "Que tipos de reparo e manutenção vocês fazem?" responde "em embarcações de alumínio".
- **Onde travei:** **o site não diz em lugar nenhum se a empresa mexe em motor**. A pessoa fica sem saber e precisa perguntar (UX-04). No formulário, o tipo "Motor de popa" não deixa claro se é para comprar ou consertar.
- **Como pedir:** pelo formulário de contato ou de orçamento. Mandei a mensagem "motor falhando" pelo Contato e recebi "Mensagem enviada… Retornamos pelo telefone informado (ligação ou WhatsApp)". O próximo passo ficou claro. O prazo de retorno não aparece, mas isso depende da empresa.

### 4. Reformar o estofamento do barco
- **Caminho:** Home → categoria **Estofamentos** → "Estofamento Náutico" → orçamento. Ou Serviços → **Orçar estofamento**, que preenche o tipo "Estofamento" e a mensagem. Os dois caminhos funcionam.
- **Clareza:** os textos agora falam de "Sobre o serviço", "Materiais, cores e prazo sob consulta" e "Reforma de estofados". Está bom.
- **Estranheza:** o estofamento aparece no catálogo com a trilha "Início › **Embarcações** › Estofamentos", como se fosse um barco à venda (UX-17). Também não diz se é preciso **levar o barco** ou só as almofadas, que é a dúvida prática de quem quer reformar.

### 5. Pessoa desconfiada: a empresa é séria?
- **Onde fica:** o site só diz "Manaus – AM". No Contato há o link **"Manaus no mapa"**, que abre o mapa da cidade inteira. Parece que vai mostrar um endereço e não mostra (`16-m390-contato.png`, UX-08).
- **Há quanto tempo existe:** o site não diz. A página Sobre não tem história, ano nem equipe.
- **Fotos reais:** todas são de banco de imagens, e o site avisa isso honestamente.
- **Falar com alguém:** só por formulário ou Instagram.
- **O que transmite confiança:** as datas das publicações no Instagram nas páginas de produto ("publicação de 29/08/2022", "09/12/2023"), as medidas reais, nenhum número inventado e o tom "sem rodeios".
- **O que tira confiança:** a página Sobre repete **palavra por palavra** a lista "Fatos" da Home, oito itens iguais (`19-m390-sobre-fatos-repetidos.png`), e parece conteúdo de preenchimento.
- _Contexto do negócio:_ endereço, telefone, horário e fotos reais foram retidos pela empresa e não são defeito do site. Mesmo assim, esta é hoje a situação mais fraca, e a sugestão em UX-08 usa apenas fatos que o site já tem.

### 6. Procurou "reparo", errou a digitação, usou filtros e voltou (celular)
- **"reparo" e "manutencao" (sem acento):** a caixa "Nenhum produto encontrado" mostra a dica **"Procura reparo, manutenção ou outro serviço? Veja nossos serviços."**, que resolve o B1 da rodada anterior. Mas a dica fica **abaixo da dobra e atrás da barra inferior**: o cabeçalho escuro, os chips e a busca ocupam a primeira tela inteira (`07-m390-busca-reparo-vazio.png`, `21-m390-catalogo-topo.png`, UX-09).
- **Com erro de digitação:** "repraro" e "concerto" (escrita comum de "conserto") não mostram a dica, só um botão "Ver serviços" no fim da caixa (`06-m390-busca-concerto-vazio.png`).
- **Busca rígida:** "canoa aluminio", "canoa 6", "motr", "estofado" e "lancha familia" dão **0 resultados**. "canoa", "motor" e "6 m" funcionam (UX-03).
- **Filtros e voltar:** chip Canoas → abri um produto → voltar do celular. O filtro **e a posição da rolagem foram mantidos**, e a busca combinada com filtro também. Muito bom. Com o link direto para Motores de popa, o chip ativo aparece centralizado e a trilha mostra a categoria (`13-m390-catalogo-motores-chip.png`).
- **Produto que não existe:** mostra o 404 "Essa rota não está no mapa" com os botões "Página inicial" e "Ver embarcações". Simpático e claro.

### 7. Formulários com erros de propósito
| Tentativa | Mensagem exibida | Avaliação |
|---|---|---|
| Enviar vazio (orçamento) | "Informe seu nome." / "Telefone inválido. Ex.: (92) 99999-9999" / "Descreva o que você precisa (mín. 10 caracteres)." | Claras. O cursor vai para o primeiro erro (`05-m390-orcamento-erros.png`). Para o telefone vazio, "Informe seu telefone" seria melhor que "inválido". |
| Não marcar a autorização (orçamento e contato) | **"Invalid literal value, expected true"** | **Inglês e técnico.** O leigo não entende o que fazer (`04-m390-erro-consentimento-ingles.png`, UX-01). |
| Telefone "9299" / "abc" / "(92) 99999-000" | "Telefone inválido. Ex.: (92) 99999-9999" | Adequado. |
| Telefone **"(92) 9 9999-0000"** ou **"92 9 9999 0000"** | "Telefone inválido…" | **Número certo recusado** (UX-02). |
| Telefone sem DDD "99999-0000" | "Telefone inválido…" | Deveria dizer "inclua o DDD". |
| Mensagem "oi" | "Descreva o que você precisa (mín. 10 caracteres)." | Clara. |
| Contato: assunto "a" | "Informe o assunto." | Confunde, porque o assunto foi informado. Melhor "Assunto muito curto" (UX-16). |
| Contato: e-mail "maria@gmail" | "E-mail inválido." | Ok. |
| Envio correto | Tela "Pedido de orçamento enviado… vendedor vai retornar pelo telefone informado (ligação ou WhatsApp)" | Ótima. Poderia repetir o número digitado para a pessoa conferir (UX-19). |

### 8. Menu, cookies, barra inferior, FAQ e galeria
- **Menu do celular:** abre como gaveta de altura total, com links grandes, "Solicitar orçamento" e o Instagram, e fecha ao navegar (`01-m360-menu-aberto.png`). **Resolvido.**
- **Banner de cookies:** compacto, com "Recusar" e "Aceitar todos" lado a lado e "Preferências" como link. Em "Preferências", as categorias estão explicadas em linguagem simples. A 360 px ele ainda cobre os botões do topo da Home (`03-m360-cookie-banner.png`), o que é aceitável porque some com um toque.
- **Barra inferior (celular):** "Pedir orçamento" com ícone de prancheta e "Instagram" deixam claro o que cada um faz. Na página de orçamento, ela troca para "Contato", um bom detalhe. A 360 px o texto "Pedir orçamento" quebra em duas linhas (UX-15).
- **FAQ (Serviços):** acordeão simples, com respostas honestas (`11-m360-faq.png`). Só existe na página Serviços (UX-05).
- **Galeria "A vida no rio" e "Ampliar" nos produtos:** a ampliação abre com contador, legenda, setas e botão de fechar (`15-m390-lightbox.png`). **No celular não dá para arrastar com o dedo** para passar as fotos, só pelas setas (UX-13). A galeria inclui uma foto de faíscas de esmerilhadeira, que destoa do título "A vida no rio".
- **PC:** o cabeçalho agora é sólido ao rolar (B3 resolvido). O botão flutuante "Orçamento" é redundante com o botão do cabeçalho e fica por cima das fotos dos cards e da tabela do produto (`17-d1366-catalogo-botao-flutuante.png`, UX-14).

---

## Verificação dos itens da rodada 1

| Item | Situação | Comentário |
|---|---|---|
| A1 Menu mobile quebrado | **Resolvido** | Gaveta de altura total com os links visíveis. |
| A2 Ícone de chat levando a formulário | **Resolvido** | Barra inferior "Pedir orçamento + Instagram" (prancheta) e pílula "Orçamento" no PC. Os rótulos são honestos. |
| A3 Sem expectativa de retorno | **Resolvido** (falta o prazo) | "Retornamos pelo telefone informado (ligação ou WhatsApp)" aparece nos formulários, no sucesso, no FAQ e nas faixas de chamada. O prazo depende da empresa. |
| A4 Fotos que contradizem o produto | **Parcial** | A foto com marca Yamaha saiu e a cargueira ficou coerente. Continuam incoerentes: lancha 10 m (silhueta de canoa), canoa 6 m (lago de outono, clima temperado) e faíscas na galeria "A vida no rio". → UX-07 |
| M1 Textos de embarcação em motores | **Resolvido** | "Sobre os motores" e "Sobre o serviço", com faixa de chamada por contexto. |
| M2 Tipo de solicitação | **Resolvido** | Campo vem pré-preenchido pelo serviço ou produto. Criou redundância com Categoria e Modelo → UX-10 |
| M3 Botões duplicados no produto | **Resolvido** | O segundo botão virou "Perguntar no Instagram". |
| M4 Home longa no celular | **Resolvido** | Caiu de 16,6 para 13,3 telas, com as categorias logo depois do topo e 3 destaques. |
| M5 Banner de cookies grande | **Resolvido** | Ocupa ~25% da tela (antes ~45%). |
| M6 Chip ativo fora da tela | **Resolvido** | Chip centralizado e trilha com a categoria. |
| M7 Faltam informações de decisão | **Parcial** | O FAQ existe, mas só em Serviços. A página do produto não fala de preço. Faltam capacidade das canoas e conserto de motor → UX-04, UX-05, UX-06 |
| M8 Flutuante cobrindo conteúdo | **Resolvido no celular**, parcial no PC | → UX-14 |
| B1 Busca "reparo" sem caminho | **Resolvido** (parcial com erro de digitação) | → UX-03, UX-09 |
| B2 "Agendar manutenção" | **Resolvido** | Agora é "Solicitar manutenção". |
| B3 Cabeçalho translúcido | **Resolvido** | |
| B4 Fotos repetidas | **Ainda incomoda (baixa)** | As capas das categorias repetem as fotos dos produtos na mesma Home. A foto dos barcos atracados aparece em Sobre e na galeria → UX-18 |
| B5 Faixa do topo não clicável | **Resolvido** | Os quatro itens viraram links. |
| B6 Números cortados em Serviços | **Resolvido** | |
| B7 Manchete genérica do topo | **Aguardando o cliente** | "Seu próximo destino começa aqui" continua sendo o trecho com mais cara de modelo pronto. Não contei como defeito. |
| B8 "Motores de Popa" com maiúscula | **Resolvido** | |

---

## Problemas encontrados (Rodada 2)

| ID | Prioridade | Onde (página + elemento) | O que eu tentava | Problema | Como melhorar | Arquivo provável |
|---|---|---|---|---|---|---|
| UX-01 | **Alta** | /orcamento e /contato, caixa "Autorizo a Ceará Náutica…" | Enviar sem marcar a autorização | Aparece **"Invalid literal value, expected true"**, em inglês e técnico. Investigação: o Zod instalado (v4) gera a mensagem certa ("É necessário autorizar o contato para enviar."), mas o servidor de desenvolvimento usa um pacote pré-compilado **antigo do Zod 3** (`apps/web/node_modules/.vite/deps/zod.js`, de 09/11, anterior à atualização). Nessa versão o parâmetro `error:` é ignorado. Provavelmente não acontece no build de produção, mas foi o que o usuário viu. | Reiniciar o Vite com `--force` (ou apagar `node_modules/.vite`) e conferir de novo. Criar teste e2e que verifique o texto em português do erro de autorização (e o de telefone vazio, que também deveria ser "Informe seu telefone/WhatsApp."). Opcional: destacar a caixa em vermelho e rolar até ela. | `packages/shared/src/schemas.ts` (consent), `apps/web/e2e/` (teste novo), cache do Vite |
| UX-02 | **Alta** | /orcamento e /contato, campo "Telefone / WhatsApp" | Digitar o número como se escreve em Manaus | "(92) 9 9999-0000" e "92 9 9999 0000" são **recusados** como inválidos. A pessoa acha que o número está certo e que o site está quebrado. Sem DDD, a mensagem não diz o que falta. | Validar só os dígitos (remover espaços, parênteses e traços e aceitar 10–13 dígitos com DDD). Formatar automaticamente enquanto a pessoa digita. Mensagem específica: "Inclua o DDD. Ex.: (92) 99999-9999". | `packages/shared/src/schemas.ts` (`phoneRegex`), `apps/web/src/components/forms/fields.tsx` |
| UX-03 | Média | /produtos, caixa "Buscar por nome" | Buscar como leigo | Só acha o texto exato: "canoa aluminio", "canoa 6", "motr", "estofado" e "lancha familia" dão 0. A dica de serviços não aparece para "concerto" nem "repraro". | Buscar palavra por palavra (todas as palavras em qualquer ordem). Tratar "6m" como "6 m". Usar sinônimos (estofado→estofamento, família/passeio→lanchas, conserto/concerto→serviços). Ampliar `SERVICE_TERMS` com "concert", "arrum", "furo", "vazam", "falh" e "motor". Quando der 0, sugerir categorias parecidas. | `apps/web/src/lib/api.ts` (`filterProducts`), `apps/web/src/pages/Products.tsx` (`SERVICE_TERMS`) |
| UX-04 | Média | /servicos (Manutenção, Motores), FAQ, /produtos/motores-de-popa | Saber se consertam motor de popa | O site só fala em **revenda** de motor. A manutenção cita casco, equipamentos e acabamento. Quem tem motor falhando não sabe se pode pedir ajuda. | Confirmar com a empresa e escrever claramente, nos dois casos: "Fazemos revisão de motor de popa" ou "Não consertamos motores, mas orientamos…". Até lá, criar a pergunta no FAQ "Vocês consertam motor de popa?" com a resposta "descreva o problema no pedido e a equipe informa". Separar no formulário "Comprar motor" e "Problema no motor". | `apps/web/src/data/content.ts` (SERVICES/FAQ), `packages/shared/src/schemas.ts` (REQUEST_TYPES, orquestrador) |
| UX-05 | Média | /produtos/:slug, perto dos botões | Saber quanto custa e quanto demora | A página do produto **não menciona preço nem prazo**, nem como "sob consulta". O FAQ que responde isso fica só em Serviços. | Acrescentar perto do CTA uma linha "Preço e prazo: sob consulta, informados no orçamento, conforme o projeto". Mostrar um FAQ curto (preço, prazo, pagamento, entrega) também no produto e no orçamento. | `apps/web/src/pages/ProductDetail.tsx`, `apps/web/src/components/ui/Faq.tsx` |
| UX-06 | Média | /produtos (cards de lanchas) | Escolher uma lancha para a família | Os cards não mostram uso indicado nem capacidade. A capacidade só aparece na de 7 m (a de 10 m diz "sob consulta"). Não há como filtrar por "passeio". | Mostrar no card selos de uso (Passeio · Pesca · Trabalho) e a capacidade quando houver. Na categoria Lanchas, um texto curto "Qual lancha para mim?" que leve ao orçamento. | `apps/web/src/components/product/ProductCard.tsx`, `packages/shared/src/catalog.ts` (orquestrador) |
| UX-07 | Média | Lancha 10 m, Canoa 6 m, galeria da Home | Ver fotos | A foto da lancha 10 m é a silhueta de uma canoa. A da canoa 6 m é um lago de outono em clima temperado. Na galeria "A vida no rio" há faíscas de esmerilhadeira. Isso contradiz o texto e o lugar. | Trocar por imagens neutras e coerentes (rio amazônico, casco de alumínio) ou usar uma só foto genérica por categoria. A prioridade é receber da empresa as fotos do Instagram. | `packages/shared/src/catalog.ts` (images), `apps/web/src/data/content.ts` (GALLERY), `apps/web/public/images` |
| UX-08 | Média | /sobre (lista "Fatos sobre o nosso trabalho"), /contato ("Manaus no mapa") | Verificar se a empresa é séria | A página Sobre repete a lista da Home palavra por palavra e não traz nada verificável. "Manaus no mapa" sugere um endereço e abre a cidade inteira. | Trocar a lista repetida por uma linha do tempo de **projetos publicados**, com as datas que já estão no catálogo (fonte do Instagram), e link para cada post. Renomear o link do mapa para "Atendemos em Manaus" ou removê-lo até haver endereço. Destacar "Veja os projetos reais no Instagram" com a contagem de publicações quando a empresa confirmar. | `apps/web/src/pages/About.tsx`, `apps/web/src/pages/Contact.tsx` |
| UX-09 | Média | /produtos no celular (cabeçalho escuro + estado vazio) | Ver o resultado da busca | O cabeçalho, os chips e a busca ocupam a primeira tela inteira (390×844). Os resultados e a dica "Procura reparo…?" ficam abaixo da dobra e atrás da barra inferior. | No celular, usar um cabeçalho compacto no catálogo (título e uma linha). Pôr a dica de serviço acima do título "Nenhum produto encontrado". | `apps/web/src/pages/Products.tsx`, `apps/web/src/components/layout/PageHeader.tsx` |
| UX-10 | Baixa | /orcamento?produto=… | Preencher o orçamento | "Produto selecionado", "Categoria" e "Modelo de referência" repetem a mesma informação. São 9 campos no celular. | Com o produto escolhido, esconder Categoria e Modelo (ou recolher em "Alterar produto"). Pôr o "Tipo de solicitação" primeiro. | `apps/web/src/components/forms/QuoteForm.tsx` |
| UX-11 | Baixa | Tabelas de especificação | Entender a ficha | Termos de estaleiro sem explicação: "Boca / Pontal", "Popa lavada", "hp". | Explicação curta (dica ou legenda): "Boca = largura; Pontal = altura do casco". | `apps/web/src/pages/ProductDetail.tsx`, `packages/shared/src/catalog.ts` |
| UX-12 | Baixa | Canoa 6 m × Canoa 7 m | Comparar as duas | As linhas da ficha mudam de um produto para outro (Dimensões × Comprimento, Chapa × Material). | Padronizar as linhas por categoria (Dimensões, Chapa, Capacidade, Motorização), usando "sob consulta" quando faltar o dado. | `packages/shared/src/catalog.ts` (orquestrador) |
| UX-13 | Baixa | Ampliação de fotos (Home e produto), celular | Passar as fotos com o dedo | Arrastar não funciona, só as setas. | Suportar o gesto de arrastar (touchstart/touchend) no Lightbox. | `apps/web/src/components/ui/Lightbox.tsx` |
| UX-14 | Baixa | PC 1366, botão flutuante "Orçamento" | Ver cards e ficha técnica | O botão fica por cima das fotos dos cards e perto da tabela, e é redundante com o "Solicitar orçamento" fixo no cabeçalho. | No PC, ocultar o botão flutuante (o cabeçalho já tem o CTA) ou só mostrá-lo depois que o cabeçalho sair da tela. | `apps/web/src/components/layout/FloatingContact.tsx` |
| UX-15 | Baixa | Barra inferior a 360 px | — | "Pedir orçamento" quebra em duas linhas. | Abaixo de 380 px, usar "Orçamento". | `apps/web/src/components/layout/FloatingContact.tsx` |
| UX-16 | Baixa | /contato, campo "Assunto" | Digitar assunto curto | "a" gera "Informe o assunto.", mas a pessoa informou. | "Assunto muito curto (mínimo 2 letras)." | `packages/shared/src/schemas.ts` (`trimmed`) |
| UX-17 | Baixa | Trilha e menu "Embarcações" em Estofamentos e Motores | Reformar estofado | "Início › Embarcações › Estofamentos" trata o serviço de estofamento como barco à venda. | Renomear para "Catálogo" ou "Produtos" na trilha e no título do catálogo, ou levar Estofamentos direto para Serviços. Dizer se é preciso levar o barco ou só as almofadas. | `apps/web/src/pages/ProductDetail.tsx`, `apps/web/src/pages/Products.tsx`, `data/content.ts` (NAV_LINKS) |
| UX-18 | Baixa | Home (categorias × destaques), Sobre × galeria | — | Mesma foto em lugares próximos (B4 da rodada 1). | Variar as capas de categoria e as fotos da galeria. | `apps/web/src/data/content.ts` (CATEGORY_COVERS, GALLERY) |
| UX-19 | Baixa | Tela de sucesso do orçamento e do contato | Conferir se deu certo | A tela não repete o telefone informado, e a pessoa não sabe se digitou errado. | "Vamos retornar no (92) 99999-0000. Número errado? Envie de novo." | `apps/web/src/components/forms/QuoteForm.tsx`, `ContactForm.tsx` |

---

## Pontos fortes
- **Menu do celular, barra inferior e cabeçalho** funcionando bem. A navegação no celular passou de "quebrada" para boa.
- **O caminho até o orçamento é curto e já vem preenchido.** De qualquer produto ou serviço, o formulário chega com produto, categoria, tipo e mensagem prontos. A confirmação explica o próximo passo.
- **O botão voltar do celular mantém o filtro e a rolagem** do catálogo, um detalhe que poucos sites acertam.
- **Honestidade:** "sob consulta", "fotos ilustrativas", a fonte com a data do Instagram e o FAQ "sem promessas que não podemos cumprir". Nada inventado.
- **Textos de cada contexto corrigidos** em motores, estofamento, faixas de chamada e na dica de serviços na busca.
- **Visual consistente e profissional** no PC (1366 e 1920) e no celular, sem rolagem horizontal e sem erros no console.
- Cookies com escolha clara e explicação em linguagem simples.

## Nota

| Critério | R1 | R2 |
|---|---|---|
| Navegação no PC | 8,5 | 8,5 |
| Navegação no celular | 4,5 | 8,0 |
| Clareza / conteúdo | 7,0 | 7,5 |
| Encontrar produto ou serviço | 7,5 | 7,5 (busca rígida, motor sem resposta) |
| Qualidade visual | 8,0 | 8,0 |
| Formulários / contato | 7,0 | 7,0 (UX-01, UX-02) |
| Confiança (visitante desconfiado) | — | 6,5 (depende de dados da empresa) |
| **Geral** | **7,0** | **7,8 / 10** |

Com UX-01 e UX-02 resolvidos, a nota sobe para **≈ 8,3**. Com UX-03 a UX-06 também, chega a **≈ 8,7**. Com fotos reais, endereço e o WhatsApp liberados pela empresa, **9+**.
