import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DEMO_PRODUCTS } from '@cn/shared';
import { ContactForm } from './ContactForm';
import { QuoteForm } from './QuoteForm';
import Quote from '@/pages/Quote';
import { jsonResponse, renderAt } from '@/test/utils';

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
    expect(fetch).not.toHaveBeenCalled();
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
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ ok: true, id: 'abc' }, 201));
    const user = userEvent.setup();
    renderAt(<ContactForm />);
    await fillContact(user);
    await user.click(screen.getByRole('button', { name: /enviar mensagem/i }));
    expect(await screen.findByRole('heading', { name: /mensagem enviada/i })).toBeInTheDocument();
    const [url, init] = vi.mocked(fetch).mock.calls[0]!;
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
    vi.mocked(fetch).mockResolvedValue(
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
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(jsonResponse({ ok: true, id: 'q2' }, 201));
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
    await waitFor(() => expect(fetchSpy).toHaveBeenCalled());
    const body = JSON.parse(String(fetchSpy.mock.calls[0]![1]?.body));
    expect(body.requestType).toBe('manutencao');
    expect(body).not.toHaveProperty('category');
    // UX-19: repete o telefone informado (formatado) e explica o próximo passo
    expect(await screen.findByTestId('success-phone')).toHaveTextContent(
      'Vamos retornar no (92) 99999-0000, por ligação ou WhatsApp.',
    );
    expect(screen.getByTestId('next-steps')).toHaveTextContent(/informados no orçamento/);
  });

  it('pré-seleciona o produto (?produto=slug) e envia productSlug/category', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(jsonResponse({ ok: true, id: 'q1' }, 201));
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

    await waitFor(() => expect(fetchSpy).toHaveBeenCalled());
    const [url, init] = fetchSpy.mock.calls[0]!;
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
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const user = userEvent.setup();
    renderAt(<QuoteForm products={DEMO_PRODUCTS} />);
    await user.type(screen.getByLabelText(/conte o que você precisa/i), 'curta');
    await user.click(screen.getByRole('button', { name: /solicitar orçamento/i }));
    expect(await screen.findByText(/mín\. 10 caracteres/)).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
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
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({ ok: true, id: 'q3' }, 201));
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
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({ ok: true, id: 'q4' }, 201));
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
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(jsonResponse({ ok: true, id: 'q5' }, 201));
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
    await waitFor(() => expect(fetchSpy).toHaveBeenCalled());
    const body = JSON.parse(String(fetchSpy.mock.calls[0]![1]?.body));
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

  it('abre com "Problema ou revisão no motor", roteiro na mensagem e sem Categoria/Modelo', async () => {
    renderAt(<Quote />, { route: '/orcamento?servico=motor-revisao' });
    const type = await screen.findByLabelText<HTMLSelectElement>(/tipo de solicitação/i);
    expect(type).toHaveValue('motor-revisao');
    expect(type.selectedOptions[0]!.textContent).toBe('Problema ou revisão no motor');
    expect(screen.getByLabelText(/conte o que você precisa/i)).toHaveValue(
      'Modelo/potência do motor e o que está acontecendo: ',
    );
    expect(screen.getByTestId('product-fields')).not.toBeVisible();
    expect(screen.getByText(/marca, modelo e potência do motor/i)).toBeInTheDocument();
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
      message:
        'Modelo/potência do motor e o que está acontecendo: Yamaha 40 hp, falha ao acelerar.',
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

describe('Tela de sucesso do contato (UX-19)', () => {
  it('repete o telefone informado', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({ ok: true, id: 'c9' }, 201));
    const user = userEvent.setup();
    renderAt(<ContactForm />);
    await fillContact(user);
    await user.click(screen.getByRole('button', { name: /enviar mensagem/i }));
    expect(await screen.findByTestId('success-phone')).toHaveTextContent(
      'Vamos retornar no (92) 99999-0000, por ligação ou WhatsApp.',
    );
  });
});
