import { site } from '@/config/site';

/** Limites para não cortar nos resultados de busca (QA-13). */
export const SEO_TITLE_MAX = 62;
export const SEO_DESCRIPTION_MAX = 155;

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Título final como o <Seo> monta ("… | Ceará Náutica"). */
const withBrand = (t: string) => `${t} | ${site.name}`;

/**
 * Título de produto curto e sem repetir a categoria quando o nome já a contém
 * ("Semi-chata de Alumínio Sob Medida em Manaus", e não "… — Semi-chatas em Manaus").
 * Mantém "Manaus" (palavra-chave local) sempre que couber em SEO_TITLE_MAX.
 */
export function productSeoTitle(name: string, categoryName?: string): string {
  const cat = categoryName ? fold(categoryName).replace(/s$/, '') : '';
  const candidates = [
    ...(cat && !fold(name).includes(cat) ? [`${name} — ${categoryName} em Manaus`] : []),
    `${name} em Manaus`,
    name,
  ];
  return candidates.find((t) => withBrand(t).length <= SEO_TITLE_MAX) ?? name;
}

/** Description de produto: resumo + chamada, cortando a chamada se passar do limite. */
export function productSeoDescription(shortDescription: string): string {
  const options = [
    `${shortDescription} Ceará Náutica, Manaus – AM. Solicite um orçamento.`,
    `${shortDescription} Ceará Náutica, Manaus – AM.`,
  ];
  const fit = options.find((d) => d.length <= SEO_DESCRIPTION_MAX);
  if (fit) return fit;
  return `${shortDescription.slice(0, SEO_DESCRIPTION_MAX - 1).replace(/\s+\S*$/, '')}…`;
}
