import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { buildWhatsAppUrl, productWhatsAppMessage } from './whatsapp';
import { normalizeWhatsAppNumber } from '@/config/site';
import { WhatsAppCta } from '@/components/ui/WhatsAppCta';
import { FloatingContact } from '@/components/layout/FloatingContact';
import { renderAt } from '@/test/utils';

// Número fictício usado APENAS nos testes (não é da empresa).
const TEST_NUMBER = '5500000000000';

describe('buildWhatsAppUrl', () => {
  it('gera link wa.me com mensagem codificada quando há número', () => {
    const url = buildWhatsAppUrl(TEST_NUMBER, productWhatsAppMessage('Canoa de Alumínio 7 m'));
    expect(url).toMatch(/^https:\/\/wa\.me\/5500000000000\?text=/);
    expect(decodeURIComponent(url!.split('text=')[1]!)).toContain('Canoa de Alumínio 7 m');
  });

  it('retorna null sem número ou com número inválido', () => {
    expect(buildWhatsAppUrl(undefined)).toBeNull();
    expect(buildWhatsAppUrl('')).toBeNull();
    expect(buildWhatsAppUrl('123')).toBeNull();
  });

  it('normaliza o número do .env para apenas dígitos', () => {
    expect(normalizeWhatsAppNumber('+55 (00) 00000-0000')).toBe('5500000000000');
    expect(normalizeWhatsAppNumber('')).toBeUndefined();
    expect(normalizeWhatsAppNumber('abc')).toBeUndefined();
  });
});

describe('<WhatsAppCta />', () => {
  it('com número: link externo seguro para o WhatsApp com o nome do produto', () => {
    renderAt(
      <WhatsAppCta number={TEST_NUMBER} location="teste" message={productWhatsAppMessage('Bote de Alumínio 7 m')} />,
    );
    const link = screen.getByRole('link', { name: /falar no whatsapp/i });
    expect(link).toHaveAttribute('href', expect.stringContaining('https://wa.me/5500000000000?text='));
    expect(decodeURIComponent(link.getAttribute('href')!)).toContain('Bote de Alumínio 7 m');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('sem número: leva para uma página do site, sem prometer número', () => {
    renderAt(<WhatsAppCta number={undefined} location="teste" fallbackTo="/orcamento?produto=x" />);
    const link = screen.getByRole('link', { name: /fale com a equipe/i });
    expect(link).toHaveAttribute('href', '/orcamento?produto=x');
    expect(screen.queryByText(/whatsapp/i)).not.toBeInTheDocument();
  });
});

describe('<FloatingContact />', () => {
  it('com número abre o WhatsApp', () => {
    renderAt(<FloatingContact number={TEST_NUMBER} />);
    expect(screen.getByTestId('floating-contact')).toHaveAttribute('href', expect.stringContaining('wa.me'));
  });

  it('sem número leva para /orcamento', () => {
    renderAt(<FloatingContact number={undefined} />, { route: '/' });
    expect(screen.getByTestId('floating-contact')).toHaveAttribute('href', '/orcamento');
  });

  it('sem número fica oculto na própria página de orçamento', () => {
    renderAt(<FloatingContact number={undefined} />, { route: '/orcamento' });
    expect(screen.queryByTestId('floating-contact')).not.toBeInTheDocument();
  });
});
