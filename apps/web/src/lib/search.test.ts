import { describe, expect, it } from 'vitest';
import { DEMO_PRODUCTS } from '@cn/shared';
import { filterProducts } from '@/lib/api';
import { looksLikeService } from '@/lib/search';

const slugs = (q: string, category?: string) =>
  filterProducts(DEMO_PRODUCTS, { q, category }).map((p) => p.slug);

describe('filterProducts (busca do catálogo, mesma regra da API)', () => {
  it('"aluminio" sem acento = "alumínio" (QA-05)', () => {
    const a = slugs('aluminio');
    expect(a.length).toBeGreaterThan(0);
    expect(slugs('Alumínio')).toEqual(a);
  });

  it('"canoa aluminio" encontra as canoas (todas as palavras, qualquer ordem)', () => {
    const canoas = DEMO_PRODUCTS.filter((p) => p.category === 'canoas').map((p) => p.slug);
    expect(slugs('canoa aluminio')).toEqual(canoas);
    expect(slugs('aluminio canoa')).toEqual(canoas);
  });

  it('"canoa 6" e "canoa 6m" encontram a canoa de 6 m', () => {
    expect(slugs('canoa 6')).toEqual(['canoa-aluminio-6m']);
    expect(slugs('canoa 6m')).toEqual(['canoa-aluminio-6m']);
    expect(slugs('canoa 6 metros')).toEqual(['canoa-aluminio-6m']);
  });

  it('"estofado" encontra o estofamento', () => {
    expect(slugs('estofado')).toEqual(['estofamento-nautico']);
  });

  it('"motr" (erro de digitação) encontra motores de popa', () => {
    expect(slugs('motr')).toEqual(['motores-de-popa']);
  });

  it('combina busca com categoria', () => {
    expect(slugs('aluminio', 'botes').every((s) => s.startsWith('bote-'))).toBe(true);
    expect(slugs('canoa', 'botes')).toEqual([]);
  });

  it('buscas sem sentido não retornam tudo', () => {
    for (const q of ['xyzw', 'asdfgh', 'canoa xyzw', '%', '!!!']) {
      expect(slugs(q)).toEqual([]);
    }
  });

  it('busca vazia ou só espaços retorna tudo', () => {
    expect(slugs('')).toHaveLength(DEMO_PRODUCTS.length);
    expect(slugs('   ')).toHaveLength(DEMO_PRODUCTS.length);
  });
});

describe('tolerância a erro só para palavras fora do catálogo (QA-10)', () => {
  const slugs = (q: string) => filterProducts(DEMO_PRODUCTS, { q }).map((p) => p.slug);
  it.each(['chata', 'semichata', 'semi-chata'])('"%s" traz só a semi-chata', (q) => {
    expect(slugs(q)).toEqual(['semi-chata-aluminio-sob-medida']);
  });
  it('"chapa" não traz a semi-chata', () => {
    expect(slugs('chapa')).not.toContain('semi-chata-aluminio-sob-medida');
    expect(slugs('chapa').length).toBeGreaterThan(0);
  });
  it('erro de digitação em palavra inexistente continua tolerado', () => {
    expect(slugs('lacnha').length).toBeGreaterThan(0);
    expect(slugs('motr')).toEqual(['motores-de-popa']);
  });
});

describe('looksLikeService', () => {
  it.each([
    'reparo',
    'conserto',
    'concerto de barco',
    'manutençao',
    'manutencao',
    'Manutenção',
    'reparar casco',
    'arrumar o barco',
    'estofar banco',
    'repraro',
    'revisão',
    'solda',
    'barco com furo',
  ])('"%s" → serviço', (q) => {
    expect(looksLikeService(q)).toBe(true);
  });

  it.each(['canoa', 'lancha 7m', 'motor', 'aluminio', '', '   '])('"%s" → não é serviço', (q) => {
    expect(looksLikeService(q)).toBe(false);
  });
});
