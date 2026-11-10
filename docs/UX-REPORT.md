# UX-REPORT — Site Ceará Náutica

_AGENT 04 (cn-ux-evaluator) · avaliação em 09/11/2026 · site em http://localhost:5173 com API real (3333)_

## Metodologia
- Navegação real com Playwright (Chromium) em **celular 390×844** (isMobile, hasTouch) e **desktop 1440×900**, páginas inteiras e trechos; todas as capturas foram revisadas visualmente.
- Scripts: `apps/web/e2e/ux/shots.mjs`, `slices.mjs`, `journeys.mjs`, `menu.mjs`, `menu2.mjs` (só leitura/navegação; não fazem parte da suíte de testes).
- 4 personas simuladas do início ao fim, contando toques/rolagens. **1 orçamento enviado** (nome "UX-TEST", serviço manutenção) → API respondeu **201**, tela de sucesso exibida.
- Console do navegador: **0 erros** em todas as páginas.
- Capturas principais em `docs/ux-screenshots/` (numeradas 01–19).

## Resumo executivo
O site passa a impressão de **empresa séria e bem cuidada**: identidade visual coerente (grafite + laranja, Barlow Condensed em caixa alta), hierarquia clara, bom ritmo de seções, catálogo com medidas reais vindas do Instagram, fluxo de orçamento muito bom (produto/serviço pré-preenchido, erros claros, confirmação explicando o próximo passo). No desktop, fica acima da média dos sites de estaleiros regionais.

Porém há **um defeito bloqueante no celular**: o **menu mobile está quebrado** (a gaveta fica com 68 px de altura e os links de navegação ficam invisíveis — ver `12-mobile-MENU-QUEBRADO.png`). Como a maioria dos visitantes de Manaus virá do Instagram pelo celular, isso precisa ser corrigido antes de qualquer publicação.

Sobre o **WhatsApp oculto**: a troca está tecnicamente bem feita (nenhum número falso, CTAs levam a /orcamento, /contato ou Instagram), mas o **ícone de balão de conversa** usado no botão flutuante e em "Falar com um vendedor"/"Fale com a equipe" cria a expectativa de um chat/WhatsApp e entrega um formulário. Além disso, o visitante não recebe nenhuma estimativa de **quando e como** será respondido — e é exatamente isso que o WhatsApp oferecia. Sugestões de compensação na seção dedicada abaixo.

As fotos de banco de imagem estão corretamente sinalizadas, mas algumas **contradizem o texto** (ex.: "Lancha cargueira 9 m com 6 poltronas" ilustrada por uma canoa de madeira ao longe + interior de lancha de fibra de luxo; logo da Yamaha visível na foto de motores, marca não confirmada).

**Nota geral: 7,0 / 10** (desktop ≈ 8; celular ≈ 6 por causa do menu — sobe para ≈ 8 com os itens Alta corrigidos).

---

## Avaliação por persona

### Persona 1 — Quer comprar uma lancha
| | Desktop | Celular |
|---|---|---|
| Caminho | Home → "Ver embarcações" → chip "Lanchas" → card → "Solicitar orçamento" | Home → ☰ → Embarcações → chip "Lanchas" → card → "Solicitar orçamento" |
| Cliques/toques até o formulário | **4** (ou 3 pelos "Projetos em destaque", que já mostram as 3 lanchas na 1ª rolagem) | **5** (menu quebrado: na prática o usuário precisa usar o botão "Ver embarcações" do hero) |
| Rolagens | 1 tela até os destaques | ~2 telas até o 1º card de lancha |

- **Navegação/clareza:** boa. O menu chama "Embarcações", a página "Embarcações e produtos", e os destaques já começam pelas lanchas. Breadcrumb na página de produto mostra a categoria.
- **Página do produto:** excelente estrutura (título, resumo, 2 CTAs, tabela de especificações, características, "Sobre este projeto", fonte do Instagram com data, "Veja também"). Passa credibilidade.
- **Problemas:** as fotos não batem com o produto (cargueira de 9 m = canoa de madeira; segunda foto = cockpit de iate de fibra). "Solicitar orçamento" e "Falar com um vendedor" levam **ao mesmo lugar** (`/orcamento?produto=…`) — dois botões, uma ação. Não há nenhuma noção de faixa de preço, prazo de fabricação ou forma de pagamento/financiamento (nem que seja "sob consulta"), que é a 1ª dúvida de quem compra lancha.
- **Orçamento:** o produto aparece pré-selecionado com miniatura ("Produto selecionado — Lancha de alumínio 7 m"), ótimo. Envio e confirmação claros.

### Persona 2 — Procura uma canoa
- **Desktop:** Home → destaques (a "Canoa de alumínio 7 m" aparece na 2ª linha, 2 rolagens) → card → orçamento: **2–3 cliques**. Ou Embarcações → chip "Canoas": 3 cliques.
- **Celular:** os 6 destaques ficam empilhados um por tela; a categoria "Canoas" na Home só aparece após **~7,5 telas de rolagem** (a Home mobile tem ~14.000 px ≈ 16,6 telas). Pelo hero: "Ver embarcações" → chip "Canoas" (visível sem rolar) → card: 3 toques. A busca "canoa" funciona (2 resultados).
- **Faltam:** usos típicos (pesca, ribeirinho, transporte escolar?), capacidade de pessoas/carga e motor recomendado para cada canoa — itens que o vendedor vai perguntar de qualquer jeito.
- **Visual:** a foto de canoas é de canoas canadenses de lazer em lago — destoa de "canoa de alumínio da Amazônia", mas está sinalizada como ilustrativa.

### Persona 3 — Procura motor de popa
- **Caminho:** Home → card "Motores de popa" (categoria) ou Serviços → "Consultar motores" → orçamento. **3 cliques** desktop / **3–4 toques** celular.
- **Experiência fraca:** a categoria tem **1 único card genérico** chamado "Motores de popa", cuja página diz "Marcas: sob consulta / Potências: sob consulta". O visitante não descobre nada que já não soubesse — nem faixas de potência (15, 40, 60, 90 HP…), nem se há motores a pronta entrega, nem se fazem instalação/revisão de motor.
- **Texto errado para o contexto:** a página do motor mostra "Sobre este projeto" e "Medidas, layout, motorização, cor e acabamento podem ser ajustados ao seu uso" — isso é texto de embarcação. A faixa CTA ao final do catálogo de motores diz "Vamos projetar a sua embarcação?".
- **Celular:** com `?categoria=motores-de-popa`, o chip ativo "Motores de popa" fica **fora da tela** (rolagem horizontal não é ajustada) — o usuário não vê qual filtro está ativo. Breadcrumb do catálogo continua "Início > Embarcações" sem a categoria.
- **Busca:** "motor" → 2 resultados ok; "yamaha" → 0 (esperado).
- **Risco:** a foto de motores na página Serviços mostra claramente a marca **Yamaha** — sugere revenda autorizada de marca não confirmada.

### Persona 4 — Precisa de manutenção/reparo
- **Caminho bom:** Home → faixa "03 Reparos e manutenção" (não clicável) → seção escura "Do projeto à manutenção" → item "Manutenção náutica" → /servicos#manutencao → "Agendar manutenção" → formulário com a mensagem **pré-preenchida** ("Tenho interesse no serviço: Manutenção náutica."). **3 cliques** desktop, **4 toques** celular.
- **Pelo catálogo/busca falha:** buscar "reparo" ou "manutenção" em Embarcações → 0 resultados; o estado vazio oferece "Solicitar orçamento", mas não aponta para /servicos.
- **Faltam informações-chave:** que tipos de reparo (solda de alumínio? casco furado? pintura? elétrica? motor?), se atende só alumínio ou também madeira/fibra, se busca a embarcação, onde deixar o barco (sem endereço — compreensível), prazo médio de avaliação. O formulário não tem campo "tipo de solicitação" (Nova embarcação / Reparo / Manutenção / Motor / Estofamento) — o serviço só entra como texto livre na mensagem e o campo "Categoria" oferece apenas categorias de produto.
- **Visual:** 2 das 5 fotos de Serviços são de solda (fabricação e manutenção) — repetitivo; a de manutenção não mostra barco.
- **"Agendar manutenção"** promete agendamento, mas leva a um pedido de orçamento. Melhor "Solicitar manutenção".

---

## Ausência do WhatsApp — está claro e fluido?
**O que funciona:** nenhum número inventado; o Contato explica "Mande sua mensagem pelo formulário ou pelo Instagram" e "Para visitar, combine com a equipe"; o formulário de orçamento tem o card "Prefere conversar antes? → Mensagem no Instagram"; o campo se chama "Telefone / WhatsApp" (o cliente informa o dele); a confirmação diz que um vendedor ligará no telefone informado.

**O que confunde:**
1. O **botão flutuante laranja com balão de conversa** (padrão universal de WhatsApp/chat) leva a `/orcamento`. Quem toca espera conversar e cai num formulário de 8 campos.
2. "Falar com um vendedor" (produto) e "Fale com a equipe" (CTA band, rodapé, menu) usam o mesmo ícone de balão e levam a formulários.
3. Não há expectativa de **tempo de resposta** nem de **canal** do retorno (ligação? WhatsApp?).

**Como compensar (sugestões concretas):**
- Trocar o ícone do flutuante por um de documento/prancheta + rótulo visível ("Orçamento") ou transformá-lo numa **barra fixa inferior no celular** com dois botões: "Pedir orçamento" e "Instagram" (ícone do Instagram). Arquivo: `apps/web/src/components/layout/FloatingContact.tsx`.
- Nos CTAs de fallback, usar `icon={false}` ou ícone `Send`/`FileText`, e rótulos honestos: "Enviar mensagem" (→ /contato) em vez de "Fale com a equipe". Arquivos: `components/ui/WhatsAppCta.tsx` (default do fallback), `CtaBand.tsx`, `Footer.tsx`, `Header.tsx`.
- No produto, substituir o segundo botão (duplicado) por **"Perguntar no Instagram"** (abre o direct) — dá ao visitante uma alternativa realmente conversacional. Arquivo: `pages/ProductDetail.tsx` (linhas ~136–143).
- Adicionar, perto do botão de envio e na confirmação, uma linha de expectativa: "Retornamos pelo telefone informado (ligação ou WhatsApp)" — e, quando a empresa confirmar, o prazo ("em até 1 dia útil"). Arquivos: `components/forms/QuoteForm.tsx`, `ContactForm.tsx`.
- Incluir no formulário a preferência de retorno: rádio "Prefiro: ligação / mensagem no WhatsApp" — mantém o cliente no canal que ele quer sem expor o número da empresa (exige campo opcional no `quoteSchema` em `packages/shared`).
- Mostrar o Instagram com mais força como prova social: grade "Veja nossos projetos no Instagram" com link (mesmo sem embed) na Home.

---

## Problemas priorizados

### Alta
| # | Problema | Evidência | Sugestão concreta | Arquivo provável |
|---|---|---|---|---|
| A1 | **Menu mobile quebrado.** O `<header>` tem `backdrop-blur-sm` (backdrop-filter), que cria um *containing block* para elementos `fixed`; a gaveta `fixed inset-0` fica presa à altura do header (**68 px**). Os links Início/Embarcações/Serviços/Sobre/Contato ficam invisíveis (nav com 32 px e overflow), os botões transbordam sobre o conteúdo e o overlay escuro não cobre a tela. | `12-mobile-MENU-QUEBRADO.png`; medição: painel `height: 68`, `backdropFilter: blur(8px)` | Renderizar a gaveta fora do `<header>` via `createPortal(…, document.body)` (ou remover o `backdrop-blur` do header). Acrescentar teste e2e mobile que verifique `#menu-mobile` com altura ≈ viewport e links visíveis. | `apps/web/src/components/layout/Header.tsx` (bloco "Drawer mobile", ~l. 81–170) |
| A2 | **Botão flutuante e CTAs com ícone de chat levam a formulário** (expectativa de WhatsApp frustrada). | `11-mobile-home-hero.png`, `14-mobile-detalhe-lancha.png` | Ver "Como compensar": ícone/rótulo de orçamento ou barra inferior "Orçamento + Instagram"; fallback sem ícone de balão. | `components/layout/FloatingContact.tsx`, `components/ui/WhatsAppCta.tsx` |
| A3 | **Nenhuma expectativa de retorno** (quando/como) após trocar o WhatsApp por formulário. | `08-desktop-orcamento.png`, `17-mobile-orcamento-sucesso.png` | Linha "Retornamos pelo telefone informado (ligação ou WhatsApp)" junto ao botão e na confirmação; prazo quando a empresa confirmar; opção de canal preferido. | `components/forms/QuoteForm.tsx`, `ContactForm.tsx`, `pages/Quote.tsx` (STEPS) |
| A4 | **Fotos que contradizem o produto** — "Lancha cargueira 9 m / 6 poltronas" com canoa de madeira ao longe + cockpit de iate; "Lancha 10 m" com lancha de fibra em lago nórdico; **logo Yamaha** visível na foto de motores (marca não confirmada). A nota "ilustrativa" não neutraliza a contradição para quem compra. | `06-desktop-detalhe-lancha.png`, `07-desktop-servicos-manutencao-motores.png` | Até chegarem as fotos reais: preferir fotos neutras e coerentes (casco de alumínio, rio amazônico) e **remover a foto com marca Yamaha**; nos produtos com foto incoerente, usar 1 foto só. Prioridade máxima: pedir à empresa as fotos do Instagram. | `packages/shared/src/catalog.ts` (images), `apps/web/src/data/content.ts`, `apps/web/public/images` |

### Média
| # | Problema | Sugestão concreta | Arquivo provável |
|---|---|---|---|
| M1 | **Motores de popa sem conteúdo útil** (1 card genérico, "sob consulta" em tudo) e textos de embarcação na página do motor ("Sobre este projeto", "Medidas, layout…"); CTA band "Vamos projetar a sua embarcação?" no catálogo de motores. | Textos condicionais por categoria em ProductDetail ("Sobre o produto" e frase de ajuste só para embarcações); CtaBand com props de título/texto por contexto; quando a empresa confirmar, listar faixas de potência/marcas; mencionar instalação/revisão se oferecida. | `pages/ProductDetail.tsx` (~l. 175–186), `components/layout/CtaBand.tsx`, `pages/Products.tsx` |
| M2 | **Formulário sem "tipo de solicitação"**: manutenção/reparo entra só como texto; "Categoria" só tem produtos. Dificulta triagem e relatórios de lead. | Campo opcional "O que você precisa?" (Nova embarcação · Reparo · Manutenção · Motor de popa · Estofamento), pré-selecionado por `?servico=`/`?categoria=`. Requer ajuste do `quoteSchema`. | `components/forms/QuoteForm.tsx`, `pages/Quote.tsx`, `packages/shared/src/schemas.ts` (orquestrador), API |
| M3 | **CTAs duplicados no produto** ("Solicitar orçamento" e "Falar com um vendedor" → mesma URL). | Segundo botão vira "Perguntar no Instagram" ou é removido enquanto não houver WhatsApp. | `pages/ProductDetail.tsx` (~l. 130–143) |
| M4 | **Home mobile muito longa** (~16,6 telas); categorias só após ~7,5 telas, depois dos 6 destaques empilhados. | No celular: mover "Encontre a sua embarcação" para logo após o hero, em chips/carrossel horizontal; reduzir destaques a 3 ou carrossel com scroll-snap. | `pages/Home.tsx` (ordem das seções, l. ~146–220) |
| M5 | **Cookie banner cobre ~45% da 1ª tela no celular**, escondendo os CTAs do hero. | Versão compacta no mobile (texto de 1–2 linhas, botões "Recusar" e "Aceitar" lado a lado, "Preferências" como link). | `components/consent/CookieBanner.tsx` |
| M6 | **Chip de categoria ativo fora da tela no celular** (ex.: Motores de popa) e breadcrumb do catálogo sem a categoria. | `scrollIntoView({inline:'center'})` no chip ativo ao montar; breadcrumb "Início > Embarcações > Motores de popa" quando filtrado; indicar rolagem (fade na borda). | `pages/Products.tsx` |
| M7 | **Faltam informações de decisão**: prazo de fabricação, formas de pagamento/financiamento, garantia, capacidade (pessoas/carga) em canoas/botes, tipos de reparo atendidos (alumínio? fibra? solda? pintura?). | Seção "Perguntas frequentes" (Home/Serviços/Produto) com respostas "sob consulta" onde não houver dado confirmado; checklist de reparos detalhado após confirmação com a empresa. | `data/content.ts`, `pages/Services.tsx`, `pages/ProductDetail.tsx` |
| M8 | **Botão flutuante sobrepõe conteúdo** no celular (texto do resumo do produto, faixa "Fabricação sob medida" no hero, imagens dos cards). | Adicionar `padding-bottom` ao `main` no mobile ou trocar por barra inferior fixa (ver A2); esconder o flutuante quando os CTAs do hero/produto estiverem visíveis. | `components/layout/FloatingContact.tsx`, `components/layout/Layout.tsx` |

### Baixa
| # | Problema | Sugestão | Arquivo provável |
|---|---|---|---|
| B1 | Busca por "reparo"/"manutenção" no catálogo → estado vazio sem caminho para Serviços. | No estado vazio, link "Procura reparo ou manutenção? Veja nossos serviços". | `pages/Products.tsx` (empty-state) |
| B2 | "Agendar manutenção" promete agenda; leva a orçamento. | "Solicitar manutenção". | `data/content.ts` (l. 56) |
| B3 | Header no desktop fica translúcido ao rolar e o texto da seção aparece "fantasma" atrás do menu. | Aumentar opacidade (`bg-white/95` também com backdrop) ou fundo sólido. | `components/layout/Header.tsx` (l. 33) |
| B4 | Fotos repetidas (mesma imagem em destaque, categoria e galeria; duas fotos de solda em Serviços). | Variar imagens; trocar foto de manutenção por casco/oficina. | `data/content.ts`, `lib/images.ts` |
| B5 | Faixa do hero "01 Embarcações… 04 Motores de popa" parece clicável mas não é. | Tornar cada item link para a seção/categoria correspondente. | `pages/Home.tsx` |
| B6 | Números "01…05" grandes em Serviços cortados na borda superior da foto. | Posicionar com margem interna ou fora da imagem. | `pages/Services.tsx` |
| B7 | Hero da Home sem nenhuma embarcação (pôr do sol genérico) e headline genérica ("Seu próximo destino começa aqui") — é o trecho com mais "cara de template". | Headline concreta ("Embarcações em alumínio feitas sob medida em Manaus") e foto com barco de alumínio assim que houver foto real. | `pages/Home.tsx`, `data/content.ts` |
| B8 | Nome do produto "Motores de Popa" com maiúscula inconsistente no breadcrumb. | "Motores de popa". | `packages/shared/src/catalog.ts` |

---

## Qualidade visual — parece empresa consolidada?
- **Sim, no geral.** Paleta disciplinada (laranja só para ação), tipografia condensada forte e consistente, espaçamentos generosos, cantos discretos, cards e tabelas limpos, rodapé completo. Não parece template genérico — exceto o hero (B7) e a galeria "A vida no rio", que é bonita mas é puro banco de imagens.
- **Consistência:** botões, eyebrows com traço laranja e cabeçalhos de página escuros se repetem em todas as páginas — boa sensação de sistema.
- **O que mais tira credibilidade hoje:** fotos que não batem com o texto (A4) e a ausência de qualquer canal "imediato" (A2/A3). Ambos se resolvem com conteúdo real da empresa.

## Pontos fortes
- Fluxo de orçamento exemplar: pré-seleção de produto com miniatura, mensagem pré-preenchida por serviço, validação inline em português, consentimento LGPD, confirmação explicando o próximo passo; envio real funcionando (201).
- Página de produto com especificações reais e **fonte com data do Instagram** — transparência que gera confiança.
- Honestidade de dados: nada inventado; "a confirmar" tratado com elegância no Contato ("Para visitar, combine com a equipe").
- Seção "O que fazemos, sem rodeios" — diferencial de tom, sem números de vitrine.
- Desktop: navegação clara, CTA "Solicitar orçamento" sempre visível no header.
- Acessibilidade: alvos de toque grandes, foco/labels, `prefers-reduced-motion` respeitado; 0 erros de console.

## Nota
| Critério | Nota |
|---|---|
| Navegação desktop | 8,5 |
| Navegação celular | 4,5 (menu quebrado) |
| Clareza / conteúdo | 7 |
| Encontrar produto | 7,5 (motores 5) |
| Qualidade visual | 8 |
| Contato / orçamento | 7 |
| **Geral** | **7,0 / 10** |

Com A1–A4 corrigidos, a expectativa é **8,0–8,5**; com fotos reais e o WhatsApp liberado, **9**.
