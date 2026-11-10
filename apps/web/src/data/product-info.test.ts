import { describe, expect, it } from 'vitest';
import { DEMO_PRODUCTS, type Product } from '@cn/shared';
import {
  cardSummary,
  glossaryFor,
  orderedSpecs,
  productFaq,
  publishedProjects,
  usageTags,
} from './product-info';

const bySlug = (slug: string) => DEMO_PRODUCTS.find((p) => p.slug === slug)!;
const allText = (p: Product) =>
  [p.name, p.shortDescription, p.description, ...p.features, ...p.specs.map((s) => s.value)]
    .join(' ')
    .toLowerCase();

describe('product-info', () => {
  it('ordena a ficha sem criar nem perder linhas (medidas primeiro, motorização por último)', () => {
    for (const p of DEMO_PRODUCTS) {
      const ordered = orderedSpecs(p.specs);
      expect(ordered).toHaveLength(p.specs.length);
      expect(new Set(ordered)).toEqual(new Set(p.specs));
    }
    const canoa7 = orderedSpecs(bySlug('canoa-aluminio-7m').specs).map((s) => s.label);
    expect(canoa7[0]).toBe('Comprimento');
    expect(canoa7.at(-1)).toBe('Motorização');
    const canoa6 = orderedSpecs(bySlug('canoa-aluminio-6m').specs).map((s) => s.label);
    // UX-12: as duas canoas têm as mesmas linhas, na mesma ordem, para comparar
    expect(canoa6).toEqual(canoa7);
  });

  it('glossário só traz termos presentes no produto', () => {
    const terms = (slug: string) => glossaryFor(bySlug(slug)).map((g) => g.term);
    expect(terms('bote-aluminio-7m')).toEqual(expect.arrayContaining(['Boca', 'Pontal']));
    expect(terms('bote-aluminio-6m-90hp')).toContain('hp');
    expect(terms('lancha-cargueira-iguaracu-9m')).toContain('Popa');
    expect(terms('motores-de-popa')).toEqual([]);
  });

  it('resumo do card usa só dados publicados (medida, capacidade e usos citados)', () => {
    for (const p of DEMO_PRODUCTS) {
      const { facts, uses } = cardSummary(p);
      for (const f of facts) expect(allText(p)).toContain(f.toLowerCase());
      // "Lazer" cobre "passeio" e "lazer" nos textos (UX-23)
      const source: Record<string, RegExp> = { Lazer: /passeio|lazer/i };
      for (const u of uses) expect(allText(p)).toMatch(source[u] ?? new RegExp(u, 'i'));
    }
    expect(cardSummary(bySlug('lancha-aluminio-7m')).facts).toEqual(['7 m', '11 passageiros']);
    expect(cardSummary(bySlug('lancha-aluminio-10m')).facts).toEqual(['10 m']);
    expect(usageTags(bySlug('motores-de-popa'))).toEqual([]);
  });

  it('[UX-23] um só termo para lazer/passeio; sem uso publicado fica "pendente", sem deduzir', () => {
    const all = DEMO_PRODUCTS.flatMap((p) => usageTags(p));
    expect(all).not.toContain('Passeio');
    expect(usageTags(bySlug('lancha-aluminio-7m'))).toEqual(['Lazer', 'Pesca', 'Trabalho']);
    expect(usageTags(bySlug('semi-chata-aluminio-sob-medida'))).toEqual([
      'Lazer',
      'Pesca',
      'Trabalho',
    ]);
    const pending = DEMO_PRODUCTS.filter((p) => cardSummary(p).usesPending).map((p) => p.slug);
    expect(pending).toEqual(
      expect.arrayContaining([
        'lancha-aluminio-10m',
        'canoa-aluminio-6m',
        'bote-aluminio-6m',
        'bote-aluminio-6m-90hp',
      ]),
    );
    // motor e estofamento não têm linha de uso
    expect(cardSummary(bySlug('motores-de-popa')).usesPending).toBe(false);
    expect(cardSummary(bySlug('estofamento-nautico')).usesPending).toBe(false);
    for (const p of DEMO_PRODUCTS) {
      const { uses, usesPending } = cardSummary(p);
      expect(usesPending && uses.length > 0).toBe(false);
    }
  });

  it('[UX-22] motor: dúvida sobre revisão/conserto sem prometer o serviço', () => {
    const faq = productFaq(bySlug('motores-de-popa'));
    const item = faq.find((f) => /revisão ou conserto/i.test(f.q));
    expect(item?.a).toBe(
      'Descreva o modelo e o problema no pedido; a equipe confirma se atende e como.',
    );
    expect(item?.a).not.toMatch(/fazemos|consertamos|garant/i);
  });

  it('FAQ não traz números que não estejam no produto', () => {
    for (const p of DEMO_PRODUCTS) {
      for (const { a } of productFaq(p)) {
        // "100% personalizado" é a frase publicada pela empresa, não um dado do produto
        const numbers = a.replace('100% personalizado', '').match(/\d+/g) ?? [];
        for (const n of numbers) expect(allText(p)).toContain(n);
      }
    }
  });

  it('projetos publicados: só os que têm data, do mais recente ao mais antigo', () => {
    const list = publishedProjects(DEMO_PRODUCTS);
    expect(list.length).toBe(DEMO_PRODUCTS.filter((p) => p.source).length);
    const isos = list.map((p) => p.iso);
    expect([...isos].sort().reverse()).toEqual(isos);
  });
});
