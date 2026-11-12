import { afterEach, describe, expect, it, vi, beforeEach } from 'vitest';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DEMO_PRODUCTS } from '@cn/shared';
import { ContactForm } from './ContactForm';
import { QuoteForm } from './QuoteForm';
import Quote from '@/pages/Quote';
import { SLOW_NOTICE_MS, VERY_SLOW_NOTICE_MS } from './useLeadSubmit';
import { jsonResponse, renderAt } from '@/test/utils';

/** Só os POST (o formulário também faz GET /api/health para acordar a API). */
const postCalls = () => vi.mocked(fetch).mock.calls.filter((c) => c[1]?.method === 'POST');

async function fillContact(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/^nome/i), 'Maria Silva');
  await user.type(screen.getByLabelText(/telefone/i), '(92) 99999-0000');
  await user.type(screen.getByLabelText(/assunto/i), 'Informações');
  await user.type(screen.getByLabelText(/mensagem/i), 'Gostaria de saber mais sobre lanchas.');
  await user.click(screen.getByRole('checkbox', { name: /autorizo/i }));
}

describe('Formulário de contato', () => {
  beforeEach(() => {
    vi.spyOn(globalThis, 'fetch');
  });

  it('valida no cliente com o contactSchema e não envia dados inválidos', async () => {
    const user = userEvent.setup();
    renderAt(<ContactForm />);
    await user.click(screen.getByRole('button', { name: /enviar mensagem/i }));
    expect(await screen.findByText('Informe seu nome.')).toBeInTheDocument();
    expect(screen.getByText(/Telefone inválido|Informe seu telefone/)).toBeInTheDocument();
    expect(screen.getByText('É necessário autorizar o contato para enviar.')).toBeInTheDocument();
    expect(screen.getByLabelText(/^nome/i)).toHaveAttribute('aria-invalid', 'true');
    expect(postCalls()).toHaveLength(0);
  });

  it('rejeita telefone e e-mail inválidos', async () => {
    const user = userEvent.setup();
    renderAt(<ContactForm />);
    await user.type(screen.getByLabelText(/telefone/i), '123');
    await user.type(screen.getByLabelText(/e-mail/i), 'nao-e-email');
    await user.click(screen.getByRole('button', { name: /enviar mensagem/i }));
    expect(await screen.findByText(/Número incompleto/)).toBeInTheDocument();
    expect(screen.getByText(/^E-mail inválido\./)).toBeInTheDocument();
  });

  it('faz POST real em /api/contact com UTM e mostra sucesso', async () => {
    sessionStorage.setItem(
      'cn_utm',
      JSON.stringify({ utm_source: 'instagram', landing_page: '/' }),
    );
    vi.mocked(fetch).mockImplementation(async () => jsonResponse({ ok: true, id: 'abc' }, 201));
    const user = userEvent.setup();
    renderAt(<ContactForm />);
    await fillContact(user);
    await user.click(screen.getByRole('button', { name: /enviar mensagem/i }));
    expect(await screen.findByRole('heading', { name: /mensagem enviada/i })).toBeInTheDocument();
    const [url, init] = postCalls()[0]!;
    expect(url).toBe('/api/contact');
    expect(init?.method).toBe('POST');
    const body = JSON.parse(String(init?.body));
    expect(body).toMatchObject({
      name: 'Maria Silva',
      consent: true,
      utm: { utm_source: 'instagram', landing_page: '/' },
    });
  });

  it('exibe as mensagens de `details` vindas do back (400)', async () => {
    vi.mocked(fetch).mockImplementation(async () =>
      jsonResponse(
        { error: 'Dados inválidos', details: { phone: ['Telefone recusado pelo servidor.'] } },
        400,
      ),
    );
    const user = userEvent.setup();
    renderAt(<ContactForm />);
    await fillContact(user);
    await user.click(screen.getByRole('button', { name: /enviar mensagem/i }));
    expect(await screen.findByText('Telefone recusado pelo servidor.')).toBeInTheDocument();
    expect(screen.getByText(/Revise os campos destacados/)).toBeInTheDocument();
  });

  it('mostra erro amigável quando o servidor está fora do ar', async () => {
    vi.mocked(fetch).mockRejectedValue(new TypeError('Failed to fetch'));
    const user = userEvent.setup();
    renderAt(<ContactForm />);
    await fillContact(user);
    await user.click(screen.getByRole('button', { name: /enviar mensagem/i }));
    expect(await screen.findByText(/Não foi possível conectar ao servidor/)).toBeInTheDocument();
  });
});

describe('Formulário de orçamento', () => {
  it('pré-seleciona o tipo de solicitação (?servico=) e envia requestType', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
      jsonResponse({ ok: true, id: 'q2' }, 201),
    );
    const user = userEvent.setup();
    renderAt(<QuoteForm products={DEMO_PRODUCTS} initialRequestType="manutencao" />);
    expect(screen.getByLabelText(/tipo de solicitação/i)).toHaveValue('manutencao');
    expect(screen.getByTestId('response-note')).toHaveTextContent(
      'Retornamos pelo telefone informado (ligação ou WhatsApp).',
    );
    await user.type(screen.getByLabelText(/^nome/i), 'Ana');
    await user.type(screen.getByLabelText(/telefone/i), '92999990000');
    await user.type(
      screen.getByLabelText(/conte o que você precisa/i),
      'Manutenção do casco de alumínio.',
    );
    await user.click(screen.getByRole('checkbox', { name: /autorizo/i }));
    await user.click(screen.getByRole('button', { name: /solicitar orçamento/i }));
    await waitFor(() => expect(postCalls()).toHaveLength(1));
    const body = JSON.parse(String(postCalls()[0]![1]?.body));
    expect(body.requestType).toBe('manutencao');
    expect(body).not.toHaveProperty('category');
    // UX-19: repete o telefone informado (formatado) e explica o próximo passo
    expect(await screen.findByTestId('success-phone')).toHaveTextContent(
      'Vamos retornar no (92) 99999-0000, por ligação ou WhatsApp.',
    );
    expect(screen.getByTestId('next-steps')).toHaveTextContent(/informados no orçamento/);
  });

  it('pré-seleciona o produto (?produto=slug) e envia productSlug/category', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
      jsonResponse({ ok: true, id: 'q1' }, 201),
    );
    const product = DEMO_PRODUCTS.find((p) => p.slug === 'canoa-aluminio-7m')!;
    const user = userEvent.setup();
    renderAt(<QuoteForm products={DEMO_PRODUCTS} initialProductSlug={product.slug} />);
    expect(screen.getByText(product.name, { selector: 'p' })).toBeInTheDocument();
    expect(screen.getByLabelText(/categoria/i)).toHaveValue('canoas');

    await user.type(screen.getByLabelText(/^nome/i), 'João');
    await user.type(screen.getByLabelText(/telefone/i), '92999990000');
    await user.type(
      screen.getByLabelText(/conte o que você precisa/i),
      'Quero uma canoa para pesca.',
    );
    await user.click(screen.getByRole('checkbox', { name: /autorizo/i }));
    await user.click(screen.getByRole('button', { name: /solicitar orçamento/i }));

    await waitFor(() => expect(postCalls()).toHaveLength(1));
    const [url, init] = postCalls()[0]!;
    expect(url).toBe('/api/quotes');
    expect(JSON.parse(String(init?.body))).toMatchObject({
      productSlug: 'canoa-aluminio-7m',
      category: 'canoas',
      requestType: 'nova-embarcacao',
      consent: true,
    });
    expect(
      await screen.findByRole('heading', { name: /pedido de orçamento enviado/i }),
    ).toBeInTheDocument();
  });

  it('não envia sem mensagem mínima', async () => {
    vi.spyOn(globalThis, 'fetch');
    const user = userEvent.setup();
    renderAt(<QuoteForm products={DEMO_PRODUCTS} />);
    await user.type(screen.getByLabelText(/conte o que você precisa/i), 'curta');
    await user.click(screen.getByRole('button', { name: /solicitar orçamento/i }));
    expect(await screen.findByText(/mín\. 10 caracteres/)).toBeInTheDocument();
    expect(postCalls()).toHaveLength(0);
  });

  it('[QA-02] trocar a categoria atualiza o tipo sugerido automaticamente', async () => {
    const user = userEvent.setup();
    renderAt(<QuoteForm products={DEMO_PRODUCTS} />);
    const type = screen.getByLabelText(/tipo de solicitação/i);
    const category = screen.getByLabelText(/^categoria/i);
    await user.selectOptions(category, 'lanchas');
    expect(type).toHaveValue('nova-embarcacao');
    await user.selectOptions(category, 'motores-de-popa');
    expect(type).toHaveValue('motor');
    await user.selectOptions(category, 'estofamentos');
    expect(type).toHaveValue('estofamento');
  });

  it('[QA-02] tipo escolhido manualmente não é sobrescrito pela categoria', async () => {
    const user = userEvent.setup();
    renderAt(<QuoteForm products={DEMO_PRODUCTS} />);
    const type = screen.getByLabelText(/tipo de solicitação/i);
    await user.selectOptions(type, 'outro');
    await user.selectOptions(screen.getByLabelText(/^categoria/i), 'motores-de-popa');
    expect(type).toHaveValue('outro');
  });

  it('[QA-02] tipo vindo do serviço (?servico=) não é sobrescrito', async () => {
    const user = userEvent.setup();
    renderAt(<QuoteForm products={DEMO_PRODUCTS} initialRequestType="motor" />);
    await user.selectOptions(screen.getByLabelText(/^categoria/i), 'lanchas');
    expect(screen.getByLabelText(/tipo de solicitação/i)).toHaveValue('motor');
  });

  it('escolher um modelo preenche a categoria dele', async () => {
    const user = userEvent.setup();
    renderAt(<QuoteForm products={DEMO_PRODUCTS} />);
    await user.selectOptions(screen.getByLabelText(/modelo de referência/i), 'motores-de-popa');
    expect(screen.getByLabelText(/^categoria/i)).toHaveValue('motores-de-popa');
    expect(screen.getByLabelText(/tipo de solicitação/i)).toHaveValue('motor');
  });

  it('[UX-10] com ?produto= não repete Categoria/Modelo; "Trocar" volta a mostrá-los', async () => {
    const user = userEvent.setup();
    renderAt(<QuoteForm products={DEMO_PRODUCTS} initialProductSlug="lancha-aluminio-7m" />);
    const card = screen.getByTestId('selected-product');
    expect(card).toHaveTextContent('Lancha de Alumínio 7 m');
    expect(card).toHaveTextContent('Lanchas');
    // campos derivados ocultos, mas com o valor que será enviado
    expect(screen.getByTestId('product-fields')).not.toBeVisible();
    expect(screen.queryByRole('combobox', { name: /^categoria/i })).toBeNull();
    expect(screen.queryByRole('combobox', { name: /modelo de referência/i })).toBeNull();
    expect(screen.getByLabelText(/^categoria/i)).toHaveValue('lanchas');
    expect(screen.getByLabelText(/modelo de referência/i)).toHaveValue('lancha-aluminio-7m');

    await user.click(screen.getByRole('button', { name: /remover produto selecionado/i }));
    expect(screen.queryByTestId('selected-product')).toBeNull();
    expect(screen.getByRole('combobox', { name: /^categoria/i })).toHaveValue('lanchas');
    expect(screen.getByRole('combobox', { name: /modelo de referência/i })).toHaveValue('');
  });

  it('[UX-19] "Corrigir o telefone" volta ao formulário com os dados e o foco no telefone', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
      jsonResponse({ ok: true, id: 'q3' }, 201),
    );
    const user = userEvent.setup();
    renderAt(<QuoteForm products={DEMO_PRODUCTS} />);
    await user.type(screen.getByLabelText(/^nome/i), 'Rita');
    await user.type(screen.getByLabelText(/telefone/i), '92 9 8888 7777');
    await user.type(screen.getByLabelText(/conte o que você precisa/i), 'Quero uma lancha.');
    await user.click(screen.getByRole('checkbox', { name: /autorizo/i }));
    await user.click(screen.getByRole('button', { name: /solicitar orçamento/i }));
    expect(await screen.findByTestId('success-phone')).toHaveTextContent('(92) 98888-7777');
    await user.click(screen.getByRole('button', { name: /corrigir o telefone/i }));
    const phone = await screen.findByLabelText(/telefone/i);
    await waitFor(() => expect(phone).toHaveFocus());
    expect(phone).toHaveValue('92 9 8888 7777');
    expect(screen.getByLabelText(/^nome/i)).toHaveValue('Rita');
  });
  it('[UX-21] sucesso: "Número errado?" e o botão "Corrigir o telefone", sem frase partida', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
      jsonResponse({ ok: true, id: 'q4' }, 201),
    );
    const user = userEvent.setup();
    renderAt(<QuoteForm products={DEMO_PRODUCTS} />);
    await user.type(screen.getByLabelText(/^nome/i), 'Rita');
    await user.type(screen.getByLabelText(/telefone/i), '92988887777');
    await user.type(screen.getByLabelText(/conte o que você precisa/i), 'Quero uma lancha.');
    await user.click(screen.getByRole('checkbox', { name: /autorizo/i }));
    await user.click(screen.getByRole('button', { name: /solicitar orçamento/i }));
    const fix = await screen.findByTestId('phone-fix');
    expect(fix).toHaveTextContent(/^Número errado\?\s*Corrigir o telefone$/);
    expect(screen.queryByText(/envie de novo/i)).toBeNull();
  });

  it('[UX-24] tipo de serviço esconde Categoria e Modelo; compra mostra', async () => {
    const user = userEvent.setup();
    renderAt(<QuoteForm products={DEMO_PRODUCTS} />);
    const type = screen.getByLabelText(/tipo de solicitação/i);
    const fields = screen.getByTestId('product-fields');
    expect(fields).toBeVisible();
    for (const t of ['reparo', 'manutencao', 'motor-revisao', 'estofamento']) {
      await user.selectOptions(type, t);
      expect(fields).not.toBeVisible();
      expect(screen.queryByRole('combobox', { name: /^categoria/i })).toBeNull();
      expect(screen.queryByRole('combobox', { name: /modelo de referência/i })).toBeNull();
    }
    for (const t of ['nova-embarcacao', 'motor', 'outro', '']) {
      await user.selectOptions(type, t);
      expect(fields).toBeVisible();
    }
  });

  it('[UX-24] categoria que sugere "Estofamento" não some com o próprio campo', async () => {
    const user = userEvent.setup();
    renderAt(<QuoteForm products={DEMO_PRODUCTS} />);
    await user.selectOptions(screen.getByLabelText(/^categoria/i), 'estofamentos');
    expect(screen.getByLabelText(/tipo de solicitação/i)).toHaveValue('estofamento');
    expect(screen.getByRole('combobox', { name: /^categoria/i })).toBeVisible();
  });

  it('[UX-24] pedido de serviço envia dados válidos sem o modelo oculto', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
      jsonResponse({ ok: true, id: 'q5' }, 201),
    );
    const user = userEvent.setup();
    renderAt(<QuoteForm products={DEMO_PRODUCTS} />);
    // escolheu um modelo e depois mudou para conserto
    await user.selectOptions(screen.getByLabelText(/modelo de referência/i), 'lancha-aluminio-7m');
    await user.selectOptions(screen.getByLabelText(/tipo de solicitação/i), 'reparo');
    await user.type(screen.getByLabelText(/^nome/i), 'Caio');
    await user.type(screen.getByLabelText(/telefone/i), '92988887777');
    await user.type(screen.getByLabelText(/conte o que você precisa/i), 'Casco amassado na proa.');
    await user.click(screen.getByRole('checkbox', { name: /autorizo/i }));
    await user.click(screen.getByRole('button', { name: /solicitar orçamento/i }));
    await waitFor(() => expect(postCalls()).toHaveLength(1));
    const body = JSON.parse(String(postCalls()[0]![1]?.body));
    expect(body).toMatchObject({ requestType: 'reparo', category: 'lanchas' });
    expect(body).not.toHaveProperty('productSlug');
  });

  it('[UX-24] grade de contato sem buraco: Nome, Telefone, E-mail e Cidade juntos', () => {
    renderAt(<QuoteForm products={DEMO_PRODUCTS} />);
    const grid = screen.getByLabelText(/^cidade/i).closest('.grid')!;
    expect(grid.querySelectorAll('input, select, textarea')).toHaveLength(4);
    expect(grid).not.toContainElement(screen.getByLabelText(/tipo de solicitação/i));
  });
});

describe('Página /orcamento?servico=motor-revisao (UX-22)', () => {
  beforeEach(() => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));
  });

  it('abre com "Problema ou revisão no motor", roteiro como exemplo e sem Categoria/Modelo', async () => {
    renderAt(<Quote />, { route: '/orcamento?servico=motor-revisao' });
    const type = await screen.findByLabelText<HTMLSelectElement>(/tipo de solicitação/i);
    expect(type).toHaveValue('motor-revisao');
    expect(type.selectedOptions[0]!.textContent).toBe('Problema ou revisão no motor');
    // UX-28: o roteiro é texto de exemplo (placeholder), não conteúdo do campo
    const msg = screen.getByLabelText(/conte o que você precisa/i);
    expect(msg).toHaveValue('');
    expect(msg).toHaveAttribute(
      'placeholder',
      'Modelo/potência do motor e o que está acontecendo…',
    );
    expect(screen.getByTestId('product-fields')).not.toBeVisible();
    expect(
      screen.getByText(
        /marca, modelo e potência do motor, o que está acontecendo e desde quando. A equipe/i,
      ),
    ).toBeInTheDocument();
  });

  it('envia requestType motor-revisao e a categoria de motores', async () => {
    vi.mocked(fetch).mockImplementation(async (input) => {
      if (String(input).includes('/api/quotes')) return jsonResponse({ ok: true, id: 'q6' }, 201);
      throw new TypeError('Failed to fetch');
    });
    const user = userEvent.setup();
    renderAt(<Quote />, { route: '/orcamento?servico=motor-revisao' });
    const msg = await screen.findByLabelText(/conte o que você precisa/i);
    await user.type(msg, 'Yamaha 40 hp, falha ao acelerar.');
    await user.type(screen.getByLabelText(/^nome/i), 'Carlos');
    await user.type(screen.getByLabelText(/telefone/i), '92988887777');
    await user.click(screen.getByRole('checkbox', { name: /autorizo/i }));
    await user.click(screen.getByRole('button', { name: /solicitar orçamento/i }));
    await screen.findByRole('heading', { name: /pedido de orçamento enviado/i });
    const call = vi.mocked(fetch).mock.calls.find((c) => String(c[0]).includes('/api/quotes'))!;
    const body = JSON.parse(String(call[1]?.body));
    expect(body).toMatchObject({
      requestType: 'motor-revisao',
      category: 'motores-de-popa',
      message: 'Yamaha 40 hp, falha ao acelerar.',
    });
    expect(body).not.toHaveProperty('productSlug');
  });

  it('?servico= desconhecido ou herdado ("constructor") não pré-preenche nada', async () => {
    renderAt(<Quote />, { route: '/orcamento?servico=constructor' });
    expect(await screen.findByLabelText(/tipo de solicitação/i)).toHaveValue('');
    expect(screen.getByLabelText(/conte o que você precisa/i)).toHaveValue('');
  });

  it('?servico=motores continua sendo compra de motor', async () => {
    renderAt(<Quote />, { route: '/orcamento?servico=motores&categoria=motores-de-popa' });
    expect(await screen.findByLabelText(/tipo de solicitação/i)).toHaveValue('motor');
    expect(screen.getByTestId('product-fields')).toBeVisible();
  });
});

describe('[UX-28] pedido de serviço exige descrição escrita pela pessoa', () => {
  beforeEach(() => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));
  });

  async function submitWith(route: string, message?: string) {
    const user = userEvent.setup();
    renderAt(<Quote />, { route });
    const msg = await screen.findByLabelText(/conte o que você precisa/i);
    if (message) await user.type(msg, message);
    await user.type(screen.getByLabelText(/^nome/i), 'Carlos');
    await user.type(screen.getByLabelText(/telefone/i), '92988887777');
    await user.click(screen.getByRole('checkbox', { name: /autorizo/i }));
    await user.click(screen.getByRole('button', { name: /solicitar orçamento/i }));
    return msg;
  }
  const quotePosts = () =>
    vi.mocked(fetch).mock.calls.filter((c) => String(c[0]).includes('/api/quotes'));

  it('motor: enviar sem escrever nada mostra "Conte o que está acontecendo com o motor." e não envia', async () => {
    const msg = await submitWith('/orcamento?servico=motor-revisao');
    expect(await screen.findByText('Conte o que está acontecendo com o motor.')).toBeVisible();
    expect(msg).toHaveAttribute('aria-invalid', 'true');
    expect(msg).toHaveFocus();
    expect(quotePosts()).toHaveLength(0);
  });

  it('motor: texto curto pede mais detalhes', async () => {
    await submitWith('/orcamento?servico=motor-revisao', 'falha');
    expect(
      await screen.findByText(
        'Conte o que está acontecendo com o motor. Escreva pelo menos 10 caracteres.',
      ),
    ).toBeVisible();
    expect(quotePosts()).toHaveLength(0);
  });

  it.each([
    ['reparos', 'Conte o que aconteceu com a embarcação.'],
    ['manutencao', 'Conte o que precisa ser feito na embarcação.'],
    ['estofamento', 'Conte o que precisa no estofamento.'],
  ])('?servico=%s abre com a mensagem vazia e pede a descrição', async (servico, error) => {
    const msg = await submitWith(`/orcamento?servico=${servico}`);
    expect(msg).toHaveValue('');
    expect(msg.getAttribute('placeholder')).toBeTruthy();
    expect(await screen.findByText(error)).toBeVisible();
    expect(quotePosts()).toHaveLength(0);
  });

  it('sem tipo de serviço, mantém a mensagem genérica do schema', async () => {
    await submitWith('/orcamento');
    expect(
      await screen.findByText('Descreva o que você precisa (mín. 10 caracteres).'),
    ).toBeVisible();
  });
});

describe('[UX-30] topo e "Como funciona" conforme o tipo de pedido', () => {
  beforeEach(() => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));
  });
  const h1 = () => screen.getByRole('heading', { level: 1 });
  const steps = () => screen.getByTestId('quote-steps');

  it('sem tipo: embarcação sob medida (como antes)', async () => {
    renderAt(<Quote />, { route: '/orcamento' });
    await screen.findByLabelText(/tipo de solicitação/i);
    expect(h1()).toHaveTextContent('Solicite seu orçamento');
    expect(screen.getByText(/cada embarcação é feita sob medida/i)).toBeInTheDocument();
    expect(steps()).toHaveTextContent(/tipo de embarcação, uso, tamanho, motorização e cor/i);
  });

  it.each(['reparos', 'manutencao', 'estofamento'])(
    '?servico=%s: textos de serviço, sem "sob medida"',
    async (servico) => {
      renderAt(<Quote />, { route: `/orcamento?servico=${servico}` });
      await screen.findByLabelText(/tipo de solicitação/i);
      expect(h1()).toHaveTextContent('Peça o orçamento do serviço');
      expect(screen.queryByText(/cada embarcação é feita sob medida/i)).not.toBeInTheDocument();
      expect(steps()).toHaveTextContent(/o que precisa ser feito e onde ela está/i);
      expect(steps()).toHaveTextContent(/a equipe confirma se atende o seu caso/i);
      expect(steps()).not.toHaveTextContent(/motorização e cor/i);
    },
  );

  it('?servico=motor-revisao: problema no motor, sem prometer conserto', async () => {
    renderAt(<Quote />, { route: '/orcamento?servico=motor-revisao' });
    await screen.findByLabelText(/tipo de solicitação/i);
    expect(h1()).toHaveTextContent('Problema ou revisão no motor');
    expect(screen.queryByText(/cada embarcação é feita sob medida/i)).not.toBeInTheDocument();
    expect(steps()).toHaveTextContent(/marca, modelo e potência do motor/i);
    expect(steps()).toHaveTextContent(/a equipe confirma se atende o seu caso/i);
  });

  it('?servico=motores: compra de motor', async () => {
    renderAt(<Quote />, { route: '/orcamento?servico=motores&categoria=motores-de-popa' });
    await screen.findByLabelText(/tipo de solicitação/i);
    expect(h1()).toHaveTextContent('Orçamento de motor de popa');
    expect(steps()).toHaveTextContent(/potência que você procura/i);
  });

  it('acompanha o tipo escolhido no formulário', async () => {
    const user = userEvent.setup();
    renderAt(<Quote />, { route: '/orcamento' });
    const type = await screen.findByLabelText(/tipo de solicitação/i);
    await user.selectOptions(type, 'reparo');
    expect(h1()).toHaveTextContent('Peça o orçamento do serviço');
    await user.selectOptions(type, 'motor-revisao');
    expect(h1()).toHaveTextContent('Problema ou revisão no motor');
    await user.selectOptions(type, 'nova-embarcacao');
    expect(h1()).toHaveTextContent('Solicite seu orçamento');
  });
});

describe('Tela de sucesso do contato (UX-19)', () => {
  it('repete o telefone informado', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
      jsonResponse({ ok: true, id: 'c9' }, 201),
    );
    const user = userEvent.setup();
    renderAt(<ContactForm />);
    await fillContact(user);
    await user.click(screen.getByRole('button', { name: /enviar mensagem/i }));
    expect(await screen.findByTestId('success-phone')).toHaveTextContent(
      'Vamos retornar no (92) 99999-0000, por ligação ou WhatsApp.',
    );
  });
});

describe('API acordando (docs/HOSTING.md)', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('acorda a API ao focar o formulário, uma vez só', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => jsonResponse({ status: 'ok' }));
    const user = userEvent.setup();
    renderAt(<ContactForm />);
    await user.click(screen.getByLabelText(/^nome/i));
    await user.click(screen.getByLabelText(/telefone/i));
    await user.click(screen.getByLabelText(/assunto/i));
    const health = vi.mocked(fetch).mock.calls.filter((c) => c[0] === '/api/health');
    expect(health).toHaveLength(1);
  });

  it('envio lento: aviso de "conectando" após alguns segundos, botão travado, depois sucesso', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    let answer!: (r: Response) => void;
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      if (String(input).includes('/api/health')) return jsonResponse({ status: 'ok' });
      return new Promise<Response>((r) => {
        answer = r;
      });
    });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) });
    renderAt(<ContactForm />);
    await fillContact(user);
    await user.click(screen.getByRole('button', { name: /enviar mensagem/i }));

    const button = await screen.findByRole('button', { name: /enviando/i });
    expect(button).toBeDisabled();
    const note = screen.getByTestId('submit-slow');
    expect(note).toHaveTextContent('');

    await act(() => vi.advanceTimersByTimeAsync(SLOW_NOTICE_MS));
    expect(note).toHaveTextContent(/conectando ao servidor/i);
    expect(note).toHaveTextContent(/alguns segundos na primeira vez/i);
    expect(note).toHaveAttribute('role', 'status');
    expect(button).toBeDisabled();

    // segundo clique/Enter durante a espera não gera outro POST
    await user.click(button);
    expect(postCalls()).toHaveLength(1);

    await act(async () => answer(jsonResponse({ ok: true, id: 'lento' }, 201)));
    expect(await screen.findByRole('heading', { name: /mensagem enviada/i })).toBeInTheDocument();
    expect(postCalls()).toHaveLength(1);
  });

  it('se o envio falhar de vez, orienta a tentar de novo e mantém o que foi digitado', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));
    const user = userEvent.setup();
    renderAt(<ContactForm />);
    await fillContact(user);
    await user.click(screen.getByRole('button', { name: /enviar mensagem/i }));
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/tente novamente/i);
    expect(alert).toHaveTextContent(/continua no formulário/i);
    expect(screen.getByTestId('submit-slow')).toHaveTextContent('');
    expect(screen.getByLabelText(/^nome/i)).toHaveValue('Maria Silva');
    expect(screen.getByLabelText(/mensagem/i)).toHaveValue('Gostaria de saber mais sobre lanchas.');
    expect(screen.getByRole('checkbox', { name: /autorizo/i })).toBeChecked();
    expect(screen.getByRole('button', { name: /enviar mensagem/i })).toBeEnabled();
    expect(postCalls()).toHaveLength(1);
  });
});

/** Dispara `beforeunload` e diz se a página pediu confirmação ao navegador. */
function unloadBlocked(): boolean {
  const ev = new Event('beforeunload', { cancelable: true });
  window.dispatchEvent(ev);
  return ev.defaultPrevented;
}

describe('[UX-31] envio interrompido por recarregar/fechar a página', () => {
  it('durante o POST o navegador pede confirmação e há marca de envio; ao terminar, nada disso', async () => {
    let answer!: (r: Response) => void;
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      if (String(input).includes('/api/health')) return jsonResponse({ status: 'ok' });
      return new Promise<Response>((r) => {
        answer = r;
      });
    });
    const user = userEvent.setup();
    renderAt(<ContactForm />);
    expect(unloadBlocked()).toBe(false);
    await fillContact(user);
    await user.click(screen.getByRole('button', { name: /enviar mensagem/i }));
    await screen.findByRole('button', { name: /enviando/i });
    expect(unloadBlocked()).toBe(true);
    expect(sessionStorage.getItem('cn_pending_contact')).toBe('1');

    await act(async () => answer(jsonResponse({ ok: true, id: 'ok' }, 201)));
    await screen.findByRole('heading', { name: /mensagem enviada/i });
    expect(unloadBlocked()).toBe(false);
    expect(sessionStorage.getItem('cn_pending_contact')).toBeNull();
  });

  it('também libera a saída e limpa a marca quando o envio falha (o rascunho fica)', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));
    const user = userEvent.setup();
    renderAt(<ContactForm />);
    await fillContact(user);
    await user.click(screen.getByRole('button', { name: /enviar mensagem/i }));
    await screen.findByRole('alert');
    expect(unloadBlocked()).toBe(false);
    expect(sessionStorage.getItem('cn_pending_contact')).toBeNull();
    expect(sessionStorage.getItem('cn_draft_contact')).toContain('Maria Silva');
  });

  it('guarda o rascunho dos campos de texto, nunca o consentimento nem o anti-spam', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => jsonResponse({ status: 'ok' }));
    const user = userEvent.setup();
    const { container } = renderAt(<ContactForm />);
    await fillContact(user);
    fireEvent.input(container.querySelector('input[name="website"]')!, {
      target: { value: 'robo' },
    });
    const draft = JSON.parse(sessionStorage.getItem('cn_draft_contact') ?? '{}');
    expect(draft).toEqual({
      name: 'Maria Silva',
      phone: '(92) 99999-0000',
      subject: 'Informações',
      message: 'Gostaria de saber mais sobre lanchas.',
    });
    expect(draft).not.toHaveProperty('consent');
    expect(draft).not.toHaveProperty('website');
  });

  it('ao voltar à página restaura o rascunho, com o consentimento desmarcado', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => jsonResponse({ status: 'ok' }));
    sessionStorage.setItem(
      'cn_draft_contact',
      JSON.stringify({
        name: 'Maria Silva',
        message: 'Texto que eu tinha escrito.',
        consent: true,
      }),
    );
    renderAt(<ContactForm />);
    expect(await screen.findByDisplayValue('Maria Silva')).toBeInTheDocument();
    expect(screen.getByLabelText(/mensagem/i)).toHaveValue('Texto que eu tinha escrito.');
    expect(screen.getByRole('checkbox', { name: /autorizo/i })).not.toBeChecked();
    // sem envio pendente: nenhum aviso de envio interrompido
    expect(screen.queryByTestId('submit-interrupted')).not.toBeInTheDocument();
  });

  it('apaga o rascunho após o sucesso; "Enviar outra mensagem" volta vazio', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
      jsonResponse({ ok: true, id: 'x' }, 201),
    );
    const user = userEvent.setup();
    renderAt(<ContactForm />);
    await fillContact(user);
    expect(sessionStorage.getItem('cn_draft_contact')).not.toBeNull();
    await user.click(screen.getByRole('button', { name: /enviar mensagem/i }));
    await screen.findByRole('heading', { name: /mensagem enviada/i });
    expect(sessionStorage.getItem('cn_draft_contact')).toBeNull();
    await user.click(screen.getByRole('button', { name: /enviar outra mensagem/i }));
    expect(screen.getByLabelText(/^nome/i)).toHaveValue('');
    expect(sessionStorage.getItem('cn_draft_contact')).toBeNull();
  });

  it('recarregou durante o envio: avisa, restaura os dados e NÃO reenvia sozinho', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) =>
      String(input).includes('/api/health')
        ? jsonResponse({ status: 'ok' })
        : jsonResponse({ ok: true, id: 'q' }, 201),
    );
    sessionStorage.setItem('cn_pending_quote', '1');
    sessionStorage.setItem(
      'cn_draft_quote',
      JSON.stringify({ name: 'Ana', phone: '(92) 99999-0000', message: 'Lancha para pesca.' }),
    );
    const user = userEvent.setup();
    renderAt(<QuoteForm products={DEMO_PRODUCTS} />);
    expect(screen.getByTestId('submit-interrupted')).toHaveTextContent(
      'Seu envio anterior pode não ter sido concluído. Confira os dados e envie de novo se não recebeu a confirmação.',
    );
    expect(await screen.findByDisplayValue('Ana')).toBeInTheDocument();
    expect(screen.getByLabelText(/conte o que você precisa/i)).toHaveValue('Lancha para pesca.');
    expect(screen.getByRole('checkbox', { name: /autorizo/i })).not.toBeChecked();
    expect(postCalls()).toHaveLength(0);
    // a marca é consumida: o aviso não volta em outra visita
    expect(sessionStorage.getItem('cn_pending_quote')).toBeNull();

    await user.click(screen.getByRole('checkbox', { name: /autorizo/i }));
    await user.click(screen.getByRole('button', { name: /solicitar orçamento/i }));
    expect(await screen.findByTestId('success-phone')).toBeInTheDocument();
    expect(postCalls()).toHaveLength(1);
    expect(sessionStorage.getItem('cn_draft_quote')).toBeNull();
  });

  it('sem sessionStorage disponível o formulário continua funcionando', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
      jsonResponse({ ok: true, id: 'x' }, 201),
    );
    const user = userEvent.setup();
    renderAt(<ContactForm />);
    await fillContact(user);
    await user.click(screen.getByRole('button', { name: /enviar mensagem/i }));
    expect(await screen.findByRole('heading', { name: /mensagem enviada/i })).toBeInTheDocument();
  });
});

describe('[UX-32] espera longa', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('após ~20 s troca "alguns segundos" por "até 1 minuto" e pede para não fechar', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    let answer!: (r: Response) => void;
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      if (String(input).includes('/api/health')) return jsonResponse({ status: 'ok' });
      return new Promise<Response>((r) => {
        answer = r;
      });
    });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) });
    renderAt(<ContactForm />);
    await fillContact(user);
    await user.click(screen.getByRole('button', { name: /enviar mensagem/i }));
    const note = screen.getByTestId('submit-slow');
    await act(() => vi.advanceTimersByTimeAsync(SLOW_NOTICE_MS));
    expect(note).toHaveTextContent(/alguns segundos/i);
    await act(() => vi.advanceTimersByTimeAsync(VERY_SLOW_NOTICE_MS - SLOW_NOTICE_MS));
    expect(note).toHaveTextContent(/ainda conectando/i);
    expect(note).toHaveTextContent(/até 1 minuto/i);
    expect(note).toHaveTextContent(/não feche a página/i);
    expect(note).not.toHaveTextContent(/alguns segundos/i);
    expect(screen.getByRole('button', { name: /enviando/i })).toBeDisabled();
    await act(async () => answer(jsonResponse({ ok: true, id: 'lento' }, 201)));
    expect(await screen.findByRole('heading', { name: /mensagem enviada/i })).toBeInTheDocument();
    expect(postCalls()).toHaveLength(1);
  });
});
