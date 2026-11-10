import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DEMO_PRODUCTS } from '@cn/shared';
import { ContactForm } from './ContactForm';
import { QuoteForm } from './QuoteForm';
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
    expect(
      await screen.findByText(/retornar pelo telefone informado \(ligação ou WhatsApp\)/),
    ).toBeInTheDocument();
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
});
