import { getCategory, type Product } from '@cn/shared';
import { absoluteUrl, site } from '@/config/site';

/** LocalBusiness apenas com dados confirmados (endereço/horário/e-mail só se configurados). */
export function localBusinessJsonLd() {
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': absoluteUrl('/#empresa'),
    name: site.name,
    alternateName: `${site.name} — ${site.tagline}`,
    description:
      'Náutica e estaleiro em Manaus – AM: fabricação de embarcações em alumínio com projeto personalizado, reparos, manutenção, revenda de motores de popa e estofamento náutico.',
    url: absoluteUrl('/'),
    logo: absoluteUrl('/favicon-512.png'),
    image: absoluteUrl('/og-image.jpg'),
    sameAs: [site.instagramUrl],
    areaServed: { '@type': 'City', name: 'Manaus' },
    address: {
      '@type': 'PostalAddress',
      addressLocality: site.city,
      addressRegion: site.region,
      addressCountry: 'BR',
      ...(site.address ? { streetAddress: site.address } : {}),
    },
  };
  if (site.whatsappNumber) data.telephone = `+${site.whatsappNumber}`;
  if (site.email) data.email = site.email;
  return data;
}

/** Product sem preço/oferta (preços não são publicados). */
export function productJsonLd(p: Product) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    description: p.shortDescription,
    category: getCategory(p.category)?.name,
    image: p.images.map((i) => absoluteUrl(i.src)),
    url: absoluteUrl(`/produtos/${p.slug}`),
    brand: { '@type': 'Brand', name: site.name },
    manufacturer: { '@type': 'Organization', name: site.name },
    material: p.category === 'motores-de-popa' || p.category === 'estofamentos' ? undefined : 'Alumínio',
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: absoluteUrl(it.path),
    })),
  };
}

/** Serializa JSON-LD com `<` escapado (evita fechar a tag <script>). */
export function serializeJsonLd(data: object): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
