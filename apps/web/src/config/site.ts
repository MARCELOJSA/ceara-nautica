/**
 * Configuração do site lida do ambiente (apps/web/.env).
 * Regra do projeto: dado não confirmado pela empresa fica vazio e a UI o oculta.
 */

const clean = (v: string | undefined): string | undefined => {
  const t = v?.trim();
  return t ? t : undefined;
};

/** Aceita apenas dígitos (10 a 15) — evita gerar link wa.me inválido. */
export function normalizeWhatsAppNumber(v: string | undefined): string | undefined {
  const digits = (v ?? '').replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15 ? digits : undefined;
}

const env = import.meta.env;

const ID_PATTERNS = {
  gtm: /^GTM-[A-Z0-9]+$/,
  ga4: /^G-[A-Z0-9]+$/,
  pixel: /^\d{6,20}$/,
};
const validId = (v: string | undefined, re: RegExp) => {
  const c = clean(v);
  return c && re.test(c) ? c : undefined;
};

export const site = {
  name: 'Ceará Náutica',
  tagline: 'Náutica & Estaleiro',
  city: 'Manaus',
  region: 'AM',
  locationLabel: 'Manaus – AM',
  instagramUrl: 'https://www.instagram.com/cearanautica/',
  instagramHandle: '@cearanautica',
  /** Mapa da cidade — não há endereço confirmado, então não apontamos um ponto exato. */
  cityMapUrl: 'https://www.google.com/maps/search/?api=1&query=Manaus%2C+AM',
  apiUrl: (clean(env.VITE_API_URL) ?? '/api').replace(/\/$/, ''),
  siteUrl: (clean(env.VITE_SITE_URL) ?? '').replace(/\/$/, ''),
  whatsappNumber: normalizeWhatsAppNumber(env.VITE_WHATSAPP_NUMBER),
  address: clean(env.VITE_ADDRESS),
  businessHours: clean(env.VITE_BUSINESS_HOURS),
  email: clean(env.VITE_CONTACT_EMAIL),
  gtmId: validId(env.VITE_GTM_ID, ID_PATTERNS.gtm),
  ga4Id: validId(env.VITE_GA4_ID, ID_PATTERNS.ga4),
  metaPixelId: validId(env.VITE_META_PIXEL_ID, ID_PATTERNS.pixel),
  /** Fotos do site são de banco de imagens até a empresa enviar as reais. */
  photosAreIllustrative: true,
} as const;

export type SiteConfig = typeof site;

export function mapUrlFor(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

/** URL absoluta para canonical/OG. Sem VITE_SITE_URL, usa a origem atual. */
export function absoluteUrl(path = '/'): string {
  const base =
    site.siteUrl || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}
