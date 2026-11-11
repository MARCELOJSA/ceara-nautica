import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DEMO_PRODUCTS } from '@cn/shared';
import Products from './Products';
import { jsonResponse, renderAt } from '@/test/utils';

const cardNames = () =>
  within(screen.getByTestId('product-grid'))
    .getAllByRole('heading', { level: 2 })
    .map((h) => h.textContent);

describe('Catálogo /produtos', () => {
  beforeEach(() => {
    // API fora do ar → usa o catálogo de @cn/shared como fallback
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));
  });

  it('lista todos os produtos (fallback) quando a API está indisponível', async () => {
    renderAt(<Products />, { route: '/produtos' });
    await screen.findByTestId('product-grid');
    expect(cardNames()).toHaveLength(DEMO_PRODUCTS.length);
  });

  it('usa os dados da API quando disponível', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse([DEMO_PRODUCTS[0]]));
    renderAt(<Products />, { route: '/produtos' });
    await screen.findByTestId('product-grid');
    expect(cardNames()).toEqual([DEMO_PRODUCTS[0]!.name]);
  });

  it('filtra pela categoria vinda da URL (?categoria=)', async () => {
    renderAt(<Products />, { route: '/produtos?categoria=canoas' });
    await screen.findByTestId('product-grid');
    const expected = DEMO_PRODUCTS.filter((p) => p.category === 'canoas').map((p) => p.name);
    expect(cardNames()).toEqual(expected);
    expect(screen.getByRole('button', { name: 'Canoas' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('troca a categoria e sincroniza a URL', async () => {
    const user = userEvent.setup();
    renderAt(<Products />, { route: '/produtos' });
    await screen.findByTestId('product-grid');
    await user.click(screen.getByRole('button', { name: 'Botes' }));
    expect(screen.getByTestId('location')).toHaveTextContent('/produtos?categoria=botes');
    expect(cardNames().every((n) => n?.startsWith('Bote'))).toBe(true);
    await user.click(screen.getByRole('button', { name: 'Todas' }));
    expect(screen.getByTestId('location')).toHaveTextContent(/^\/produtos$/);
  });

  it('busca por nome (sem acento) e grava ?q= na URL', async () => {
    const user = userEvent.setup();
    renderAt(<Products />, { route: '/produtos' });
    await screen.findByTestId('product-grid');
    await user.type(screen.getByRole('searchbox', { name: /buscar por nome/i }), 'iguaracu');
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('q=iguaracu'));
    expect(cardNames()).toEqual(['Lancha Cargueira tipo Iguaraçu 9 m']);
  });

  it('combina categoria + busca vindas da URL', async () => {
    renderAt(<Products />, { route: '/produtos?categoria=botes&q=90' });
    await screen.findByTestId('product-grid');
    expect(cardNames()).toEqual(['Bote de Alumínio 6 m — 90 hp']);
  });

  it('mostra estado vazio e permite limpar filtros', async () => {
    const user = userEvent.setup();
    renderAt(<Products />, { route: '/produtos?categoria=lanchas&q=inexistente' });
    expect(await screen.findByTestId('empty-state')).toBeInTheDocument();
    expect(screen.getByText(/0 resultados/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /limpar filtros/i }));
    expect(screen.getByTestId('location')).toHaveTextContent(/^\/produtos$/);
    await screen.findByTestId('product-grid');
  });

  it('[UX-20] celular tem introdução curta e completa (sem corte nem reticências)', async () => {
    renderAt(<Products />, { route: '/produtos' });
    await screen.findByTestId('product-grid');
    const short = screen.getByTestId('intro-short');
    expect(short).toHaveTextContent(
      'Lanchas, canoas, botes e semi-chatas em alumínio, além de motores e estofamentos.',
    );
    expect(short.className).toContain('sm:hidden');
    expect(short.className).not.toMatch(/line-clamp|truncate/);
  });

  it('[UX-23] toda embarcação mostra "Indicado para", com termo único e "sob consulta"', async () => {
    renderAt(<Products />, { route: '/produtos' });
    await screen.findByTestId('product-grid');
    const boats = DEMO_PRODUCTS.filter(
      (p) => !['motores-de-popa', 'estofamentos'].includes(p.category),
    );
    const lines = screen.getAllByTestId('card-uses').map((el) => el.textContent ?? '');
    expect(lines).toHaveLength(boats.length);
    expect(lines.join(' ')).not.toMatch(/Passeio/);
    expect(lines.filter((l) => /sob consulta/.test(l)).length).toBeGreaterThan(0);
  });
  it.each(['motor falhando', 'motor não liga', 'problema no motor', 'motor quebrado'])(
    '[UX-27] "%s": estado vazio com dica de serviços e "Problema no motor? Descreva aqui"',
    async (q) => {
      renderAt(<Products />, { route: `/produtos?q=${encodeURIComponent(q)}` });
      await screen.findByTestId('empty-state');
      const hint = screen.getByTestId('service-hint');
      expect(within(hint).getByRole('link', { name: /veja nossos serviços/i })).toHaveAttribute(
        'href',
        '/servicos',
      );
      expect(
        within(hint).getByRole('link', { name: 'Problema no motor? Descreva aqui' }),
      ).toHaveAttribute('href', '/orcamento?servico=motor-revisao');
      expect(hint).toHaveTextContent(/a equipe confirma se atende/i);
    },
  );

  it('[UX-27] "barco furado": dica de serviços, sem o link de motor', async () => {
    renderAt(<Products />, { route: '/produtos?q=barco%20furado' });
    await screen.findByTestId('empty-state');
    expect(screen.getByTestId('service-hint')).toBeInTheDocument();
    expect(screen.queryByTestId('motor-issue-hint')).not.toBeInTheDocument();
  });

  it('[UX-27] "motor" sozinho mostra os motores, sem estado vazio', async () => {
    renderAt(<Products />, { route: '/produtos?q=motor' });
    await screen.findByTestId('product-grid');
    expect(screen.queryByTestId('motor-issue-hint')).not.toBeInTheDocument();
  });
});
