/**
 * Categorias comerciais oficiais da Ceará Náutica (definidas pelo cliente).
 * A ordem aqui é a ordem de exibição no site.
 */
export const CATEGORIES = [
  {
    slug: 'lanchas',
    name: 'Lanchas',
    description: 'Lanchas em alumínio para lazer, pesca e transporte nos rios da Amazônia.',
  },
  {
    slug: 'canoas',
    name: 'Canoas',
    description: 'Canoas em alumínio, leves e resistentes para o dia a dia no rio.',
  },
  {
    slug: 'botes',
    name: 'Botes',
    description: 'Botes em alumínio práticos para pesca, apoio e deslocamentos curtos.',
  },
  {
    slug: 'semi-chatas',
    name: 'Semi-chatas',
    description: 'Embarcações semi-chatas em alumínio, estáveis e com boa capacidade de carga.',
  },
  {
    slug: 'motores-de-popa',
    name: 'Motores de popa',
    description: 'Revenda de motores de popa para diferentes tipos de embarcação.',
  },
  {
    slug: 'estofamentos',
    name: 'Estofamentos',
    description: 'Estofamentos náuticos sob medida para assentos e áreas de convivência.',
  },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]['slug'];

export const CATEGORY_SLUGS = CATEGORIES.map((c) => c.slug) as [CategorySlug, ...CategorySlug[]];

export function getCategory(slug: string) {
  return CATEGORIES.find((c) => c.slug === slug);
}
