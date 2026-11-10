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
      <WhatsAppCta
        number={TEST_NUMBER}
        location="teste"
        message={productWhatsAppMessage('Bote de Alumínio 7 m')}
      />,
    );
    const link = screen.getByRole('link', { name: /falar no whatsapp/i });
    expect(link).toHaveAttribute(
      'href',
      expect.stringContaining('https://wa.me/5500000000000?text='),
    );
    expect(decodeURIComponent(link.getAttribute('href')!)).toContain('Bote de Alumínio 7 m');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('sem número (padrão): oferece o direct do Instagram, sem prometer número', () => {
    renderAt(<WhatsAppCta number={undefined} location="teste" />);
    const link = screen.getByRole('link', { name: /perguntar no instagram/i });
    expect(link).toHaveAttribute('href', 'https://www.instagram.com/cearanautica/');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(screen.queryByText(/whatsapp/i)).not.toBeInTheDocument();
  });

  it('sem número com fallback interno: link honesto para a página indicada', () => {
    renderAt(
      <WhatsAppCta
        number={undefined}
        location="teste"
        fallback={{ to: '/orcamento?produto=x', label: 'Pedir orçamento' }}
      />,
    );
    expect(screen.getByRole('link', { name: 'Pedir orçamento' })).toHaveAttribute(
      'href',
      '/orcamento?produto=x',
    );
  });
});

describe('<FloatingContact />', () => {
  it('com número: barra mobile e botão desktop abrem o WhatsApp', () => {
    renderAt(<FloatingContact number={TEST_NUMBER} />);
    expect(screen.getByTestId('mobile-bar-secondary')).toHaveAttribute(
      'href',
      expect.stringContaining('wa.me'),
    );
    expect(screen.getByTestId('floating-desktop')).toHaveAttribute(
      'href',
      expect.stringContaining('wa.me'),
    );
  });

  it('sem número: "Pedir orçamento" + Instagram, sem balão de WhatsApp', () => {
    renderAt(<FloatingContact number={undefined} />, { route: '/' });
    expect(screen.getByTestId('floating-contact')).toHaveAttribute('href', '/orcamento');
    expect(screen.getByTestId('floating-contact')).toHaveTextContent('Pedir orçamento');
    expect(screen.getByTestId('mobile-bar-secondary')).toHaveAttribute(
      'href',
      'https://www.instagram.com/cearanautica/',
    );
    // UX-14: sem número não há flutuante no desktop (o cabeçalho fixo já tem o CTA)
    expect(screen.queryByTestId('floating-desktop')).not.toBeInTheDocument();
    expect(screen.queryByText(/whatsapp/i)).not.toBeInTheDocument();
  });

  it('sem número, na página de orçamento: barra aponta para Contato e some o botão desktop', () => {
    renderAt(<FloatingContact number={undefined} />, { route: '/orcamento' });
    expect(screen.getByTestId('floating-contact')).toHaveAttribute('href', '/contato');
    expect(screen.queryByTestId('floating-desktop')).not.toBeInTheDocument();
  });
});
