import { describe, expect, it } from 'vitest';
import { CATALOG_PRODUCTS, getCategory } from '@cn/shared';
import { SEO_DESCRIPTION_MAX, SEO_TITLE_MAX, productSeoDescription, productSeoTitle } from './seo';

const full = (t: string) => `${t} | Ceará Náutica`;

describe('productSeoTitle (QA-13)', () => {
  it('não repete a categoria quando o nome já a contém', () => {
    expect(productSeoTitle('Semi-chata de Alumínio Sob Medida', 'Semi-chatas')).toBe(
      'Semi-chata de Alumínio Sob Medida em Manaus',
    );
    expect(productSeoTitle('Motores de popa', 'Motores de popa')).toBe('Motores de popa em Manaus');
  });

  it('acrescenta a categoria quando o nome não a cita e cabe', () => {
    expect(productSeoTitle('Iguaraçu 9 m', 'Lanchas')).toBe('Iguaraçu 9 m — Lanchas em Manaus');
  });

  it('todo o catálogo fica dentro dos limites e mantém "Manaus"', () => {
    for (const p of CATALOG_PRODUCTS) {
      const t = productSeoTitle(p.name, getCategory(p.category)?.name);
      expect(full(t).length, t).toBeLessThanOrEqual(SEO_TITLE_MAX);
      expect(t).toMatch(/Manaus$/);
      expect(productSeoDescription(p.shortDescription).length).toBeLessThanOrEqual(
        SEO_DESCRIPTION_MAX,
      );
    }
  });
});
