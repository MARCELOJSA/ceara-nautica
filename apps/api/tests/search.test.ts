import { describe, expect, it } from 'vitest';
import {
  DEMO_PRODUCTS,
  matchesSearch,
  normalizeText,
  searchProducts,
  searchTerms,
  type Product,
} from '@cn/shared';

/** Testes unitários da busca compartilhada (@cn/shared/search), sem banco. */
const slugs = (q: string, list: Product[] = DEMO_PRODUCTS) =>
  searchProducts(list, q).map((p) => p.slug);
const bySlug = (slug: string) => DEMO_PRODUCTS.find((p) => p.slug === slug)!;

describe('normalizeText', () => {
  it('remove acentos, maiúsculas e pontuação', () => {
    expect(normalizeText('  Alumínio, CANOA!  ')).toBe('aluminio canoa');
  });

  it('unifica medidas: 6m, 6 m, 6 metros, 6 mts', () => {
    for (const s of ['6m', '6 m', '6 metros', '6 metro', '6 mts', '6M']) {
      expect(normalizeText(s)).toBe('6m');
    }
    expect(normalizeText('1,90 m')).toBe('1.90m');
    expect(normalizeText('90 hp')).toBe('90hp');
    expect(normalizeText('chapa 2 mm')).toBe('chapa 2 mm');
  });
});

describe('searchTerms', () => {
  it('descarta palavras vazias e repetidas', () => {
    expect(searchTerms('lancha de alumínio para a lancha')).toEqual(['lancha', 'aluminio']);
  });
  it('só palavras vazias → usa as próprias palavras', () => {
    expect(searchTerms('de')).toEqual(['de']);
  });
  it('só símbolos → nenhum termo', () => {
    expect(searchTerms('%_\\')).toEqual([]);
  });
});

describe('matchesSearch / searchProducts', () => {
  const canoas = DEMO_PRODUCTS.filter((p) => p.category === 'canoas').map((p) => p.slug);

  it('busca vazia retorna tudo', () => {
    expect(slugs('')).toHaveLength(DEMO_PRODUCTS.length);
    expect(slugs('   ')).toHaveLength(DEMO_PRODUCTS.length);
  });

  it('"aluminio" (sem acento) = "alumínio" (QA-05)', () => {
    const a = slugs('aluminio');
    expect(a.length).toBeGreaterThan(0);
    expect(slugs('alumínio')).toEqual(a);
    expect(slugs('ALUMÍNIO')).toEqual(a);
    expect(a).not.toContain('motores-de-popa');
    expect(a).not.toContain('estofamento-nautico');
  });

  it('"canoa aluminio" exige todas as palavras, em qualquer ordem', () => {
    expect(slugs('canoa aluminio')).toEqual(canoas);
    expect(slugs('alumínio canoa')).toEqual(canoas);
    expect(slugs('canoas de alumínio')).toEqual(canoas);
  });

  it('"canoa 6" / "canoa 6m" / "canoa 6 metros" acham a canoa de 6 m', () => {
    for (const q of ['canoa 6', 'canoa 6m', 'canoa 6 m', 'canoa 6 metros']) {
      expect(slugs(q)).toEqual(['canoa-aluminio-6m']);
    }
    expect(slugs('canoa 7')).toEqual(['canoa-aluminio-7m']);
  });

  it('número não casa com parte de outro número (6 ≠ 60, 1,90)', () => {
    expect(slugs('canoa 60')).toEqual([]);
    expect(slugs('lancha 1')).toEqual([]);
  });

  it('"estofado" acha o estofamento (sinônimo)', () => {
    expect(slugs('estofado')).toEqual(['estofamento-nautico']);
    expect(slugs('estofados')).toEqual(['estofamento-nautico']);
    expect(slugs('estof')).toEqual(['estofamento-nautico']);
  });

  it('"motr" (erro de digitação) acha motores de popa', () => {
    expect(slugs('motr')).toEqual(['motores-de-popa']);
    expect(slugs('motor')).toEqual(['motores-de-popa']);
    expect(slugs('motores')).toEqual(['motores-de-popa']);
    expect(slugs('motor de popa')).toEqual(['motores-de-popa']);
  });

  it('"motor" não casa com "motorização" das descrições de barcos', () => {
    expect(slugs('motor')).not.toContain('lancha-aluminio-7m');
  });

  it('plural/singular e inversão de letras', () => {
    const lanchas = DEMO_PRODUCTS.filter((p) => p.category === 'lanchas').map((p) => p.slug);
    expect(slugs('lancha')).toEqual(lanchas);
    expect(slugs('lanchas')).toEqual(lanchas);
    expect(slugs('lacnha')).toEqual(lanchas);
  });

  it('busca em descrição, especificações e características', () => {
    expect(slugs('capota')).toEqual(['canoa-aluminio-6m']);
    expect(slugs('90 hp')).toEqual(['bote-aluminio-6m-90hp']);
    expect(slugs('iguaracu')).toEqual(['lancha-cargueira-iguaracu-9m']);
  });

  it('buscas sem sentido não retornam tudo', () => {
    for (const q of [
      'xyzw',
      'qwerty',
      'submarino',
      'canoa xyzw',
      '%',
      '%%%',
      '_',
      'alum%nio',
      '!!!',
    ]) {
      expect(slugs(q)).toEqual([]);
    }
  });

  it('erro de digitação só é tolerado em palavras de 4+ letras', () => {
    // "cano" (4) ainda acha canoa por prefixo; "cxn" (3) não vira nada
    expect(slugs('cxn')).toEqual([]);
  });

  it('matchesSearch funciona produto a produto', () => {
    expect(matchesSearch(bySlug('canoa-aluminio-6m'), 'canoa 6')).toBe(true);
    expect(matchesSearch(bySlug('canoa-aluminio-7m'), 'canoa 6')).toBe(false);
  });
});
