import { describe, expect, it } from 'vitest';
import { DEMO_PRODUCTS } from '@cn/shared';
import { CATEGORY_COVERS } from '@/data/content';
import { productImages } from '@/lib/images';
import { homeFeatured } from './featured';

describe('homeFeatured (UX-18)', () => {
  const items = homeFeatured(DEMO_PRODUCTS);
  const covers = new Set(Object.values(CATEGORY_COVERS).map((c) => c.src));

  it('mostra 6 embarcações, destacadas primeiro', () => {
    expect(items).toHaveLength(6);
    expect(items.every((p) => !['motores-de-popa', 'estofamentos'].includes(p.category))).toBe(
      true,
    );
    const firstNonFeatured = items.findIndex((p) => !p.featured);
    if (firstNonFeatured >= 0)
      expect(items.slice(firstNonFeatured).every((p) => !p.featured)).toBe(true);
  });

  it('nenhum destaque repete a foto de uma capa de categoria', () => {
    for (const p of items) expect(covers.has(productImages(p)[0]!.src)).toBe(false);
  });

  it('as capas de categoria não se repetem entre si', () => {
    expect(covers.size).toBe(Object.keys(CATEGORY_COVERS).length);
  });
});
