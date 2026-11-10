import type { Product } from '@cn/shared';
import { CATEGORY_COVERS } from '@/data/content';
import { productImages } from '@/lib/images';

const FEATURED_LIMIT = 6;
/** "Projetos em destaque" mostra só embarcações (motor e estofamento têm seção própria). */
const NOT_BOATS = new Set<string>(['motores-de-popa', 'estofamentos']);
const COVER_SRCS = new Set(Object.values(CATEGORY_COVERS).map((c) => c.src));

/**
 * UX-18: destaques da Home sem repetir as fotos das capas de categoria da mesma
 * página. Mantém os destacados primeiro (na ordem do catálogo), pula os que têm
 * a foto principal usada como capa e completa com outras embarcações publicadas.
 */
export function homeFeatured(products: Product[], limit = FEATURED_LIMIT): Product[] {
  const boats = products.filter(
    (p) => !NOT_BOATS.has(p.category) && !COVER_SRCS.has(productImages(p)[0]?.src ?? ''),
  );
  return [...boats.filter((p) => p.featured), ...boats.filter((p) => !p.featured)].slice(0, limit);
}
